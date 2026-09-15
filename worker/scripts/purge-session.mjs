// Purge ciblée d'une session (events + audit_calls), puis confirmation qu'il n'en reste rien.
// L'argument est obligatoire : pas de valeur par défaut ("dernière session") sur une action
// destructive, contrairement à session-replay.mjs qui est en lecture seule.
//
// Usage : node worker/scripts/purge-session.mjs <session_id> [--local]

import { execSync } from 'node:child_process'

const sessionId = process.argv[2]
if (!sessionId || sessionId === '--local') {
  console.error('Usage: node worker/scripts/purge-session.mjs <session_id> [--local]')
  console.error('session_id obligatoire : pas de purge "dernière session" implicite.')
  process.exit(1)
}
const remoteFlag = process.argv.includes('--local') ? '' : '--remote'

function d1(sql) {
  const escaped = sql.replace(/"/g, '\\"')
  const cmd = `npx wrangler d1 execute toolbox-telemetry ${remoteFlag} --config worker/wrangler.toml --command "${escaped}" --json`
  const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  const parsed = JSON.parse(out)
  return Array.isArray(parsed) ? parsed[0]?.results ?? [] : parsed?.results ?? []
}

const safeId = sessionId.replace(/'/g, "''")
d1(`DELETE FROM events WHERE session_id = '${safeId}'`)
d1(`DELETE FROM audit_calls WHERE session_id = '${safeId}'`)

const remainingEvents = d1(`SELECT COUNT(*) as n FROM events WHERE session_id = '${safeId}'`)
const remainingCalls = d1(`SELECT COUNT(*) as n FROM audit_calls WHERE session_id = '${safeId}'`)

const n1 = remainingEvents[0]?.n ?? 0
const n2 = remainingCalls[0]?.n ?? 0
if (n1 === 0 && n2 === 0) {
  console.log(`✓ session ${sessionId} purgée (events + audit_calls), 0 ligne restante.`)
} else {
  console.error(`✗ session ${sessionId} : ${n1} ligne(s) restante(s) dans events, ${n2} dans audit_calls.`)
  process.exit(1)
}
