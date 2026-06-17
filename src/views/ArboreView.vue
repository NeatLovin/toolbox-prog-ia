<template>
  <div class="arbre">
    <div class="ui-page-header">
      <h1>Arbre de decision</h1>
      <p>Trois etapes pour une recommandation d'outils adaptee a votre contexte pedagogique.</p>
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
          <span class="ui-badge" :class="`ui-badge--zone-${z.key}`">Risque IA : {{ z.risk }}</span>
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
      <h2 class="step-title">Dans quel contexte d'usage ? <InfoTooltip :content="GLOSSARY.contexte.short" /></h2>
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
        <InfoTooltip :content="GLOSSARY.bloom.short" />
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
        <span class="ui-badge" :class="sourceBadgeClass">{{ sourceLabel }}</span>
        <InfoTooltip :content="GLOSSARY.combinatoire.short" />
      </div>
      <div class="result-tools">
        <ToolCard v-for="tool in result.tools" :key="tool.id" :tool="tool" />
      </div>

      <!-- Invitation si "toute la zone" (pas de patron) -->
      <p v-if="!selectedConcept" class="zone-invite">
        Choisissez un concept precis (etape 2) pour obtenir un patron d'activite pedagogique adapte.
      </p>

      <!-- Justification (repliable) -->
      <details v-if="result.justification" class="ui-collapsible">
        <summary>Justification de la recommandation</summary>
        <div class="ui-collapsible-body detail-content">{{ result.justification }}</div>
      </details>

      <!-- Patron pedagogique (repliable, seulement si concept selectionne) -->
      <details v-if="selectedConcept && patronForResult?.all.length" class="ui-collapsible">
        <summary>
          Patron pedagogique
          <span
            v-if="patronForResult.hasExact"
            class="ui-badge ui-badge--source-exact patron-ctx-tag"
          >Pour "{{ selectedContext }}"</span>
          <span v-else class="ui-badge ui-badge--source-approche patron-ctx-tag">Variantes disponibles</span>
        </summary>
        <div class="ui-collapsible-body">
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
        </div>
      </details>

      <!-- Actions -->
      <div class="result-actions">
        <button class="ui-btn ui-btn-primary" @click="restart">Nouvelle recherche</button>
        <router-link to="/catalogue" class="ui-btn ui-btn-secondary">Voir le catalogue complet</router-link>
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
import InfoTooltip from '../components/InfoTooltip.vue'
import { GLOSSARY } from '../lib/glossary.js'

const { concepts, getPatronsByConceptAndContext } = useData()

const ZONES = [
  { family: 'Syntaxe',      key: 'syntaxe',      sub: 'Variables, structures, POO, syntaxe formelle',       risk: 'Maximal' },
  { family: 'Logique',      key: 'logique',       sub: 'Algorithmes, debug, tests, raisonnement',             risk: 'Eleve'   },
  { family: 'Architecture', key: 'architecture',  sub: 'Design patterns, securite, qualite logicielle',       risk: 'Modere'  }
]

const CONTEXTS = [
  { value: 'Présentiel encadré',   label: 'Présentiel encadré',   desc: 'En classe, supervision directe'  },
  { value: 'Autonomie supervisée', label: 'Autonomie supervisée', desc: 'Hors classe, feedback différé'   },
  { value: 'Projet long',          label: 'Projet long',          desc: 'Semestre ou année'               },
  { value: 'Diagnostic',           label: 'Diagnostic',           desc: 'Evaluation initiale du niveau'   }
]

const BLOOM_OBJECTIVES = [
  { bloom: 'Understand', label: 'Comprendre / expliquer' },
  { bloom: 'Apply',      label: 'Appliquer / produire'   },
  { bloom: 'Create',     label: 'Concevoir / evaluer'    }
]

const step            = ref('zone')
const selectedZone    = ref('')
const selectedConcept = ref(null)
const selectedContext = ref('')
const selectedBloom   = ref(null)

const conceptsInZone = computed(() => concepts.filter(c => c.family === selectedZone.value))
const dominantBloom  = computed(() => selectedConcept.value?.bloom?.[0] ?? 'Apply')
const effectiveBloom = computed(() => selectedBloom.value || dominantBloom.value)
const zoneKey        = computed(() => selectedZone.value.toLowerCase())

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
  if (s === 'combo') return 'ui-badge--source-exact'
  if (s === 'combo-approche') return 'ui-badge--source-approche'
  return 'ui-badge--source-matrix'
})

const sourceLabel = computed(() => {
  const s = result.value?.source
  if (s === 'combo') return 'Combinatoire exacte'
  if (s === 'combo-approche') return 'Combinatoire approchee'
  return 'Score matriciel'
})

function chooseZone(family)   { selectedZone.value = family; step.value = 'concept' }
function chooseConcept(c)     { selectedConcept.value = c; step.value = 'context' }
function chooseContext(ctx)   { selectedContext.value = ctx; step.value = 'bloom' }
function chooseBloom(bloom)   { selectedBloom.value = bloom; step.value = 'result' }

function goToStep(target) {
  if (target === 'zone') {
    selectedZone.value = ''; selectedConcept.value = null
    selectedContext.value = ''; selectedBloom.value = null
    step.value = 'zone'
  } else if (target === 'concept') {
    selectedConcept.value = null; selectedContext.value = ''
    selectedBloom.value = null; step.value = 'concept'
  } else if (target === 'context') {
    selectedContext.value = ''; selectedBloom.value = null; step.value = 'context'
  } else if (target === 'bloom') {
    selectedBloom.value = null; step.value = 'bloom'
  }
}

function restart() {
  selectedZone.value = ''; selectedConcept.value = null
  selectedContext.value = ''; selectedBloom.value = null
  step.value = 'zone'
}
</script>

<style scoped>
.arbre {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Fil d'Ariane */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  font-size: var(--text-sm);
}

.bc-link {
  background: none;
  border: none;
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-accent);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.1s, background 0.1s;
}
.bc-link:hover { text-decoration-color: currentColor; background: var(--color-accent-subtle); }

.bc-sep { color: var(--color-text-placeholder); }
.bc-current { color: var(--color-text-muted); font-size: var(--text-sm); }

/* Sections */
.step-section,
.result-section { display: flex; flex-direction: column; gap: var(--space-4); }

.step-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.optional-tag {
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--color-accent-subtle);
  color: var(--color-text-faint);
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-sm);
}

.step-hint { font-size: var(--text-base); color: var(--color-text-faint); }

/* Zone cards */
.zone-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.zone-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 1.4rem var(--space-5);
  border-radius: var(--radius-2xl);
  border: 2px solid transparent;
  cursor: pointer;
  text-align: left;
  transition: transform 0.1s, box-shadow 0.1s;
}
.zone-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

.zone-card--syntaxe      { background: var(--zone-syntaxe-bg);      border-color: var(--zone-syntaxe-border); }
.zone-card--logique      { background: var(--zone-logique-bg);       border-color: var(--zone-logique-border); }
.zone-card--architecture { background: var(--zone-architecture-bg);  border-color: var(--zone-architecture-border); }

.zone-name { font-size: 1.15rem; font-weight: 800; }
.zone-card--syntaxe      .zone-name { color: var(--zone-syntaxe-text); }
.zone-card--logique      .zone-name { color: var(--zone-logique-text); }
.zone-card--architecture .zone-name { color: var(--zone-architecture-text); }

.zone-sub { font-size: 0.8rem; color: var(--color-text-faint); line-height: 1.4; }

/* Concept list */
.concept-list { display: flex; flex-direction: column; gap: 0.4rem; }

.concept-btn {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.65rem var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}
.concept-btn:hover { border-color: var(--color-accent); background: var(--color-accent-subtle); }

.concept-btn--all { border-style: dashed; border-color: var(--color-border-strong); background: var(--color-surface); }
.concept-btn--all:hover { border-color: var(--color-accent); background: var(--color-accent-subtle); }

.cb-header { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
.cb-id { font-size: var(--text-2xs); font-weight: 700; font-family: monospace; color: var(--color-text-placeholder); flex-shrink: 0; }
.cb-name { font-size: var(--text-base); font-weight: 700; color: var(--color-text); }
.cb-desc { font-size: 0.78rem; color: var(--color-text-faint); line-height: 1.4; }

/* Context grid */
.context-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

.context-btn {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: var(--space-4) 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}
.context-btn:hover { border-color: var(--color-accent); background: var(--color-accent-subtle); }

.ctx-name { font-size: var(--text-base); font-weight: 700; color: var(--color-text); }
.ctx-desc { font-size: 0.78rem; color: var(--color-text-faint); }

/* Bloom grid */
.bloom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

.bloom-btn {
  padding: 0.85rem var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}
.bloom-btn:hover { border-color: var(--color-accent); background: var(--color-accent-subtle); }

.bloom-btn--skip {
  grid-column: 1 / -1;
  border-style: dashed;
  color: var(--color-text-faint);
  background: var(--color-surface);
}
.bloom-btn--skip:hover { border-color: var(--color-text-faint); background: var(--color-bg); }

.skip-note { font-weight: 400; color: var(--color-text-placeholder); }

/* Zone principle */
.zone-principle {
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.zone-principle--syntaxe      { background: var(--zone-syntaxe-bg);     border: 1px solid var(--zone-syntaxe-border); }
.zone-principle--logique      { background: var(--zone-logique-bg);      border: 1px solid var(--zone-logique-border); }
.zone-principle--architecture { background: var(--zone-architecture-bg); border: 1px solid var(--zone-architecture-border); }

.zp-label {
  font-size: var(--text-2xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.zone-principle--syntaxe      .zp-label { color: var(--zone-syntaxe-text); }
.zone-principle--logique      .zp-label { color: var(--zone-logique-text); }
.zone-principle--architecture .zp-label { color: var(--zone-architecture-text); }

.zp-text { font-size: var(--text-base); color: var(--color-text); line-height: 1.6; }

/* Resultat */
.result-header { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
.result-title  { font-size: var(--text-xl); font-weight: 800; color: var(--color-text); }

.result-tools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}

.zone-invite {
  font-size: var(--text-base);
  color: var(--color-text-faint);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
}

.detail-content {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-4);
  line-height: 1.65;
}

.patron-match-banner {
  font-size: var(--text-xs);
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  margin-bottom: var(--space-3);
  border-radius: var(--radius-sm);
}
.patron-match-banner--exact    { background: var(--color-success-bg); color: var(--color-success-text); }
.patron-match-banner--fallback { background: var(--color-warning-bg); color: var(--color-warning-text); }

.patron-ctx-tag { margin-left: auto; }

.result-patron { margin-top: var(--space-3); }
.result-patron + .result-patron { margin-top: var(--space-2); }

.result-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

/* Responsive */
@media (max-width: 640px) {
  .zone-grid    { grid-template-columns: 1fr; }
  .context-grid { grid-template-columns: 1fr; }
  .bloom-grid   { grid-template-columns: 1fr; }
  .bloom-btn--skip { grid-column: auto; }
}
</style>
