<template>
  <div class="catalogue">
    <div class="ui-page-header">
      <h1>Catalogue des outils</h1>
      <p>{{ filtered.length }} outil{{ filtered.length !== 1 ? 's' : '' }} affiché{{ filtered.length !== 1 ? 's' : '' }} sur {{ tools.length }}</p>
    </div>

    <!-- Filtres principaux -->
    <div class="ui-filter-bar">
      <div class="ui-filter-group">
        <label>Recherche</label>
        <input v-model="search" type="text" placeholder="Nom ou description..." class="ui-filter-input" />
      </div>

      <div class="ui-filter-group">
        <label>Famille</label>
        <select v-model="selectedFamily" class="ui-filter-select">
          <option value="">Toutes les familles</option>
          <option v-for="f in families" :key="f.id" :value="f.id">{{ f.label }}</option>
        </select>
      </div>

      <button v-if="hasFilters" class="ui-reset-btn" @click="resetFilters">Réinitialiser</button>
    </div>

    <!-- Filtres avancés (repliables) -->
    <details class="ui-collapsible advanced-filters">
      <summary>Filtres avancés (Fonction, Coût, Robustesse IA, Fil rouge)</summary>
      <div class="ui-collapsible-body advanced-body">
        <div class="ui-filter-group">
          <label>Fonction <InfoTooltip :content="GLOSSARY.fonction.short" /></label>
          <select v-model="selectedFunction" class="ui-filter-select">
            <option value="">Toutes</option>
            <option value="F">Formative</option>
            <option value="S">Sommative</option>
            <option value="FS">Formative + Sommative</option>
          </select>
        </div>

        <div class="ui-filter-group">
          <label>Coût enseignant <InfoTooltip :content="GLOSSARY.cout.short" /></label>
          <select v-model="selectedCost" class="ui-filter-select">
            <option value="">Tous</option>
            <option value="1">Faible (1/3)</option>
            <option value="2">Modéré (2/3)</option>
            <option value="3">Élevé (3/3)</option>
          </select>
        </div>

        <div class="ui-filter-group">
          <label>Robustesse IA <InfoTooltip :content="GLOSSARY.robustesse_ia.short" /></label>
          <select v-model="selectedRobustness" class="ui-filter-select">
            <option value="">Toutes</option>
            <option value="0">Nulle</option>
            <option value="1">Faible</option>
            <option value="2">Modérée</option>
            <option value="3">Élevée</option>
            <option value="4">Très élevée</option>
          </select>
        </div>

        <div class="ui-filter-group">
          <label>Fil rouge <InfoTooltip :content="GLOSSARY.fil_rouge.short" /></label>
          <select v-model="selectedFil" class="ui-filter-select">
            <option value="">Tous</option>
            <option v-for="f in meta.fils_rouges" :key="f.id" :value="f.id">{{ f.id }} : {{ f.label }}</option>
          </select>
        </div>
      </div>
    </details>

    <div v-if="filtered.length === 0" class="ui-empty-state">
      Aucun outil ne correspond aux filtres sélectionnés.
    </div>

    <!-- Liste de DisclosureCard, une par outil -->
    <div v-else class="tools-list">
      <DisclosureCard
        v-for="tool in filtered"
        :key="tool.id"
        details-label="Détails et usage"
        deep-label="Sources et littérature"
      >

        <!-- Niveau 1 : id + famille + nom + description + efficacité -->
        <template #summary>
          <div class="ts-header">
            <span class="ts-id">{{ tool.id }}</span>
            <span class="ui-badge" :class="familyClass(tool)">{{ familyShort(tool) }}</span>
          </div>
          <p class="ts-name">{{ tool.name }}</p>
          <p class="ts-desc">{{ tool.description }}</p>
          <span v-if="tool.efficacite" class="ui-badge" :class="efficaciteClass(tool)">{{ tool.efficacite }}</span>
        </template>

        <!-- Niveau 2 : détail textuel, attributs, scénarios, fils rouges, lien -->
        <template #details>
          <div class="td-body">

            <!-- Profil visuel : 3 jauges (niveau de preuve, robustesse IA, coût enseignant) -->
            <div class="metric-profile">
              <MetricGauge
                label="Niveau de preuve"
                :value="EFFICACITE_VALUE[tool.efficacite] ?? 0"
                :max="3"
                :value-label="tool.efficacite ?? '—'"
                variant="ramp"
              />
              <MetricGauge
                label="Robustesse aux dérives IA"
                :value="tool.robustness_num ?? 0"
                :max="4"
                :value-label="baseName(tool.robustness_ai)"
              />
              <MetricGauge
                label="Coût enseignant (magnitude)"
                :value="tool.cost_num ?? 0"
                :max="3"
                :value-label="baseName(tool.cost_teacher)"
              />
            </div>

            <div v-if="tool.detail" class="td-detail">
              <p>{{ tool.detail }}</p>
            </div>

            <div class="td-attrs">
              <div class="td-row">
                <span class="td-label">Fonction</span>
                <span class="ui-badge" :class="functionClass(tool)">{{ functionLabel(tool) }}</span>
              </div>
              <div class="td-row">
                <span class="td-label">Séquencement conseillé</span>
                <span class="td-val">{{ tool.cursus }}</span>
              </div>
              <div class="td-row">
                <span class="td-label">Coût étudiant</span>
                <span class="td-val">{{ tool.cost_student }}</span>
              </div>
              <div v-if="tool.cyberlearn && tool.cyberlearn !== 'Non applicable'" class="td-row">
                <span class="td-label">Cyberlearn</span>
                <span class="td-val">{{ tool.cyberlearn }}</span>
              </div>
            </div>

            <div v-if="resolvedScenarios(tool).length" class="td-section">
              <h4 class="td-section-title">Scénarios</h4>
              <div class="td-items">
                <div v-for="s in resolvedScenarios(tool)" :key="s.id" class="td-item">
                  <strong>{{ s.label }}</strong>
                  <p>{{ s.description }}</p>
                </div>
              </div>
            </div>

            <div v-if="tool.fils_rouges && tool.fils_rouges.length" class="td-section">
              <h4 class="td-section-title">Fils rouges</h4>
              <div class="td-items">
                <div v-for="fil in resolvedFils(tool)" :key="fil.id" class="td-item td-fil">
                  <span class="ui-badge" :class="filClass(fil.id)">{{ fil.id }}</span>
                  <div>
                    <strong>{{ fil.label }}</strong>
                    <p>{{ fil.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <a
              v-if="tool.link"
              :href="tool.link"
              target="_blank"
              rel="noopener noreferrer"
              class="ui-btn ui-btn-primary td-link-btn"
            >
              Voir la ressource
              <span class="td-link-domain">{{ linkDomain(tool) }}</span>
            </a>

          </div>
        </template>

        <!-- Niveau 3 : sources bibliographiques -->
        <template #deep>
          <p v-if="tool.sources" class="td-sources">{{ tool.sources }}</p>
          <p v-else class="td-sources-empty">Aucune référence documentée pour cet outil.</p>
        </template>

      </DisclosureCard>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData.js'
import DisclosureCard from '../components/DisclosureCard.vue'
import InfoTooltip from '../components/InfoTooltip.vue'
import MetricGauge from '../components/MetricGauge.vue'
import { GLOSSARY } from '../lib/glossary.js'

const EFFICACITE_VALUE = { 'Validée': 3, 'Établie': 2, 'Émergente': 1 }

const { tools, meta } = useData()

const filMap      = Object.fromEntries((meta.fils_rouges || []).map(f => [f.id, f]))
const scenarioMap = Object.fromEntries((meta.scenarios   || []).map(s => [s.id, s]))

const search             = ref('')
const selectedFamily     = ref('')
const selectedFunction   = ref('')
const selectedCost       = ref('')
const selectedRobustness = ref('')
const selectedFil        = ref('')

const families = [
  { id: 'FM1', label: 'Méthodes pédagogiques traditionnelles' },
  { id: 'FM2', label: 'Dispositifs traditionnels outillés' },
  { id: 'FM3', label: 'Tuteurs IA et dispositifs scaffoldés' },
  { id: 'FM4', label: 'Outils agentiques et IA généraliste' }
]

const hasFilters = computed(() =>
  search.value !== '' || selectedFamily.value !== '' ||
  selectedFunction.value !== '' || selectedCost.value !== '' ||
  selectedRobustness.value !== '' || selectedFil.value !== ''
)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return tools.filter(t => {
    if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
    if (selectedFamily.value && t.family !== selectedFamily.value) return false
    if (selectedFunction.value && t.function !== selectedFunction.value) return false
    if (selectedCost.value && String(t.cost_num) !== selectedCost.value) return false
    if (selectedRobustness.value !== '' && String(t.robustness_num) !== selectedRobustness.value) return false
    if (selectedFil.value && !(t.fils_rouges || []).includes(selectedFil.value)) return false
    return true
  })
})

function resetFilters() {
  search.value = ''; selectedFamily.value = ''; selectedFunction.value = ''
  selectedCost.value = ''; selectedRobustness.value = ''; selectedFil.value = ''
}

/* Helpers display - même logique que ToolCard/ToolDetailModal */
function familyShort(tool) {
  const labels = { FM1: 'Traditionnel', FM2: 'Outillé', FM3: 'Tuteur IA', FM4: 'IA généraliste' }
  return labels[tool.family] || tool.family_label
}

function familyClass(tool) {
  return {
    'ui-badge--family-m': tool.family === 'FM1',
    'ui-badge--family-t': tool.family === 'FM2',
    'ui-badge--family-i': tool.family === 'FM3',
    'ui-badge--family-a': tool.family === 'FM4'
  }
}

function functionLabel(tool) {
  const map = { F: 'Formative', S: 'Sommative', FS: 'Formative + Sommative', R: 'Recherche' }
  return map[tool.function] || tool.function
}

function functionClass(tool) {
  return {
    'ui-badge--fn-f':  tool.function === 'F',
    'ui-badge--fn-s':  tool.function === 'S',
    'ui-badge--fn-fs': tool.function === 'FS'
  }
}

function robustnessShort(tool) {
  const n = tool.robustness_num
  if (n === 0) return 'Rob. nulle'
  if (n === 1) return 'Rob. faible'
  if (n === 2) return 'Rob. modérée'
  if (n === 3) return 'Rob. élevée'
  if (n === 4) return 'Rob. très élevée'
  return ''
}

function robustnessClass(tool) {
  const n = tool.robustness_num
  if (n <= 1) return 'ui-badge--rob-low'
  if (n === 2) return 'ui-badge--rob-mid'
  if (n === 3) return 'ui-badge--rob-high'
  return 'ui-badge--rob-max'
}

function efficaciteClass(tool) {
  return {
    'ui-badge--efficacite-validee':   tool.efficacite === 'Validée',
    'ui-badge--efficacite-etablie':   tool.efficacite === 'Établie',
    'ui-badge--efficacite-emergente': tool.efficacite === 'Émergente'
  }
}

function filClass(fil) {
  return {
    'ui-badge--fil-a': fil === 'Fil A',
    'ui-badge--fil-b': fil === 'Fil B',
    'ui-badge--fil-c': fil === 'Fil C',
    'ui-badge--fil-d': fil === 'Fil D'
  }
}

function resolvedFils(tool) {
  return (tool.fils_rouges || []).map(id => filMap[id] || { id, label: id, description: '' })
}

function resolvedScenarios(tool) {
  return (tool.scenarios || []).map(id => scenarioMap[id]).filter(Boolean)
}

function linkDomain(tool) {
  try { return new URL(tool.link || '').hostname.replace('www.', '') } catch { return '' }
}

function baseName(str) {
  return (str || '').split('(')[0].trim()
}
</script>

<style scoped>
.catalogue {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Filtres avancés */
.advanced-body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
}

/* Liste d'outils (une colonne) */
.tools-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Niveau 1 : summary ── */
.ts-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.ts-id {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-placeholder);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

.ts-name {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.ts-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* ── Niveau 2 : details ── */

/* Profil visuel à 3 jauges */
.metric-profile {
  display: flex;
  gap: var(--space-5);
  flex-wrap: wrap;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.td-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.td-detail {
  background: var(--color-accent-subtle);
  border-left: 3px solid var(--color-accent);
  padding: 0.85rem var(--space-4);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.65;
}

.td-attrs {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.td-row {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  font-size: var(--text-base);
  flex-wrap: wrap;
}

.td-label {
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 160px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.td-val { color: var(--color-text); }

.td-section { display: flex; flex-direction: column; gap: 0.6rem; }

.td-section-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.3rem;
}

.td-items { display: flex; flex-direction: column; gap: 0.6rem; }

.td-item {
  font-size: var(--text-sm);
  line-height: 1.5;
}
.td-item strong {
  display: block;
  font-size: var(--text-base);
  color: var(--color-text);
  margin-bottom: 0.15rem;
}
.td-item p { color: var(--color-text-muted); }

.td-fil {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.td-link-btn { align-self: flex-start; }

.td-link-domain {
  font-size: var(--text-2xs);
  color: var(--color-text-placeholder);
  font-weight: 400;
}

/* ── Niveau 3 : deep ── */
.td-sources {
  font-size: var(--text-sm);
  color: var(--color-text-faint);
  font-style: italic;
  line-height: 1.6;
}

.td-sources-empty {
  font-size: var(--text-sm);
  color: var(--color-text-placeholder);
  font-style: italic;
}

@media (max-width: 640px) {
  .td-label { min-width: 120px; }
  .metric-profile { flex-direction: column; gap: var(--space-3); }
}
</style>
