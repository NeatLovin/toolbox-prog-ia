// Reconstitue chronologiquement les evenements d'une session, du premier au dernier.
// Trie explicitement sur ts_client (horodatage navigateur, strictement croissant) et non
// ts_server (assigne une fois par lot de flush, identique pour plusieurs evenements d'un
// meme lot) - voir worker/README.md section "ts_client vs ts_server".
//
// Usage : node worker/scripts/session-replay.mjs <session_id> [--local]

import { execSync } from 'node:child_process'

const sessionId = process.argv[2]
if (!sessionId) {
  console.error('Usage: node worker/scripts/session-replay.mjs <session_id> [--local]')
  process.exit(1)
}
const remoteFlag = process.argv.includes('--local') ? '' : '--remote'

const sql = `SELECT event, payload, ts_client FROM events WHERE session_id = '${sessionId.replace(/'/g, "''")}' ORDER BY ts_client ASC`
const cmd = `npx wrangler d1 execute toolbox-telemetry ${remoteFlag} --config worker/wrangler.toml --command "${sql}" --json`

const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
const parsed = JSON.parse(out)
const rows = Array.isArray(parsed) ? parsed[0]?.results ?? [] : parsed?.results ?? []

if (!rows.length) {
  console.log(`Aucun evenement trouve pour la session ${sessionId}.`)
  process.exit(0)
}

console.log(`${rows.length} evenement(s) pour la session ${sessionId}, dans l'ordre reel :\n`)
for (const row of rows) {
  const t = new Date(row.ts_client).toISOString()
  console.log(`${t}  ${row.event}  ${row.payload ?? ''}`)
}
