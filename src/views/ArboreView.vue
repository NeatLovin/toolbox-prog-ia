<template>
  <div class="arbre">
    <header class="home-header">
      <h1>Obtenir une recommandation</h1>
      <p class="home-subtitle">
        Un catalogue d'outils pédagogiques et un arbre de décision pour enseigner la programmation
        à l'ère de l'intelligence artificielle générative.
      </p>
      <p class="trust-line">
        Recommandations déterministes et traçables, aucun texte généré par l'IA.
      </p>
    </header>

    <!-- Fil d'Ariane (masque a l'etape zone) -->
    <nav v-if="step !== 'zone'" class="breadcrumb" aria-label="Étapes">
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
          v-for="(z, i) in ZONES"
          :key="z.family"
          class="zone-card reveal reveal--stagger"
          :class="`zone-card--${z.key}`"
          :style="`--i:${i}`"
          @click="chooseZone(z.family)"
        >
          <span v-if="z.key === 'logique'" class="u-eyebrow logique-eyebrow">zone centrale</span>
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
          <span class="cb-desc">Vue d'ensemble de la famille, sans patron spécifique</span>
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
        Quel est l'objectif cognitif visé ?
        <InfoTooltip :content="GLOSSARY.bloom.short" />
        <span class="optional-tag">Facultatif</span>
      </h2>
      <p class="step-hint">
        Si vous passez, l'objectif retenu sera "{{ dominantBloom }}"
        {{ selectedConcept ? '(prédominant sur ce concept)' : '(valeur par défaut)' }}.
      </p>
      <div class="bloom-grid">
        <button
          v-for="obj in BLOOM_OBJECTIVES"
          :key="obj.bloom"
          class="bloom-btn"
          @click="chooseBloom(obj.bloom)"
        >
          <span class="bloom-btn-label">{{ obj.label }}</span>
          <span class="bloom-btn-hint">{{ obj.hint }}</span>
        </button>
        <button class="bloom-btn bloom-btn--skip" @click="chooseBloom(null)">
          Passer <span class="skip-note">({{ dominantBloom }})</span>
        </button>
      </div>
    </section>

    <!-- Resultat -->
    <section v-else-if="step === 'result' && result" class="result-section reveal">

      <DisclosureCard details-label="Patron et outils" deep-label="Sources">

        <!-- ── Niveau 1 : l'essentiel ── -->
        <template #summary>

          <!-- Principe IA de la zone -->
          <div class="zone-principle" :class="`zone-principle--${zoneKey}`">
            <span class="zp-label">Principe IA : {{ selectedZone }}</span>
            <p class="zp-text">{{ ZONE_PRINCIPLES[selectedZone] }}</p>
          </div>

          <!-- Profil de zone : risque IA uniquement, sans exigence cognitive -->
          <ZoneProfile :zone="selectedZone" :show-posture="false" :show-cognitive="false" class="result-zone-profile" />

          <!-- Concept ciblé (cliquable si un concept précis a été choisi) -->
          <div v-if="selectedConcept" class="result-concept-row">
            <span class="u-eyebrow">Concept ciblé</span>
            <button
              type="button"
              class="result-concept-btn"
              :aria-label="`Voir le concept ${selectedConcept.name}`"
              @click="conceptDetail = selectedConcept"
            >
              <span class="rcb-id">{{ selectedConcept.id }}</span>
              <span class="rcb-sep" aria-hidden="true">·</span>
              <span class="rcb-name">{{ selectedConcept.name }}</span>
              <span class="rcb-hint" aria-hidden="true">ⓘ</span>
            </button>
          </div>

          <!-- Proposition pédagogique (si concept choisi et patron disponible) -->
          <div v-if="selectedConcept && patronForResult?.all?.length" class="result-proposal">
            <span class="u-eyebrow">Ce qu'on vous propose</span>
            <p class="proposal-name">
              {{ patronForResult.hasExact ? patronForResult.exact[0]?.titre : patronForResult.all[0]?.titre }}
            </p>
          </div>

          <!-- Outils conseillés -->
          <div class="result-approach">
            <span class="u-eyebrow">Outils conseillés</span>
            <ul class="result-tool-pills" aria-label="Outils recommandés">
              <li v-for="tool in result.tools.slice(0, 3)" :key="tool.id" class="tool-pill">
                <span class="ui-badge" :class="toolFamilyClass(tool)">{{ toolFamilyShort(tool) }}</span>
                {{ tool.name }}
              </li>
            </ul>
          </div>

          <!-- Invitation si "toute la zone" -->
          <p v-if="!selectedConcept" class="zone-invite">
            Choisissez un concept précis (étape 2) pour obtenir un patron d'activité pédagogique adapté.
          </p>

        </template>

        <!-- ── Niveau 2 : patron + outils complets + justification ── -->
        <template #details>

          <!-- Patron pédagogique -->
          <template v-if="selectedConcept && patronForResult?.all?.length">
            <div
              class="patron-match-banner"
              :class="patronForResult.hasExact ? 'patron-match-banner--exact' : 'patron-match-banner--fallback'"
            >
              <span class="ui-badge ui-badge--neutral">
                {{ patronForResult.hasExact ? `Contexte : ${selectedContext}` : 'Autre contexte' }}
              </span>
              {{ patronForResult.hasExact
                ? `Ce patron correspond à votre contexte d'usage.`
                : `Aucun patron disponible pour « ${selectedContext} ». Voici les variantes pour d'autres contextes :` }}
            </div>
            <PatronBlock
              v-for="p in (patronForResult.hasExact ? patronForResult.exact : patronForResult.all)"
              :key="p.id"
              :patron="p"
              class="result-patron"
            />
            <hr class="details-sep" />
          </template>

          <!-- Liste complète des outils -->
          <div class="result-tools">
            <ToolCard v-for="tool in result.tools" :key="tool.id" :tool="tool" />
          </div>

          <!-- Justification et provenance (remontées depuis niveau 3) -->
          <template v-if="result.justification || sourceDescription">
            <hr class="details-sep" />
            <div class="details-justif">
              <div v-if="result.justification" class="deep-block">
                <span class="deep-label">Justification</span>
                <p class="deep-text">{{ result.justification }}</p>
              </div>
              <div class="deep-block">
                <span class="deep-label">Provenance</span>
                <p class="deep-text">{{ sourceDescription }}</p>
              </div>
            </div>
          </template>

        </template>

        <!-- ── Niveau 3 : sources ── -->
        <template #deep>
          <div class="deep-section">
            <div class="deep-block">
              <span class="deep-label">Sources et littérature</span>
              <ul v-if="resultSources.length" class="deep-sources-list">
                <li v-for="s in resultSources" :key="s.id" class="deep-source-item">
                  <span class="deep-source-name">{{ s.name }}</span>
                  <span class="deep-source-ref"> · {{ s.sources }}</span>
                </li>
              </ul>
              <p v-else class="deep-text">
                Consultez les fiches détaillées des outils dans le catalogue pour les références académiques associées.
              </p>
            </div>
          </div>
        </template>

      </DisclosureCard>

      <!-- Actions -->
      <div class="result-actions">
        <button class="ui-btn ui-btn-primary no-print" @click="restart">Nouvelle recherche</button>
        <router-link to="/catalogue" class="ui-btn ui-btn-secondary no-print">Voir le catalogue complet</router-link>
        <button class="ui-btn ui-btn-ghost no-print" @click="exportPDF" aria-label="Exporter en PDF via l'impression du navigateur">Exporter en PDF</button>
      </div>

    </section>

  <ConceptDetailModal :concept="conceptDetail" @close="conceptDetail = null" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRecommendation, ZONE_PRINCIPLES } from '../lib/recommendation.js'
import { useData } from '../composables/useData.js'
import DisclosureCard from '../components/DisclosureCard.vue'
import ToolCard from '../components/ToolCard.vue'
import PatronBlock from '../components/PatronBlock.vue'
import InfoTooltip from '../components/InfoTooltip.vue'
import ZoneProfile from '../components/ZoneProfile.vue'
import ConceptDetailModal from '../components/ConceptDetailModal.vue'
import { GLOSSARY } from '../lib/glossary.js'

const { concepts, getPatronsByConceptAndContext } = useData()
const route  = useRoute()
const router = useRouter()

const ZONES = [
  { family: 'Syntaxe',      key: 'syntaxe',      sub: 'Variables, structures, POO, syntaxe formelle',       risk: 'Maximal' },
  { family: 'Logique',      key: 'logique',       sub: 'Algorithmes, debug, tests, raisonnement',             risk: 'Élevé'   },
  { family: 'Architecture', key: 'architecture',  sub: 'Design patterns, sécurité, qualité logicielle',       risk: 'Modéré'  }
]

const CONTEXTS = [
  { value: 'Présentiel encadré',   label: 'Présentiel encadré',   desc: 'En classe, supervision directe'  },
  { value: 'Autonomie supervisée', label: 'Autonomie supervisée', desc: 'Hors classe, feedback différé'   },
  { value: 'Projet long',          label: 'Projet long',          desc: 'Semestre ou année'               },
  { value: 'Diagnostic',           label: 'Diagnostic',           desc: 'Évaluation initiale du niveau'   }
]

const BLOOM_OBJECTIVES = [
  { bloom: 'Understand', label: 'Comprendre / expliquer', hint: 'Lire et expliquer un programme existant' },
  { bloom: 'Apply',      label: 'Appliquer / produire',   hint: 'Écrire du code, mettre en œuvre une solution connue' },
  { bloom: 'Create',     label: 'Concevoir / évaluer',    hint: 'Imaginer la solution en amont, juger ou critiquer une approche' }
]

const step            = ref('zone')
const selectedZone    = ref('')
const selectedConcept = ref(null)
const selectedContext = ref('')
const selectedBloom   = ref(null)
const conceptDetail   = ref(null)

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
  if (s === 'combo-approche') return 'Combinatoire approchée'
  return 'Score matriciel'
})

const sourceDescription = computed(() => {
  const s = result.value?.source
  const c = result.value?.combo
  if (s === 'combo') {
    const detail = [c?.year, c?.bloom, c?.context].filter(Boolean).join(', ')
    return `Correspondance exacte avec la combinatoire ${c?.id || ''}${detail ? ` (${detail})` : ''}.`
  }
  if (s === 'combo-approche')
    return `Correspondance approchée avec la combinatoire ${c?.id || ''}. La fonction pédagogique ou le niveau Bloom ont été assouplis pour trouver la meilleure correspondance.`
  return "Aucune combinatoire n'a correspondu aux paramètres exacts. Les outils sont classés par score agrégé dans la matrice de pertinence pour la zone sélectionnée."
})

const resultSources = computed(() =>
  (result.value?.tools || [])
    .filter(t => t.sources)
    .map(t => ({ id: t.id, name: t.name, sources: t.sources }))
)

function toolFamilyShort(tool) {
  const labels = { FM1: 'Traditionnel', FM2: 'Outillé', FM3: 'Tuteur IA', FM4: 'IA généraliste' }
  return labels[tool.family] || tool.family_label
}

function toolFamilyClass(tool) {
  return {
    'ui-badge--family-m': tool.family === 'FM1',
    'ui-badge--family-t': tool.family === 'FM2',
    'ui-badge--family-i': tool.family === 'FM3',
    'ui-badge--family-a': tool.family === 'FM4'
  }
}

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
  router.replace({ query: {} })
}

function exportPDF() { window.print() }

// Synchro URL : écriture quand on atteint le résultat
watch(step, (val) => {
  if (val === 'result') {
    router.replace({ query: {
      zone:    selectedZone.value,
      concept: selectedConcept.value?.id ?? 'all',
      context: selectedContext.value,
      bloom:   selectedBloom.value ?? 'none'
    }})
  }
})

// Restauration depuis l'URL au montage
onMounted(() => {
  const q = route.query
  if (!q.zone) return
  if (!ZONES.some(z => z.family === q.zone)) return
  if (!CONTEXTS.some(c => c.value === q.context)) return

  selectedZone.value    = q.zone
  selectedConcept.value = (q.concept && q.concept !== 'all')
    ? (concepts.find(c => c.id === q.concept) ?? null)
    : null
  selectedContext.value = q.context
  selectedBloom.value   = (q.bloom && q.bloom !== 'none' && BLOOM_OBJECTIVES.some(b => b.bloom === q.bloom))
    ? q.bloom
    : null
  step.value = 'result'
})
</script>

<style scoped>
.arbre {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* En-tête d'accueil */
.home-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.home-header h1 {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
}

.home-subtitle {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  max-width: 620px;
  line-height: 1.65;
}

.trust-line {
  font-size: var(--text-sm);
  color: var(--color-text-placeholder);
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
  transition: transform var(--dur-2) var(--ease), box-shadow var(--dur-2) var(--ease);
}
.zone-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

.zone-card--syntaxe {
  background: var(--zone-syntaxe-bg);
  border-color: var(--zone-syntaxe-border);
  border-left-color: var(--zone-syntaxe-text);
  border-left-width: 3px;
}
.zone-card--logique {
  background: var(--zone-logique-bg);
  border-color: var(--zone-logique-border);
  border-left-color: var(--zone-logique-text);
  border-left-width: 4px;
}
.zone-card--architecture {
  background: var(--zone-architecture-bg);
  border-color: var(--zone-architecture-border);
  border-left-color: var(--zone-architecture-text);
  border-left-width: 3px;
}

.zone-name { font-size: 1.15rem; font-weight: 800; }
.zone-card--syntaxe      .zone-name { color: var(--zone-syntaxe-text); }
.zone-card--logique      .zone-name { color: var(--zone-logique-text); }
.zone-card--architecture .zone-name { color: var(--zone-architecture-text); }

.logique-eyebrow {
  color: var(--zone-logique-text);
  margin-bottom: -0.1rem;
}

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
.cb-id { font-size: var(--text-2xs); font-weight: 600; font-family: var(--font-mono); color: var(--color-text-placeholder); flex-shrink: 0; letter-spacing: 0.03em; }
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
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.1s, background 0.1s;
}
.bloom-btn:hover { border-color: var(--color-accent); background: var(--color-accent-subtle); }

.bloom-btn-label {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
}

.bloom-btn-hint {
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text-faint);
  line-height: 1.4;
}

.bloom-btn--skip {
  grid-column: 1 / -1;
  border-style: dashed;
  color: var(--color-text-faint);
  background: var(--color-surface);
}
.bloom-btn--skip:hover { border-color: var(--color-text-faint); background: var(--color-bg); }

.skip-note { font-weight: 400; color: var(--color-text-placeholder); }

/* Profil de zone dans le résultat : colonne unique, largeur contrainte */
.result-zone-profile {
  max-width: 280px;
}

/* Zone principle */
.zone-principle {
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.zone-principle--syntaxe {
  background: var(--zone-syntaxe-bg);
  border: 1px solid var(--zone-syntaxe-border);
  border-left: 3px solid var(--zone-syntaxe-text);
}
.zone-principle--logique {
  background: var(--zone-logique-bg);
  border: 1px solid var(--zone-logique-border);
  border-left: 3px solid var(--zone-logique-text);
}
.zone-principle--architecture {
  background: var(--zone-architecture-bg);
  border: 1px solid var(--zone-architecture-border);
  border-left: 3px solid var(--zone-architecture-text);
}

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

/* Niveau 1 - proposition + outils */
.result-proposal {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.proposal-name {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.35;
}

.result-approach {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.result-tool-pills {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

/* Invitation zone entière */
.zone-invite {
  font-size: var(--text-base);
  color: var(--color-text-faint);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
}

/* Niveau 2 - patron + outils */
.patron-match-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-sm);
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  margin-bottom: var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.patron-match-banner--exact {
  border-left: 3px solid var(--color-success-text);
  color: var(--color-text);
}

.details-justif {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.result-patron { margin-top: var(--space-3); }
.result-patron + .result-patron { margin-top: var(--space-2); }

.details-sep {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-4) 0;
}

.result-tools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}

/* Niveau 3 - justification + sources */
.deep-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.deep-block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.deep-label {
  font-size: var(--text-2xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-faint);
}

.deep-text {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
}

.deep-sources-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.deep-source-item { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.5; }
.deep-source-name { font-weight: 600; color: var(--color-text); }
.deep-source-ref  { color: var(--color-text-faint); }

/* Concept ciblé */
.result-concept-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.result-concept-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.45rem 0.8rem;
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-text);
  text-align: left;
  transition: border-color 0.12s, background 0.12s;
  align-self: flex-start;
}
.result-concept-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}
.result-concept-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-lg);
}

.rcb-id {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-placeholder);
  letter-spacing: 0.03em;
}
.rcb-sep {
  color: var(--color-text-placeholder);
  user-select: none;
}
.rcb-name {
  font-weight: 600;
  color: var(--color-text);
}
.rcb-hint {
  font-size: 0.85em;
  color: var(--color-info-text);
  margin-left: 0.1rem;
}

/* Actions */
.result-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }

/* Responsive */
@media (max-width: 640px) {
  .zone-grid    { grid-template-columns: 1fr; }
  .context-grid { grid-template-columns: 1fr; }
  .bloom-grid   { grid-template-columns: 1fr; }
  .bloom-btn--skip { grid-column: auto; }
  .result-tools { grid-template-columns: 1fr; }
}
</style>
