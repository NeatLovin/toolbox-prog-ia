import { ref } from 'vue'
import conceptsData from '../data/concepts.json'
import { getRecommendation, getToolsForConcept, getMatchingCombos, BLOOM_ORDER } from '../lib/recommendation.js'

const PROXY_URL = 'http://localhost:3001/api/classify'

const CONCEPT_LIST = conceptsData.map(c => `${c.id} : ${c.name}`).join('\n')

function buildPrompt(section) {
  return `Tu analyses une section de cours de programmation pour identifier les concepts pedagogiques couverts.

Concepts disponibles - retourne UNIQUEMENT des IDs de cette liste :
${CONCEPT_LIST}

Niveaux Bloom acceptes : Remember, Understand, Apply, Analyze, Evaluate, Create
Contextes acceptes : Presentiel encadre, Autonomie supervisee, Projet long, Diagnostic

Section : "${section.title}"
Extrait : ${section.text_excerpt.slice(0, 600)}

Reponds uniquement avec un JSON valide, sans texte avant ni apres :
{
  "concept_ids": ["C1.1"],
  "bloom": "Apply",
  "context": "Presentiel encadre",
  "confidence": 0.85
}

Regles :
- concept_ids : 0 a 3 IDs uniquement parmi la liste ci-dessus, tableau vide si aucun concept identifiable
- N'invente jamais un ID hors de la liste fournie
- confidence : 0.0 (aucune certitude) a 1.0 (tres certain)`
}

async function classifySection(section) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: buildPrompt(section) }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Proxy: HTTP ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Pas de JSON dans la reponse du modele')

  const parsed = JSON.parse(jsonMatch[0])
  const validIds = new Set(conceptsData.map(c => c.id))
  const safeIds = (parsed.concept_ids || []).filter(id => validIds.has(id)).slice(0, 3)

  return {
    concept_ids: safeIds,
    bloom: BLOOM_ORDER.includes(parsed.bloom) ? parsed.bloom : null,
    context: parsed.context || 'Presentiel encadre',
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5))
  }
}

function segmentSections(pages) {
  const allItems = []
  for (const page of pages) {
    for (const item of page.items) {
      if (item.str?.trim()) {
        allItems.push({ str: item.str.trim(), height: item.height || 0, pageNum: page.pageNum })
      }
    }
  }

  const heights = allItems.map(i => i.height).filter(h => h > 0).sort((a, b) => a - b)
  const median = heights[Math.floor(heights.length / 2)] || 12
  const headingThreshold = median * 1.4
  const TITLE_RE = /^(\d+\.|\d+\s+[A-Z]|Chapitre|Module|Section|Partie|Introduction|Conclusion)/i

  const sections = []
  let current = null

  for (const item of allItems) {
    const isHeading = (item.height >= headingThreshold || TITLE_RE.test(item.str)) && item.str.length >= 3 && item.str.length <= 120
    if (isHeading) {
      if (current && current.text.length > 50) sections.push(current)
      current = { title: item.str, text: '', pageStart: item.pageNum }
    } else if (current) {
      current.text += ' ' + item.str
    }
  }
  if (current && current.text.length > 50) sections.push(current)

  if (sections.length === 0) {
    sections.push({ title: 'Document complet', text: allItems.map(i => i.str).join(' '), pageStart: 1 })
  }

  return sections.slice(0, 20).map((s, i) => ({
    index: i,
    title: s.title,
    text_excerpt: s.text.slice(0, 800).trim(),
    page_start: s.pageStart
  }))
}

function detectYear(classifs) {
  const ids = classifs.flatMap(s => s.concept_ids)
  const counts = {}
  ids.forEach(id => {
    const c = conceptsData.find(c => c.id === id)
    const prefix = c?.year?.startsWith('S') ? c.year.split('-')[0] : 'S1'
    counts[prefix] = (counts[prefix] || 0) + 1
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'S1'
}

function detectBloom(classifs) {
  const counts = {}
  classifs.forEach(s => { if (s.bloom) counts[s.bloom] = (counts[s.bloom] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Apply'
}

function computeSwot(classifs, allSections) {
  const allConceptIds = [...new Set(classifs.flatMap(s => s.concept_ids))]
  const year = detectYear(classifs)
  const bloom = detectBloom(classifs)
  const families = [...new Set(allConceptIds.map(id => conceptsData.find(c => c.id === id)?.family).filter(Boolean))]

  // Forces : concepts avec au moins un outil ideal (score 3) ET robuste (robustness_num >= 3)
  const forces = allConceptIds
    .map(cid => {
      const concept = conceptsData.find(c => c.id === cid)
      const strongTools = getToolsForConcept(cid, 3).filter(t => (t.robustness_num ?? 0) >= 3)
      return strongTools.length ? { concept, tools: strongTools.slice(0, 3) } : null
    })
    .filter(Boolean)

  // Faiblesses : concepts peu couverts dans la matrice
  const poorlyCovered = allConceptIds
    .map(cid => {
      const concept = conceptsData.find(c => c.id === cid)
      const t = getToolsForConcept(cid, 2)
      return t.length === 0 ? { concept, reason: 'Aucun outil avec score de pertinence >= 2 dans la matrice.' } : null
    })
    .filter(Boolean)

  // Concepts attendus en S1 mais absents du cours
  const expectedForYear = conceptsData.filter(c => c.year === 'S1' || c.year === 'S1-S2')
  const missingExpected = expectedForYear
    .filter(c => !allConceptIds.includes(c.id))
    .slice(0, 3)
    .map(concept => ({ concept, reason: `Concept attendu en ${concept.year} non detecte dans le cours.` }))

  const faiblesses = [...poorlyCovered, ...missingExpected]

  // Risques : concepts de syntaxe (risk_ai Maximal) presents dans le cours
  const risques = allConceptIds
    .map(cid => {
      const concept = conceptsData.find(c => c.id === cid)
      if (!concept || concept.risk_ai !== 'Maximal') return null
      const fm4 = getToolsForConcept(cid, 1).filter(t => t.family === 'FM4').slice(0, 3)
      return {
        concept,
        tools: fm4,
        reason: "L'IA generative excelle sur la syntaxe : risque de vibe coding et de fragile knowledge si l'evaluation n'est pas robuste."
      }
    })
    .filter(Boolean)

  // Opportunites : combinatoires correspondant aux parametres detectes
  const opportunites = getMatchingCombos({ year, families, bloom }).slice(0, 4)

  return { forces, faiblesses, risques, opportunites, meta: { year, bloom, families } }
}

function computeRecommendations(classifs) {
  return classifs
    .filter(s => s.concept_ids.length > 0 && s.bloom)
    .map(s => {
      const concept = conceptsData.find(c => c.id === s.concept_ids[0])
      const rec = getRecommendation({
        year: (() => { const y = concept?.year; return y?.startsWith('S') ? y.split('-')[0] : 'S1' })(),
        concept_family: concept?.family || 'Syntaxe',
        bloom: s.bloom,
        function: 'Formative',
        context: s.context
      })
      return { section_index: s.section_index, ...rec }
    })
}

export function useAudit() {
  const phase = ref('idle') // idle | extracting | classifying | reviewing | computing | done | error
  const sections = ref([])
  const classifications = ref([])
  const validated = ref([])
  const swot = ref(null)
  const recommendations = ref([])
  const error = ref(null)
  const isDemo = ref(false)

  function loadFixture(fixture) {
    isDemo.value = true
    sections.value = fixture.sections
    classifications.value = fixture.classifications
    phase.value = 'reviewing'
  }

  async function extractAndClassify(file) {
    try {
      error.value = null
      phase.value = 'extracting'

      // Import pdf.js a la demande (evite de le charger en mode statique / GitHub Pages)
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const buffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
      const pages = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        pages.push({ pageNum: i, items: content.items })
      }
      sections.value = segmentSections(pages)

      phase.value = 'classifying'
      const results = []
      for (const section of sections.value) {
        if (!section.text_excerpt || section.text_excerpt.length < 30) {
          results.push({ section_index: section.index, concept_ids: [], bloom: null, context: 'Presentiel encadre', confidence: 0 })
          continue
        }
        try {
          const r = await classifySection(section)
          results.push({ section_index: section.index, ...r })
        } catch (e) {
          results.push({ section_index: section.index, concept_ids: [], bloom: null, context: 'Presentiel encadre', confidence: 0, note: e.message })
        }
      }
      classifications.value = results
      phase.value = 'reviewing'
    } catch (e) {
      error.value = e.message
      phase.value = 'error'
    }
  }

  function confirmReview(validatedClassifs) {
    validated.value = validatedClassifs
    phase.value = 'computing'
    swot.value = computeSwot(validatedClassifs, sections.value)
    recommendations.value = computeRecommendations(validatedClassifs)
    phase.value = 'done'
  }

  function reset() {
    phase.value = 'idle'
    sections.value = []
    classifications.value = []
    validated.value = []
    swot.value = null
    recommendations.value = []
    error.value = null
    isDemo.value = false
  }

  return { phase, sections, classifications, validated, swot, recommendations, error, isDemo, loadFixture, extractAndClassify, confirmReview, reset }
}
