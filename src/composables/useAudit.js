import { ref } from 'vue'
import conceptsData from '../data/concepts.json'
import { getRecommendation, getToolsForConcept, getMatchingCombos, BLOOM_ORDER } from '../lib/recommendation.js'

const PROXY_URL   = 'http://localhost:3001/api/classify'
const CONCEPT_LIST = conceptsData.map(c => `${c.id} : ${c.name}`).join('\n')

// Set to true locally to log detected section titles (never commit as true)
const DEBUG_SEGMENTATION = false

// Programming keyword pattern - used for excerpt scoring and section ranking
const PROG_KW_SRC = '\\b(boucle|condition|variable|fonction|r[eé]cursion|tableau|objet|classe|h[eé]ritage|pointeur|complexit[eé]|exception|param[eè]tre|type|scope|d[eé]claration|algorithme|it[eé]ration|d[eé]bogage|test|assertion|module|interface|polymorphisme|encapsulation|abstraction|structure|arbre|graphe|pile|file|liste|loop|function|array|object|class|inheritance|pointer|complexity|parameter|algorithm|debug)\\b'

function countProgKeywords(text) {
  return (text.match(new RegExp(PROG_KW_SRC, 'gi')) || []).length
}

// Build a representative excerpt: head + keyword-dense sample, capped at maxChars
function buildExcerpt(body, maxChars, kwSampleSize) {
  const cleaned = body.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxChars) return cleaned

  const headLen = maxChars - kwSampleSize - 7 // 7 = ' [...] '
  const head    = cleaned.slice(0, headLen)
  const rest    = cleaned.slice(headLen)

  let bestStart = 0
  let bestCount = 0
  const winSize = kwSampleSize * 2
  for (let i = 0; i < rest.length - kwSampleSize; i += 50) {
    const count = countProgKeywords(rest.slice(i, i + winSize))
    if (count > bestCount) { bestCount = count; bestStart = i }
  }
  return (head + ' [...] ' + rest.slice(bestStart, bestStart + kwSampleSize)).slice(0, maxChars)
}

function buildPrompt(section) {
  const parentCtx = section.parent_title
    ? `\nTitre parent : "${section.parent_title}"`
    : ''
  return `Tu analyses une section de cours de programmation pour identifier les concepts pédagogiques couverts.

Concepts disponibles - retourne UNIQUEMENT des IDs de cette liste :
${CONCEPT_LIST}

Niveaux Bloom acceptés : Remember, Understand, Apply, Analyze, Evaluate, Create
Contextes acceptés : Présentiel encadré, Autonomie supervisée, Projet long, Diagnostic

Section : "${section.title}"${parentCtx}
Extrait : ${section.text_excerpt}

Réponds uniquement avec un JSON valide, sans texte avant ni après :
{
  "concept_ids": ["C1.1"],
  "bloom": "Apply",
  "context": "Présentiel encadré",
  "confidence": 0.85
}

Règles :
- concept_ids : 0 à 3 IDs uniquement parmi la liste ci-dessus, tableau vide si aucun concept identifiable
- N'invente jamais un ID hors de la liste fournie
- confidence : 0.0 (aucune certitude) à 1.0 (très certain)`
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
  if (!jsonMatch) throw new Error('Pas de JSON dans la réponse du modèle')

  const parsed = JSON.parse(jsonMatch[0])
  const validIds = new Set(conceptsData.map(c => c.id))
  const safeIds = (parsed.concept_ids || []).filter(id => validIds.has(id)).slice(0, 3)

  return {
    concept_ids: safeIds,
    bloom: BLOOM_ORDER.includes(parsed.bloom) ? parsed.bloom : null,
    context: parsed.context || 'Présentiel encadré',
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5))
  }
}

function segmentSections(pages) {
  // ─── Thresholds - edit here to tune ──────────────────────────────────────
  const LINE_Y_TOL_FACTOR  = 0.50  // fraction of page median height for same-line grouping
  const WORD_GAP_FACTOR    = 0.30  // fraction of line height to insert a space between runs
  const HEADER_BAND        = 0.12  // top/bottom band as fraction of page height (HF detection)
  const HEADER_REPEAT_FRAC = 0.50  // fraction of pages a text must repeat to be header/footer
  const HEIGHT_STRONG      = 1.40  // height/median ≥ this → strong title signal
  const HEIGHT_WEAK        = 1.15  // height/median ≥ this → partial title signal
  const TITLE_MAX_WORDS    = 12    // ≤ this many words → short-line signal
  const GAP_RATIO          = 1.80  // gap/medianSpacing ≥ this → large-gap signal
  const TITLE_THRESHOLD    = 2.50  // minimum score to classify a line as a title
  const MIN_SECTION_BODY   = 200   // merge sections with body shorter than this (chars)
  const MAX_SECTIONS       = 50    // hard safety cap (pathological detection only - normal docs stay well below)
  const EXCERPT_MAX        = 1200  // max length of text_excerpt
  const EXCERPT_KW_SAMPLE  = 400   // keyword-dense chunk appended to excerpt
  // ─────────────────────────────────────────────────────────────────────────

  const PAGE_NUM_RE   = /^(page\s*)?\d+(\s*[/\-]\s*\d+)?$/i
  const SENTENCE_END  = /[.!?:]$/
  const BOLD_FONT     = /bold|black|semibold|heavy|demi/i
  // Numbering prefix OR course keyword (FR + EN, accent-tolerant via [eé] pairs)
  const COURSE_KW_RE  = new RegExp(
    '^(\\d+\\.?|\\d+\\.\\d+\\.?|\\d+\\.\\d+\\.\\d+\\.?|[A-Z]\\.|[IVX]+\\.)\\s+\\S|' +
    '^(Chapitre|Module|Section|Partie|S[eé]ance|Semaine|Le[çc]on|Cours|TP|Lab|' +
    'Exercice|Objectifs|Comp[eé]tences|Pr[eé]requis|Introduction|Conclusion|' +
    'Plan|Sommaire|Chapter|Lesson|Week|Exercise|Objectives|Prerequisites)',
    'i'
  )

  // ── Build a rich flat line list from all pages ──────────────────────────
  const allLines = []

  for (const page of pages) {
    const rawItems = (page.items || []).filter(it => it.str?.trim())
    if (!rawItems.length) continue

    // Enrich pdf.js items with explicit x / y / width / fontName
    const items = rawItems.map(it => ({
      str:      it.str.trim(),
      height:   it.height            ?? 0,
      x:        it.transform?.[4]    ?? 0,
      y:        it.transform?.[5]    ?? 0,
      width:    it.width             ?? 0,
      fontName: it.fontName          || ''
    })).filter(it => it.str)

    if (!items.length) continue

    // Page-level median height → y-tolerance for line grouping
    const hs     = items.map(it => it.height).filter(h => h > 0).sort((a, b) => a - b)
    const medH   = hs[Math.floor(hs.length / 2)] || 12
    const yTol   = medH * LINE_Y_TOL_FACTOR

    // Sort top-to-bottom (PDF y grows upward → descending y = visual top first)
    items.sort((a, b) => b.y - a.y)

    // Group items into lines by y-proximity; refY = first item's y (stable anchor)
    const groups = []
    for (const it of items) {
      const last = groups[groups.length - 1]
      if (last && Math.abs(last.refY - it.y) < yTol) {
        last.items.push(it)
      } else {
        groups.push({ refY: it.y, items: [it] })
      }
    }

    // Page y-extent for header/footer band detection
    const ys   = items.map(it => it.y)
    const maxY = ys.length ? Math.max(...ys) : 0
    const minY = ys.length ? Math.min(...ys) : 0
    const pgH  = maxY - minY || 1

    let prevY       = null
    let isFirstLine = true

    for (const grp of groups) {
      // Sort items left-to-right within the line
      grp.items.sort((a, b) => a.x - b.x)

      // Concatenate runs, inserting a space when the horizontal gap warrants it
      const lineHs = grp.items.map(it => it.height).filter(h => h > 0)
      const lineH  = lineHs.length ? Math.max(...lineHs) : medH
      const minGap = lineH * WORD_GAP_FACTOR

      let text      = ''
      let prevRight = null
      for (const it of grp.items) {
        if (!it.str) continue
        if (prevRight !== null && it.x - prevRight > minGap) text += ' '
        text     += it.str
        prevRight = it.x + it.width
      }
      text = text.replace(/\s+/g, ' ').trim()
      if (!text) continue

      // Dominant font (weighted by character count)
      const tally = {}
      for (const it of grp.items) {
        const f = it.fontName || ''
        tally[f] = (tally[f] || 0) + it.str.length
      }
      const font = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

      // yRel: 0 = bottom, 1 = top of page
      const yRel   = (grp.refY - minY) / pgH
      const inBand = yRel > (1 - HEADER_BAND) || yRel < HEADER_BAND

      allLines.push({
        text,
        page:        page.pageNum,
        y:           grp.refY,
        height:      lineH,
        fontName:    font,
        gapBefore:   prevY !== null ? prevY - grp.refY : 0,
        isFirstLine,
        inBand
      })

      prevY       = grp.refY
      isFirstLine = false
    }
  }

  if (!allLines.length) {
    return [{ index: 0, title: 'Document complet', text_excerpt: '', page_start: 1 }]
  }

  // ── Remove headers, footers, isolated page numbers ──────────────────────
  const totalPages = Math.max(...allLines.map(l => l.page))
  const minRepeat  = Math.max(2, Math.ceil(totalPages * HEADER_REPEAT_FRAC))

  // Count how many distinct pages each normalised band-text appears on
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

  const lines = allLines.filter(l => {
    const norm = l.text.toLowerCase().replace(/\d+/g, '#').trim()
    if (l.inBand && hfTexts.has(norm)) return false
    if (PAGE_NUM_RE.test(l.text.trim()))  return false
    return true
  })

  if (!lines.length) {
    const fallback = allLines.map(l => l.text).join(' ')
    return [{ index: 0, title: 'Document complet', text_excerpt: buildExcerpt(fallback, EXCERPT_MAX, EXCERPT_KW_SAMPLE), page_start: 1 }]
  }

  // ── Title scoring - multi-signal weighted sum ───────────────────────────
  const allH  = lines.map(l => l.height).filter(h => h > 0).sort((a, b) => a - b)
  const medH  = allH[Math.floor(allH.length / 2)] || 12
  const gaps  = lines.map(l => l.gapBefore).filter(g => g > 0).sort((a, b) => a - b)
  const medGap = gaps[Math.floor(gaps.length / 2)] || medH * 1.2

  function scoreTitle(line) {
    const t     = line.text.trim()
    const words = t.split(/\s+/).length
    let score   = 0

    if (COURSE_KW_RE.test(t))                           score += 2.0  // strong: numbering / keyword
    const hr = line.height / medH
    if      (hr >= HEIGHT_STRONG)                       score += 2.0  // strong: large font
    else if (hr >= HEIGHT_WEAK)                         score += 1.0  // partial
    if (words <= TITLE_MAX_WORDS)                       score += 0.8  // medium: short line
    if (!SENTENCE_END.test(t))                          score += 0.6  // medium: no sentence punctuation
    if (line.gapBefore > medGap * GAP_RATIO)            score += 0.8  // medium: large gap before
    if (line.fontName && BOLD_FONT.test(line.fontName)) score += 0.8  // bonus: bold font name
    if (line.isFirstLine)                               score += 0.3  // weak: first line of page
    const hasLetters = /[A-Za-zÀ-ÿ]/.test(t)
    if (hasLetters && t === t.toUpperCase())            score += 0.4  // weak: ALL CAPS
    else if (/^[A-ZÀ-Ÿ]/.test(t))                      score += 0.2  // weak: initial cap

    return score
  }

  // ── Segment into raw sections ────────────────────────────────────────────
  function numLevel(text) {
    if (/^\d+\.\d+\.\d+/.test(text)) return 3
    if (/^\d+\.\d+/.test(text))      return 2
    return 1
  }

  const raw = []
  let cur   = null

  for (const line of lines) {
    const isTitle = line.text.length >= 3
      && line.text.length <= 120
      && scoreTitle(line) >= TITLE_THRESHOLD

    if (isTitle) {
      if (cur && cur.body.length > 50) raw.push(cur)
      cur = { title: line.text, body: '', pageStart: line.page, level: numLevel(line.text), titleH: line.height }
    } else if (cur) {
      cur.body += ' ' + line.text
    }
  }
  if (cur && cur.body.length > 50) raw.push(cur)

  if (!raw.length) {
    const fallback = lines.map(l => l.text).join(' ')
    return [{ index: 0, title: 'Document complet', text_excerpt: buildExcerpt(fallback, EXCERPT_MAX, EXCERPT_KW_SAMPLE), page_start: 1 }]
  }

  // ── Assign parent titles ─────────────────────────────────────────────────
  const withParent = raw.map((s, i) => {
    let parent = null
    for (let j = i - 1; j >= 0; j--) {
      const p = raw[j]
      if (p.level < s.level || (p.level === s.level && p.titleH > s.titleH + 1)) {
        parent = p.title
        break
      }
    }
    return { ...s, parent }
  })

  // ── Merge short sections into their predecessor ──────────────────────────
  const merged = []
  for (const s of withParent) {
    if (s.body.trim().length < MIN_SECTION_BODY && merged.length > 0) {
      merged[merged.length - 1].body += ' ' + s.title + ' ' + s.body
    } else {
      merged.push({ ...s })
    }
  }

  // ── Safety cap - only triggers on pathological documents (heuristic runaway) ─
  // Normal documents: the section count reflects the actual structure.
  // If the detector fires on nearly every line (e.g. a scanned slide deck with
  // identical font sizes and no body text), trim to the MAX_SECTIONS most
  // informative sections and restore reading order.
  let final = merged
  if (merged.length > MAX_SECTIONS) {
    final = merged
      .map(s => ({ ...s, _rank: s.body.length + countProgKeywords(s.body) * 20 }))
      .sort((a, b) => b._rank - a._rank)
      .slice(0, MAX_SECTIONS)
      .sort((a, b) => a.pageStart - b.pageStart)
  }

  if (DEBUG_SEGMENTATION) {
    // eslint-disable-next-line no-console
    console.debug('[segmentation]',
      final.map((s, i) => `${i + 1}. p.${s.pageStart} "${s.title}" (${s.body.trim().length} car.)`).join('\n'))
  }

  return final.map((s, i) => ({
    index:        i,
    title:        s.title,
    text_excerpt: buildExcerpt(s.body.trim(), EXCERPT_MAX, EXCERPT_KW_SAMPLE),
    page_start:   s.pageStart,
    ...(s.parent ? { parent_title: s.parent } : {})
  }))
}

function detectBloom(classifs) {
  const counts = {}
  classifs.forEach(s => { if (s.bloom) counts[s.bloom] = (counts[s.bloom] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Apply'
}

function computeSwot(classifs, allSections) {
  const allConceptIds = [...new Set(classifs.flatMap(s => s.concept_ids))]
  const bloom = detectBloom(classifs)
  const families = [...new Set(allConceptIds.map(id => conceptsData.find(c => c.id === id)?.family).filter(Boolean))]

  // Forces : concepts avec au moins un outil idéal (score 3) ET robuste (robustness_num >= 3)
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
  const expectedForYear = conceptsData.filter(c => c.level === 'Novice')
  const missingExpected = expectedForYear
    .filter(c => !allConceptIds.includes(c.id))
    .slice(0, 3)
    .map(concept => ({ concept, reason: `Concept de niveau ${concept.level} non détecté dans le cours.` }))

  const faiblesses = [...poorlyCovered, ...missingExpected]

  // Risques : concepts de syntaxe (risk_ai Maximal) présents dans le cours
  const risques = allConceptIds
    .map(cid => {
      const concept = conceptsData.find(c => c.id === cid)
      if (!concept || concept.risk_ai !== 'Maximal') return null
      const fm4 = getToolsForConcept(cid, 1).filter(t => t.family === 'FM4').slice(0, 3)
      return {
        concept,
        tools: fm4,
        reason: "L'IA générative excelle sur la syntaxe : risque de vibe coding et de fragile knowledge si l'évaluation n'est pas robuste."
      }
    })
    .filter(Boolean)

  // Opportunités : combinatoires correspondant aux paramètres détectés
  const opportunites = getMatchingCombos({ families, bloom }).slice(0, 4)

  return { forces, faiblesses, risques, opportunites, meta: { bloom, families } }
}

function computeRecommendations(classifs) {
  return classifs
    .filter(s => s.concept_ids.length > 0 && s.bloom)
    .map(s => {
      const concept = conceptsData.find(c => c.id === s.concept_ids[0])
      const rec = getRecommendation({
        year: undefined,
        concept_family: concept?.family || 'Syntaxe',
        bloom: s.bloom,
        function: 'Formative',
        context: s.context
      })
      return { section_index: s.section_index, ...rec }
    })
}

export function useAudit() {
  const phase           = ref('idle') // idle | extracting | classifying | reviewing | computing | done | error
  const sections        = ref([])
  const classifications = ref([])
  const validated       = ref([])
  const swot            = ref(null)
  const recommendations = ref([])
  const error           = ref(null)
  const isDemo          = ref(false)

  function loadFixture(fixture) {
    isDemo.value           = true
    sections.value         = fixture.sections
    classifications.value  = fixture.classifications
    phase.value            = 'reviewing'
  }

  async function extractAndClassify(file) {
    try {
      error.value = null
      phase.value = 'extracting'

      // Import pdf.js on demand (avoids loading it in static / GitHub Pages mode)
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
      sections.value = segmentSections(pages)

      phase.value = 'classifying'
      const results = []
      for (const section of sections.value) {
        if (!section.text_excerpt || section.text_excerpt.length < 30) {
          results.push({ section_index: section.index, concept_ids: [], bloom: null, context: 'Présentiel encadré', confidence: 0 })
          continue
        }
        try {
          const r = await classifySection(section)
          results.push({ section_index: section.index, ...r })
        } catch (e) {
          results.push({ section_index: section.index, concept_ids: [], bloom: null, context: 'Présentiel encadré', confidence: 0, note: e.message })
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
    validated.value        = validatedClassifs
    phase.value            = 'computing'
    swot.value             = computeSwot(validatedClassifs, sections.value)
    recommendations.value  = computeRecommendations(validatedClassifs)
    phase.value            = 'done'
  }

  function reset() {
    phase.value           = 'idle'
    sections.value        = []
    classifications.value = []
    validated.value       = []
    swot.value            = null
    recommendations.value = []
    error.value           = null
    isDemo.value          = false
  }

  return { phase, sections, classifications, validated, swot, recommendations, error, isDemo, loadFixture, extractAndClassify, confirmReview, reset }
}
