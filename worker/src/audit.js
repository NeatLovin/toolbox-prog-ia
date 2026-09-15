import { jsonResponse, safeStr, todayUTC } from './util.js'
import { isCapReviewDue } from './health.js'
import conceptsData from '../../src/data/concepts.json'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 2000
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const CONCEPT_LIST = conceptsData.map(c => `${c.id} : ${c.name}`).join('\n')

// Prompt système fixé côté serveur : le client ne peut plus faire varier le modèle, max_tokens
// ou le prompt lui-même, ce que l'ancien proxy Express permettait (surface de coût ouverte).
function buildSystemText() {
  return `Tu analyses un document pour déterminer s'il porte sur l'enseignement de la programmation ou de l'informatique, puis en extraire la structure pédagogique si applicable.

ÉTAPE 1 — ÉVALUER si le document traite de programmation ou d'informatique (algorithmique, bases de données, réseaux, systèmes, génie logiciel…), et avec quelle confiance.
Si le contenu porte sur autre chose (droit, médecine, histoire, langues, gestion, etc.) : renvoie { "is_programming": false, "relevance_confidence": "high"|"medium"|"low", "sections": [] } sans analyser davantage. Utilise "low" seulement si le document est ambigu ou trop court pour trancher clairement, jamais par excès de prudence.
Si le contenu porte sur la programmation ou l'informatique : passe à l'étape 2 avec "is_programming": true et une "relevance_confidence" reflétant la clarté du signal.

ÉTAPE 2 — Analyser la structure pédagogique section par section.
Concepts disponibles — retourne UNIQUEMENT des IDs de cette liste :
${CONCEPT_LIST}

Niveaux Bloom acceptés : Remember, Understand, Apply, Analyze, Evaluate, Create

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après :
{
  "is_programming": true,
  "relevance_confidence": "high",
  "course_summary": "Ce cours couvre la programmation Python orientée objet pour des étudiants de première année.",
  "sections": [
    {
      "title": "Titre de la section",
      "concept_ids": ["C1.1"],
      "bloom": "Apply",
      "confidence": "high"
    }
  ]
}

Règles strictes :
- Ne jamais forcer des concepts de programmation sur un contenu non informatique
- relevance_confidence : "low" | "medium" | "high", honnêteté requise sur la certitude du jugement is_programming lui-même (document court, ambigu, mixte -> "low")
- course_summary : 1 à 2 phrases neutres en français décrivant ce que couvre ce cours ; laisser "" si is_programming est false
- concept_ids : 0 à 3 IDs parmi la liste ci-dessus, tableau vide si aucun concept identifiable
- N'invente jamais un ID hors de la liste fournie
- bloom : une valeur parmi les niveaux Bloom acceptés, ou null si incertain
- confidence : "low" | "medium" | "high" pour chaque section. Honnêteté requise : "low" si la section est courte, ambiguë, ou que le concept est déduit avec peu d'indices ; "medium" si plausible mais partiel ; "high" seulement si l'evidence est claire. Ne pas surévaluer.
- Détecte les sections à partir des titres et de la structure du texte
- Limite à 30 sections maximum`
}

export async function handleAudit(request, env) {
  if (isCapReviewDue(env)) {
    console.warn(`[toolbox] AUDIT_DAILY_GLOBAL_CAP (${env.AUDIT_DAILY_GLOBAL_CAP}) : la date de révision (${env.AUDIT_DAILY_CAP_REVIEW_DATE}) est dépassée — reconsidérer une valeur de croisière.`)
  }

  if (String(env.AUDIT_KILL_SWITCH || '').toLowerCase() === 'true') {
    await logUnavailable(env, null, 'kill_switch')
    return jsonResponse({ error: 'unavailable', reason: 'kill_switch' }, 503)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const sessionId = safeStr(body?.session_id, 64)
  const text = typeof body?.text === 'string' ? body.text : ''
  if (!sessionId) {
    return jsonResponse({ error: 'invalid_body', reason: 'missing_session' }, 400)
  }

  const maxChars = parseInt(env.AUDIT_MAX_CHARS || '160000', 10)
  if (!text.trim() || text.length > maxChars) {
    await logUnavailable(env, sessionId, 'size_exceeded')
    return jsonResponse({ error: 'unavailable', reason: 'size_exceeded' }, 400)
  }

  const nowMs = Date.now()
  const day = todayUTC()
  const hourAgo = nowMs - 3600_000

  const perSessionCap = parseInt(env.AUDIT_RATE_LIMIT_PER_SESSION_HOUR || '8', 10)
  const sessionCountRow = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM audit_calls WHERE session_id = ? AND ts_server > ?'
  ).bind(sessionId, hourAgo).first()
  if ((sessionCountRow?.n ?? 0) >= perSessionCap) {
    await logUnavailable(env, sessionId, 'session_cap')
    return jsonResponse({ error: 'unavailable', reason: 'session_cap' }, 429)
  }

  const dailyCap = parseInt(env.AUDIT_DAILY_GLOBAL_CAP || '200', 10)
  const dailyCountRow = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM audit_calls WHERE day = ?'
  ).bind(day).first()
  if ((dailyCountRow?.n ?? 0) >= dailyCap) {
    await logUnavailable(env, sessionId, 'daily_cap')
    return jsonResponse({ error: 'unavailable', reason: 'daily_cap' }, 429)
  }

  const key = env.ANTHROPIC_API_KEY
  if (!key) {
    await logUnavailable(env, sessionId, 'missing_key')
    return jsonResponse({ error: 'unavailable', reason: 'missing_key' }, 503)
  }

  // Compteur inséré avant l'appel : un appel tenté compte, qu'il réussisse ou non côté Anthropic,
  // pour éviter qu'un flot d'erreurs upstream ne contourne les plafonds.
  await env.DB.prepare(
    'INSERT INTO audit_calls (session_id, ts_server, day) VALUES (?, ?, ?)'
  ).bind(sessionId, nowMs, day).run()

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [{ type: 'text', text: buildSystemText(), cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: text }]
      })
    })
    const data = await response.json()
    return jsonResponse(data, response.status)
  } catch {
    await logUnavailable(env, sessionId, 'upstream_error')
    return jsonResponse({ error: 'unavailable', reason: 'upstream_error' }, 502)
  }
}

async function logUnavailable(env, sessionId, reason) {
  try {
    await env.DB.prepare(
      `INSERT INTO events
        (session_id, ts_client, ts_server, event, payload, app_version, schema_version, campaign, viewport_bucket)
       VALUES (?, ?, ?, 'audit_unavailable', ?, NULL, NULL, NULL, NULL)`
    ).bind(sessionId || 'unknown', Date.now(), Date.now(), JSON.stringify({ reason })).run()
  } catch {
    // Le suivi de l'indisponibilité ne doit jamais faire échouer la réponse au client.
  }
}
