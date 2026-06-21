<template>
  <div class="audit">
    <!-- Entete -->
    <div class="audit-header">
      <div>
        <h2>Analyse du cours</h2>
        <p class="audit-meta">
          {{ validatedCount }} section{{ validatedCount > 1 ? 's' : '' }} analysee{{ validatedCount > 1 ? 's' : '' }} &middot;
          {{ allConceptIds.length }} concept{{ allConceptIds.length > 1 ? 's' : '' }} detecte{{ allConceptIds.length > 1 ? 's' : '' }}
        </p>
      </div>
      <button class="ui-btn ui-btn-secondary" @click="$emit('reset')">Nouvelle analyse</button>
    </div>

    <!-- Banniere methodologique -->
    <div class="generic-rec-banner">
      <span class="grb-label">Methodologie</span>
      <p class="grb-text">{{ GENERIC_RECOMMENDATION }}</p>
    </div>

    <!-- Recommandation globale -->
    <section v-if="globalRec.dominantFamily" class="global-rec">
      <h2 class="gr-title">Recommandation globale du cours</h2>
      <div class="gr-stats">
        <div class="gr-stat">
          <span class="gr-stat-label">Famille dominante</span>
          <span class="gr-stat-value">{{ globalRec.dominantFamily }}</span>
        </div>
        <div class="gr-stat">
          <span class="gr-stat-label">Risque IA global</span>
          <span class="ui-badge" :class="riskClass(globalRec.risk)">{{ globalRec.risk }}</span>
        </div>
        <div v-if="globalRec.dominantBloom" class="gr-stat">
          <span class="gr-stat-label">Bloom dominant</span>
          <span class="gr-stat-value">{{ globalRec.dominantBloom }}</span>
        </div>
        <div class="gr-stat">
          <span class="gr-stat-label">Concepts detectes</span>
          <span class="gr-stat-value">{{ globalRec.conceptCount }}</span>
        </div>
      </div>
      <div v-if="globalRec.levers.length" class="gr-levers">
        <span class="gr-levers-label">Leviers prioritaires (robustesse elevee, score matriciel fort)</span>
        <div class="gr-levers-list">
          <div v-for="t in globalRec.levers" :key="t.id" class="gr-lever">
            <span class="gr-lever-id">{{ t.id }}</span>
            <span class="gr-lever-name">{{ t.name }}</span>
            <span class="gr-lever-rob">Robustesse {{ t.robustness_ai }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SWOT -->
    <section class="swot-grid">
      <!-- Forces -->
      <div class="swot-quadrant swot-quadrant--forces">
        <h3 class="quad-title">&#9650; Forces</h3>
        <p class="quad-desc">Concepts bien couverts avec des outils a la fois ideaux et robustes face a l'IA.</p>
        <div v-if="swot.forces.length === 0" class="quad-empty">Aucune force identifiee.</div>
        <div v-for="item in swot.forces" :key="item.concept.id" class="quad-item">
          <div class="qi-concept">
            <span class="qi-id">{{ item.concept.id }}</span>
            <span class="qi-name">{{ item.concept.name }}</span>
          </div>
          <div class="qi-tools">
            <span v-for="t in item.tools" :key="t.id" class="qi-tool qi-tool--strong" :title="t.name">
              {{ t.id }} &#9733;&#9733;&#9733;
            </span>
          </div>
          <p class="qi-trace">Source : matrice, score 3, robustesse {{ item.tools[0]?.robustness_ai }}</p>
        </div>
      </div>

      <!-- Faiblesses -->
      <div class="swot-quadrant swot-quadrant--faiblesses">
        <h3 class="quad-title">&#9660; Faiblesses</h3>
        <p class="quad-desc">Concepts peu ou pas instrumentes dans la matrice, ou attendus mais absents du cours.</p>
        <div v-if="swot.faiblesses.length === 0" class="quad-empty">Aucune faiblesse identifiee.</div>
        <div v-for="item in swot.faiblesses" :key="item.concept.id" class="quad-item">
          <div class="qi-concept">
            <span class="qi-id">{{ item.concept.id }}</span>
            <span class="qi-name">{{ item.concept.name }}</span>
          </div>
          <p class="qi-trace">{{ item.reason }}</p>
        </div>
      </div>

      <!-- Risques -->
      <div class="swot-quadrant swot-quadrant--risques">
        <h3 class="quad-title">&#9888; Risques</h3>
        <p class="quad-desc">Concepts de syntaxe (risque IA Maximal) ou outils disponibles a robustesse nulle.</p>
        <div v-if="swot.risques.length === 0" class="quad-empty">Aucun risque identifie.</div>
        <div v-for="item in swot.risques" :key="item.concept.id" class="quad-item">
          <div class="qi-concept">
            <span class="qi-id">{{ item.concept.id }}</span>
            <span class="qi-name">{{ item.concept.name }}</span>
            <span class="ui-badge" :class="riskClass(item.concept.risk_ai)">Risque {{ item.concept.risk_ai }}</span>
          </div>
          <p class="qi-trace">{{ item.reason }}</p>
        </div>
      </div>

      <!-- Opportunites -->
      <div class="swot-quadrant swot-quadrant--opportunites">
        <h3 class="quad-title">&#128270; Opportunites</h3>
        <p class="quad-desc">Combinatoires preconfigures de combos.json correspondant aux parametres detectes.</p>
        <div v-if="swot.opportunites.length === 0" class="quad-empty">Aucune combinatoire correspondante trouvee.</div>
        <div v-for="combo in swot.opportunites" :key="combo.id" class="quad-item">
          <p class="qi-combo-label">{{ combo.recommended_label }}</p>
          <p class="qi-trace qi-trace--info">{{ combo.justification }}</p>
          <div class="qi-tools">
            <span v-for="t in combo.tools" :key="t.id" class="qi-tool" :title="t.name">{{ t.id }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Recommandations par section -->
    <section class="recs-section">
      <h2>Recommandations par section</h2>
      <p class="recs-intro">
        Pour chaque section analysee, la recommandation est calculee par le moteur deterministe
        (combinatoires + matrice de pertinence), sans generation de texte.
      </p>

      <div v-for="rec in recommendations" :key="rec.section_index" class="rec-block">
        <div class="rec-header">
          <span class="rec-section-title">{{ sectionTitle(rec.section_index) }}</span>
          <span class="ui-badge" :class="sourceBadgeClass(rec.source)">
            {{ sourceLabel(rec.source) }}
          </span>
        </div>

        <p v-if="rec.justification" class="rec-justification">{{ rec.justification }}</p>

        <div class="rec-tools">
          <div v-for="tool in rec.tools" :key="tool.id" class="rec-tool-card">
            <div class="rtc-header">
              <span class="rtc-id">{{ tool.id }}</span>
              <span class="ui-badge" :class="familyClass(tool.family)">{{ tool.family }}</span>
              <span class="rtc-function">{{ functionLabel(tool.function) }}</span>
            </div>
            <p class="rtc-name">{{ tool.name }}</p>
            <p class="rtc-desc">{{ tool.description }}</p>
          </div>
        </div>

        <template v-for="cid in (validatedBySection[rec.section_index]?.concept_ids || [])" :key="cid">
          <template v-if="patronsForSectionConcept(rec.section_index, cid).hasExact">
            <PatronBlock
              v-for="p in patronsForSectionConcept(rec.section_index, cid).exact"
              :key="p.id"
              :patron="p"
            />
          </template>
          <template v-else-if="patronsForSectionConcept(rec.section_index, cid).all.length">
            <p class="patron-ctx-note">
              Variantes (contexte infere : {{ validatedBySection[rec.section_index]?.context || 'non precise' }}) :
            </p>
            <PatronBlock
              v-for="p in patronsForSectionConcept(rec.section_index, cid).all"
              :key="p.id"
              :patron="p"
            />
          </template>
        </template>
      </div>

      <div v-if="recommendations.length === 0" class="ui-empty-state">
        Aucune section avec concepts et niveau Bloom identifies.
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useData.js'
import PatronBlock from './PatronBlock.vue'
import { GENERIC_RECOMMENDATION, computeCourseGlobalRec } from '../lib/recommendation.js'

const { getPatronsByConceptAndContext } = useData()

const props = defineProps({
  swot: { type: Object, required: true },
  recommendations: { type: Array, required: true },
  sections: { type: Array, required: true },
  validated: { type: Array, required: true }
})

defineEmits(['reset'])

const validatedCount = computed(() => props.validated.length)
const allConceptIds = computed(() => [...new Set(props.validated.flatMap(s => s.concept_ids))])
const globalRec = computed(() => computeCourseGlobalRec(props.validated))

function riskClass(risk) {
  if (risk === 'Maximal') return 'ui-badge--risk-max'
  if (risk === 'Eleve') return 'ui-badge--risk-high'
  return 'ui-badge--risk-mod'
}

const validatedBySection = computed(() =>
  Object.fromEntries(props.validated.map(v => [v.section_index, v]))
)

function sectionTitle(idx) {
  return props.sections.find(s => s.index === idx)?.title || `Section ${idx + 1}`
}

function familyClass(fam) {
  return {
    'ui-badge--family-m': fam === 'FM1',
    'ui-badge--family-t': fam === 'FM2',
    'ui-badge--family-i': fam === 'FM3',
    'ui-badge--family-a': fam === 'FM4'
  }
}

function functionLabel(fn) {
  return { F: 'Formative', S: 'Sommative', FS: 'F+S', R: 'Recherche' }[fn] || fn
}

function sourceLabel(src) {
  if (src === 'combo') return 'Combinatoire exacte'
  if (src === 'combo-approche') return 'Combinatoire approchee'
  return 'Score matriciel'
}

function sourceBadgeClass(src) {
  if (src === 'combo') return 'ui-badge--source-exact'
  if (src === 'combo-approche') return 'ui-badge--source-approche'
  return 'ui-badge--source-matrix'
}

function patronsForSectionConcept(sectionIndex, conceptId) {
  const ctx = validatedBySection.value[sectionIndex]?.context
  return getPatronsByConceptAndContext(conceptId, ctx)
}
</script>

<style scoped>
.audit {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.audit-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.audit-header h2 {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-text);
}

.audit-meta {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-top: 0.3rem;
}

/* SWOT grid */
.swot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 700px) { .swot-grid { grid-template-columns: 1fr; } }

.swot-quadrant {
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid transparent;
}

.swot-quadrant--forces      { background: var(--color-success-bg); border-color: var(--color-success-border); }
.swot-quadrant--faiblesses  { background: var(--color-warning-bg); border-color: var(--color-warning-border); }
.swot-quadrant--risques     { background: var(--color-danger-bg);  border-color: var(--color-danger-border);  }
.swot-quadrant--opportunites { background: var(--color-info-bg);   border-color: var(--color-info-border);    }

.quad-title {
  font-size: var(--text-md);
  font-weight: 800;
  color: var(--color-text);
}

.swot-quadrant--forces .quad-title       { color: var(--color-success-text); }
.swot-quadrant--faiblesses .quad-title   { color: var(--color-warning-text); }
.swot-quadrant--risques .quad-title      { color: var(--color-danger-text);  }
.swot-quadrant--opportunites .quad-title { color: var(--color-info-text);    }

.quad-desc {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
  line-height: 1.5;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  padding-bottom: 0.5rem;
}

.quad-empty { font-size: var(--text-sm); color: var(--color-text-placeholder); font-style: italic; }

.quad-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.6rem 0.75rem;
  background: rgba(255,255,255,0.7);
  border-radius: var(--radius-md);
}

.qi-concept {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.qi-id {
  font-size: var(--text-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

.qi-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.qi-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.qi-tool {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  background: var(--color-border);
  color: var(--color-text-muted);
}

.qi-tool--strong {
  background: var(--color-accent);
  color: var(--color-bg);
}

.qi-trace {
  font-size: 0.72rem;
  color: var(--color-text-faint);
  font-style: italic;
  line-height: 1.4;
}

.qi-trace--info { color: var(--color-info-text); }

.qi-combo-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

/* Recommandations */
.recs-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.recs-section h2 {
  font-size: var(--text-xl);
  font-weight: 800;
  color: var(--color-text);
}

.recs-intro {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.rec-block {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.rec-section-title {
  font-weight: 700;
  color: var(--color-text);
  font-size: var(--text-base);
}

.rec-justification {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  background: var(--color-bg);
  border-left: 3px solid var(--color-accent);
  padding: 0.6rem 0.75rem;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.rec-tools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.rec-tool-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.rtc-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.rtc-id {
  font-size: var(--text-2xs);
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text-placeholder);
}

.rtc-function {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.rtc-name {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
}

.rtc-desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.45;
}

.patron-ctx-note {
  font-size: var(--text-xs);
  color: var(--color-warning-text);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.6rem;
}

/* Banniere methodologique */
.generic-rec-banner {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.85rem 1.1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.grb-label {
  font-size: var(--text-2xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-faint);
  white-space: nowrap;
  padding-top: 0.1rem;
  flex-shrink: 0;
}

.grb-text {
  font-size: 0.8rem;
  color: var(--color-text-faint);
  line-height: 1.6;
}

/* Recommandation globale */
.global-rec {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--patron-bg);
  border: 1px solid var(--patron-border);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
}

.gr-title {
  font-size: var(--text-base);
  font-weight: 800;
  color: var(--patron-title);
}

.gr-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.gr-stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  background: rgba(255,255,255,0.7);
  border: 1px solid var(--patron-border);
  border-radius: var(--radius-md);
  padding: 0.55rem 0.85rem;
  min-width: 120px;
}

.gr-stat-label {
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--patron-text);
}

.gr-stat-value {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
}

.gr-levers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gr-levers-label {
  font-size: var(--text-2xs);
  font-weight: 700;
  color: var(--patron-text);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.gr-levers-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.gr-lever {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.7);
  border: 1px solid var(--patron-border);
  border-radius: var(--radius-md);
  padding: 0.4rem 0.75rem;
  flex-wrap: wrap;
}

.gr-lever-id {
  font-size: var(--text-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}

.gr-lever-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  flex: 1;
}

.gr-lever-rob {
  font-size: var(--text-2xs);
  color: var(--color-success-text);
  background: var(--color-success-bg);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}
</style>
