import { safeSessionStorage } from './safeStorage.js'

// Marqueur de campagne (?src=) : seule source de vérité, lue par la télémétrie et le bandeau de
// consentement. Liste blanche fermée : aucune valeur libre venant de l'URL n'atteint jamais la
// base. tb2026 = lien envoyé aux enseignants ; selftest = passages de test du porteur du projet,
// à exclure de toute analyse (voir worker/analysis.sql) ; tout le reste = direct.
const ALLOWED = new Set(['tb2026', 'selftest'])
const KNOWN = new Set([...ALLOWED, 'direct'])
const KEY = 'tb_campaign'

// Repli si le stockage est bloqué, comme l'identifiant de session (session.js) : sans lui, un
// enseignant arrivé par ?src=tb2026 serait relu comme direct et sortirait du corpus.
let memoryCampaign = null

function readStored() {
  const stored = safeSessionStorage.getItem(KEY)
  return KNOWN.has(stored) ? stored : null
}

// Appelée une fois au démarrage (main.js), avant que le routeur à dièse ne fasse disparaître la
// query. Couvre les deux formes d'URL : ?src= avant le # (lien envoyé) et dans la query du hash
// (lien partagé du type .../#/arbre?src=tb2026). La première arrivée dans l'onglet l'emporte.
export function captureCampaignOnce() {
  if (readStored() || memoryCampaign) return
  const hash = window.location.hash || ''
  const hashQueryIndex = hash.indexOf('?')
  const hashQuery = hashQueryIndex >= 0 ? hash.slice(hashQueryIndex + 1) : ''
  const params = new URLSearchParams(hashQuery || window.location.search.replace(/^\?/, ''))
  const src = params.get('src')
  memoryCampaign = ALLOWED.has(src) ? src : 'direct'
  safeSessionStorage.setItem(KEY, memoryCampaign)
}

export function getCampaign() {
  return readStored() || memoryCampaign || 'direct'
}
