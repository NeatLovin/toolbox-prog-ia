<template>
  <div class="metric-gauge">
    <span class="u-eyebrow mg-label">{{ label }}</span>
    <div class="mg-row">
      <div
        class="mg-segs"
        role="img"
        :aria-label="`${label} : ${valueLabel}, ${value} sur ${max}`"
      >
        <span
          v-for="n in max"
          :key="n"
          class="mg-seg"
          :class="n <= value ? 'mg-seg--filled' : 'mg-seg--empty'"
          :style="n <= value ? filledStyle : undefined"
        />
      </div>
      <span class="mg-vl">{{ valueLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label:      { type: String, required: true },
  value:      { type: Number, required: true },
  max:        { type: Number, required: true },
  valueLabel: { type: String, required: true },
  variant:    { type: String, default: 'neutral' }  // 'ramp' | 'neutral'
})

const filledStyle = computed(() => {
  if (props.variant === 'ramp') {
    if (props.value >= 3) return { background: 'var(--zone-logique)' }
    if (props.value === 2) return { background: 'var(--color-text-faint)' }
    return { background: 'var(--color-text-placeholder)' }
  }
  return { background: 'var(--color-text-muted)' }
})
</script>

<style scoped>
.metric-gauge {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
  min-width: 120px;
}

.mg-label {
  color: var(--color-text-faint);
}

.mg-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.mg-segs {
  display: flex;
  gap: 3px;
}

.mg-seg {
  display: inline-block;
  width: 1.1rem;
  height: 0.32rem;
  border-radius: var(--radius-pill);
  flex-shrink: 0;
  transition: background var(--dur-2) var(--ease);
}

.mg-seg--empty {
  background: transparent;
  border: 1.5px solid var(--color-border-strong);
}

.mg-vl {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
