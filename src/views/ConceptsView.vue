<template>
  <div class="concepts">
    <div class="page-header">
      <h1>Concepts pedagogiques</h1>
      <p>{{ concepts.length }} sous-concepts en {{ families.length }} familles, avec outils de reference issus de la matrice.</p>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Famille</label>
        <select v-model="selectedFamily" class="filter-select">
          <option value="">Toutes</option>
          <option v-for="f in families" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Niveau Bloom</label>
        <select v-model="selectedBloom" class="filter-select">
          <option value="">Tous</option>
          <option v-for="b in bloomLevels" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Risque IA</label>
        <select v-model="selectedRisk" class="filter-select">
          <option value="">Tous</option>
          <option value="Maximal">Maximal</option>
          <option value="Eleve">Eleve</option>
          <option value="Modere">Modere</option>
        </select>
      </div>
      <button v-if="hasFilters" class="reset-btn" @click="resetFilters">Reinitialiser</button>
    </div>

    <template v-for="fam in visibleFamilies" :key="fam.id">
      <section class="family-section" :class="'family-section--' + fam.id.toLowerCase()">
        <div class="family-header">
          <div class="family-title-row">
            <h2>{{ fam.name }}</h2>
            <span class="risk-badge" :class="riskClass(fam.risk_ai)">
              Risque IA {{ fam.risk_ai }}
            </span>
            <span class="concept-count">{{ fam.concepts.length }} concept{{ fam.concepts.length > 1 ? 's' : '' }}</span>
          </div>
          <p class="family-description">{{ fam.description }}</p>
        </div>

        <div class="concepts-grid">
          <article
            v-for="concept in fam.concepts"
            :key="concept.id"
            class="concept-card"
          >
            <div class="concept-header">
              <span class="concept-id">{{ concept.id }}</span>
              <span class="concept-year">{{ concept.year }}</span>
            </div>

            <h3 class="concept-name">{{ concept.name }}</h3>
            <p class="concept-desc">{{ concept.description }}</p>

            <div class="concept-bloom">
              <span v-for="b in concept.bloom" :key="b" class="bloom-tag" :class="bloomClass(b)">{{ b }}</span>
            </div>

            <div class="concept-fuller">
              <span class="fuller-label">Fuller :</span>
              <span class="fuller-value">{{ concept.fuller }}</span>
            </div>

            <div v-if="topTools(concept.id).length" class="concept-tools">
              <span class="tools-label">Outils de reference</span>
              <div class="tools-list">
                <span
                  v-for="entry in topTools(concept.id)"
                  :key="entry.toolId"
                  class="tool-ref"
                  :class="entry.score === 3 ? 'tool-ref--ideal' : 'tool-ref--utile'"
                  :title="toolName(entry.toolId) + (entry.score === 3 ? ' — Ideal' : ' — Utile')"
                >
                  {{ entry.toolId }}
                </span>
              </div>
            </div>

            <div v-if="concept.references" class="concept-refs">
              {{ concept.references }}
            </div>
          </article>
        </div>
      </section>
    </template>

    <div v-if="visibleFamilies.length === 0" class="empty-state">
      Aucun concept ne correspond aux filtres selectionnes.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData.js'

const { concepts, tools, matrix } = useData()

const selectedFamily = ref('')
const selectedBloom = ref('')
const selectedRisk = ref('')

const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

const hasFilters = computed(() =>
  selectedFamily.value !== '' || selectedBloom.value !== '' || selectedRisk.value !== ''
)

function resetFilters() {
  selectedFamily.value = ''
  selectedBloom.value = ''
  selectedRisk.value = ''
}

// Map concept_id -> [{toolId, score}] sorted by score desc, score >= 2
const matrixMap = computed(() => {
  const map = {}
  matrix.cells.forEach(cell => {
    if (cell.score < 2) return
    if (!map[cell.concept]) map[cell.concept] = []
    map[cell.concept].push({ toolId: cell.tool, score: cell.score })
  })
  Object.values(map).forEach(arr => arr.sort((a, b) => b.score - a.score))
  return map
})

const toolNameMap = Object.fromEntries(tools.map(t => [t.id, t.name]))

function topTools(conceptId) {
  return (matrixMap.value[conceptId] || []).slice(0, 5)
}

function toolName(id) {
  return toolNameMap[id] || id
}

// Group concepts by family, apply filters
const families = computed(() => {
  const famMap = {}
  concepts.forEach(c => {
    if (!famMap[c.family_id]) {
      famMap[c.family_id] = {
        id: c.family_id,
        name: c.family,
        description: c.family_description,
        risk_ai: c.risk_ai,
        concepts: []
      }
    }
    famMap[c.family_id].concepts.push(c)
  })
  return Object.values(famMap)
})

const visibleFamilies = computed(() => {
  return families.value
    .map(fam => {
      const filtered = fam.concepts.filter(c => {
        if (selectedBloom.value && !c.bloom.includes(selectedBloom.value)) return false
        if (selectedRisk.value && c.risk_ai !== selectedRisk.value) return false
        return true
      })
      return { ...fam, concepts: filtered }
    })
    .filter(fam => {
      if (selectedFamily.value && fam.id !== selectedFamily.value) return false
      return fam.concepts.length > 0
    })
})

function riskClass(risk) {
  if (risk === 'Maximal') return 'risk--max'
  if (risk === 'Eleve') return 'risk--high'
  return 'risk--mod'
}

function bloomClass(b) {
  const map = {
    Remember: 'bloom--remember',
    Understand: 'bloom--understand',
    Apply: 'bloom--apply',
    Analyze: 'bloom--analyze',
    Evaluate: 'bloom--evaluate',
    Create: 'bloom--create'
  }
  return map[b] || ''
}
</script>

<style scoped>
.concepts {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

.filter-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.65rem;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  min-width: 160px;
  outline: none;
  transition: border-color 0.15s;
}

.filter-select:focus { border-color: #2563eb; background: #ffffff; }

.reset-btn {
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  align-self: flex-end;
}

.reset-btn:hover { background: #e2e8f0; }

/* Family sections */
.family-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.family-header {
  padding: 1.25rem 1.5rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.family-section--f1 .family-header { background: #eff6ff; border: 1px solid #bfdbfe; }
.family-section--f2 .family-header { background: #fff7ed; border: 1px solid #fed7aa; }
.family-section--f3 .family-header { background: #f0fdf4; border: 1px solid #bbf7d0; }

.family-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.family-title-row h2 {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
}

.family-section--f1 .family-title-row h2 { color: #1e40af; }
.family-section--f2 .family-title-row h2 { color: #9a3412; }
.family-section--f3 .family-title-row h2 { color: #166534; }

.risk-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.risk--max { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.risk--high { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
.risk--mod { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

.concept-count {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: auto;
}

.family-description {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
}

/* Concept cards grid */
.concepts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.concept-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: box-shadow 0.15s;
}

.concept-card:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.concept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.concept-id {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  font-family: monospace;
}

.concept-year {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.concept-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.concept-desc {
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.5;
  flex: 1;
}

.concept-bloom {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.bloom-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
}

.bloom--remember  { background: #dbeafe; color: #1e40af; }
.bloom--understand { background: #ede9fe; color: #5b21b6; }
.bloom--apply     { background: #d1fae5; color: #065f46; }
.bloom--analyze   { background: #fef3c7; color: #92400e; }
.bloom--evaluate  { background: #ffedd5; color: #9a3412; }
.bloom--create    { background: #fce7f3; color: #9d174d; }

.concept-fuller {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  font-size: 0.75rem;
}

.fuller-label {
  font-weight: 600;
  color: #64748b;
}

.fuller-value {
  color: #475569;
}

.concept-tools {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.4rem;
  border-top: 1px solid #f1f5f9;
}

.tools-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tools-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tool-ref {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  cursor: default;
}

.tool-ref--ideal { background: #1e293b; color: #f8fafc; }
.tool-ref--utile { background: #e2e8f0; color: #475569; }

.concept-refs {
  font-size: 0.72rem;
  color: #94a3b8;
  font-style: italic;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 3rem;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}
</style>
