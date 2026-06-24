<template>
  <article class="tool-card" :class="{ 'tool-card--clickable': clickable }" @click="clickable && $emit('open', tool)">
    <div class="card-header">
      <span class="tool-id">{{ tool.id }}</span>
      <span class="ui-badge" :class="familyClass">{{ familyShort }}</span>
    </div>
    <h3 class="tool-name">{{ tool.name }}</h3>
    <p class="tool-desc">{{ tool.description }}</p>

    <div class="card-meta">
      <span class="ui-badge" :class="functionClass">{{ functionLabel }}</span>
      <span class="ui-badge ui-badge--neutral" :title="tool.cost_teacher">Cout {{ tool.cost_num }}/3</span>
      <span class="ui-badge ui-badge--neutral">{{ tool.cursus }}</span>
      <span
        v-if="tool.robustness_num !== null && tool.robustness_num !== undefined"
        class="ui-badge"
        :class="robustnessClass"
        :title="'Robustesse IA : ' + tool.robustness_ai"
      >{{ robustnessShort }}</span>
      <span
        v-if="tool.efficacite"
        class="ui-badge"
        :class="efficaciteClass"
      >{{ tool.efficacite }}</span>
    </div>

    <div v-if="tool.fils_rouges && tool.fils_rouges.length" class="card-fils">
      <span
        v-for="fil in tool.fils_rouges"
        :key="fil"
        class="ui-badge"
        :class="filClass(fil)"
        :title="filTitle(fil)"
      >{{ fil }}</span>
    </div>

    <div v-if="tool.scenarios && tool.scenarios.length" class="card-fils">
      <span
        v-for="sc in tool.scenarios"
        :key="sc"
        class="ui-badge ui-badge--neutral"
        :title="scenarioTitle(sc)"
      >{{ sc }}</span>
    </div>

  </article>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useData.js'

const props = defineProps({
  tool: { type: Object, required: true },
  clickable: { type: Boolean, default: false }
})

defineEmits(['open'])

const { meta } = useData()

const filMap = Object.fromEntries((meta.fils_rouges || []).map(f => [f.id, f]))
const scenarioMap = Object.fromEntries((meta.scenarios || []).map(s => [s.id, s]))

function filTitle(fil) {
  const f = filMap[fil]
  return f ? `${f.id} — ${f.label} : ${f.description}` : fil
}

function scenarioTitle(s) {
  const sc = scenarioMap[s]
  return sc ? `${sc.id} — ${sc.label} : ${sc.description}` : s
}

function filClass(fil) {
  return {
    'ui-badge--fil-a': fil === 'Fil A',
    'ui-badge--fil-b': fil === 'Fil B',
    'ui-badge--fil-c': fil === 'Fil C',
    'ui-badge--fil-d': fil === 'Fil D'
  }
}

const familyShort = computed(() => {
  const labels = { FM1: 'Traditionnel', FM2: 'Outillé', FM3: 'Tuteur IA', FM4: 'IA généraliste' }
  return labels[props.tool.family] || props.tool.family_label
})

const familyClass = computed(() => ({
  'ui-badge--family-m': props.tool.family === 'FM1',
  'ui-badge--family-t': props.tool.family === 'FM2',
  'ui-badge--family-i': props.tool.family === 'FM3',
  'ui-badge--family-a': props.tool.family === 'FM4'
}))

const functionLabel = computed(() => {
  const map = { F: 'Formative', S: 'Sommative', FS: 'F + S', R: 'Recherche' }
  return map[props.tool.function] || props.tool.function
})

const functionClass = computed(() => ({
  'ui-badge--fn-f':  props.tool.function === 'F',
  'ui-badge--fn-s':  props.tool.function === 'S',
  'ui-badge--fn-fs': props.tool.function === 'FS'
}))

const robustnessShort = computed(() => {
  const n = props.tool.robustness_num
  if (n === 0) return 'Rob. nulle'
  if (n === 1) return 'Rob. faible'
  if (n === 2) return 'Rob. moderee'
  if (n === 3) return 'Rob. elevee'
  if (n === 4) return 'Rob. tres elevee'
  return ''
})

const robustnessClass = computed(() => {
  const n = props.tool.robustness_num
  if (n <= 1) return 'ui-badge--rob-low'
  if (n === 2) return 'ui-badge--rob-mid'
  if (n === 3) return 'ui-badge--rob-high'
  return 'ui-badge--rob-max'
})

const efficaciteClass = computed(() => ({
  'ui-badge--efficacite-validee':   props.tool.efficacite === 'Validée',
  'ui-badge--efficacite-etablie':   props.tool.efficacite === 'Établie',
  'ui-badge--efficacite-emergente': props.tool.efficacite === 'Émergente'
}))
</script>

<style scoped>
.tool-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: box-shadow var(--dur-2) var(--ease), border-color var(--dur-1) var(--ease);
  box-shadow: var(--shadow-sm);
}

.tool-card--clickable { cursor: pointer; }

.tool-card--clickable:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-strong);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tool-id {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-placeholder);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

.tool-name {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.tool-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
  flex: 1;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.card-fils {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
</style>
