#!/usr/bin/env node
// Vérification bout en bout (lot 7) : simule un parcours de recommandation complet dans un
// navigateur réel, puis interroge la base D1 locale pour confirmer que les événements attendus
// sont bien arrivés.
//
// La télémétrie n'envoie rien sur le réseau en mode développement (`vite`) : ce script a donc
// besoin d'un build "production" (DEV=false, pour activer l'envoi réseau) mais pointant sur le
// Worker local (VITE_API_BASE=http://localhost:8787, chargé depuis .env.development). D'où
// `--mode development` sur `vite build`, qui ne change que les fichiers .env chargés, pas le
// mode DEV/PROD lui-même.
//
// Prérequis, dans deux terminaux séparés :
//   npx wrangler d1 execute toolbox-telemetry --local --file=worker/schema.sql   (une fois)
//   npm run worker:dev
//   npm run build -- --mode development && npm run preview
//
// Usage : node worker/scripts/verify-e2e.mjs

import { chromium } from 'playwright'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:4173/toolbox-prog-ia/'

function queryD1(sql) {
  // execSync (pas execFileSync) : sur Windows, execFileSync avec shell:true et un tableau
  // d'arguments finit par re-découper --command sur les espaces au lieu de le passer comme un
  // seul argument. Construire la ligne de commande nous-mêmes et la citer évite le problème.
  const escaped = sql.replace(/"/g, '\\"')
  const configPath = path.join(REPO_ROOT, 'worker', 'wrangler.toml')
  const cmd = `npx wrangler d1 execute toolbox-telemetry --local --config "${configPath}" --command "${escaped}" --json`
  const out = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' })
  const parsed = JSON.parse(out)
  return Array.isArray(parsed) ? parsed[0]?.results ?? [] : parsed?.results ?? []
}

async function runJourney() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const pageErrors = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.goto(`${BASE_URL}#/arbre`, { waitUntil: 'load' })
  await page.waitForSelector('.consent-banner', { state: 'visible', timeout: 10000 })
  await page.click('.consent-banner >> text=Accepter')
  await page.waitForTimeout(150)

  // Recharge la vue arbre après acceptation : reco_start se déclenche à son montage (onMounted
  // dans ArboreView.vue), donc uniquement s'il a lieu APRÈS que le consentement a été accordé.
  // Sur ce premier chargement (avant le clic "Accepter"), reco_start est perdu par conception
  // (aucun événement n'est mis en file tant qu'aucun consentement n'est donné) : c'est le
  // comportement voulu, pas un bug à contourner autrement qu'en rechargeant après coup, comme
  // le ferait un enseignant qui revient sur la page après avoir répondu au bandeau.
  // page.reload() plutôt qu'un second goto() vers la même URL : avec le routeur à dièse, un
  // goto() vers une URL identique (même hash) n'est pas une vraie navigation pour Chromium, le
  // bundle ne se réexécute pas et onMounted ne se redéclenche donc jamais.
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(150)

  await page.click('.zone-card--logique')
  await page.click('.concept-btn--all')
  await page.click('.context-btn >> nth=0')
  await page.click('.bloom-btn--skip')
  await page.waitForTimeout(400)

  // Le flush périodique (10s, FLUSH_INTERVAL_MS dans lib/telemetry.js) doit avoir le temps de
  // se déclencher PENDANT que la page est encore vivante : fermer le navigateur tout de suite
  // tue le timer avant qu'il ne parte, et browser.close() ne simule pas fidèlement le
  // visibilitychange->hidden d'un vrai onglet fermé par l'utilisateur. On attend ici, page
  // ouverte, plutôt que de forcer artificiellement l'événement.
  console.log('Attente du flush périodique de la file de télémétrie (12s, page ouverte)...')
  await page.waitForTimeout(12000)

  await browser.close()
  return pageErrors
}

async function main() {
  const sinceMs = Date.now()
  console.log(`Parcours e2e contre ${BASE_URL} ...`)
  const pageErrors = await runJourney()
  if (pageErrors.length) {
    console.error('Erreurs JS pendant le parcours :', pageErrors)
  }

  const expectedEvents = [
    'session_start', 'consent_choice', 'reco_start',
    'reco_question_answered', 'reco_result_shown'
  ]

  const rows = queryD1(
    `SELECT event, COUNT(*) AS n FROM events WHERE ts_server > ${sinceMs} GROUP BY event`
  )
  const counts = Object.fromEntries(rows.map((r) => [r.event, r.n]))

  console.log('\nÉvénements reçus depuis le début du script :')
  for (const [event, n] of Object.entries(counts)) console.log(`  ${event}: ${n}`)

  let ok = true
  console.log('\nVérification :')
  for (const ev of expectedEvents) {
    const pass = (counts[ev] || 0) > 0
    if (!pass) ok = false
    console.log(`  ${pass ? 'OK  ' : 'FAIL'} ${ev}`)
  }
  if (pageErrors.length) ok = false

  // Bonus : croise les outils jamais ouverts (toutes sessions en base) avec les 48 du dépôt,
  // exactement le calcul que la requête 5 d'analysis.sql ne peut pas faire seule (D1 n'a pas
  // la liste des identifiants d'outils).
  try {
    const toolsPath = path.join(REPO_ROOT, 'src', 'data', 'tools.json')
    const allTools = JSON.parse(readFileSync(toolsPath, 'utf8')).map((t) => t.id)
    const openedRows = queryD1(
      `SELECT DISTINCT json_extract(payload, '$.tool_id') AS tool_id FROM events WHERE event IN ('tool_detail_open','reco_tool_open')`
    )
    const opened = new Set(openedRows.map((r) => r.tool_id).filter(Boolean))
    const neverOpened = allTools.filter((id) => !opened.has(id))
    console.log(`\nOutils jamais ouverts (toutes sessions en base) : ${neverOpened.length}/${allTools.length}`)
  } catch (e) {
    console.warn('Croisement outils jamais ouverts ignoré :', e.message)
  }

  console.log(`\n${ok ? 'VÉRIFICATION RÉUSSIE' : 'ÉCHEC DE LA VÉRIFICATION'}`)
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
