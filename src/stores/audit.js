import { defineStore } from 'pinia'
import conceptsData from '../data/concepts.json'
import { getRecommendation, getToolsForConcept, getMatchingCombos, BLOOM_ORDER } from '../lib/recommendation.js'
import { getSessionId } from '../lib/session.js'
import { track } from '../lib/telemetry.js'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Le prompt système, le modèle et max_tokens sont fixés côté serveur (worker/src/audit.js) :
// le client n'envoie que le texte extrait, jamais de quoi faire varier le coût par appel.
const AUDIT_URL      = `${import.meta.env.VITE_API_BASE || ''}/audit`
const VALID_IDS      = new Set(conceptsData.map(c => c.id))
const CHUNK_MAX      = 40_000
const CHUNK_LIMIT    = 4

// Set to true locally to log detected sections (never commit as true)
const DEBUG_SEGMENTATION = false

// Scratch d'exécution du garde-fou de pertinence (lot 4.7) : pas de la donnée d'état
// applicative, donc volontairement hors de state() Pinia (rien à réhydrater, rien à persister).
let pendingResult = null
let classifyStartedAt = null

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
  let response
  try {
    response = await fetch(AUDIT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        session_id: getSessionId(),
        text: cleanText
      })
    })
  } catch {
    // La requête n'a jamais atteint le Worker (hors ligne, DNS...) : le seul cas que le
    // service serveur ne peut pas logger lui-même en audit_unavailable.
    const networkErr = new Error('network_error')
    networkErr.isNetworkError = true
    throw networkErr
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    // Réponse reçue (guard-rail cote serveur) : déjà loggé en audit_unavailable côté Worker,
    // pas besoin de le refaire côté client.
    throw new Error(err.reason || err.error || `Worker: HTTP ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Réponse du modèle invalide : pas d\'objet JSON.')

  const raw = JSON.parse(jsonMatch[0])
  const isProg      = raw.is_programming === true
  const relevance   = ['low', 'medium', 'high'].includes(raw.relevance_confidence) ? raw.relevance_confidence : 'medium'
  const rawSections = Array.isArray(raw.sections) ? raw.sections : []
  const rawSummary  = typeof raw.course_summary === 'string' ? raw.course_summary.slice(0, 400).trim() : ''
  return {
    is_programming: isProg,
    relevance_confidence: relevance,
    course_summary: rawSummary,
    model: typeof data.model === 'string' ? data.model : null,
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
  let globalProg       = false
  let globalSummary    = ''
  let globalConfidence = null
  let globalModel      = null
  const allSections    = []
  for (const chunk of chunks) {
    const result = await analyzeDocument(chunk)
    if (result.is_programming) {
      globalProg = true
      if (!globalSummary && result.course_summary) globalSummary = result.course_summary
      if (!globalConfidence) globalConfidence = result.relevance_confidence
    }
    if (!globalModel) globalModel = result.model
    allSections.push(...result.sections)
  }
  return {
    is_programming: globalProg,
    relevance_confidence: globalConfidence || 'low',
    course_summary: globalSummary,
    model: globalModel,
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
    phase:           'idle', // idle | extracting | classifying | reviewing | relevance-warning | computing | done | error
    sections:        [],
    classifications: [],
    validated:       [],
    swot:            null,
    recommendations: [],
    error:           null,
    isDemo:          false,
    relevanceConfidence: null,
    courseContext:   'Présentiel encadré',
    courseSummary:   ''
  }),

  actions: {
    loadFixture(fixture) {
      track('audit_start', {})
      this.isDemo          = true
      this.sections        = fixture.sections
      this.classifications = fixture.classifications
      this.phase           = 'reviewing'

      const charCount = (fixture.sections || []).reduce((sum, s) => sum + (s.text_excerpt?.length || 0), 0)
      const pageCount = Math.max(0, ...(fixture.sections || []).map(s => s.page_start || 0))
      track('audit_document_submitted', {
        pages: pageCount,
        characters: charCount,
        extraction_ok: true,
        duration_ms: 0,
        is_example_fixture: true
      })
    },

    async extractAndClassify(file) {
      const startedAt = Date.now()
      track('audit_start', {})
      try {
        this.error = null
        this.phase = 'extracting'

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

        const buffer = await file.arrayBuffer()
        const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise
        const pages  = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page    = await pdf.getPage(i)
          const content = await page.getTextContent()
          pages.push({ pageNum: i, items: content.items })
        }

        const cleanText = buildCleanText(pages)
        const extractionOk = !!cleanText.trim()

        track('audit_document_submitted', {
          pages: pdf.numPages,
          characters: cleanText.length,
          extraction_ok: extractionOk,
          duration_ms: Date.now() - startedAt,
          is_example_fixture: false
        })

        if (!extractionOk) {
          this.sections        = [{ index: 0, title: 'Document complet' }]
          this.classifications = [{ section_index: 0, concept_ids: [], bloom: null, confidence: 'low' }]
          this.phase = 'reviewing'
          return
        }

        this.phase = 'classifying'
        classifyStartedAt = Date.now()
        const result = await analyzeWithChunking(cleanText)

        // Garde-fou de pertinence : jamais de blocage, toujours une confirmation. Basse
        // confiance ou is_programming false -> l'enseignant tranche, le modèle ne décide pas
        // seul de fermer la porte.
        if (!result.is_programming || result.relevance_confidence === 'low') {
          pendingResult = result
          this.relevanceConfidence = result.relevance_confidence
          this.phase = 'relevance-warning'
          return
        }

        this._applyClassificationResult(result)

      } catch (e) {
        this.error = e.message
        this.phase = 'error'
        if (e.isNetworkError) {
          track('audit_unavailable', { reason: 'network_error' })
        }
      }
    },

    // Point d'entrée commun pour le chemin normal et pour la reprise après confirmation
    // du garde-fou de pertinence : même traitement, même instrumentation.
    _applyClassificationResult(result) {
      this.courseSummary = result.course_summary || ''
      const detected      = result.sections

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

      const conceptCounts = {}
      detected.forEach(s => (s.concept_ids || []).forEach(cid => { conceptCounts[cid] = (conceptCounts[cid] || 0) + 1 }))
      const confidenceNum = { low: 1, medium: 2, high: 3 }
      const avgConfidence = detected.length
        ? detected.reduce((sum, s) => sum + (confidenceNum[s.confidence] || 2), 0) / detected.length
        : null

      track('audit_classification_result', {
        segment_count: detected.length,
        concept_distribution: conceptCounts,
        avg_confidence: avgConfidence ? Math.round(avgConfidence * 100) / 100 : null,
        model: result.model,
        latency_ms: Date.now() - (classifyStartedAt || Date.now())
      })
    },

    confirmRelevance(userConfirmed) {
      track('audit_relevance_check', { confidence: this.relevanceConfidence, user_confirmed: userConfirmed })
      const result = pendingResult
      pendingResult = null
      if (userConfirmed && result) {
        this._applyClassificationResult(result)
      } else {
        this.reset()
      }
    },

    confirmReview(validatedClassifs) {
      this.validated       = validatedClassifs
      this.phase           = 'computing'
      this.swot            = computeSwot(validatedClassifs, this.sections)
      this.recommendations = computeRecs(validatedClassifs, this.courseContext)
      this.phase           = 'done'
    },

    // Contexte modifiable après le résultat sans relancer l'extraction ni la classification :
    // recalcul déterministe pur sur les données déjà validées, aucun appel réseau, aucun coût.
    recomputeWithContext(newContext) {
      this.courseContext   = newContext
      this.recommendations = computeRecs(this.validated, newContext)
    },

    reset() {
      this.$reset()
      try { localStorage.removeItem('audit_v1') } catch (_) {}
    }
  },

  persist: {
    key:  'audit_v1',
    pick: ['phase', 'sections', 'validated', 'swot', 'recommendations', 'courseContext', 'courseSummary', 'isDemo']
  }
})
