// Accès au stockage qui ne lève jamais d'exception. Un navigateur qui bloque les données de site
// (réglage « bloquer tous les cookies », poste verrouillé) lève une SecurityError dès la simple
// lecture de window.localStorage : ici, l'accès n'a lieu qu'au moment de l'appel, dans un try,
// jamais au chargement du module. Sans stockage, l'application perd seulement ce qu'elle
// mémorisait (thème, résultat d'audit), elle continue de s'afficher.
function safe(getStorage) {
  return {
    getItem(key) {
      try { return getStorage().getItem(key) } catch { return null }
    },
    setItem(key, value) {
      try { getStorage().setItem(key, value) } catch {}
    },
    removeItem(key) {
      try { getStorage().removeItem(key) } catch {}
    }
  }
}

export const safeSessionStorage = safe(() => window.sessionStorage)
export const safeLocalStorage = safe(() => window.localStorage)
