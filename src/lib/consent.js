import { ref } from 'vue'

// Choix mémorisé pour la durée de la session uniquement (sessionStorage, jamais localStorage).
const CONSENT_KEY = 'tb_consent'

function readStored() {
  try {
    return sessionStorage.getItem(CONSENT_KEY)
  } catch {
    return null
  }
}

// 'granted' | 'denied' | null (aucun choix fait encore)
export const consentStatus = ref(readStored())

// Force la réouverture du bandeau (lien "Confidentialité" du pied de page) sans effacer le
// choix déjà stocké : l'utilisateur peut revenir dessus et en changer.
export const bannerForcedOpen = ref(false)

export function hasConsent() {
  return consentStatus.value === 'granted'
}

export function grantConsent() {
  consentStatus.value = 'granted'
  try {
    sessionStorage.setItem(CONSENT_KEY, 'granted')
  } catch {
    // sessionStorage indisponible : le choix reste en mémoire pour la session JS en cours
  }
}

export function denyConsent() {
  consentStatus.value = 'denied'
  try {
    sessionStorage.setItem(CONSENT_KEY, 'denied')
  } catch {
    // idem
  }
}

export function reopenBanner() {
  bannerForcedOpen.value = true
}

export function closeBanner() {
  bannerForcedOpen.value = false
}
