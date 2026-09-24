// Identifiant de session anonyme, généré à chaque visite et conservé en sessionStorage
// uniquement (jamais localStorage) pour ne créer aucun identifiant persistant entre visites.
// Partagé entre le relais d'audit (stores/audit.js) et la télémétrie (lib/telemetry.js).
const SESSION_KEY = 'tb_session_id'

// Repli si le stockage est bloqué : un identifiant propre à cette page, gardé en mémoire. Une
// constante partagée ferait fusionner tous les visiteurs sans stockage en une seule session, et leur
// ferait partager le plafond d'audit par session.
let memoryId = null

export function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    if (!memoryId) memoryId = crypto.randomUUID()
    return memoryId
  }
}
