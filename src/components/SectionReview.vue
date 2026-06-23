<template>
  <div class="review">
    <div class="review-header">
      <div>
        <h2>Validation des classifications</h2>
        <p>
          Le modèle a analysé {{ sections.length }} section{{ sections.length > 1 ? 's' : '' }}.
          Vérifiez et corrigez les classifications avant de générer l'analyse.
          Cette étape est obligatoire : c'est vous qui validez, le modèle ne fait que proposer.
        </p>
        <p class="review-hint">
          La détection assistée par IA peut comporter des erreurs. Vérifiez en priorité les sections marquées « Confiance faible ».
        </p>
      </div>
      <button class="ui-btn ui-btn-primary btn-confirm" @click="handleConfirm">
        Confirmer et analyser &rarr;
      </button>
    </div>

    <div class="sections-list">
      <div v-for="(classif, idx) in localClassifs" :key="classif.section_index" class="section-card">
        <div class="section-meta">
          <span class="section-num">Section {{ idx + 1 }}</span>
          <span v-if="sections[classif.section_index]" class="section-page">
            p. {{ sections[classif.section_index].page_start }}
          </span>
          <span class="confidence-badge" :class="confidenceClass(classif.confidence)">
            {{ confidenceLabel(classif.confidence) }}
          </span>
          <button class="btn-skip" :class="{ 'btn-skip--active': classif.skipped }" @click="toggleSkip(idx)">
            {{ classif.skipped ? 'Réinclure' : 'Exclure' }}
          </button>
        </div>

        <h3 class="section-title" :class="{ 'section-title--muted': classif.skipped }">
          {{ sections[classif.section_index]?.title || 'Section ' + (idx + 1) }}
        </h3>

        <p v-if="sections[classif.section_index]?.text_excerpt" class="section-excerpt">
          {{ sections[classif.section_index].text_excerpt.slice(0, 200) }}...
        </p>

        <template v-if="!classif.skipped">
          <div class="field-row">
            <label class="field-label">Concepts détectés</label>
            <div class="concepts-editor">
              <span
                v-for="cid in classif.concept_ids"
                :key="cid"
                class="concept-tag"
              >
                {{ cid }} <span class="concept-name">{{ conceptName(cid) }}</span>
                <button class="tag-remove" @click="removeConcept(idx, cid)">&times;</button>
              </span>
              <select v-if="classif.concept_ids.length < 3" class="add-concept" @change="addConcept(idx, $event)">
                <option value="">+ Ajouter un concept</option>
                <option
                  v-for="c in availableConcepts(classif.concept_ids)"
                  :key="c.id"
                  :value="c.id"
                >{{ c.id }} - {{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="field-row">
            <label class="field-label">Niveau Bloom</label>
            <select v-model="classif.bloom" class="field-select">
              <option value="">Non identifiable</option>
              <option v-for="b in bloomLevels" :key="b" :value="b">{{ b }}</option>
            </select>
          </div>

        </template>

        <p v-if="classif.note" class="section-note">{{ classif.note }}</p>
      </div>
    </div>

    <div class="review-footer">
      <button class="ui-btn ui-btn-primary btn-confirm" @click="handleConfirm">
        Confirmer et générer l'analyse &rarr;
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import conceptsData from '../data/concepts.json'

const props = defineProps({
  sections: { type: Array, required: true },
  classifications: { type: Array, required: true }
})

const emit = defineEmits(['confirm'])

const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

const localClassifs = ref(props.classifications.map(c => ({ ...c, skipped: false })))

const conceptMap = Object.fromEntries(conceptsData.map(c => [c.id, c.name]))

function conceptName(id) {
  return conceptMap[id] || id
}

function availableConcepts(currentIds) {
  return conceptsData.filter(c => !currentIds.includes(c.id))
}

function addConcept(idx, event) {
  const id = event.target.value
  if (id && !localClassifs.value[idx].concept_ids.includes(id)) {
    localClassifs.value[idx].concept_ids.push(id)
  }
  event.target.value = ''
}

function removeConcept(idx, cid) {
  localClassifs.value[idx].concept_ids = localClassifs.value[idx].concept_ids.filter(id => id !== cid)
}

function toggleSkip(idx) {
  localClassifs.value[idx].skipped = !localClassifs.value[idx].skipped
}

function confidenceLabel(c) {
  if (c === 'low')  return 'Confiance faible'
  if (c === 'high') return 'Confiance élevée'
  return 'Confiance moyenne'
}

function confidenceClass(c) {
  if (c === 'low')  return 'conf--low'
  if (c === 'high') return 'conf--high'
  return 'conf--mid'
}

function handleConfirm() {
  const result = localClassifs.value
    .filter(c => !c.skipped)
    .map(({ skipped, ...rest }) => rest)
  emit('confirm', result)
}
</script>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-6);
  flex-wrap: wrap;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-xl);
  padding: 1.25rem var(--space-6);
}

.review-header h2 {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 0.35rem;
}

.review-header p {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
  max-width: 560px;
}

.review-hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  padding: 0.3rem 0.65rem;
  border-left: 2px solid var(--color-warning-border);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--color-warning-bg);
}

.btn-confirm {
  white-space: nowrap;
  flex-shrink: 0;
}

.sections-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.section-num {
  font-size: var(--text-2xs);
  font-weight: 700;
  color: var(--color-text-faint);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.section-page {
  font-size: var(--text-2xs);
  color: var(--color-text-placeholder);
}

.confidence-badge {
  font-size: var(--text-2xs);
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
}

.conf--low  { background: var(--color-danger-bg);  color: var(--color-danger-text);  }
.conf--mid  { background: var(--color-warning-bg); color: var(--color-warning-text); }
.conf--high { background: var(--color-success-bg); color: var(--color-success-text); }

.btn-skip {
  margin-left: auto;
  font-size: var(--text-2xs);
  font-weight: 600;
  padding: 0.15rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-faint);
  cursor: pointer;
}

.btn-skip--active {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-color: var(--color-danger-border);
}

.section-title {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text);
}

.section-title--muted { color: var(--color-text-placeholder); }

.section-excerpt {
  font-size: var(--text-xs);
  color: var(--color-text-faint);
  line-height: 1.5;
  background: var(--color-bg);
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-md);
}

.field-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.field-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  min-width: 120px;
  padding-top: 0.3rem;
  flex-shrink: 0;
}

.concepts-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  flex: 1;
}

.concept-tag {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--color-accent-subtle);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}

.concept-name {
  font-weight: 400;
  color: var(--color-text-faint);
}

.tag-remove {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0;
}

.add-concept {
  font-size: var(--text-xs);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.4rem;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
}

.field-select {
  font-size: var(--text-base);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.6rem;
  background: var(--color-bg);
  color: var(--color-text);
}

.section-note {
  font-size: var(--text-xs);
  color: var(--color-text-placeholder);
  font-style: italic;
}

.review-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
