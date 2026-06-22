<template>
  <!-- Document hors programmation -->
  <div v-if="!isProgramming" class="not-prog ui-card">
    <h2 class="np-title">Ce document ne semble pas porter sur la programmation.</h2>
    <p class="np-text">L'audit est conçu pour analyser des cours de programmation ou d'informatique. Déposez un syllabus, un plan de cours ou un support de cours en lien avec ces disciplines.</p>
    <button class="ui-btn ui-btn-secondary" @click="$emit('reset')">Recommencer</button>
  </div>

  <!-- Résultat normal -->
  <div v-else class="audit">

    <!-- En-tête -->
    <div class="audit-header">
      <div>
        <h2>Analyse du cours</h2>
        <p class="audit-meta">
          {{ validatedCount }} section{{ validatedCount > 1 ? 's' : '' }} ·
          {{ allConceptIds.length }} notion{{ allConceptIds.length > 1 ? 's' : '' }} repérée{{ allConceptIds.length > 1 ? 's' : '' }}
        </p>
      </div>
      <button class="ui-btn ui-btn-secondary" @click="$emit('reset')">Nouvelle analyse</button>
    </div>

    <!-- 1. EN BREF (toujours visible) -->
    <section class="brief ui-card">
      <h3 class="brief-title">En bref</h3>
      <p class="brief-text">{{ summaryText }}</p>

      <template v-if="keyTools.length">
        <p class="brief-subtitle">Ce qu'on vous conseille</p>
        <div class="brief-levers">
          <div v-for="t in keyTools" :key="t.id" class="brief-lever">
            <span class="bl-name">{{ t.name }}</span>
            <MetricGauge
              label="Niveau de preuve"
              :value="efficaciteNum(t)"
              :max="3"
              :value-label="t.efficacite || 'Émergente'"
              variant="ramp"
            />
          </div>
        </div>
      </template>
    </section>

    <!-- 2. APERÇU VISUEL (toujours visible) -->
    <section class="overview">
      <div class="overview-chips" role="list" aria-label="Repères du cours">
        <div class="ov-chip" role="listitem">
          <span class="ov-chip-num">{{ validatedCount }}</span>
          <span class="ov-chip-label">section{{ validatedCount > 1 ? 's' : '' }} analysée{{ validatedCount > 1 ? 's' : '' }}</span>
        </div>
        <div class="ov-chip" role="listitem">
          <span class="ov-chip-num">{{ detectedZones.join(', ') || 'Non déterminé' }}</span>
          <span class="ov-chip-label">zone{{ detectedZones.length > 1 ? 's' : '' }} détectée{{ detectedZones.length > 1 ? 's' : '' }}</span>
        </div>
        <div v-if="bloomLabel" class="ov-chip" role="listitem">
          <span class="ov-chip-num">{{ bloomLabel }}</span>
          <span class="ov-chip-label">niveau cognitif dominant</span>
        </div>
        <div class="ov-chip" role="listitem">
          <span class="ov-chip-num">{{ allConceptIds.length }}</span>
          <span class="ov-chip-label">notion{{ allConceptIds.length > 1 ? 's' : '' }} couverte{{ allConceptIds.length > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <ZoneProfile
        v-if="detectedZones.length"
        :zones="detectedZones"
        :show-posture="true"
      />
    </section>

    <!-- 3. ANALYSE DÉTAILLÉE (repliée) -->
    <DisclosureCard details-label="Voir l'analyse détaillée">
      <template #summary>
        <div class="swot-teaser">
          <p class="swot-teaser-text">
            Forces, points de vigilance et approches pédagogiques conseillées, basés sur les notions détectées.
          </p>
          <div class="swot-counts">
            <span class="swot-count swot-count--force">{{ swot.forces.length }} force{{ swot.forces.length !== 1 ? 's' : '' }}</span>
            <span class="swot-count swot-count--faiblesse">{{ swot.faiblesses.length }} faiblesse{{ swot.faiblesses.length !== 1 ? 's' : '' }}</span>
            <span class="swot-count swot-count--risque">{{ swot.risques.length }} vigilance{{ swot.risques.length !== 1 ? 's' : '' }}</span>
            <span class="swot-count swot-count--opportunite">{{ swot.opportunites.length }} approche{{ swot.opportunites.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </template>

      <template #details>
        <div class="swot-grid">

          <!-- Forces -->
          <div class="swot-quadrant swot-quadrant--forces">
            <h3 class="quad-title">Points bien outillés</h3>
            <p class="quad-desc">Ces notions disposent de solutions éprouvées, fiables face aux pratiques IA des étudiants.</p>
            <div v-if="swot.forces.length === 0" class="quad-empty">Aucun point bien outillé identifié.</div>
            <div v-for="item in swot.forces" :key="item.concept.id" class="quad-item">
              <div class="qi-concept">
                <span class="qi-id">{{ item.concept.id }}</span>
                <span class="qi-name">{{ item.concept.name }}</span>
              </div>
              <div class="qi-tools">
                <span v-for="t in item.tools" :key="t.id" class="qi-tool" :title="t.name">{{ t.name }}</span>
              </div>
            </div>
          </div>

          <!-- Faiblesses -->
          <div class="swot-quadrant swot-quadrant--faiblesses">
            <h3 class="quad-title">Points moins bien couverts</h3>
            <p class="quad-desc">Ces notions sont plus difficiles à instrumenter ou n'ont pas été détectées dans ce cours.</p>
            <div v-if="swot.faiblesses.length === 0" class="quad-empty">Aucun point de faiblesse identifié.</div>
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
            <h3 class="quad-title">Points de vigilance IA</h3>
            <p class="quad-desc">Pour ces notions, l'IA peut facilement produire le travail à la place de l'étudiant.</p>
            <div v-if="swot.risques.length === 0" class="quad-empty">Aucun point de vigilance identifié.</div>
            <div v-for="item in swot.risques" :key="item.concept.id" class="quad-item">
              <div class="qi-concept">
                <span class="qi-id">{{ item.concept.id }}</span>
                <span class="qi-name">{{ item.concept.name }}</span>
              </div>
              <p class="qi-trace">{{ item.reason }}</p>
            </div>
          </div>

          <!-- Opportunités -->
          <div class="swot-quadrant swot-quadrant--opportunites">
            <h3 class="quad-title">Approches conseillées</h3>
            <p class="quad-desc">Ces combinaisons d'outils correspondent au profil pédagogique détecté dans ce cours.</p>
            <div v-if="swot.opportunites.length === 0" class="quad-empty">Aucune approche correspondante trouvée.</div>
            <div v-for="combo in swot.opportunites" :key="combo.id" class="quad-item">
              <p class="qi-combo-label">{{ combo.recommended_label }}</p>
              <p class="qi-trace qi-trace--info">{{ combo.justification }}</p>
              <div class="qi-tools">
                <span v-for="t in combo.tools" :key="t.id" class="qi-tool" :title="t.name">{{ t.name }}</span>
              </div>
            </div>
          </div>

        </div>
      </template>
    </DisclosureCard>

    <!-- 4. RECOMMANDATIONS PAR SECTION -->
    <section class="recs-section">
      <h2>Recommandations par section</h2>
      <p class="recs-intro">
        Pour chaque section, les outils conseillés sont calculés automatiquement
        à partir des notions et du contexte détectés, sans génération de texte libre.
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
              <span class="ui-badge" :class="familyClass(tool.family)">{{ familyLabel(tool.family) }}</span>
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
              Variantes disponibles (contexte : {{ validatedBySection[rec.section_index]?.context || 'non précisé' }}) :
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
        Aucune section avec notions et niveau cognitif identifiés.
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useData.js'
import PatronBlock    from './PatronBlock.vue'
import MetricGauge   from './MetricGauge.vue'
import ZoneProfile   from './ZoneProfile.vue'
import DisclosureCard from './DisclosureCard.vue'
import { computeCourseGlobalRec } from '../lib/recommendation.js'

const { getPatronsByConceptAndContext } = useData()

const props = defineProps({
  isProgramming:   { type: Boolean, default: true },
  swot:            { type: Object,  default: () => null },
  recommendations: { type: Array,   default: () => [] },
  sections:        { type: Array,   default: () => [] },
  validated:       { type: Array,   default: () => [] }
})

defineEmits(['reset'])

// ── Données dérivées ─────────────────────────────────────────────────────────

const validatedCount = computed(() => props.validated.length)
const allConceptIds  = computed(() => [...new Set(props.validated.flatMap(s => s.concept_ids))])
const globalRec      = computed(() => computeCourseGlobalRec(props.validated))
const detectedZones  = computed(() => props.swot?.meta?.families || [])

const validatedBySection = computed(() =>
  Object.fromEntries(props.validated.map(v => [v.section_index, v]))
)

// ── Labels humains ────────────────────────────────────────────────────────────

const BLOOM_FR = {
  Remember: 'Mémoriser', Understand: 'Comprendre', Apply: 'Appliquer',
  Analyze: 'Analyser', Evaluate: 'Évaluer', Create: 'Concevoir'
}

function bloomFr(b) { return BLOOM_FR[b] || b || '' }

const bloomLabel = computed(() => bloomFr(props.swot?.meta?.bloom))

function familyLabel(fam) {
  return { FM1: 'Méthodes', FM2: 'Dispositifs outillés', FM3: 'Tuteur IA', FM4: 'IA généraliste' }[fam] || fam
}

function functionLabel(fn) {
  return { F: 'Formative', S: 'Sommative', FS: 'F+S', R: 'Recherche' }[fn] || fn
}

function sourceLabel(src) {
  if (src === 'combo')         return 'Recommandation personnalisée'
  if (src === 'combo-approche') return 'Proche de votre profil'
  return 'Suggestion générale'
}

function efficaciteNum(tool) {
  return { 'Validée': 3, 'Établie': 2, 'Émergente': 1 }[tool?.efficacite] || 1
}

// ── Texte synthétique "En bref" ───────────────────────────────────────────────

const summaryText = computed(() => {
  const zones = detectedZones.value
  const bloom = props.swot?.meta?.bloom
  const r     = globalRec.value

  if (!zones.length) {
    return "Trop peu de notions ont été identifiées pour établir un profil. Vérifiez les classifications dans l'étape précédente."
  }

  const zoneStr = zones.length > 1
    ? zones.slice(0, -1).join(', ') + ' et ' + zones[zones.length - 1]
    : zones[0]

  let text = `Ce cours couvre principalement ${zones.length > 1 ? 'les zones' : 'la zone'} ${zoneStr}`
  if (bloom) text += `, avec un accent cognitif sur « ${bloomFr(bloom)} »`
  text += '.'

  const riskLower = (r.risk || '').toLowerCase()
  if (riskLower === 'maximal') {
    text += " La syntaxe est une zone à fort risque de délégation à l'IA : prévoyez des évaluations qui vérifient la compréhension réelle de chaque étudiant."
  } else if (riskLower.includes('elev') || riskLower.includes('éle')) {
    text += " Certaines notions présentent un risque notable de délégation à l'IA : une vigilance pédagogique est recommandée."
  } else if (r.risk) {
    text += " Le profil de risque IA est modéré et maîtrisable avec de bonnes pratiques d'évaluation."
  }

  return text
})

// Outils phares : levers de globalRec en priorité, sinon premier combo
const keyTools = computed(() => {
  const levers = globalRec.value.levers || []
  if (levers.length) return levers.slice(0, 3)
  return (props.swot.opportunites?.[0]?.tools || []).slice(0, 3)
})

// ── Classes CSS ───────────────────────────────────────────────────────────────

function familyClass(fam) {
  return {
    'ui-badge--family-m': fam === 'FM1',
    'ui-badge--family-t': fam === 'FM2',
    'ui-badge--family-i': fam === 'FM3',
    'ui-badge--family-a': fam === 'FM4'
  }
}

function sourceBadgeClass(src) {
  if (src === 'combo')         return 'ui-badge--source-exact'
  if (src === 'combo-approche') return 'ui-badge--source-approche'
  return 'ui-badge--source-matrix'
}

// ── Helpers section ───────────────────────────────────────────────────────────

function sectionTitle(idx) {
  return props.sections.find(s => s.index === idx)?.title || `Section ${idx + 1}`
}

function patronsForSectionConcept(sectionIndex, conceptId) {
  const ctx = validatedBySection.value[sectionIndex]?.context
  return getPatronsByConceptAndContext(conceptId, ctx)
}
</script>

<style scoped>
/* === Document hors programmation === */
.not-prog {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 560px;
}
.np-title {
  font-size: var(--text-xl);
  font-weight: 800;
  color: var(--color-text);
}
.np-text {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* === Conteneur principal === */
.audit {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* === En-tête === */
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

/* === En bref === */
.brief {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.brief-title {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--color-text);
}

.brief-text {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.7;
}

.brief-subtitle {
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-faint);
}

.brief-levers {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.brief-lever {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}

.bl-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
}

/* === Aperçu visuel === */
.overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.overview-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.ov-chip {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.55rem 0.85rem;
  min-width: 100px;
}

.ov-chip-num {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
}

.ov-chip-label {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

/* === SWOT teaser (slot summary de DisclosureCard) === */
.swot-teaser {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.swot-teaser-text {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.swot-counts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.swot-count {
  font-size: var(--text-2xs);
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-pill);
}

.swot-count--force       { background: var(--color-success-bg); color: var(--color-success-text); }
.swot-count--faiblesse   { background: var(--color-warning-bg); color: var(--color-warning-text); }
.swot-count--risque      { background: var(--color-danger-bg);  color: var(--color-danger-text);  }
.swot-count--opportunite { background: var(--color-info-bg);    color: var(--color-info-text);    }

/* === SWOT grid (inside DisclosureCard details) === */
.swot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding-top: var(--space-2);
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

.quad-title { font-size: var(--text-md); font-weight: 800; }
.swot-quadrant--forces .quad-title       { color: var(--color-success-text); }
.swot-quadrant--faiblesses .quad-title   { color: var(--color-warning-text); }
.swot-quadrant--risques .quad-title      { color: var(--color-danger-text);  }
.swot-quadrant--opportunites .quad-title { color: var(--color-info-text);    }

.quad-desc {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
  line-height: 1.5;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}

.quad-empty { font-size: var(--text-sm); color: var(--color-text-placeholder); font-style: italic; }

.quad-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.6rem 0.75rem;
  background: var(--color-surface);
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
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  color: var(--color-text-muted);
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

/* === Recommandations par section === */
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
</style>
