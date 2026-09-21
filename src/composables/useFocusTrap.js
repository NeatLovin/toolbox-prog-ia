import { nextTick } from 'vue'

// Piège de focus minimal pour une modale teleportée et montée conditionnellement (v-if) :
// focus initial sur l'élément racine à l'ouverture, cycle Tab/Shift+Tab confiné à la modale,
// fermeture sur Échap, restauration du focus sur l'élément déclencheur à la fermeture.
// Usage : appeler activate()/deactivate() depuis le watch existant sur la prop qui pilote le
// v-if (tool/concept...), attacher handleKeydown via @keydown sur l'élément racine (celui pointé
// par modalElRef, qui doit porter tabindex="-1" pour être focalisable programmatiquement).
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(modalElRef, onClose) {
  let previouslyFocused = null

  async function activate() {
    previouslyFocused = document.activeElement
    await nextTick()
    modalElRef.value?.focus()
  }

  function deactivate() {
    previouslyFocused?.focus?.()
    previouslyFocused = null
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const root = modalElRef.value
    if (!root) return
    const focusable = [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter(el => el.offsetParent !== null)
    if (focusable.length === 0) { e.preventDefault(); return }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return { activate, deactivate, handleKeydown }
}
