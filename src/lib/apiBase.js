// Point d'entrée unique pour VITE_API_BASE, réutilisé par telemetry.js et stores/audit.js (qui
// lisaient chacun import.meta.env.VITE_API_BASE séparément). Détecte le cas "placeholder encore
// en place" en plus du cas "absent" : sans ça, un build publié sans .env.production correctement
// renseigné laisserait partir des requêtes vers un domaine inexistant plutôt que de désactiver
// proprement les appels réseau.
const RAW = import.meta.env.VITE_API_BASE || ''
const isPlaceholder = /REPLACE_WITH/.test(RAW)

export const API_BASE = (!RAW || isPlaceholder) ? '' : RAW
export const isApiConfigured = !!API_BASE

if (import.meta.env.PROD && !isApiConfigured) {
  // Un seul avertissement au chargement, jamais par événement : sert au diagnostic si le build
  // publié n'a pas été fait avec un .env.production correctement renseigné.
  console.warn(
    '[toolbox] VITE_API_BASE est absent ou vaut encore le placeholder : télémétrie et audit ' +
    'sont désactivés côté client (repli automatique sur la fixture pour l\'audit).'
  )
}
