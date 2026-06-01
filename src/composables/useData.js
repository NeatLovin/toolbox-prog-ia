import tools from '../data/tools.json'
import concepts from '../data/concepts.json'
import matrix from '../data/matrix.json'
import combos from '../data/combos.json'
import meta from '../data/meta.json'
import patronsData from '../data/patrons.json'

// Index conceptId -> [patron, ...] (plusieurs patrons possibles par concept)
const _patronsMap = {}
patronsData.patrons.forEach(p => {
  p.concepts.forEach(cid => {
    if (!_patronsMap[cid]) _patronsMap[cid] = []
    _patronsMap[cid].push(p)
  })
})

export function useData() {
  // Retourne tous les patrons d'un concept (tableau, potentiellement vide)
  function getPatronsByConcept(conceptId) {
    return _patronsMap[conceptId] || []
  }

  // Retourne { exact, others, all, hasExact }
  // exact : patrons dont le contexte correspond exactement
  // others : patrons des autres contextes
  // all : tous les patrons du concept
  // hasExact : vrai si au moins un patron exact
  function getPatronsByConceptAndContext(conceptId, contexte) {
    const all = _patronsMap[conceptId] || []
    if (!contexte || all.length === 0) {
      return { exact: [], others: all, all, hasExact: false }
    }
    const exact = all.filter(p => p.contexte === contexte)
    const others = all.filter(p => p.contexte !== contexte)
    return { exact, others, all, hasExact: exact.length > 0 }
  }

  return {
    tools,
    concepts,
    matrix,
    combos,
    meta,
    patrons: patronsData.patrons,
    patronMeta: patronsData.meta,
    getPatronsByConcept,
    getPatronsByConceptAndContext
  }
}
