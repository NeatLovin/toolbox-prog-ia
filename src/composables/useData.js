import tools from '../data/tools.json'
import concepts from '../data/concepts.json'
import matrix from '../data/matrix.json'
import combos from '../data/combos.json'
import meta from '../data/meta.json'
import patronsData from '../data/patrons.json'

// Index conceptId -> patron (calcule une seule fois au chargement)
const _patronMap = Object.fromEntries(
  patronsData.patrons.flatMap(p => p.concepts.map(cid => [cid, p]))
)

export function useData() {
  function getPatronByConcept(conceptId) {
    return _patronMap[conceptId] || null
  }

  return { tools, concepts, matrix, combos, meta, patrons: patronsData.patrons, patronMeta: patronsData.meta, getPatronByConcept }
}
