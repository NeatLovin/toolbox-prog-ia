// Reconstitue chronologiquement les evenements d'une session, du premier au dernier.
// Trie explicitement sur ts_client (horodatage navigateur, strictement croissant) et non
// ts_server (assigne une fois par lot de flush, identique pour plusieurs evenements d'un
// meme lot) - voir worker/README.md section "ts_client vs ts_server".
//
// Usage : node worker/scripts/session-replay.mjs [session_id] [--local]
// Sans session_id (ou via `npm run pilot:replay`) : cible automatiquement la session la plus
// recente, pratique pour relire le passage du pilote juste apres coup.

import { execSync } from 'node:child_process'

const args = process.argv.slice(2).filter(a => a !== '--local')
const explicitSessionId = args[0] || null
const remoteFlag = process.argv.includes('--local') ? '' : '--remote'

function d1(sql) {
  const escaped = sql.replace(/"/g, '\\"')
  const cmd = `npx wrangler d1 execute toolbox-telemetry ${remoteFlag} --config worker/wrangler.toml --command "${escaped}" --json`
  const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  const parsed = JSON.parse(out)
  return Array.isArray(parsed) ? parsed[0]?.results ?? [] : parsed?.results ?? []
}

let sessionId = explicitSessionId
if (!sessionId) {
  const latest = d1('SELECT session_id FROM events ORDER BY ts_client DESC LIMIT 1')
  if (!latest.length) {
    console.log('Aucune session trouvée en base.')
    process.exit(0)
  }
  sessionId = latest[0].session_id
  console.log(`Aucun session_id fourni : ciblage de la session la plus récente (${sessionId}).\n`)
}

const rows = d1(`SELECT event, payload, ts_client, campaign FROM events WHERE session_id = '${sessionId.replace(/'/g, "''")}' ORDER BY ts_client ASC`)

if (!rows.length) {
  console.log(`Aucun événement trouvé pour la session ${sessionId}.`)
  process.exit(0)
}

const first = rows[0]
const last = rows[rows.length - 1]
const durationMs = last.ts_client - first.ts_client
const campaigns = [...new Set(rows.map(r => r.campaign).filter(Boolean))]

console.log(`Session ${sessionId}`)
console.log(`${rows.length} événement(s), du ${new Date(first.ts_client).toISOString()} au ${new Date(last.ts_client).toISOString()} (${Math.round(durationMs / 1000)}s)`)
if (campaigns.length === 0) {
  console.log('⚠ aucune campagne renseignée sur cette session (attendu : tb2026 pour un vrai parcours pilote)')
} else if (campaigns.length > 1) {
  console.log(`⚠ plusieurs campagnes différentes sur cette session : ${campaigns.join(', ')}`)
} else if (campaigns[0] !== 'tb2026') {
  console.log(`⚠ campagne inattendue : ${campaigns[0]} (attendu tb2026 pour le pilote)`)
} else {
  console.log(`✓ campagne tb2026 confirmée`)
}
console.log(`Premier événement : ${first.event}  —  Dernier événement : ${last.event}`)
console.log('\nDéroulé chronologique complet :\n')
for (const row of rows) {
  const t = new Date(row.ts_client).toISOString()
  console.log(`${t}  ${row.event}  ${row.payload ?? ''}`)
}
