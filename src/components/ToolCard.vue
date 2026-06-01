<template>
  <article class="tool-card" :class="{ 'tool-card--clickable': clickable }" @click="clickable && $emit('open', tool)">
    <div class="card-header">
      <span class="tool-id">{{ tool.id }}</span>
      <span class="tool-family" :class="familyClass">{{ familyShort }}</span>
    </div>
    <h3 class="tool-name">{{ tool.name }}</h3>
    <p class="tool-desc">{{ tool.description }}</p>

    <div class="card-meta">
      <span class="meta-badge" :class="functionClass">{{ functionLabel }}</span>
      <span class="meta-badge meta-badge--cost" :title="tool.cost_teacher">Cout {{ tool.cost_num }}/3</span>
      <span class="meta-badge meta-badge--cursus">{{ tool.cursus }}</span>
      <span v-if="tool.robustness_num !== null && tool.robustness_num !== undefined"
            class="meta-badge"
            :class="robustnessClass"
            :title="'Robustesse IA : ' + tool.robustness_ai">
        {{ robustnessShort }}
      </span>
    </div>

    <div v-if="tool.fils_rouges && tool.fils_rouges.length" class="card-fils">
      <span v-for="fil in tool.fils_rouges" :key="fil" class="fil-badge" :class="filClass(fil)" :title="filLabel(fil)">
        {{ fil }}
      </span>
    </div>

    <div v-if="tool.cyberlearn && tool.cyberlearn !== 'Non applicable'" class="card-cyberlearn">
      <span class="cyberlearn-label">Cyberlearn :</span>
      <span class="cyberlearn-value">{{ tool.cyberlearn }}</span>
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

const filMap = Object.fromEntries((meta.fils_rouges || []).map(f => [f.id, f.label]))

function filLabel(fil) {
  return filMap[fil] || fil
}

function filClass(fil) {
  return {
    'fil--a': fil === 'Fil A',
    'fil--b': fil === 'Fil B',
    'fil--c': fil === 'Fil C',
    'fil--d': fil === 'Fil D'
  }
}

const familyShort = computed(() => {
  const labels = {
    FM1: 'Traditionnel',
    FM2: 'Outille',
    FM3: 'Tuteur IA',
    FM4: 'IA generaliste'
  }
  return labels[props.tool.family] || props.tool.family_label
})

const familyClass = computed(() => ({
  'family--m': props.tool.family === 'FM1',
  'family--t': props.tool.family === 'FM2',
  'family--i': props.tool.family === 'FM3',
  'family--a': props.tool.family === 'FM4'
}))

const functionLabel = computed(() => {
  const map = { F: 'Formative', S: 'Sommative', FS: 'F + S', R: 'Recherche' }
  return map[props.tool.function] || props.tool.function
})

const functionClass = computed(() => ({
  'badge--formative': props.tool.function === 'F',
  'badge--sommative': props.tool.function === 'S',
  'badge--both': props.tool.function === 'FS'
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
  if (n <= 1) return 'badge--rob-low'
  if (n === 2) return 'badge--rob-mid'
  if (n === 3) return 'badge--rob-high'
  return 'badge--rob-max'
})
</script>

<style scoped>
.tool-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: box-shadow 0.15s;
}

.tool-card--clickable {
  cursor: pointer;
}

.tool-card--clickable:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  border-color: #2563eb;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tool-id {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  font-family: monospace;
}

.tool-family {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.family--m { background: #dbeafe; color: #1e40af; }
.family--t { background: #d1fae5; color: #065f46; }
.family--i { background: #fef3c7; color: #92400e; }
.family--a { background: #fce7f3; color: #9d174d; }

.tool-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.tool-desc {
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.5;
  flex: 1;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.meta-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid transparent;
}

.badge--formative { background: #ecfdf5; color: #166534; border-color: #bbf7d0; }
.badge--sommative { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.badge--both { background: #f0fdf4; color: #14532d; border-color: #86efac; }

.meta-badge--cost { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
.meta-badge--cursus { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }

.badge--rob-low { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
.badge--rob-mid { background: #fff7ed; color: #9a3412; border-color: #fed7aa; }
.badge--rob-high { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
.badge--rob-max { background: #dcfce7; color: #14532d; border-color: #86efac; }

.card-fils {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.fil-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  cursor: default;
}

.fil--a { background: #dcfce7; color: #15803d; }
.fil--b { background: #fee2e2; color: #b91c1c; }
.fil--c { background: #ede9fe; color: #6d28d9; }
.fil--d { background: #ffedd5; color: #c2410c; }

.card-cyberlearn {
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.cyberlearn-label {
  font-weight: 600;
  color: #475569;
}
</style>
