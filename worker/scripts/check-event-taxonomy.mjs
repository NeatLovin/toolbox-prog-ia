// Verrou anti-derive entre le code et ce qui tourne (point 1 de la mission "durcissement avant le
// pilote enseignant"). Deux controles statiques, aucun appel reseau :
//
// 1. Tout evenement emis cote client doit exister dans ALLOWED_EVENTS (worker/src/events.js) -
//    sinon le Worker le rejette silencieusement, comme cela s'est produit pour audit_truncated
//    avant que le Worker ne soit redeploye. Deux voies d'emission sont detectees : les appels
//    track('...') et les voies d'envoi dediees qui contournent volontairement track() (ex.
//    submitSurveyResponse() dans src/lib/telemetry.js) en fixant un nom d'evenement en dur - ces
//    dernieres sont reperees par un marqueur de commentaire explicite (`@client-event: nom`) plutot
//    que par une detection heuristique du litteral, pour eviter tout faux positif. Toute nouvelle
//    voie dediee doit porter ce marqueur pour rester couverte par ce controle.
// 2. AUDIT_MAX_CHARS (worker/wrangler.toml, plafond de refus par requete) doit toujours rester
//    strictement superieur a CHUNK_MAX (src/stores/audit.js, taille reelle d'une tranche envoyee
//    par le client) - sinon une tranche legitime commencerait a etre refusee.
//
// Execute automatiquement avant chaque build via le script npm "prebuild" (package.json) :
// npm execute pre<nom> avant <nom> pour tout script, donc avant "build" et donc avant "deploy"
// (qui appelle deja "predeploy" -> "build"). Sortie non nulle si un controle echoue.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const { ALLOWED_EVENTS } = await import(pathToFileURL(path.join(ROOT, 'worker/src/events.js')))

let failed = false
function fail(msg) { console.error(`✗ ${msg}`); failed = true }
function ok(msg) { console.log(`✓ ${msg}`) }

// --- 1. Taxonomie des evenements ---

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, exts, out)
    else if (exts.some(ext => entry.endsWith(ext))) out.push(full)
  }
  return out
}

const srcFiles = walk(path.join(ROOT, 'src'), ['.js', '.vue'])
const TRACK_RE = /track\(\s*['"]([a-zA-Z0-9_]+)['"]/g
const DEDICATED_RE = /@client-event:\s*([a-zA-Z0-9_]+)/g

function collect(content, re) {
  const found = new Map() // event name -> ignored here, filled by caller
  let m
  while ((m = re.exec(content))) found.set(m[1], true)
  return [...found.keys()]
}

const trackEvents = new Map()    // event name -> Set of files, via track('...')
const dedicatedEvents = new Map() // event name -> Set of files, via @client-event marker
for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8')
  const rel = path.relative(ROOT, file)
  for (const name of collect(content, TRACK_RE)) {
    if (!trackEvents.has(name)) trackEvents.set(name, new Set())
    trackEvents.get(name).add(rel)
  }
  for (const name of collect(content, DEDICATED_RE)) {
    if (!dedicatedEvents.has(name)) dedicatedEvents.set(name, new Set())
    dedicatedEvents.get(name).add(rel)
  }
}

const allEmittedNames = new Set([...trackEvents.keys(), ...dedicatedEvents.keys()])
const missingInWorker = [...allEmittedNames].filter(name => !ALLOWED_EVENTS.has(name))
const neverEmitted = [...ALLOWED_EVENTS].filter(name => !allEmittedNames.has(name))

if (missingInWorker.length) {
  for (const name of missingInWorker) {
    const files = new Set([...(trackEvents.get(name) || []), ...(dedicatedEvents.get(name) || [])])
    const via = dedicatedEvents.has(name) ? 'voie dédiée' : 'track()'
    fail(`événement '${name}' émis côté client via ${via} (${[...files].join(', ')}) mais absent de ALLOWED_EVENTS dans worker/src/events.js — sera rejeté silencieusement par le Worker déployé`)
  }
} else {
  ok(`tous les événements émis côté client (${trackEvents.size} via track(), ${dedicatedEvents.size} via voie dédiée) sont dans la liste blanche du Worker`)
}

if (dedicatedEvents.size) {
  const list = [...dedicatedEvents.entries()].map(([name, files]) => `${name} (${[...files].join(', ')})`).join(', ')
  console.log(`ℹ événements émis via une voie d'envoi dédiée, hors track() : ${list}`)
}

if (neverEmitted.length) {
  console.log(`ℹ événements de la liste blanche jamais émis, ni par track() ni par une voie dédiée (peut être volontaire, ex. reco_generative_used) : ${neverEmitted.join(', ')}`)
}

// --- 2. Cohérence CHUNK_MAX (client) / AUDIT_MAX_CHARS (Worker) ---

const auditStoreSrc = readFileSync(path.join(ROOT, 'src/stores/audit.js'), 'utf8')
const chunkMaxMatch = auditStoreSrc.match(/CHUNK_MAX\s*=\s*(\d[\d_]*)/)
if (!chunkMaxMatch) {
  fail('CHUNK_MAX introuvable dans src/stores/audit.js — le contrôle de cohérence avec AUDIT_MAX_CHARS ne peut pas être fait')
} else {
  const chunkMax = parseInt(chunkMaxMatch[1].replace(/_/g, ''), 10)

  const wranglerToml = readFileSync(path.join(ROOT, 'worker/wrangler.toml'), 'utf8')
  const auditMaxMatch = wranglerToml.match(/AUDIT_MAX_CHARS\s*=\s*"(\d+)"/)
  if (!auditMaxMatch) {
    fail('AUDIT_MAX_CHARS introuvable dans worker/wrangler.toml — le contrôle de cohérence avec CHUNK_MAX ne peut pas être fait')
  } else {
    const auditMax = parseInt(auditMaxMatch[1], 10)
    if (auditMax <= chunkMax) {
      fail(`AUDIT_MAX_CHARS (${auditMax}, worker/wrangler.toml) doit rester strictement supérieur à CHUNK_MAX (${chunkMax}, src/stores/audit.js) — sinon une tranche légitime serait refusée par le Worker`)
    } else {
      ok(`AUDIT_MAX_CHARS (${auditMax}) reste bien au-dessus de CHUNK_MAX (${chunkMax})`)
    }
  }
}

if (failed) {
  console.error('\nContrôle de cohérence taxonomie/valeurs partagées : ÉCHEC')
  process.exit(1)
}
console.log('\nContrôle de cohérence taxonomie/valeurs partagées : OK')
