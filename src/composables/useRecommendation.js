import tools from '../data/tools.json'
import concepts from '../data/concepts.json'
import matrix from '../data/matrix.json'
import combos from '../data/combos.json'

const BLOOM_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

function bloomCovers(comboBloom, userBloom) {
  if (comboBloom === 'Multi-niveaux') return true
  const parts = comboBloom.split('-')
  if (parts.length === 1) return parts[0] === userBloom
  const startIdx = BLOOM_ORDER.indexOf(parts[0])
  const endIdx = BLOOM_ORDER.indexOf(parts[parts.length - 1])
  const userIdx = BLOOM_ORDER.indexOf(userBloom)
  if (startIdx === -1 || endIdx === -1 || userIdx === -1) return false
  return userIdx >= startIdx && userIdx <= endIdx
}

function familyCovers(comboFamily, userFamily) {
  if (comboFamily === 'Toutes familles') return true
  if (comboFamily === 'Syntaxe-Logique') return userFamily === 'Syntaxe' || userFamily === 'Logique'
  return comboFamily === userFamily
}

function yearCovers(comboYear, userYear) {
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
  const match = combos.find(combo =>
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
      tools: match.recommended_tools
        .map(id => tools.find(t => t.id === id))
        .filter(Boolean),
      justification: match.justification
    }
  }

  // Fallback : classement par score matriciel
  const fnCodeMap = { 'Formative': 'F', 'Sommative': 'S' }
  const fnCode = fnCodeMap[fn]

  const familyConcepts = concepts
    .filter(c => familyCovers(concept_family, c.family) || c.family === concept_family)
    .map(c => c.id)

  const scores = {}
  matrix.cells
    .filter(cell => familyConcepts.includes(cell.concept))
    .forEach(cell => {
      scores[cell.tool] = (scores[cell.tool] || 0) + cell.score
    })

  const ranked = tools
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
