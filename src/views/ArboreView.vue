<template>
  <div class="arbre">
    <div class="page-header">
      <h1>Arbre de decision</h1>
      <p>Deux etapes pour une recommandation d'outils adaptee a votre contexte pedagogique.</p>
    </div>

    <!-- Fil d'Ariane (masque a l'etape zone) -->
    <nav v-if="step !== 'zone'" class="breadcrumb" aria-label="Etapes">
      <button class="bc-link" @click="goToStep('zone')">{{ selectedZone }}</button>
      <template v-if="step !== 'concept'">
        <span class="bc-sep" aria-hidden="true">›</span>
        <button class="bc-link" @click="goToStep('concept')">
          {{ selectedConcept ? selectedConcept.name : 'Toute la zone' }}
        </button>
      </template>
      <template v-if="step !== 'concept' && step !== 'context'">
        <span class="bc-sep" aria-hidden="true">›</span>
        <button class="bc-link" @click="goToStep('context')">{{ selectedContext }}</button>
      </template>
      <template v-if="step === 'result'">
        <span class="bc-sep" aria-hidden="true">›</span>
        <span class="bc-current">{{ effectiveBloom }}</span>
      </template>
    </nav>

    <!-- Etape 1 : Zone -->
    <section v-if="step === 'zone'" class="step-section">
      <h2 class="step-title">Quelle zone conceptuelle travaillez-vous ?</h2>
      <div class="zone-grid">
        <button
          v-for="z in ZONES"
          :key="z.family"
          class="zone-card"
          :class="`zone-card--${z.key}`"
          @click="chooseZone(z.family)"
        >
          <span class="zone-name">{{ z.family }}</span>
          <span class="zone-sub">{{ z.sub }}</span>
          <span class="zone-risk">Risque IA : {{ z.risk }}</span>
        </button>
      </div>
    </section>

    <!-- Etape 2 : Concept -->
    <section v-else-if="step === 'concept'" class="step-section">
      <h2 class="step-title">Quel concept en particulier ?</h2>
      <div class="concept-list">
        <button class="concept-btn concept-btn--all" @click="chooseConcept(null)">
          <span class="cb-name">Toute la zone {{ selectedZone }}</span>
          <span class="cb-desc">Vue d'ensemble de la famille, sans patron specifique</span>
        </button>
        <button
          v-for="c in conceptsInZone"
          :key="c.id"
          class="concept-btn"
          @click="chooseConcept(c)"
        >
          <div class="cb-header">
            <span class="cb-id">{{ c.id }}</span>
            <span class="cb-name">{{ c.name }}</span>
          </div>
          <span class="cb-desc">{{ c.description }}</span>
        </button>
      </div>
    </section>

    <!-- Etape 3 : Contexte -->
    <section v-else-if="step === 'context'" class="step-section">
      <h2 class="step-title">Dans quel contexte d'usage ?</h2>
      <div class="context-grid">
        <button
          v-for="ctx in CONTEXTS"
          :key="ctx.value"
          class="context-btn"
          @click="chooseContext(ctx.value)"
        >
          <span class="ctx-name">{{ ctx.label }}</span>
          <span class="ctx-desc">{{ ctx.desc }}</span>
        </button>
      </div>
    </section>

    <!-- Etape 4 : Objectif cognitif (facultatif) -->
    <section v-else-if="step === 'bloom'" class="step-section">
      <h2 class="step-title">
        Quel est l'objectif cognitif vise ?
        <span class="optional-tag">Facultatif</span>
      </h2>
      <p class="step-hint">
        Si vous passez, l'objectif retenu sera "{{ dominantBloom }}"
        {{ selectedConcept ? '(predominant sur ce concept)' : '(valeur par defaut)' }}.
      </p>
      <div class="bloom-grid">
        <button
          v-for="obj in BLOOM_OBJECTIVES"
          :key="obj.bloom"
          class="bloom-btn"
          @click="chooseBloom(obj.bloom)"
        >
          {{ obj.label }}
        </button>
        <button class="bloom-btn bloom-btn--skip" @click="chooseBloom(null)">
          Passer <span class="skip-note">({{ dominantBloom }})</span>
        </button>
      </div>
    </section>

    <!-- Resultat -->
    <section v-else-if="step === 'result' && result" class="result-section">

      <!-- Principe IA de la zone -->
      <div class="zone-principle" :class="`zone-principle--${zoneKey}`">
        <span class="zp-label">Principe IA - {{ selectedZone }}</span>
        <p class="zp-text">{{ ZONE_PRINCIPLES[selectedZone] }}</p>
      </div>

      <!-- En-tete et outils -->
      <div class="result-header">
        <h2 class="result-title">Outils recommandes</h2>
        <span class="source-badge" :class="sourceBadgeClass">{{ sourceLabel }}</span>
      </div>
      <div class="result-tools">
        <ToolCard v-for="tool in result.tools" :key="tool.id" :tool="tool" />
      </div>

      <!-- Invitation si "toute la zone" (pas de patron) -->
      <p v-if="!selectedConcept" class="zone-invite">
        Choisissez un concept precis (etape 2) pour obtenir un patron d'activite pedagogique adapte.
      </p>

      <!-- Justification (repliable) -->
      <details v-if="result.justification" class="result-detail">
        <summary class="detail-summary">Justification de la recommandation</summary>
        <p class="detail-content">{{ result.justification }}</p>
      </details>

      <!-- Patron pedagogique (repliable, seulement si concept selectionne) -->
      <details v-if="selectedConcept && patronForResult?.all.length" class="result-detail">
        <summary class="detail-summary">
          Patron pedagogique
          <span
            v-if="patronForResult.hasExact"
            class="patron-ctx-tag patron-ctx-tag--exact"
          >Pour "{{ selectedContext }}"</span>
          <span v-else class="patron-ctx-tag patron-ctx-tag--fallback">Variantes disponibles</span>
        </summary>
        <div
          class="patron-match-banner"
          :class="patronForResult.hasExact ? 'patron-match-banner--exact' : 'patron-match-banner--fallback'"
        >
          {{ patronForResult.hasExact
            ? `Patron pour le contexte "${selectedContext}"`
            : `Pas de patron pour "${selectedContext}" - variantes disponibles` }}
        </div>
        <PatronBlock
          v-for="p in (patronForResult.hasExact ? patronForResult.exact : patronForResult.all)"
          :key="p.id"
          :patron="p"
          class="result-patron"
        />
      </details>

      <!-- Actions -->
      <div class="result-actions">
        <button class="btn-primary" @click="restart">Nouvelle recherche</button>
        <router-link to="/catalogue" class="btn-secondary">Voir le catalogue complet</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getRecommendation, ZONE_PRINCIPLES } from '../lib/recommendation.js'
import { useData } from '../composables/useData.js'
import ToolCard from '../components/ToolCard.vue'
import PatronBlock from '../components/PatronBlock.vue'

const { concepts, getPatronsByConceptAndContext } = useData()

const ZONES = [
  { family: 'Syntaxe',      key: 'syntaxe',      sub: 'Variables, structures, POO, syntaxe formelle',       risk: 'Maximal' },
  { family: 'Logique',      key: 'logique',      sub: 'Algorithmes, debug, tests, raisonnement',             risk: 'Eleve'   },
  { family: 'Architecture', key: 'architecture', sub: 'Design patterns, securite, qualite logicielle',       risk: 'Modere'  }
]

const CONTEXTS = [
  { value: 'Présentiel encadré',    label: 'Présentiel encadré',    desc: 'En classe, supervision directe'     },
  { value: 'Autonomie supervisée',  label: 'Autonomie supervisée',  desc: 'Hors classe, feedback différé'      },
  { value: 'Projet long',           label: 'Projet long',           desc: 'Semestre ou année'                  },
  { value: 'Diagnostic',            label: 'Diagnostic',            desc: 'Évaluation initiale du niveau'      }
]

const BLOOM_OBJECTIVES = [
  { bloom: 'Understand', label: 'Comprendre / expliquer' },
  { bloom: 'Apply',      label: 'Appliquer / produire'   },
  { bloom: 'Create',     label: 'Concevoir / evaluer'    }
]

const step            = ref('zone')
const selectedZone    = ref('')
const selectedConcept = ref(null)   // null = toute la zone
const selectedContext = ref('')
const selectedBloom   = ref(null)   // null = utilise dominant

const conceptsInZone = computed(() =>
  concepts.filter(c => c.family === selectedZone.value)
)

const dominantBloom = computed(() =>
  selectedConcept.value?.bloom?.[0] ?? 'Apply'
)

const effectiveBloom = computed(() =>
  selectedBloom.value || dominantBloom.value
)

const zoneKey = computed(() =>
  selectedZone.value.toLowerCase()
)

const result = computed(() => {
  if (step.value !== 'result') return null
  return getRecommendation({
    year: undefined,
    concept_family: selectedZone.value,
    bloom: effectiveBloom.value,
    function: 'Formative',
    context: selectedContext.value
  })
})

const patronForResult = computed(() => {
  if (!selectedConcept.value || step.value !== 'result') return null
  return getPatronsByConceptAndContext(selectedConcept.value.id, selectedContext.value)
})

const sourceBadgeClass = computed(() => {
  const s = result.value?.source
  if (s === 'combo') return 'source-badge--exact'
  if (s === 'combo-approche') return 'source-badge--approche'
  return 'source-badge--matrix'
})

const sourceLabel = computed(() => {
  const s = result.value?.source
  if (s === 'combo') return 'Combinatoire exacte'
  if (s === 'combo-approche') return 'Combinatoire approchee'
  return 'Score matriciel'
})

function chooseZone(family) {
  selectedZone.value = family
  step.value = 'concept'
}

function chooseConcept(concept) {
  selectedConcept.value = concept
  step.value = 'context'
}

function chooseContext(ctx) {
  selectedContext.value = ctx
  step.value = 'bloom'
}

function chooseBloom(bloom) {
  selectedBloom.value = bloom
  step.value = 'result'
}

function goToStep(target) {
  if (target === 'zone') {
    selectedZone.value = ''
    selectedConcept.value = null
    selectedContext.value = ''
    selectedBloom.value = null
    step.value = 'zone'
  } else if (target === 'concept') {
    selectedConcept.value = null
    selectedContext.value = ''
    selectedBloom.value = null
    step.value = 'concept'
  } else if (target === 'context') {
    selectedContext.value = ''
    selectedBloom.value = null
    step.value = 'context'
  } else if (target === 'bloom') {
    selectedBloom.value = null
    step.value = 'bloom'
  }
}

function restart() {
  selectedZone.value = ''
  selectedConcept.value = null
  selectedContext.value = ''
  selectedBloom.value = null
  step.value = 'zone'
}
</script>

<style scoped>
.arbre {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.page-header p {
  color: #475569;
  font-size: 0.95rem;
}

/* Fil d'Ariane */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  font-size: 0.82rem;
}

.bc-link {
  background: none;
  border: none;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.1s, background 0.1s;
}

.bc-link:hover {
  text-decoration-color: currentColor;
  background: #eff6ff;
}

.bc-sep { color: #94a3b8; }

.bc-current {
  color: #475569;
  font-size: 0.82rem;
}

/* Sections */
.step-section,
.result-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.optional-tag {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #e2e8f0;
  color: #64748b;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
}

.step-hint {
  font-size: 0.875rem;
  color: #64748b;
}

/* Zone cards */
.zone-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 640px) {
  .zone-grid { grid-template-columns: 1fr; }
}

.zone-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.4rem 1.25rem;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: transform 0.1s, box-shadow 0.1s;
}

.zone-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.zone-card--syntaxe      { background: #eff6ff; border-color: #93c5fd; }
.zone-card--logique      { background: #f0fdf4; border-color: #86efac; }
.zone-card--architecture { background: #f5f3ff; border-color: #c4b5fd; }

.zone-name {
  font-size: 1.15rem;
  font-weight: 800;
}

.zone-card--syntaxe      .zone-name { color: #1d4ed8; }
.zone-card--logique      .zone-name { color: #15803d; }
.zone-card--architecture .zone-name { color: #6d28d9; }

.zone-sub {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.4;
}

.zone-risk {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  align-self: flex-start;
}

.zone-card--syntaxe      .zone-risk { background: #dbeafe; color: #1d4ed8; }
.zone-card--logique      .zone-risk { background: #dcfce7; color: #15803d; }
.zone-card--architecture .zone-risk { background: #ede9fe; color: #6d28d9; }

/* Concept list */
.concept-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.concept-btn {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.65rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}

.concept-btn:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.concept-btn--all {
  border-style: dashed;
  border-color: #cbd5e1;
  background: #ffffff;
}

.concept-btn--all:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.cb-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cb-id {
  font-size: 0.72rem;
  font-weight: 700;
  font-family: monospace;
  color: #94a3b8;
  flex-shrink: 0;
}

.cb-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.cb-desc {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.4;
}

/* Context grid */
.context-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 500px) {
  .context-grid { grid-template-columns: 1fr; }
}

.context-btn {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1rem 1.1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}

.context-btn:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.ctx-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

.ctx-desc {
  font-size: 0.78rem;
  color: #64748b;
}

/* Bloom grid */
.bloom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 500px) {
  .bloom-grid { grid-template-columns: 1fr; }
}

.bloom-btn {
  padding: 0.85rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}

.bloom-btn:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.bloom-btn--skip {
  grid-column: 1 / -1;
  border-style: dashed;
  color: #64748b;
  background: #ffffff;
}

.bloom-btn--skip:hover {
  border-color: #64748b;
  background: #f8fafc;
}

.skip-note {
  font-weight: 400;
  color: #94a3b8;
}

/* Zone principle */
.zone-principle {
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.zone-principle--syntaxe      { background: #eff6ff; border: 1px solid #93c5fd; }
.zone-principle--logique      { background: #f0fdf4; border: 1px solid #86efac; }
.zone-principle--architecture { background: #f5f3ff; border: 1px solid #c4b5fd; }

.zp-label {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.zone-principle--syntaxe      .zp-label { color: #1d4ed8; }
.zone-principle--logique      .zp-label { color: #15803d; }
.zone-principle--architecture .zp-label { color: #6d28d9; }

.zp-text {
  font-size: 0.875rem;
  color: #1e293b;
  line-height: 1.6;
}

/* Resultat */
.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.result-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}

.source-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.source-badge--exact    { background: #dcfce7; color: #14532d; }
.source-badge--approche { background: #fef9c3; color: #854d0e; }
.source-badge--matrix   { background: #fef3c7; color: #78350f; }

.result-tools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.zone-invite {
  font-size: 0.875rem;
  color: #64748b;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
}

/* Collapsible */
.result-detail {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.detail-summary {
  padding: 0.65rem 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  user-select: none;
}

.detail-summary::-webkit-details-marker { display: none; }

.detail-summary::before {
  content: '▶';
  font-size: 0.6rem;
  color: #94a3b8;
  transition: transform 0.15s;
  flex-shrink: 0;
}

details[open] .detail-summary::before { transform: rotate(90deg); }

.detail-content {
  font-size: 0.875rem;
  color: #475569;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-left: 3px solid #2563eb;
  padding: 0.85rem 1rem;
}

.patron-match-banner {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
}

.patron-match-banner--exact {
  background: #f0fdf4;
  color: #15803d;
  border-bottom: 1px solid #bbf7d0;
}

.patron-match-banner--fallback {
  background: #fff7ed;
  color: #9a3412;
  border-bottom: 1px solid #fed7aa;
}

.patron-ctx-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  margin-left: auto;
}

.patron-ctx-tag--exact    { background: #dcfce7; color: #14532d; }
.patron-ctx-tag--fallback { background: #ffedd5; color: #9a3412; }

.result-patron { margin: 0; }

/* Actions */
.result-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  display: inline-block;
  transition: background 0.15s;
}

.btn-primary { background: #2563eb; color: #ffffff; border-color: #2563eb; }
.btn-primary:hover { background: #1d4ed8; }

.btn-secondary { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
.btn-secondary:hover { background: #e2e8f0; }
</style>
