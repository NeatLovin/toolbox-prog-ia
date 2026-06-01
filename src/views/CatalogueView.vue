<template>
  <div class="catalogue">
    <div class="page-header">
      <h1>Catalogue des outils</h1>
      <p>{{ filtered.length }} outil{{ filtered.length !== 1 ? 's' : '' }} affiche{{ filtered.length !== 1 ? 's' : '' }} sur {{ tools.length }}</p>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Recherche</label>
        <input v-model="search" type="text" placeholder="Nom ou description..." class="filter-input" />
      </div>

      <div class="filter-group">
        <label>Famille</label>
        <select v-model="selectedFamily" class="filter-select">
          <option value="">Toutes les familles</option>
          <option v-for="f in families" :key="f.id" :value="f.id">{{ f.label }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Fonction</label>
        <select v-model="selectedFunction" class="filter-select">
          <option value="">Toutes</option>
          <option value="F">Formative</option>
          <option value="S">Sommative</option>
          <option value="FS">Formative + Sommative</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Cout enseignant</label>
        <select v-model="selectedCost" class="filter-select">
          <option value="">Tous</option>
          <option value="1">Faible (1/3)</option>
          <option value="2">Modere (2/3)</option>
          <option value="3">Eleve (3/3)</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Robustesse IA</label>
        <select v-model="selectedRobustness" class="filter-select">
          <option value="">Toutes</option>
          <option value="0">Nulle</option>
          <option value="1">Faible</option>
          <option value="2">Moderee</option>
          <option value="3">Elevee</option>
          <option value="4">Tres elevee</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Fil rouge</label>
        <select v-model="selectedFil" class="filter-select">
          <option value="">Tous</option>
          <option v-for="f in meta.fils_rouges" :key="f.id" :value="f.id">{{ f.id }} — {{ f.label }}</option>
        </select>
      </div>

      <button v-if="hasFilters" class="reset-btn" @click="resetFilters">Reinitialiser</button>
    </div>

    <div v-if="filtered.length === 0" class="empty-state">
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

const { tools, meta } = useData()

const search = ref('')
const selectedFamily = ref('')
const selectedFunction = ref('')
const selectedCost = ref('')
const selectedRobustness = ref('')
const selectedFil = ref('')
const selectedTool = ref(null)

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
  search.value = ''
  selectedFamily.value = ''
  selectedFunction.value = ''
  selectedCost.value = ''
  selectedRobustness.value = ''
  selectedFil.value = ''
}

function openModal(tool) {
  selectedTool.value = tool
}
</script>

<style scoped>
.catalogue {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
}

.page-header p {
  font-size: 0.875rem;
  color: #64748b;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-input,
.filter-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.65rem;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  min-width: 170px;
  outline: none;
  transition: border-color 0.15s;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #2563eb;
  background: #ffffff;
}

.reset-btn {
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  align-self: flex-end;
}

.reset-btn:hover {
  background: #e2e8f0;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 3rem;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}
</style>
