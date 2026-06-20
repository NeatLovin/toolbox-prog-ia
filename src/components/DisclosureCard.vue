<template>
  <div class="dc-root ui-card">
    <div v-if="title" class="dc-title" role="heading" aria-level="2">{{ title }}</div>

    <!-- Niveau 1 — toujours visible -->
    <div class="dc-summary">
      <slot name="summary" />
    </div>

    <!-- Niveau 2 — tiroir Détails -->
    <details v-if="hasDetails" class="ui-collapsible">
      <summary>{{ detailsLabel }}</summary>
      <div class="ui-collapsible-body">
        <slot name="details" />
      </div>
    </details>

    <!-- Niveau 3 — tiroir Creuser -->
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
  gap: var(--space-4);
}

.dc-title {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--color-text);
}

/* Le summary hérite du gap de la card : aucun style propre requis */
</style>
