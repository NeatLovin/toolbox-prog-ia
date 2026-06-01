<template>
  <Teleport to="body">
    <div v-if="tool" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" :aria-label="tool.name">
        <button class="modal-close" @click="$emit('close')" aria-label="Fermer">&times;</button>

        <div class="modal-header">
          <div class="modal-id-row">
            <span class="tool-id">{{ tool.id }}</span>
            <span class="tool-family" :class="familyClass">{{ tool.family_label }}</span>
            <span v-if="tool.robustness_num !== null && tool.robustness_num !== undefined"
                  class="rob-badge" :class="robustnessClass">
              {{ tool.robustness_ai }}
            </span>
          </div>
          <h2 class="modal-title">{{ tool.name }}</h2>
          <p class="modal-desc">{{ tool.description }}</p>
        </div>

        <div v-if="tool.detail" class="detail-block">
          <p>{{ tool.detail }}</p>
        </div>

        <div class="modal-grid">
          <div class="info-row">
            <span class="info-label">Fonction</span>
            <span class="meta-badge" :class="functionClass">{{ functionLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cursus cible</span>
            <span class="info-value">{{ tool.cursus }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cout enseignant</span>
            <span class="info-value">{{ tool.cost_teacher }} ({{ tool.cost_num }}/3)</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cout etudiant</span>
            <span class="info-value">{{ tool.cost_student }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cyberlearn</span>
            <span class="info-value">{{ tool.cyberlearn }}</span>
          </div>
        </div>

        <div v-if="tool.fils_rouges && tool.fils_rouges.length" class="section">
          <h3 class="section-title">Fils rouges</h3>
          <div class="fils-list">
            <div v-for="fil in resolvedFils" :key="fil.id" class="fil-item">
              <span class="fil-badge" :class="filClass(fil.id)">{{ fil.id }}</span>
              <div>
                <strong>{{ fil.label }}</strong>
                <p>{{ fil.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="resolvedScenarios.length" class="section">
          <h3 class="section-title">Scenarios</h3>
          <div class="scenarios-list">
            <div v-for="s in resolvedScenarios" :key="s.id" class="scenario-item">
              <strong>{{ s.label }}</strong>
              <p>{{ s.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="tool.sources" class="section">
          <h3 class="section-title">Sources</h3>
          <p class="sources-text">{{ tool.sources }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useData.js'

const props = defineProps({
  tool: { type: Object, default: null }
})

defineEmits(['close'])

const { meta } = useData()

const filMap = Object.fromEntries((meta.fils_rouges || []).map(f => [f.id, f]))
const scenarioMap = Object.fromEntries((meta.scenarios || []).map(s => [s.id, s]))

const resolvedFils = computed(() =>
  (props.tool?.fils_rouges || []).map(id => filMap[id] || { id, label: id, description: '' })
)

const resolvedScenarios = computed(() =>
  (props.tool?.scenarios || [])
    .map(id => scenarioMap[id])
    .filter(Boolean)
)

function filClass(fil) {
  return {
    'fil--a': fil === 'Fil A',
    'fil--b': fil === 'Fil B',
    'fil--c': fil === 'Fil C',
    'fil--d': fil === 'Fil D'
  }
}

const familyClass = computed(() => ({
  'family--m': props.tool?.family === 'FM1',
  'family--t': props.tool?.family === 'FM2',
  'family--i': props.tool?.family === 'FM3',
  'family--a': props.tool?.family === 'FM4'
}))

const functionLabel = computed(() => {
  const map = { F: 'Formative', S: 'Sommative', FS: 'Formative + Sommative', R: 'Recherche' }
  return map[props.tool?.function] || props.tool?.function
})

const functionClass = computed(() => ({
  'badge--formative': props.tool?.function === 'F',
  'badge--sommative': props.tool?.function === 'S',
  'badge--both': props.tool?.function === 'FS'
}))

const robustnessClass = computed(() => {
  const n = props.tool?.robustness_num
  if (n <= 1) return 'rob--low'
  if (n === 2) return 'rob--mid'
  if (n === 3) return 'rob--high'
  return 'rob--max'
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  padding: 2rem;
  max-width: 680px;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.modal-close:hover {
  background: #f1f5f9;
  color: #475569;
}

.modal-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-id-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tool-id {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  font-family: monospace;
}

.tool-family {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.family--m { background: #dbeafe; color: #1e40af; }
.family--t { background: #d1fae5; color: #065f46; }
.family--i { background: #fef3c7; color: #92400e; }
.family--a { background: #fce7f3; color: #9d174d; }

.rob-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.rob--low { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.rob--mid { background: #fff7ed; color: #9a3412; border-color: #fed7aa; }
.rob--high { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
.rob--max { background: #dcfce7; color: #14532d; border-color: #86efac; }

.modal-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
  padding-right: 2rem;
}

.modal-desc {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.6;
}

.detail-block {
  background: #eff6ff;
  border-left: 3px solid #2563eb;
  padding: 0.85rem 1rem;
  border-radius: 0 6px 6px 0;
  font-size: 0.875rem;
  color: #1e3a8a;
  line-height: 1.65;
}

.modal-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.info-row {
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  font-size: 0.875rem;
}

.info-label {
  font-weight: 600;
  color: #475569;
  min-width: 130px;
  flex-shrink: 0;
}

.info-value {
  color: #1e293b;
}

.meta-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.badge--formative { background: #ecfdf5; color: #166534; border-color: #bbf7d0; }
.badge--sommative { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.badge--both { background: #f0fdf4; color: #14532d; border-color: #86efac; }

.section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.3rem;
}

.fils-list, .scenarios-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fil-item, .scenario-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.fil-item strong, .scenario-item strong {
  display: block;
  color: #1e293b;
  font-size: 0.875rem;
}

.fil-item p, .scenario-item p {
  color: #475569;
  margin-top: 0.15rem;
  font-size: 0.82rem;
  line-height: 1.5;
}

.fil-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 2px;
}

.fil--a { background: #dcfce7; color: #15803d; }
.fil--b { background: #fee2e2; color: #b91c1c; }
.fil--c { background: #ede9fe; color: #6d28d9; }
.fil--d { background: #ffedd5; color: #c2410c; }

.sources-text {
  font-size: 0.82rem;
  color: #64748b;
  font-style: italic;
}
</style>
