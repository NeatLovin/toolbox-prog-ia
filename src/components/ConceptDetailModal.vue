<template>
  <Teleport to="body">
    <div v-if="concept" class="modal-backdrop" @click.self="$emit('close')">
      <div
        class="modal"
        role="dialog"
        :aria-label="concept.name"
        @keydown.esc="$emit('close')"
        tabindex="-1"
        ref="modalEl"
      >
        <button class="modal-close" @click="$emit('close')" aria-label="Fermer">&times;</button>

        <div class="modal-header">
          <div class="modal-id-row">
            <span class="concept-id">{{ concept.id }}</span>
            <span class="ui-badge" :class="zoneClass">{{ concept.family }}</span>
            <span class="ui-badge ui-badge--level">{{ concept.level }}</span>
            <span class="ui-badge" :class="riskClass">{{ concept.risk_ai }}</span>
          </div>
          <h2 class="modal-title">{{ concept.name }}</h2>
        </div>

        <div v-if="concept.gloss" class="gloss-block">
          <span class="gloss-label">En clair</span>
          <p class="gloss-text">{{ concept.gloss }}</p>
        </div>

        <div class="detail-block">
          <p>{{ concept.description }}</p>
        </div>

        <div class="modal-grid">
          <div class="info-row">
            <span class="info-label">Niveaux Bloom</span>
            <div class="info-badges">
              <span
                v-for="b in concept.bloom"
                :key="b"
                class="ui-badge"
                :class="bloomClass(b)"
              >{{ b }}</span>
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">Dimension Fuller</span>
            <span class="info-value">{{ concept.fuller }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Risque IA</span>
            <span class="info-value">{{ concept.risk_ai }}</span>
          </div>
        </div>

        <div v-if="concept.references" class="section">
          <h3 class="section-title">Références</h3>
          <p class="sources-text"><ReferenceLinks :text="concept.references" /></p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import ReferenceLinks from './ReferenceLinks.vue'

const props = defineProps({
  concept: { type: Object, default: null }
})

defineEmits(['close'])

const modalEl = ref(null)

watch(() => props.concept, async (val) => {
  if (val) {
    await nextTick()
    modalEl.value?.focus()
  }
})

const zoneClass = computed(() => {
  const map = {
    Syntaxe:      'ui-badge--zone-syntaxe',
    Logique:      'ui-badge--zone-logique',
    Architecture: 'ui-badge--zone-architecture'
  }
  return map[props.concept?.family] || ''
})

const riskClass = computed(() => ({
  'ui-badge--risk-max':  props.concept?.risk_ai === 'Maximal',
  'ui-badge--risk-high': props.concept?.risk_ai === 'Élevé',
  'ui-badge--risk-mod':  props.concept?.risk_ai === 'Modéré'
}))

function bloomClass(b) {
  const map = {
    Remember:  'ui-badge--bloom-remember',
    Understand:'ui-badge--bloom-understand',
    Apply:     'ui-badge--bloom-apply',
    Analyze:   'ui-badge--bloom-analyze',
    Evaluate:  'ui-badge--bloom-evaluate',
    Create:    'ui-badge--bloom-create'
  }
  return map[b] || ''
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
  max-width: 620px;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  box-shadow: var(--shadow-modal);
  outline: none;
}

.modal-close {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-placeholder);
  cursor: pointer;
  line-height: 1;
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
  transition: background 0.12s;
}
.modal-close:hover { background: var(--color-accent-subtle); color: var(--color-text-muted); }

.modal-header { display: flex; flex-direction: column; gap: var(--space-2); }

.modal-id-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.concept-id {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-placeholder);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

.modal-title {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-text);
  padding-right: var(--space-8);
  line-height: 1.2;
}

.gloss-block {
  background: var(--color-accent-subtle);
  border-left: 3px solid var(--color-accent);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: 0.85rem var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.gloss-label {
  font-size: var(--text-2xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-faint);
}

.gloss-text {
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.65;
}

.detail-block {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.65;
}

.modal-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.info-row {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  font-size: var(--text-base);
  flex-wrap: wrap;
}

.info-label {
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 130px;
  flex-shrink: 0;
}

.info-value { color: var(--color-text); }

.info-badges { display: flex; flex-wrap: wrap; gap: 0.3rem; }

.section { display: flex; flex-direction: column; gap: 0.6rem; }

.section-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.3rem;
}

.sources-text {
  font-size: var(--text-sm);
  color: var(--color-text-faint);
  font-style: italic;
}
</style>
