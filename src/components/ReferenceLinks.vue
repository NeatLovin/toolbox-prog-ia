<template>
  <span class="ref-links">
    <template v-for="(ref, i) in parsed" :key="i">
      <span v-if="i > 0" class="ref-sep" aria-hidden="true"> · </span>
      <a
        v-if="ref.url"
        :href="ref.url"
        target="_blank"
        rel="noopener noreferrer"
        class="ref-link"
      >{{ ref.text }}</a>
      <span v-else>{{ ref.text }}</span>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { parseReferences } from '../lib/references.js'

const props = defineProps({
  text: { type: String, default: '' }
})

const parsed = computed(() => parseReferences(props.text))
</script>

<style scoped>
.ref-sep {
  user-select: none;
}

.ref-link {
  color: var(--color-info-text);
  text-decoration: none;
}

.ref-link:hover {
  text-decoration: underline;
}

.ref-link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
