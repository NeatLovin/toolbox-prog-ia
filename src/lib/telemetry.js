import { getSessionId } from './session.js'
import { hasConsent } from './consent.js'
import { API_BASE, isApiConfigured } from './apiBase.js'
import { getCampaign } from './campaign.js'

const SCHEMA_VERSION = '1.0'
const FLUSH_INTERVAL_MS = 10_000
const FLUSH_BATCH_SIZE = 20
// Borne haute de sécurité en mémoire si le réseau reste indisponible longtemps : au-delà, les
// plus anciens événements en file sont perdus silencieusement plutôt que de croître sans limite
// sur une session très longue. Très généreux par rapport au rythme de flush normal (10s/20 evt).
const MAX_QUEUE = 200

// Mode développement (npm run dev), ou adresse du Worker absente/placeholder (voir apiBase.js) :
// journalise en console au lieu d'envoyer sur le réseau.
const CONSOLE_MODE = import.meta.env.DEV || !isApiConfigured

let queue = []
let flushTimer = null

// reco_generative_used est défini dans la taxonomie du Worker (liste blanche) mais n'est émis
// nulle part dans ce code : aucune couche générative de reformulation n'existe aujourd'hui dans
// l'arbre de décision (seul l'audit appelle un modèle, pour la classification). Câbler cet
// événement sur un comportement inexistant fabriquerait un signal. Il sera émis le jour où cette
// couche optionnelle (cf. Choix_stack_technique_PoC_Toolbox.md, section 4.3) sera implémentée.

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

// Voie d'envoi dédiée, volontairement indépendante de hasConsent(). N'est légitime que pour un
// envoi déclenché par un acte explicite de la personne, à ce moment précis (ex. cliquer "Envoyer"
// sur le questionnaire de fin de parcours) : cet acte vaut consentement pour cet envoi-là, et pour
// lui seul. Jamais pour un événement automatique (affichage, ouverture) ni pour un refus de
// répondre — ces deux cas doivent passer par track(), sous la garde normale de hasConsent(). Une
// première version de survey_shown/survey_dismissed passait par ici à tort (un affichage
// automatique et un refus de répondre ne sont pas des actes de consentement) ; corrigé, voir
// trackSurveyShown/trackSurveyDismissed plus bas. Ne touche jamais à queue/flush() de track() : un
// seul événement, une seule requête immédiate, jamais combiné avec d'autres événements en attente.
//
// N'est jamais exportée directement : chaque export public ci-dessous fixe son propre nom
// d'événement en dur (jamais un paramètre) et porte son propre marqueur "@client-event", pour que
// worker/scripts/check-event-taxonomy.mjs (qui ne voit pas les noms figés en dur hors des appels
// track(...)) les détecte individuellement. Toute nouvelle voie d'envoi dédiée doit remplir la
// condition ci-dessus (acte explicite, jamais automatique, jamais un refus) ET porter ce marqueur.
function sendDedicatedEvent(event, payload) {
  const body = JSON.stringify({
    session_id: getSessionId(),
    app_version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev',
    schema_version: SCHEMA_VERSION,
    campaign: getCampaign(),
    events: [{ event, payload, ts_client: Date.now(), viewport_bucket: viewportBucket() }]
  })
  if (CONSOLE_MODE) {
    console.debug(`[telemetry:${event}]`, payload)
    return
  }
  try {
    fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {})
  } catch {
    // Échec réseau toujours silencieux, comme le reste de la télémétrie.
  }
}

// Ni l'un ni l'autre n'est un acte explicite de consentement (un affichage est automatique, un
// "Passer" est un refus de répondre) : passent par track(), sous la garde normale du consentement
// général, comme n'importe quel autre événement. N'existeront donc pas pour une session qui a
// refusé ou n'a pas encore choisi — voir worker/analysis.sql (requête 10) pour la conséquence sur
// le calcul du taux de complétion du questionnaire.
export function trackSurveyShown(parcours) {
  track('survey_shown', { parcours })
}

export function trackSurveyDismissed(parcours) {
  track('survey_dismissed', { parcours })
}

// @client-event: survey_submitted
export function submitSurveyResponse(payload) {
  sendDedicatedEvent('survey_submitted', payload)
}

// Envoi de fin de session : sur visibilitychange -> hidden plutôt que beforeunload (qui manque
// les abandons mobile/onglet-fermé et n'est pas fiable), via sendBeacon pour survivre au
// déchargement de la page.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true)
  })
}
