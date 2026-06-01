<template>
  <div class="patron-block">
    <div class="patron-header">
      <span class="patron-badge">Patron pedagogique</span>
      <span v-if="patron.contexte" class="contexte-tag" :class="contexteClass(patron.contexte)">
        {{ patron.contexte }}
      </span>
      <span v-for="ph in patron.phase_couverte" :key="ph" class="phase-tag" :class="phaseClass(ph)">
        {{ ph }}
      </span>
      <span class="patron-id">{{ patron.id }}</span>
    </div>

    <h4 class="patron-titre">{{ patron.titre }}</h4>
    <p class="patron-competence">{{ patron.competence }}</p>

    <div class="patron-fields">
      <div class="patron-field">
        <span class="pf-label">Activite</span>
        <p class="pf-text">{{ patron.activite }}</p>
      </div>
      <div class="patron-field patron-field--risk">
        <span class="pf-label pf-label--risk">Risque IA</span>
        <p class="pf-text">{{ patron.risque_ia }}</p>
      </div>
      <div class="patron-field">
        <span class="pf-label">Parade</span>
        <p class="pf-text">{{ patron.parade }}</p>
      </div>
      <div class="patron-field">
        <span class="pf-label">Evaluation</span>
        <p class="pf-text">{{ patron.evaluation }}</p>
      </div>
    </div>

    <div v-if="resolvedTools.length" class="patron-outils">
      <span class="pf-label">Outils</span>
      <div class="patron-outils-list">
        <button
          v-for="tool in resolvedTools"
          :key="tool.id"
          class="patron-tool-btn"
          :title="tool.description"
          @click="selectedTool = tool"
        >
          <span class="ptb-id">{{ tool.id }}</span>
          <span class="ptb-name">{{ tool.name }}</span>
        </button>
      </div>
    </div>

    <p v-if="patron.references" class="patron-refs">{{ patron.references }}</p>

    <ToolDetailModal :tool="selectedTool" @close="selectedTool = null" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData.js'
import ToolDetailModal from './ToolDetailModal.vue'

const props = defineProps({
  patron: { type: Object, required: true }
})

const { tools } = useData()
const toolMap = Object.fromEntries(tools.map(t => [t.id, t]))

const resolvedTools = computed(() =>
  (props.patron.outils || []).map(id => toolMap[id]).filter(Boolean)
)

const selectedTool = ref(null)

function phaseClass(ph) {
  return {
    'phase--apprendre': ph === 'apprendre',
    'phase--exercer': ph === 'exercer',
    'phase--evaluer': ph === 'évaluer'
  }
}

function contexteClass(ctx) {
  return {
    'ctx--presentiel': ctx === 'Présentiel encadré',
    'ctx--autonomie':  ctx === 'Autonomie supervisée',
    'ctx--projet':     ctx === 'Projet long',
    'ctx--diagnostic': ctx === 'Diagnostic'
  }
}
</script>

<style scoped>
.patron-block {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.patron-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.patron-badge {
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.contexte-tag {
  font-size: 0.67rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: 3px;
}

.ctx--presentiel  { background: #dbeafe; color: #1e40af; }
.ctx--autonomie   { background: #d1fae5; color: #065f46; }
.ctx--projet      { background: #ede9fe; color: #5b21b6; }
.ctx--diagnostic  { background: #ffedd5; color: #9a3412; }

.phase-tag {
  font-size: 0.67rem;
  font-weight: 700;
  padding: 0.12rem 0.4rem;
  border-radius: 3px;
}

.phase--apprendre { background: #dbeafe; color: #1e40af; }
.phase--exercer   { background: #d1fae5; color: #065f46; }
.phase--evaluer   { background: #fce7f3; color: #9d174d; }

.patron-id {
  margin-left: auto;
  font-size: 0.68rem;
  font-family: monospace;
  color: #a78bfa;
}

.patron-titre {
  font-size: 0.9rem;
  font-weight: 700;
  color: #78350f;
  line-height: 1.3;
}

.patron-competence {
  font-size: 0.82rem;
  color: #92400e;
  font-style: italic;
  line-height: 1.5;
  padding: 0.4rem 0.6rem;
  background: rgba(254, 243, 199, 0.6);
  border-radius: 4px;
}

.patron-fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.patron-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.patron-field--risk .pf-text {
  color: #b91c1c;
}

.pf-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #92400e;
}

.pf-label--risk {
  color: #b91c1c;
}

.pf-text {
  font-size: 0.8rem;
  color: #44403c;
  line-height: 1.55;
}

.patron-outils {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.patron-outils-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.patron-tool-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #1e293b;
  color: #f8fafc;
  border: none;
  border-radius: 5px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 0.75rem;
}

.patron-tool-btn:hover {
  background: #334155;
}

.ptb-id {
  font-family: monospace;
  font-weight: 700;
}

.ptb-name {
  font-weight: 400;
  color: #94a3b8;
}

.patron-refs {
  font-size: 0.7rem;
  color: #a78bfa;
  font-style: italic;
  line-height: 1.4;
}
</style>
