<template>
  <div class="review">
    <div class="review-header">
      <div>
        <h2>Validation des classifications</h2>
        <p>
          Le modele a analyse {{ sections.length }} section{{ sections.length > 1 ? 's' : '' }}.
          Verifiez et corrigez les classifications avant de generer l'analyse.
          Cette etape est obligatoire : c'est vous qui validez, le modele ne fait que proposer.
        </p>
      </div>
      <button class="btn-confirm" @click="handleConfirm">
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
            {{ classif.skipped ? 'Reinclure' : 'Exclure' }}
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
            <label class="field-label">Concepts detectes</label>
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

          <div class="field-row">
            <label class="field-label">Contexte</label>
            <select v-model="classif.context" class="field-select">
              <option value="Presentiel encadre">Presentiel encadre</option>
              <option value="Autonomie supervisee">Autonomie supervisee</option>
              <option value="Projet long">Projet long</option>
              <option value="Diagnostic">Diagnostic</option>
            </select>
          </div>
        </template>

        <p v-if="classif.note" class="section-note">{{ classif.note }}</p>
      </div>
    </div>

    <div class="review-footer">
      <button class="btn-confirm" @click="handleConfirm">
        Confirmer et generer l'analyse &rarr;
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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
  if (c == null || c < 0.3) return 'Incertain'
  if (c < 0.7) return 'Modere'
  return 'Confiant'
}

function confidenceClass(c) {
  if (c == null || c < 0.3) return 'conf--low'
  if (c < 0.7) return 'conf--mid'
  return 'conf--high'
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
  gap: 1.5rem;
}

.review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
}

.review-header h2 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.35rem;
}

.review-header p {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
  max-width: 560px;
}

.btn-confirm {
  padding: 0.65rem 1.4rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  flex-shrink: 0;
}

.btn-confirm:hover { background: #1d4ed8; }

.sections-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
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
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.section-page {
  font-size: 0.72rem;
  color: #94a3b8;
}

.confidence-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.conf--low { background: #fef2f2; color: #991b1b; }
.conf--mid { background: #fff7ed; color: #9a3412; }
.conf--high { background: #f0fdf4; color: #166534; }

.btn-skip {
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.15rem 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #f8fafc;
  color: #64748b;
  cursor: pointer;
}

.btn-skip--active {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.section-title--muted { color: #94a3b8; }

.section-excerpt {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.5;
  background: #f8fafc;
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
}

.field-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
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
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.concept-name {
  font-weight: 400;
  color: #3b82f6;
}

.tag-remove {
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  padding: 0;
}

.add-concept {
  font-size: 0.78rem;
  border: 1px dashed #93c5fd;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  background: #f0f9ff;
  color: #1e40af;
  cursor: pointer;
}

.field-select {
  font-size: 0.875rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  background: #f8fafc;
  color: #1e293b;
}

.section-note {
  font-size: 0.78rem;
  color: #94a3b8;
  font-style: italic;
}

.review-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
