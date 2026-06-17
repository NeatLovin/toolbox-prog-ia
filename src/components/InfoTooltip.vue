<template>
  <span class="info-tip" @mouseenter="onEnter" @mouseleave="onLeave">
    <button
      type="button"
      class="info-btn"
      :aria-label="`Definition : ${content.slice(0, 60)}`"
      :aria-expanded="open"
      @click.stop="onToggle"
      @touchstart.prevent.stop="onToggle"
    >?</button>
    <span v-if="open" role="tooltip" class="tip-popup">{{ content }}</span>
  </span>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  content: { type: String, required: true }
})

const open = ref(false)
let touchMode = false

function onEnter() { if (!touchMode) open.value = true }
function onLeave() { if (!touchMode) open.value = false }
function onToggle() {
  touchMode = true
  open.value = !open.value
  setTimeout(() => { touchMode = false }, 600)
}
</script>

<style scoped>
.info-tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 1px solid var(--color-border-strong);
  background: var(--color-accent-subtle);
  color: var(--color-text-faint);
  font-size: 0.6rem;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;
  transition: background 0.12s, border-color 0.12s;
  padding: 0;
}

.info-btn:hover,
.info-btn:focus-visible {
  background: var(--color-border);
  border-color: var(--color-accent);
  color: var(--color-text);
}

.tip-popup {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 200;
  background: var(--color-text);
  color: var(--color-bg);
  border-radius: var(--radius-lg);
  padding: 0.45rem 0.7rem;
  font-size: var(--text-2xs);
  font-weight: 400;
  line-height: 1.55;
  max-width: 240px;
  width: max-content;
  box-shadow: var(--shadow-lg);
  white-space: normal;
  pointer-events: none;
}
</style>
