<template>
  <div class="patron-block">
    <div class="patron-header">
      <span class="ui-badge ui-badge--patron">Patron pedagogique</span>
      <span v-if="patron.contexte" class="ui-badge" :class="contexteClass(patron.contexte)">
        {{ patron.contexte }}
      </span>
      <span v-for="ph in patron.phase_couverte" :key="ph" class="ui-badge" :class="phaseClass(ph)">
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
        <p class="pf-text pf-text--risk">{{ patron.risque_ia }}</p>
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
    'ui-badge--phase-apprendre': ph === 'apprendre',
    'ui-badge--phase-exercer':   ph === 'exercer',
    'ui-badge--phase-evaluer':   ph === 'évaluer'
  }
}

function contexteClass(ctx) {
  return {
    'ui-badge--ctx-presentiel': ctx === 'Présentiel encadré',
    'ui-badge--ctx-autonomie':  ctx === 'Autonomie supervisée',
    'ui-badge--ctx-projet':     ctx === 'Projet long',
    'ui-badge--ctx-diagnostic': ctx === 'Diagnostic'
  }
}
</script>

<style scoped>
.patron-block {
  background: var(--patron-bg);
  border: 1px solid var(--patron-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) 1.1rem;
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

.patron-id {
  margin-left: auto;
  font-size: var(--text-2xs);
  font-family: monospace;
  color: var(--color-text-placeholder);
}

.patron-titre {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--patron-title);
  line-height: 1.3;
}

.patron-competence {
  font-size: var(--text-sm);
  color: var(--patron-text);
  font-style: italic;
  line-height: 1.5;
  padding: 0.4rem 0.6rem;
  background: var(--patron-tag-bg);
  border-radius: var(--radius-sm);
}

.patron-fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.patron-field { display: flex; flex-direction: column; gap: 0.2rem; }

.pf-label {
  font-size: var(--text-2xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--patron-text);
}
.pf-label--risk { color: var(--patron-risk-text); }

.pf-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.55;
}
.pf-text--risk { color: var(--patron-risk-text); }

.patron-outils { display: flex; flex-direction: column; gap: 0.35rem; }

.patron-outils-list { display: flex; flex-wrap: wrap; gap: 0.35rem; }

.patron-tool-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--color-accent);
  color: var(--color-bg);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: background 0.12s;
  font-size: var(--text-xs);
}
.patron-tool-btn:hover { background: var(--color-accent-hover); }

.ptb-id { font-family: monospace; font-weight: 700; }
.ptb-name { font-weight: 400; color: var(--color-text-placeholder); }

.patron-refs {
  font-size: var(--text-2xs);
  color: var(--color-text-placeholder);
  font-style: italic;
  line-height: 1.4;
}
</style>
