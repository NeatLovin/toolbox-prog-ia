import { getSessionId } from './session.js'
import { hasConsent } from './consent.js'

const SCHEMA_VERSION = '1.0'
const FLUSH_INTERVAL_MS = 10_000
const FLUSH_BATCH_SIZE = 20
// Borne haute de sécurité en mémoire si le réseau reste indisponible longtemps : au-delà, les
// plus anciens événements en file sont perdus silencieusement plutôt que de croître sans limite
// sur une session très longue. Très généreux par rapport au rythme de flush normal (10s/20 evt).
const MAX_QUEUE = 200

const API_BASE = import.meta.env.VITE_API_BASE || ''
// Mode développement (npm run dev, ou VITE_API_BASE absent) : journalise en console au lieu
// d'envoyer sur le réseau, pour ne jamais peupler la base pendant le développement local.
const CONSOLE_MODE = import.meta.env.DEV || !API_BASE

let queue = []
let flushTimer = null

// reco_generative_used est défini dans la taxonomie du Worker (liste blanche) mais n'est émis
// nulle part dans ce code : aucune couche générative de reformulation n'existe aujourd'hui dans
// l'arbre de décision (seul l'audit appelle un modèle, pour la classification). Câbler cet
// événement sur un comportement inexistant fabriquerait un signal. Il sera émis le jour où cette
// couche optionnelle (cf. Choix_stack_technique_PoC_Toolbox.md, section 4.3) sera implémentée.

function getCampaign() {
  try {
    return sessionStorage.getItem('tb_campaign') || 'direct'
  } catch {
    return 'direct'
  }
}

function viewportBucket() {
  const w = window.innerWidth
  if (w < 640) return 'small'
  if (w < 1024) return 'medium'
  return 'large'
}

export function track(event, payload = {}) {
  // Tant qu'aucun consentement n'est accordé, rien n'est envoyé ET rien n'est mis en file :
  // un refus (ou une absence de choix) ne laisse aucune trace, même différée.
  if (!hasConsent()) return

  const entry = {
    event,
    payload,
    ts_client: Date.now(),
    viewport_bucket: viewportBucket()
  }

  if (CONSOLE_MODE) {
    console.debug('[telemetry]', event, payload)
    return
  }

  queue.push(entry)
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE)

  if (queue.length >= FLUSH_BATCH_SIZE) {
    flush()
  } else {
    scheduleFlush()
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, FLUSH_INTERVAL_MS)
}

function flush(useBeacon = false) {
  if (queue.length === 0) return
  const batch = queue.splice(0, FLUSH_BATCH_SIZE)

  const body = JSON.stringify({
    session_id: getSessionId(),
    app_version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev',
    schema_version: SCHEMA_VERSION,
    campaign: getCampaign(),
    events: batch
  })

  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(`${API_BASE}/events`, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {})
    }
  } catch {
    // Échec réseau toujours silencieux : ne jamais remonter d'erreur à l'utilisateur ni
    // bloquer l'interface pour une histoire de télémétrie.
  }
}

// Envoi de fin de session : sur visibilitychange -> hidden plutôt que beforeunload (qui manque
// les abandons mobile/onglet-fermé et n'est pas fiable), via sendBeacon pour survivre au
// déchargement de la page.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true)
  })
}
