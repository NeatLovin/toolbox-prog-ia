<template>
  <article class="tool-card">
    <div class="card-header">
      <span class="tool-id">{{ tool.id }}</span>
      <span class="tool-family" :class="familyClass">{{ tool.family_label }}</span>
    </div>
    <h3 class="tool-name">{{ tool.name }}</h3>
    <p class="tool-desc">{{ tool.description }}</p>
    <div class="card-meta">
      <span class="meta-badge" :class="functionClass">{{ functionLabel }}</span>
      <span class="meta-badge meta-badge--cost" :title="tool.cost_teacher">
        Cout {{ tool.cost_num }}/3
      </span>
      <span class="meta-badge meta-badge--cursus">{{ tool.cursus }}</span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tool: { type: Object, required: true }
})

const familyClass = computed(() => ({
  'family--m': props.tool.family === 'FM1',
  'family--t': props.tool.family === 'FM2',
  'family--i': props.tool.family === 'FM3',
  'family--a': props.tool.family === 'FM4'
}))

const functionLabel = computed(() => {
  const map = { F: 'Formative', S: 'Sommative', FS: 'Formative + Sommative', R: 'Recherche' }
  return map[props.tool.function] || props.tool.function
})

const functionClass = computed(() => ({
  'badge--formative': props.tool.function === 'F',
  'badge--sommative': props.tool.function === 'S',
  'badge--both': props.tool.function === 'FS'
}))
</script>

<style scoped>
.tool-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  transition: box-shadow 0.15s;
}

.tool-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
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
  gap: 0.4rem;
  margin-top: 0.25rem;
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

.meta-badge--cost { background: #f1f5f9; color: #475569; border-color: #e2e8f0; }
.meta-badge--cursus { background: #f8fafc; color: #64748b; border-color: #e2e8f0; }
</style>
