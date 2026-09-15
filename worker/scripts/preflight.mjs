// Vérification en une commande que le site publié est sain, avant d'envoyer le lien aux
// enseignants (npm run preflight). Chaque contrôle affiche un verdict explicite ; le script sort
// en erreur (code 1) si un contrôle échoue. Nettoie derrière lui l'événement de test qu'il insère.

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SITE = 'https://neatlovin.github.io/toolbox-prog-ia/'
const ORIGIN = 'https://neatlovin.github.io'

let failed = false
function ok(msg) { console.log(`✓ ${msg}`) }
function fail(msg) { console.error(`✗ ${msg}`); failed = true }
function warn(msg) { console.log(`⚠ ${msg}`) }

function readEnvVar(file, key) {
  const content = readFileSync(path.join(ROOT, file), 'utf8')
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

function readWranglerVar(key) {
  const content = readFileSync(path.join(ROOT, 'worker/wrangler.toml'), 'utf8')
  const match = content.match(new RegExp(`${key}\\s*=\\s*"([^"]*)"`))
  return match ? match[1] : null
}

function d1(sql) {
  const escaped = sql.replace(/"/g, '\\"')
  const cmd = `npx wrangler d1 execute toolbox-telemetry --remote --config worker/wrangler.toml --command "${escaped}" --json`
  const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, cwd: ROOT })
  const parsed = JSON.parse(out)
  return Array.isArray(parsed) ? parsed[0]?.results ?? [] : parsed?.results ?? []
}

// --- 1. Le site publié répond ---
let apiBase = null
try {
  const res = await fetch(SITE)
  if (res.ok) ok(`le site publié répond (${SITE}, HTTP ${res.status})`)
  else fail(`le site publié répond avec HTTP ${res.status} (attendu 200)`)
} catch (e) {
  fail(`le site publié est injoignable : ${e.message}`)
}

// --- 2. VITE_API_BASE n'est pas le placeholder ---
apiBase = readEnvVar('.env.production', 'VITE_API_BASE')
const isPlaceholder = !apiBase || /REPLACE_WITH/.test(apiBase)
if (isPlaceholder) {
  fail(`VITE_API_BASE dans .env.production est vide ou encore au placeholder : ${apiBase}`)
} else {
  ok(`VITE_API_BASE configuré : ${apiBase}`)
}

if (!isPlaceholder) {
  // --- 3. POST /events accepte un événement de test, puis le nettoie ---
  const testSessionId = `preflight-${Date.now()}`
  try {
    const res = await fetch(`${apiBase}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({
        session_id: testSessionId,
        app_version: 'preflight',
        schema_version: '1.0',
        campaign: 'preflight',
        events: [{ event: 'session_start', payload: {}, ts_client: Date.now(), viewport_bucket: 'large' }]
      })
    })
    const body = await res.json().catch(() => ({}))
    if (res.ok && body.ok) ok(`POST /events accepte un événement de test (session ${testSessionId})`)
    else fail(`POST /events a répondu HTTP ${res.status} : ${JSON.stringify(body)}`)
  } catch (e) {
    fail(`POST /events injoignable : ${e.message}`)
  }
  // --- 4. POST /audit répond (texte vide -> size_exceeded, sans appel au modèle, sans coût) ---
  // La même réponse distingue nativement size_exceeded (service disponible) de kill_switch
  // (coupure active), ce qui couvre aussi le contrôle 5 sans requête supplémentaire.
  try {
    const res = await fetch(`${apiBase}/audit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ session_id: `${testSessionId}-audit`, text: '' })
    })
    const body = await res.json().catch(() => ({}))
    if (body.reason === 'kill_switch') {
      fail('POST /audit répond kill_switch : la coupure d\'urgence est ACTIVE, le service est indisponible')
    } else if (body.reason === 'size_exceeded') {
      ok('POST /audit répond correctement (route/CORS/JSON fonctionnels, aucun appel au modèle consommé)')
    } else {
      warn(`POST /audit a répondu de façon inattendue : HTTP ${res.status} ${JSON.stringify(body)}`)
    }
  } catch (e) {
    fail(`POST /audit injoignable : ${e.message}`)
  }

  // Nettoyage : le test /events insère un événement sous testSessionId, et le test /audit avec un
  // texte vide insère systématiquement un audit_unavailable sous testSessionId-audit, quelle que
  // soit la raison (size_exceeded ou kill_switch) - les deux sessions doivent être purgées.
  try {
    d1(`DELETE FROM events WHERE session_id IN ('${testSessionId}', '${testSessionId}-audit')`)
    ok('événements de test nettoyés de D1')
  } catch (e) {
    warn(`nettoyage des événements de test échoué (à faire manuellement, sessions ${testSessionId} et ${testSessionId}-audit) : ${e.message}`)
  }

  // --- 5. GET /health : coupure, plafonds, dérive avec le wrangler.toml local ---
  try {
    const res = await fetch(`${apiBase}/health`, { headers: { Origin: ORIGIN } })
    const health = await res.json()

    if (health.kill_switch) fail('GET /health : coupure d\'urgence ACTIVE sur le Worker déployé')
    else ok('GET /health : coupure d\'urgence inactive (service disponible)')

    const localDailyCap = parseInt(readWranglerVar('AUDIT_DAILY_GLOBAL_CAP'), 10)
    if (health.audit_daily_global_cap === localDailyCap) {
      ok(`AUDIT_DAILY_GLOBAL_CAP déployé (${health.audit_daily_global_cap}) correspond au dépôt`)
    } else {
      fail(`AUDIT_DAILY_GLOBAL_CAP déployé (${health.audit_daily_global_cap}) diffère du dépôt (${localDailyCap}) — dérive entre le code et ce qui tourne`)
    }

    const localHourCap = parseInt(readWranglerVar('AUDIT_RATE_LIMIT_PER_SESSION_HOUR'), 10)
    if (health.audit_rate_limit_per_session_hour === localHourCap) {
      ok(`AUDIT_RATE_LIMIT_PER_SESSION_HOUR déployé (${health.audit_rate_limit_per_session_hour}) correspond au dépôt`)
    } else {
      fail(`AUDIT_RATE_LIMIT_PER_SESSION_HOUR déployé (${health.audit_rate_limit_per_session_hour}) diffère du dépôt (${localHourCap}) — dérive entre le code et ce qui tourne`)
    }

    // --- 6. Fraîcheur du plafond de lancement ---
    if (health.audit_daily_cap_review_due) {
      warn(`plafond de lancement (${health.audit_daily_global_cap}) encore actif au-delà de sa date de révision (${health.audit_daily_cap_review_date}) — envisager de redescendre AUDIT_DAILY_GLOBAL_CAP`)
    } else {
      ok(`fenêtre de lancement encore valide (révision prévue le ${health.audit_daily_cap_review_date})`)
    }
  } catch (e) {
    fail(`GET /health injoignable : ${e.message}`)
  }
}

console.log('')
if (failed) {
  console.error('Préflight : ÉCHEC — ne pas envoyer le lien avant correction.')
  process.exit(1)
}
console.log('Préflight : OK')
