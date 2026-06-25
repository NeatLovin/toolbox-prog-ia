import { defineStore } from 'pinia'
import conceptsData from '../data/concepts.json'
import { getRecommendation, getToolsForConcept, getMatchingCombos, BLOOM_ORDER } from '../lib/recommendation.js'

const PROXY_URL      = 'http://localhost:3001/api/classify'
const CONCEPT_LIST   = conceptsData.map(c => `${c.id} : ${c.name}`).join('\n')
const VALID_IDS      = new Set(conceptsData.map(c => c.id))
const CHUNK_MAX      = 40_000
const CHUNK_LIMIT    = 4

// Set to true locally to log detected sections (never commit as true)
const DEBUG_SEGMENTATION = false

const SYSTEM_TEXT = `Tu analyses un document pour déterminer s'il porte sur l'enseignement de la programmation ou de l'informatique, puis en extraire la structure pédagogique si applicable.

ÉTAPE 1 — ÉVALUER si le document traite de programmation ou d'informatique (algorithmique, bases de données, réseaux, systèmes, génie logiciel…).
Si le contenu porte sur autre chose (droit, médecine, histoire, langues, gestion, etc.) : renvoie immédiatement { "is_programming": false, "sections": [] } sans analyser davantage.
Si le contenu porte sur la programmation ou l'informatique : passe à l'étape 2.

ÉTAPE 2 — Analyser la structure pédagogique section par section.
Concepts disponibles — retourne UNIQUEMENT des IDs de cette liste :
${CONCEPT_LIST}

Niveaux Bloom acceptés : Remember, Understand, Apply, Analyze, Evaluate, Create

Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après :
{
  "is_programming": true,
  "course_summary": "Ce cours couvre la programmation Python orientée objet pour des étudiants de première année.",
  "sections": [
    {
      "title": "Titre de la section",
      "concept_ids": ["C1.1"],
      "bloom": "Apply",
      "confidence": "high"
    }
  ]
}

Règles strictes :
- Ne jamais forcer des concepts de programmation sur un contenu non informatique
- course_summary : 1 à 2 phrases neutres en français décrivant ce que couvre ce cours ; laisser "" si is_programming est false
- concept_ids : 0 à 3 IDs parmi la liste ci-dessus, tableau vide si aucun concept identifiable
- N'invente jamais un ID hors de la liste fournie
- bloom : une valeur parmi les niveaux Bloom acceptés, ou null si incertain
- confidence : "low" | "medium" | "high". Honnêteté requise : "low" si la section est courte, ambiguë, ou que le concept est déduit avec peu d'indices ; "medium" si plausible mais partiel ; "high" seulement si l'evidence est claire. Ne pas surévaluer.
- Détecte les sections à partir des titres et de la structure du texte
- Limite à 30 sections maximum`

// ── Extraction + débruitage côté client (gratuit) ────────────────────────────

function buildCleanText(pages) {
  const LINE_Y_TOL_FACTOR  = 0.50
  const WORD_GAP_FACTOR    = 0.30
  const HEADER_BAND        = 0.12
  const HEADER_REPEAT_FRAC = 0.50
  const PAGE_NUM_RE        = /^(page\s*)?\d+(\s*[/\-]\s*\d+)?$/i

  const allLines = []

  for (const page of pages) {
    const rawItems = (page.items || []).filter(it => it.str?.trim())
    if (!rawItems.length) continue

    const items = rawItems.map(it => ({
      str:    it.str.trim(),
      height: it.height         ?? 0,
      x:      it.transform?.[4] ?? 0,
      y:      it.transform?.[5] ?? 0,
      width:  it.width          ?? 0
    })).filter(it => it.str)

    if (!items.length) continue

    const hs   = items.map(it => it.height).filter(h => h > 0).sort((a, b) => a - b)
    const medH = hs[Math.floor(hs.length / 2)] || 12
    const yTol = medH * LINE_Y_TOL_FACTOR

    items.sort((a, b) => b.y - a.y)

    const groups = []
    for (const it of items) {
      const last = groups[groups.length - 1]
      if (last && Math.abs(last.refY - it.y) < yTol) {
        last.items.push(it)
      } else {
        groups.push({ refY: it.y, items: [it] })
      }
    }

    const ys   = items.map(it => it.y)
    const maxY = ys.length ? Math.max(...ys) : 0
    const minY = ys.length ? Math.min(...ys) : 0
    const pgH  = maxY - minY || 1

    for (const grp of groups) {
      grp.items.sort((a, b) => a.x - b.x)

      const lineHs = grp.items.map(it => it.height).filter(h => h > 0)
      const lineH  = lineHs.length ? Math.max(...lineHs) : medH
      const minGap = lineH * WORD_GAP_FACTOR

      let text      = ''
      let prevRight = null
      for (const it of grp.items) {
        if (!it.str) continue
        if (prevRight !== null && it.x - prevRight > minGap) text += ' '
        text     += it.str
        prevRight  = it.x + it.width
      }
      text = text.replace(/\s+/g, ' ').trim()
      if (!text) continue

      const yRel   = (grp.refY - minY) / pgH
      const inBand = yRel > (1 - HEADER_BAND) || yRel < HEADER_BAND
      allLines.push({ text, page: page.pageNum, inBand })
    }
  }

  if (!allLines.length) return ''

  const totalPages = Math.max(...allLines.map(l => l.page))
  const minRepeat  = Math.max(2, Math.ceil(totalPages * HEADER_REPEAT_FRAC))

  const hfPageSets = {}
  for (const l of allLines.filter(l => l.inBand)) {
    const key = l.text.toLowerCase().replace(/\d+/g, '#').trim()
    if (!hfPageSets[key]) hfPageSets[key] = new Set()
    hfPageSets[key].add(l.page)
  }
  const hfTexts = new Set(
    Object.entries(hfPageSets)
      .filter(([, ps]) => ps.size >= minRepeat)
      .map(([k]) => k)
  )

  return allLines
    .filter(l => {
      const norm = l.text.toLowerCase().replace(/\d+/g, '#').trim()
      if (l.inBand && hfTexts.has(norm)) return false
      if (PAGE_NUM_RE.test(l.text.trim())) return false
      return true
    })
    .map(l => l.text)
    .join('\n')
}

// ── Appel unique au modèle ───────────────────────────────────────────────────

async function analyzeDocument(cleanText) {
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: [{ type: 'text', text: SYSTEM_TEXT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: cleanText }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Proxy: HTTP ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Réponse du modèle invalide : pas d\'objet JSON.')

  const raw = JSON.parse(jsonMatch[0])
  const isProg      = raw.is_programming === true
  const rawSections = Array.isArray(raw.sections) ? raw.sections : []
  const rawSummary  = typeof raw.course_summary === 'string' ? raw.course_summary.slice(0, 400).trim() : ''
  return {
    is_programming: isProg,
    course_summary: rawSummary,
    sections: rawSections.slice(0, 30).map(entry => ({
      title:       typeof entry.title === 'string' ? entry.title.slice(0, 200) : 'Section',
      concept_ids: Array.isArray(entry.concept_ids)
        ? entry.concept_ids.filter(id => VALID_IDS.has(id)).slice(0, 3)
        : [],
      bloom:      BLOOM_ORDER.includes(entry.bloom) ? entry.bloom : null,
      confidence: ['low', 'medium', 'high'].includes(entry.confidence) ? entry.confidence : 'medium'
    }))
  }
}

async function analyzeWithChunking(cleanText) {
  if (cleanText.length <= CHUNK_MAX) return analyzeDocument(cleanText)

  const chunks = []
  for (let i = 0; i < cleanText.length && chunks.length < CHUNK_LIMIT; i += CHUNK_MAX) {
    chunks.push(cleanText.slice(i, i + CHUNK_MAX))
  }
  let globalProg    = false
  let globalSummary = ''
  const allSections = []
  for (const chunk of chunks) {
    const result = await analyzeDocument(chunk)
    if (result.is_programming) {
      globalProg = true
      if (!globalSummary && result.course_summary) globalSummary = result.course_summary
    }
    allSections.push(...result.sections)
  }
  return {
    is_programming: globalProg,
    course_summary: globalSummary,
    sections: globalProg ? allSections.slice(0, 30) : []
  }
}

// ── SWOT + recommandations déterministes (inchangés) ─────────────────────────

function detectBloom(classifs) {
  const counts = {}
  classifs.forEach(s => { if (s.bloom) counts[s.bloom] = (counts[s.bloom] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Apply'
}

function computeSwot(classifs, allSections) {
  const allConceptIds = [...new Set(classifs.flatMap(s => s.concept_ids))]
  const bloom = detectBloom(classifs)
  const families = [...new Set(allConceptIds.map(id => conceptsData.find(c => c.id === id)?.family).filter(Boolean))]

  const forces = allConceptIds
    .map(cid => {
      const concept = conceptsData.find(c => c.id === cid)
      const strongTools = getToolsForConcept(cid, 3).filter(t => (t.robustness_num ?? 0) >= 3)
      return strongTools.length ? { concept, tools: strongTools.slice(0, 3) } : null
    })
    .filter(Boolean)

  const poorlyCovered = allConceptIds
    .map(cid => {
      const concept = conceptsData.find(c => c.id === cid)
      const t = getToolsForConcept(cid, 2)
      return t.length === 0 ? { concept, reason: 'Peu de solutions vraiment adaptées pour enseigner ce point.' } : null
    })
    .filter(Boolean)

  const expectedForYear = conceptsData.filter(c => c.level.includes('S1'))
  const missingExpected = expectedForYear
    .filter(c => !allConceptIds.includes(c.id))
    .slice(0, 3)
    .map(concept => ({ concept, reason: `Notion de début de cursus absente de ce cours ; vérifiez qu'elle est couverte ailleurs.` }))

  const faiblesses = [...poorlyCovered, ...missingExpected]

  const risques = allConceptIds
    .map(cid => {
      const concept = conceptsData.find(c => c.id === cid)
      if (!concept || concept.risk_ai !== 'Maximal') return null
      const fm4 = getToolsForConcept(cid, 1).filter(t => t.family === 'FM4').slice(0, 3)
      return {
        concept,
        tools: fm4,
        reason: "L'IA peut produire ce travail à la place de l'étudiant ; prévoyez une évaluation qui le vérifie."
      }
    })
    .filter(Boolean)

  const opportunites = getMatchingCombos({ families, bloom }).slice(0, 4)

  return { forces, faiblesses, risques, opportunites, meta: { bloom, families } }
}

function computeRecs(classifs, courseCtx) {
  return classifs
    .filter(s => s.concept_ids.length > 0 && s.bloom)
    .map(s => {
      const concept = conceptsData.find(c => c.id === s.concept_ids[0])
      const rec = getRecommendation({
        year: undefined,
        concept_family: concept?.family || 'Syntaxe',
        bloom: s.bloom,
        function: 'Formative',
        context: courseCtx
      })
      return { section_index: s.section_index, ...rec }
    })
}

// ── Store Pinia ───────────────────────────────────────────────────────────────

export const useAuditStore = defineStore('audit', {
  state: () => ({
    phase:           'idle', // idle | extracting | classifying | reviewing | computing | done | error
    sections:        [],
    classifications: [],
    validated:       [],
    swot:            null,
    recommendations: [],
    error:           null,
    isDemo:          false,
    isProgramming:   true,
    courseContext:   'Présentiel encadré',
    courseSummary:   ''
  }),

  actions: {
    loadFixture(fixture) {
      this.isDemo          = true
      this.sections        = fixture.sections
      this.classifications = fixture.classifications
      this.phase           = 'reviewing'
    },

    async extractAndClassify(file) {
      try {
        this.error = null
        this.phase = 'extracting'

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

        const buffer = await file.arrayBuffer()
        const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise
        const pages  = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page    = await pdf.getPage(i)
          const content = await page.getTextContent()
          pages.push({ pageNum: i, items: content.items })
        }

        const cleanText = buildCleanText(pages)

        if (!cleanText.trim()) {
          this.sections        = [{ index: 0, title: 'Document complet' }]
          this.classifications = [{ section_index: 0, concept_ids: [], bloom: null, confidence: 'low' }]
          this.phase = 'reviewing'
          return
        }

        this.phase = 'classifying'
        const result = await analyzeWithChunking(cleanText)

        if (!result.is_programming) {
          this.isProgramming   = false
          this.sections        = []
          this.classifications = []
          this.phase           = 'done'
          return
        }

        this.courseSummary = result.course_summary || ''
        const detected     = result.sections

        if (DEBUG_SEGMENTATION) {
          // eslint-disable-next-line no-console
          console.debug('[analyzeDocument]', detected.map((s, i) => `${i + 1}. "${s.title}"`).join('\n'))
        }

        this.sections        = detected.map((entry, i) => ({ index: i, title: entry.title }))
        this.classifications = detected.map((entry, i) => ({
          section_index: i,
          concept_ids:  entry.concept_ids,
          bloom:        entry.bloom,
          confidence:   entry.confidence
        }))
        this.phase = 'reviewing'

      } catch (e) {
        this.error = e.message
        this.phase = 'error'
      }
    },

    confirmReview(validatedClassifs) {
      this.validated       = validatedClassifs
      this.phase           = 'computing'
      this.swot            = computeSwot(validatedClassifs, this.sections)
      this.recommendations = computeRecs(validatedClassifs, this.courseContext)
      this.phase           = 'done'
    },

    reset() {
      this.$reset()
      try { localStorage.removeItem('audit_v1') } catch (_) {}
    }
  },

  persist: {
    key:  'audit_v1',
    pick: ['phase', 'sections', 'validated', 'swot', 'recommendations', 'courseContext', 'courseSummary', 'isProgramming', 'isDemo']
  }
})
