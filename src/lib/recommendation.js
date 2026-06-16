import toolsData from '../data/tools.json'
import conceptsData from '../data/concepts.json'
import matrixData from '../data/matrix.json'
import combosData from '../data/combos.json'

export const BLOOM_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

export function bloomCovers(comboBloom, userBloom) {
  if (comboBloom === 'Multi-niveaux') return true
  const parts = comboBloom.split('-')
  if (parts.length === 1) return parts[0] === userBloom
  const startIdx = BLOOM_ORDER.indexOf(parts[0])
  const endIdx = BLOOM_ORDER.indexOf(parts[parts.length - 1])
  const userIdx = BLOOM_ORDER.indexOf(userBloom)
  if (startIdx === -1 || endIdx === -1 || userIdx === -1) return false
  return userIdx >= startIdx && userIdx <= endIdx
}

export function familyCovers(comboFamily, userFamily) {
  if (comboFamily === 'Toutes familles') return true
  if (comboFamily === 'Syntaxe-Logique') return userFamily === 'Syntaxe' || userFamily === 'Logique'
  return comboFamily === userFamily
}

export function yearCovers(comboYear, userYear) {
  if (comboYear === 'Transversal') return true
  if (comboYear.includes('-')) {
    const parts = comboYear.split('-')
    const startN = parseInt(parts[0].replace('S', ''))
    const endN = parseInt(parts[1].replace('S', ''))
    const userN = parseInt(userYear.replace('S', ''))
    if (isNaN(startN) || isNaN(endN) || isNaN(userN)) return false
    return userN >= startN && userN <= endN
  }
  return comboYear === userYear
}

export function getRecommendation({ year, concept_family, bloom, function: fn, context }) {
  const match = combosData.find(combo =>
    yearCovers(combo.year, year) &&
    familyCovers(combo.concept_family, concept_family) &&
    bloomCovers(combo.bloom, bloom) &&
    combo.function === fn &&
    combo.context === context
  )

  if (match) {
    return {
      source: 'combo',
      combo: match,
      tools: match.recommended_tools.map(id => toolsData.find(t => t.id === id)).filter(Boolean),
      justification: match.justification
    }
  }

  const fnCodeMap = { Formative: 'F', Sommative: 'S' }
  const fnCode = fnCodeMap[fn]

  const familyConcepts = conceptsData
    .filter(c => familyCovers(concept_family, c.family) || c.family === concept_family)
    .map(c => c.id)

  const scores = {}
  matrixData.cells
    .filter(cell => familyConcepts.includes(cell.concept))
    .forEach(cell => { scores[cell.tool] = (scores[cell.tool] || 0) + cell.score })

  const ranked = toolsData
    .filter(t => !fnCode || t.function === fnCode || t.function === 'FS')
    .map(t => ({ tool: t, score: scores[t.id] || 0 }))
    .sort((a, b) => b.score - a.score || a.tool.cost_num - b.tool.cost_num)
    .slice(0, 3)
    .map(({ tool }) => tool)

  return {
    source: 'matrix',
    combo: null,
    tools: ranked,
    justification: 'Aucune combinatoire exacte trouvee. Recommandation calculee a partir des scores de la matrice de pertinence pour la famille de concepts selectionnee.'
  }
}

// Retourne les outils de la matrice pour un concept, avec score >= minScore, tries par score desc.
export function getToolsForConcept(conceptId, minScore = 2) {
  return matrixData.cells
    .filter(c => c.concept === conceptId && c.score >= minScore)
    .map(c => {
      const tool = toolsData.find(t => t.id === c.tool)
      return tool ? { ...tool, matrix_score: c.score } : null
    })
    .filter(Boolean)
    .sort((a, b) => b.matrix_score - a.matrix_score)
}

export const GENERIC_RECOMMENDATION = `Cette analyse croise les concepts detectes dans votre cours avec la matrice de pertinence (840 cellules, scores 1 a 3) et les 32 patrons d'activite du TB. Chaque recommandation est tracable jusqu'aux donnees sources. La Toolbox aide a identifier des leviers pertinents selon la configuration pedagogique detectee ; les choix restent ceux de l'enseignant.`

// Calcule une recommandation globale deterministe pour l'ensemble du cours.
// Retourne : { dominantFamily, risk, dominantBloom, levers, conceptCount, sectionCount }
export function computeCourseGlobalRec(validatedClassifs) {
  const allConceptIds = [...new Set(validatedClassifs.flatMap(s => s.concept_ids))]

  const familyCounts = {}
  allConceptIds.forEach(id => {
    const c = conceptsData.find(c => c.id === id)
    if (c) familyCounts[c.family] = (familyCounts[c.family] || 0) + 1
  })
  const dominantFamily = Object.entries(familyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const riskMap = { Syntaxe: 'Maximal', Logique: 'Eleve', Architecture: 'Modere' }
  const risk = dominantFamily ? (riskMap[dominantFamily] || null) : null

  const bloomCounts = {}
  validatedClassifs.forEach(s => { if (s.bloom) bloomCounts[s.bloom] = (bloomCounts[s.bloom] || 0) + 1 })
  const dominantBloom = Object.entries(bloomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const familyConceptIds = dominantFamily
    ? allConceptIds.filter(id => conceptsData.find(c => c.id === id)?.family === dominantFamily)
    : allConceptIds

  const toolScores = {}
  matrixData.cells
    .filter(cell => familyConceptIds.includes(cell.concept))
    .forEach(cell => { toolScores[cell.tool] = (toolScores[cell.tool] || 0) + cell.score })

  const levers = toolsData
    .filter(t => (t.robustness_num ?? 0) >= 3 && toolScores[t.id])
    .sort((a, b) => (toolScores[b.id] || 0) - (toolScores[a.id] || 0))
    .slice(0, 3)

  return { dominantFamily, risk, dominantBloom, levers, conceptCount: allConceptIds.length, sectionCount: validatedClassifs.length }
}

// Retourne les combos correspondant aux parametres donnes (tous facultatifs sauf families qui est un tableau).
export function getMatchingCombos({ year, families, bloom, fn, context } = {}) {
  return combosData
    .filter(combo => {
      if (year && !yearCovers(combo.year, year)) return false
      if (families?.length && !families.some(f => familyCovers(combo.concept_family, f))) return false
      if (bloom && !bloomCovers(combo.bloom, bloom)) return false
      if (fn && combo.function !== fn) return false
      if (context && combo.context !== context) return false
      return true
    })
    .map(combo => ({
      ...combo,
      tools: combo.recommended_tools.map(id => toolsData.find(t => t.id === id)).filter(Boolean)
    }))
}
