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
      <button class="btn-reset" @click="$emit('reset')">Nouvelle analyse</button>
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
          <span class="gr-risk-badge" :class="riskClass(globalRec.risk)">{{ globalRec.risk }}</span>
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
            <span class="risk-tag">Risque {{ item.concept.risk_ai }}</span>
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
          <p class="qi-trace qi-trace--blue">{{ combo.justification }}</p>
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
          <span class="rec-source" :class="sourceBadgeClass(rec.source)">
            {{ sourceLabel(rec.source) }}
          </span>
        </div>

        <p v-if="rec.justification" class="rec-justification">{{ rec.justification }}</p>

        <div class="rec-tools">
          <div v-for="tool in rec.tools" :key="tool.id" class="rec-tool-card">
            <div class="rtc-header">
              <span class="rtc-id">{{ tool.id }}</span>
              <span class="rtc-family" :class="familyClass(tool.family)">{{ tool.family }}</span>
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

      <div v-if="recommendations.length === 0" class="empty-state">
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
  if (risk === 'Maximal') return 'risk--max'
  if (risk === 'Eleve') return 'risk--high'
  return 'risk--mod'
}

// Index section_index -> validated entry pour acces O(1) dans le template
const validatedBySection = computed(() =>
  Object.fromEntries(props.validated.map(v => [v.section_index, v]))
)

function sectionTitle(idx) {
  return props.sections.find(s => s.index === idx)?.title || `Section ${idx + 1}`
}

function familyClass(fam) {
  return { 'family--m': fam === 'FM1', 'family--t': fam === 'FM2', 'family--i': fam === 'FM3', 'family--a': fam === 'FM4' }
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
  if (src === 'combo') return 'src--combo'
  if (src === 'combo-approche') return 'src--approche'
  return 'src--matrix'
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
  gap: 2rem;
}

.audit-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.audit-header h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1e293b;
}

.audit-meta {
  font-size: 0.875rem;
  color: #475569;
  margin-top: 0.3rem;
}

.btn-reset {
  padding: 0.5rem 1rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-reset:hover { background: #e2e8f0; }

/* SWOT grid */
.swot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 700px) { .swot-grid { grid-template-columns: 1fr; } }

.swot-quadrant {
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid transparent;
}

.swot-quadrant--forces    { background: #f0fdf4; border-color: #bbf7d0; }
.swot-quadrant--faiblesses { background: #eff6ff; border-color: #bfdbfe; }
.swot-quadrant--risques   { background: #fef2f2; border-color: #fecaca; }
.swot-quadrant--opportunites { background: #fff7ed; border-color: #fed7aa; }

.quad-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
}

.swot-quadrant--forces .quad-title    { color: #15803d; }
.swot-quadrant--faiblesses .quad-title { color: #1d4ed8; }
.swot-quadrant--risques .quad-title   { color: #b91c1c; }
.swot-quadrant--opportunites .quad-title { color: #c2410c; }

.quad-desc {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.5;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  padding-bottom: 0.5rem;
}

.quad-empty { font-size: 0.82rem; color: #94a3b8; font-style: italic; }

.quad-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.6rem 0.75rem;
  background: rgba(255,255,255,0.7);
  border-radius: 6px;
}

.qi-concept {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.qi-id {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: monospace;
  color: #475569;
}

.qi-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
}

.risk-tag {
  font-size: 0.68rem;
  font-weight: 700;
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
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
  border-radius: 3px;
  font-family: monospace;
  background: #e2e8f0;
  color: #475569;
}

.qi-tool--strong {
  background: #1e293b;
  color: #f8fafc;
}

.qi-trace {
  font-size: 0.72rem;
  color: #64748b;
  font-style: italic;
  line-height: 1.4;
}

.qi-trace--blue { color: #1e40af; }

.qi-combo-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
}

/* Recommandations */
.recs-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recs-section h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
}

.recs-intro {
  font-size: 0.875rem;
  color: #475569;
}

.rec-block {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
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
  color: #1e293b;
  font-size: 0.9rem;
}

.rec-source {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.src--combo    { background: #dcfce7; color: #14532d; }
.src--approche { background: #fef9c3; color: #854d0e; }
.src--matrix   { background: #fef3c7; color: #78350f; }

.rec-justification {
  font-size: 0.82rem;
  color: #475569;
  background: #f8fafc;
  border-left: 3px solid #2563eb;
  padding: 0.6rem 0.75rem;
  border-radius: 0 5px 5px 0;
}

.rec-tools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}

.rec-tool-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
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
  font-size: 0.72rem;
  font-weight: 700;
  font-family: monospace;
  color: #94a3b8;
}

.rtc-family {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  text-transform: uppercase;
}

.family--m { background: #dbeafe; color: #1e40af; }
.family--t { background: #d1fae5; color: #065f46; }
.family--i { background: #fef3c7; color: #92400e; }
.family--a { background: #fce7f3; color: #9d174d; }

.rtc-function {
  font-size: 0.68rem;
  color: #64748b;
}

.rtc-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.rtc-desc {
  font-size: 0.75rem;
  color: #475569;
  line-height: 1.45;
}

.patron-ctx-note {
  font-size: 0.75rem;
  color: #9a3412;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 5px;
  padding: 0.3rem 0.6rem;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 2rem;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
}

/* Banniere methodologique */
.generic-rec-banner {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem 1.1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.grb-label {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  white-space: nowrap;
  padding-top: 0.1rem;
  flex-shrink: 0;
}

.grb-text {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.6;
}

/* Recommandation globale */
.global-rec {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 1.25rem;
}

.gr-title {
  font-size: 1rem;
  font-weight: 800;
  color: #78350f;
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
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 0.55rem 0.85rem;
  min-width: 120px;
}

.gr-stat-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #92400e;
}

.gr-stat-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

.gr-risk-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  align-self: flex-start;
}

.risk--max { background: #fee2e2; color: #b91c1c; }
.risk--high { background: #ffedd5; color: #c2410c; }
.risk--mod { background: #dcfce7; color: #15803d; }

.gr-levers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gr-levers-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #92400e;
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
  border: 1px solid #fde68a;
  border-radius: 5px;
  padding: 0.4rem 0.75rem;
  flex-wrap: wrap;
}

.gr-lever-id {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: monospace;
  color: #475569;
}

.gr-lever-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
}

.gr-lever-rob {
  font-size: 0.7rem;
  color: #15803d;
  background: #dcfce7;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-weight: 600;
}
</style>
