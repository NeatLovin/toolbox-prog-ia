// Identifiant de session anonyme, généré à chaque visite et conservé en sessionStorage
// uniquement (jamais localStorage) pour ne créer aucun identifiant persistant entre visites.
// Partagé entre le relais d'audit (stores/audit.js) et la télémétrie (lib/telemetry.js).
const SESSION_KEY = 'tb_session_id'

export function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return 'no-storage'
  }
}
