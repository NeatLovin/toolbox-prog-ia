import { jsonResponse, safeStr, safeJsonStr } from './util.js'

// Liste blanche exacte de la taxonomie (section 5 du brief). Tout événement hors de cette
// liste est silencieusement écarté avant insertion, jamais stocké.
//
// MODIFIER CETTE LISTE EXIGE npm run worker:deploy, PAS SEULEMENT UNE PUBLICATION DU SITE.
// Le Worker et le site GitHub Pages sont deux déploiements indépendants : publier le front sans
// redéployer le Worker laisse cette liste inchangée en production, et tout événement ajouté côté
// client sera rejeté silencieusement (vécu avec audit_truncated avant son redéploiement).
// worker/scripts/check-event-taxonomy.mjs (lancé automatiquement avant chaque build) détecte un
// événement émis côté client mais absent d'ici — il ne détecte pas un Worker déployé qui n'a pas
// encore cette liste à jour : penser au redéploiement reste manuel.
export const ALLOWED_EVENTS = new Set([
  // Session et accueil
  'session_start', 'consent_choice', 'home_entry_click',
  // Recommandation guidée
  'reco_start', 'reco_question_answered', 'reco_back', 'reco_result_shown',
  'reco_generative_used', 'reco_detail_expand', 'reco_tool_open', 'reco_patron_open',
  'reco_external_link_click', 'reco_restart', 'reco_export', 'reco_abandon',
  // Catalogue et cartographie
  'catalogue_filter', 'catalogue_empty_result', 'tool_detail_open',
  'matrix_open', 'matrix_cell_open', 'matrix_legend_open', 'dead_click',
  // Audit de plan de cours
  'audit_start', 'audit_document_submitted', 'audit_relevance_check', 'audit_context_filled',
  'audit_classification_result', 'audit_classification_edited', 'audit_validation_confirmed',
  'audit_result_shown', 'audit_recommendation_open', 'audit_export', 'audit_unavailable',
  'audit_truncated',
  // Transversal
  'app_error', 'survey_shown', 'survey_dismissed', 'survey_submitted'
])

const MAX_EVENTS_PER_BATCH = 25
const MAX_PAYLOAD_CHARS = 2000
const MAX_SESSION_EVENTS_PER_HOUR = 600

export async function handleEvents(request, env) {
  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400)
  }

  const sessionId = safeStr(body?.session_id, 64)
  const events = Array.isArray(body?.events) ? body.events : null
  if (!sessionId || !events || events.length === 0) {
    return jsonResponse({ error: 'invalid_body' }, 400)
  }
  if (events.length > MAX_EVENTS_PER_BATCH) {
    return jsonResponse({ error: 'batch_too_large' }, 400)
  }

  const appVersion = safeStr(body.app_version, 32)
  const schemaVersion = safeStr(body.schema_version, 16)
  const campaign = safeStr(body.campaign, 32)

  const nowMs = Date.now()
  const hourAgo = nowMs - 3600_000

  // Débit simple par session : au-delà, on refuse silencieusement (le client échoue en silence).
  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM events WHERE session_id = ? AND ts_server > ?'
  ).bind(sessionId, hourAgo).first()
  if ((countRow?.n ?? 0) > MAX_SESSION_EVENTS_PER_HOUR) {
    return jsonResponse({ error: 'rate_limited' }, 429)
  }

  const stmts = []
  for (const e of events.slice(0, MAX_EVENTS_PER_BATCH)) {
    const name = typeof e?.event === 'string' ? e.event : ''
    if (!ALLOWED_EVENTS.has(name)) continue

    const payloadStr = safeJsonStr(e.payload, MAX_PAYLOAD_CHARS)
    const tsClient = Number.isFinite(e.ts_client) ? Math.trunc(e.ts_client) : nowMs
    const viewportBucket = safeStr(e.viewport_bucket, 8)

    stmts.push(env.DB.prepare(
      `INSERT INTO events
        (session_id, ts_client, ts_server, event, payload, app_version, schema_version, campaign, viewport_bucket)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(sessionId, tsClient, nowMs, name, payloadStr, appVersion, schemaVersion, campaign, viewportBucket))
  }

  if (stmts.length === 0) {
    return jsonResponse({ error: 'no_valid_events' }, 400)
  }

  await env.DB.batch(stmts)
  return jsonResponse({ ok: true }, 200)
}
