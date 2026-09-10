import { track } from './telemetry.js'

// Détection d'un "clic mort" : au moins deux clics en moins d'une seconde sur le même élément
// d'une zone non interactive. Limité aux zones à risque (cellules de matrice, badges de score,
// étiquettes de famille) pour ne pas produire de bruit. `key` identifie l'élément précis
// (ex. un id de cellule) pour ne pas confondre deux clics rapprochés sur deux éléments distincts
// d'une même zone, ce qui est un usage normal (parcours rapide de la matrice).
const lastClickAt = new Map()

export function useDeadClickZone(area) {
  return function onDeadClick(key = area) {
    const identity = `${area}:${key}`
    const now = Date.now()
    const last = lastClickAt.get(identity) || 0
    lastClickAt.set(identity, now)
    if (now - last < 1000) {
      track('dead_click', { area })
    }
  }
}
