<template>
  <div class="dc-root ui-card">
    <div v-if="title" class="dc-title" role="heading" aria-level="2">{{ title }}</div>

    <!-- Niveau 1 - toujours visible -->
    <div class="dc-summary">
      <slot name="summary" />
    </div>

    <!-- Niveau 2 - tiroir Détails -->
    <details v-if="hasDetails" class="ui-collapsible">
      <summary>{{ detailsLabel }}</summary>
      <div class="ui-collapsible-body">
        <slot name="details" />
      </div>
    </details>

    <!-- Niveau 3 - tiroir Creuser -->
    <details v-if="hasDeep" class="ui-collapsible">
      <summary>{{ deepLabel }}</summary>
      <div class="ui-collapsible-body">
        <slot name="deep" />
      </div>
    </details>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'

defineProps({
  title:        { type: String, default: '' },
  detailsLabel: { type: String, default: 'Détails' },
  deepLabel:    { type: String, default: 'Creuser' }
})

const slots      = useSlots()
const hasDetails = computed(() => !!slots.details)
const hasDeep    = computed(() => !!slots.deep)
</script>

<style scoped>
.dc-root {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  transition: transform var(--dur-2) var(--ease), box-shadow var(--dur-2) var(--ease);
}

.dc-root:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.dc-title {
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--color-text);
}
</style>
