<template>
  <Teleport to="body">
    <div v-if="tool" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" :aria-label="tool.name">
        <button class="modal-close" @click="$emit('close')" aria-label="Fermer">&times;</button>

        <div class="modal-header">
          <div class="modal-id-row">
            <span class="tool-id">{{ tool.id }}</span>
            <span class="ui-badge" :class="familyClass">{{ tool.family_label }}</span>
            <span
              v-if="tool.robustness_num !== null && tool.robustness_num !== undefined"
              class="ui-badge"
              :class="robustnessClass"
            >{{ tool.robustness_ai }}</span>
          </div>
          <h2 class="modal-title">{{ tool.name }}</h2>
          <p class="modal-desc">{{ tool.description }}</p>
        </div>

        <div v-if="tool.detail" class="detail-block">
          <p>{{ tool.detail }}</p>
        </div>

        <div class="modal-grid">
          <div class="info-row">
            <span class="info-label">Fonction</span>
            <span class="ui-badge" :class="functionClass">{{ functionLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Séquencement conseillé</span>
            <span class="info-value">{{ tool.cursus }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Coût enseignant</span>
            <span class="info-value">{{ tool.cost_teacher }} ({{ tool.cost_num }}/3)</span>
          </div>
          <div class="info-row">
            <span class="info-label">Coût étudiant</span>
            <span class="info-value">{{ tool.cost_student }}</span>
          </div>
          <div v-if="tool.efficacite" class="info-row">
            <span class="info-label">Efficacite <InfoTooltip :content="GLOSSARY.efficacite.short" /></span>
            <span class="ui-badge" :class="efficaciteClass">{{ tool.efficacite }}</span>
          </div>
        </div>

        <div v-if="tool.fils_rouges && tool.fils_rouges.length" class="section">
          <h3 class="section-title">Axes pédagogiques <InfoTooltip :content="GLOSSARY.fil_rouge.short" /></h3>
          <div class="fils-list">
            <div v-for="fil in resolvedFils" :key="fil.id" class="fil-item">
              <span class="ui-badge" :class="filClass(fil.id)">{{ fil.id }}</span>
              <div>
                <strong>{{ fil.label }}</strong>
                <p>{{ fil.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="resolvedScenarios.length" class="section">
          <h3 class="section-title">Scénarios <InfoTooltip :content="GLOSSARY.scenario.short" /></h3>
          <div class="scenarios-list">
            <div v-for="s in resolvedScenarios" :key="s.id" class="scenario-item">
              <strong>{{ s.label }}</strong>
              <p>{{ s.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="tool.sources" class="section">
          <h3 class="section-title">Sources</h3>
          <p class="sources-text"><ReferenceLinks :text="tool.sources" /></p>
        </div>

        <div v-if="tool.link" class="section">
          <a :href="tool.link" target="_blank" rel="noopener noreferrer" class="ui-btn ui-btn-primary tool-link-btn">
            Voir la ressource
            <span class="tool-link-domain">{{ linkDomain }}</span>
          </a>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useData } from '../composables/useData.js'
import InfoTooltip from './InfoTooltip.vue'
import { GLOSSARY } from '../lib/glossary.js'
import ReferenceLinks from './ReferenceLinks.vue'

const props = defineProps({
  tool: { type: Object, default: null }
})

defineEmits(['close'])

const { meta } = useData()

const filMap  = Object.fromEntries((meta.fils_rouges || []).map(f => [f.id, f]))
const scenarioMap = Object.fromEntries((meta.scenarios || []).map(s => [s.id, s]))

const resolvedFils = computed(() =>
  (props.tool?.fils_rouges || []).map(id => filMap[id] || { id, label: id, description: '' })
)
const resolvedScenarios = computed(() =>
  (props.tool?.scenarios || []).map(id => scenarioMap[id]).filter(Boolean)
)

function filClass(fil) {
  return {
    'ui-badge--fil-a': fil === 'Fil A',
    'ui-badge--fil-b': fil === 'Fil B',
    'ui-badge--fil-c': fil === 'Fil C',
    'ui-badge--fil-d': fil === 'Fil D'
  }
}

const familyClass = computed(() => ({
  'ui-badge--family-m': props.tool?.family === 'FM1',
  'ui-badge--family-t': props.tool?.family === 'FM2',
  'ui-badge--family-i': props.tool?.family === 'FM3',
  'ui-badge--family-a': props.tool?.family === 'FM4'
}))

const functionLabel = computed(() => {
  const map = { F: 'Formative', S: 'Sommative', FS: 'Formative + Sommative', R: 'Recherche' }
  return map[props.tool?.function] || props.tool?.function
})

const functionClass = computed(() => ({
  'ui-badge--fn-f':  props.tool?.function === 'F',
  'ui-badge--fn-s':  props.tool?.function === 'S',
  'ui-badge--fn-fs': props.tool?.function === 'FS'
}))

const linkDomain = computed(() => {
  try { return new URL(props.tool?.link || '').hostname.replace('www.', '') } catch { return '' }
})

const robustnessClass = computed(() => {
  const n = props.tool?.robustness_num
  if (n <= 1) return 'ui-badge--rob-low'
  if (n === 2) return 'ui-badge--rob-mid'
  if (n === 3) return 'ui-badge--rob-high'
  return 'ui-badge--rob-max'
})

const efficaciteClass = computed(() => ({
  'ui-badge--efficacite-validee':   props.tool?.efficacite === 'Validée',
  'ui-badge--efficacite-etablie':   props.tool?.efficacite === 'Établie',
  'ui-badge--efficacite-emergente': props.tool?.efficacite === 'Émergente'
}))
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
  max-width: 680px;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  box-shadow: var(--shadow-modal);
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

.tool-id {
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
}

.modal-desc {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.detail-block {
  background: var(--color-accent-subtle);
  border-left: 3px solid var(--color-accent);
  padding: 0.85rem var(--space-4);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  font-size: var(--text-base);
  color: var(--color-text);
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
}

.info-label {
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 130px;
  flex-shrink: 0;
}

.info-value { color: var(--color-text); }

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

.fils-list, .scenarios-list { display: flex; flex-direction: column; gap: 0.6rem; }

.fil-item, .scenario-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.fil-item strong, .scenario-item strong {
  display: block;
  color: var(--color-text);
  font-size: var(--text-base);
}

.fil-item p, .scenario-item p {
  color: var(--color-text-muted);
  margin-top: 0.15rem;
  font-size: var(--text-sm);
  line-height: 1.5;
}

.sources-text {
  font-size: var(--text-sm);
  color: var(--color-text-faint);
  font-style: italic;
}

.tool-link-btn { align-self: flex-start; }

.tool-link-domain {
  font-size: var(--text-2xs);
  color: var(--color-text-placeholder);
  font-weight: 400;
}

@media (max-width: 640px) {
  .modal { padding: var(--space-6); }
  .info-label { min-width: 100px; }
}
</style>
