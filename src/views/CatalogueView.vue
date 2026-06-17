<template>
  <div class="catalogue">
    <div class="ui-page-header">
      <h1>Catalogue des outils</h1>
      <p>{{ filtered.length }} outil{{ filtered.length !== 1 ? 's' : '' }} affiche{{ filtered.length !== 1 ? 's' : '' }} sur {{ tools.length }}</p>
    </div>

    <!-- Filtres principaux (toujours visibles) -->
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

      <button v-if="hasFilters" class="ui-reset-btn" @click="resetFilters">Reinitialiser</button>
    </div>

    <!-- Filtres avances (repliables) -->
    <details class="ui-collapsible advanced-filters">
      <summary>Filtres avances (Fonction, Cout, Robustesse IA, Fil rouge)</summary>
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
          <label>Cout enseignant <InfoTooltip :content="GLOSSARY.cout.short" /></label>
          <select v-model="selectedCost" class="ui-filter-select">
            <option value="">Tous</option>
            <option value="1">Faible (1/3)</option>
            <option value="2">Modere (2/3)</option>
            <option value="3">Eleve (3/3)</option>
          </select>
        </div>

        <div class="ui-filter-group">
          <label>Robustesse IA <InfoTooltip :content="GLOSSARY.robustesse_ia.short" /></label>
          <select v-model="selectedRobustness" class="ui-filter-select">
            <option value="">Toutes</option>
            <option value="0">Nulle</option>
            <option value="1">Faible</option>
            <option value="2">Moderee</option>
            <option value="3">Elevee</option>
            <option value="4">Tres elevee</option>
          </select>
        </div>

        <div class="ui-filter-group">
          <label>Fil rouge <InfoTooltip :content="GLOSSARY.fil_rouge.short" /></label>
          <select v-model="selectedFil" class="ui-filter-select">
            <option value="">Tous</option>
            <option v-for="f in meta.fils_rouges" :key="f.id" :value="f.id">{{ f.id }} — {{ f.label }}</option>
          </select>
        </div>
      </div>
    </details>

    <div v-if="filtered.length === 0" class="ui-empty-state">
      Aucun outil ne correspond aux filtres selectionnes.
    </div>

    <div v-else class="tools-grid">
      <ToolCard
        v-for="tool in filtered"
        :key="tool.id"
        :tool="tool"
        :clickable="true"
        @open="openModal"
      />
    </div>

    <ToolDetailModal :tool="selectedTool" @close="selectedTool = null" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData.js'
import ToolCard from '../components/ToolCard.vue'
import ToolDetailModal from '../components/ToolDetailModal.vue'
import InfoTooltip from '../components/InfoTooltip.vue'
import { GLOSSARY } from '../lib/glossary.js'

const { tools, meta } = useData()

const search             = ref('')
const selectedFamily     = ref('')
const selectedFunction   = ref('')
const selectedCost       = ref('')
const selectedRobustness = ref('')
const selectedFil        = ref('')
const selectedTool       = ref(null)

const families = [
  { id: 'FM1', label: 'Methodes pedagogiques traditionnelles' },
  { id: 'FM2', label: 'Dispositifs traditionnels outilles' },
  { id: 'FM3', label: 'Tuteurs IA et dispositifs scaffoldes' },
  { id: 'FM4', label: 'Outils agentiques et IA generaliste' }
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

function openModal(tool) { selectedTool.value = tool }
</script>

<style scoped>
.catalogue {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Contenu du bloc filtres avances */
.advanced-body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5);
}

@media (max-width: 640px) {
  .tools-grid { grid-template-columns: 1fr; }
}
</style>
