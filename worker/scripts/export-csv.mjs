#!/usr/bin/env node
// Convertit en CSV le JSON produit par `wrangler d1 execute ... --json`.
// Aucune dépendance ajoutée : lecture stdin, écriture stdout.
//
// Usage :
//   npx wrangler d1 execute toolbox-telemetry --remote --command "SELECT * FROM events" --json \
//     | node worker/scripts/export-csv.mjs > events.csv

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const raw = Buffer.concat(chunks).toString('utf8')

const parsed = JSON.parse(raw)
const results = Array.isArray(parsed) ? parsed[0]?.results : parsed?.results

if (!results || results.length === 0) {
  process.stderr.write('Aucune ligne à exporter.\n')
  process.exit(0)
}

const columns = Object.keys(results[0])

function csvEscape(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str
}

const lines = [columns.join(',')]
for (const row of results) {
  lines.push(columns.map(c => csvEscape(row[c])).join(','))
}

process.stdout.write(lines.join('\n') + '\n')
