<template>
  <div class="arbre">
    <div class="page-header">
      <h1>Arbre de decision</h1>
      <p>Repondez aux 5 questions pour obtenir une recommandation d'outils adaptee a votre contexte.</p>
    </div>

    <div class="wizard">
      <!-- Questions -->
      <div
        v-for="(q, idx) in questions"
        :key="q.key"
        class="question-block"
        :class="{ 'question-block--active': idx === currentStep, 'question-block--done': idx < currentStep, 'question-block--locked': idx > currentStep }"
      >
        <div class="question-header">
          <span class="step-badge">{{ idx + 1 }}</span>
          <span class="question-label">{{ q.label }}</span>
          <span v-if="idx < currentStep" class="answer-preview">{{ getAnswerLabel(q, answers[q.key]) }}</span>
        </div>

        <div v-if="idx === currentStep" class="question-options">
          <button
            v-for="opt in q.options"
            :key="opt.value"
            class="option-btn"
            :class="{ 'option-btn--selected': answers[q.key] === opt.value }"
            @click="selectAnswer(q.key, opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Boutons de navigation -->
      <div v-if="currentStep > 0 && currentStep < questions.length" class="nav-btns">
        <button class="btn-secondary" @click="goBack">Retour</button>
      </div>

      <!-- Recommandation -->
      <div v-if="result" class="result-panel">
        <div class="result-header">
          <h2>Recommandation</h2>
          <span v-if="result.source === 'combo'" class="source-badge source-badge--exact">Combinatoire exacte</span>
          <span v-else class="source-badge source-badge--matrix">Score matriciel</span>
        </div>

        <p v-if="result.justification" class="result-justification">{{ result.justification }}</p>

        <div class="result-tools">
          <ToolCard v-for="tool in result.tools" :key="tool.id" :tool="tool" />
        </div>

        <template v-if="patronForResult && patronForResult.all.length">
          <!-- Patron correspondant au contexte choisi -->
          <template v-if="patronForResult.hasExact">
            <div class="patron-match-banner patron-match-banner--exact">
              Patron pour "{{ answers.context }}"
            </div>
            <PatronBlock
              v-for="p in patronForResult.exact"
              :key="p.id"
              :patron="p"
              class="result-patron"
            />
          </template>
          <!-- Aucun patron exact : afficher les variantes disponibles -->
          <template v-else>
            <div class="patron-match-banner patron-match-banner--fallback">
              Pas de patron pour "{{ answers.context }}" - variantes disponibles :
            </div>
            <PatronBlock
              v-for="p in patronForResult.all"
              :key="p.id"
              :patron="p"
              class="result-patron"
            />
          </template>
        </template>

        <div class="result-actions">
          <button class="btn-primary" @click="restart">Nouvelle recherche</button>
          <router-link to="/catalogue" class="btn-secondary">Voir le catalogue complet</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getRecommendation } from '../composables/useRecommendation.js'
import { useData } from '../composables/useData.js'
import ToolCard from '../components/ToolCard.vue'
import PatronBlock from '../components/PatronBlock.vue'

const { getPatronsByConceptAndContext } = useData()

const questions = [
  {
    key: 'year',
    label: 'Annee de cursus',
    options: [
      { value: 'S1', label: 'S1 - 1re annee' },
      { value: 'S2', label: 'S2 - 1re annee (semestre 2)' },
      { value: 'S3', label: 'S3 - 2e annee' },
      { value: 'S4', label: 'S4 - 2e annee (semestre 2)' },
      { value: 'S5', label: 'S5 - 3e annee' },
      { value: 'S6', label: 'S6 - 3e annee (semestre 2)' },
      { value: 'Transversal', label: 'Transversal (toutes annees)' }
    ]
  },
  {
    key: 'concept_family',
    label: 'Famille de concepts',
    options: [
      { value: 'Syntaxe', label: 'Syntaxe - Variables, structures, POO...' },
      { value: 'Logique', label: 'Logique - Algorithmes, debug, tests...' },
      { value: 'Architecture', label: 'Architecture - Design patterns, securite...' }
    ]
  },
  {
    key: 'bloom',
    label: 'Niveau Bloom vise',
    options: [
      { value: 'Remember', label: 'Remember - Memoriser, reconnaitre' },
      { value: 'Understand', label: 'Understand - Expliquer, resumer' },
      { value: 'Apply', label: 'Apply - Executer, implementer' },
      { value: 'Analyze', label: 'Analyze - Differncier, structurer' },
      { value: 'Evaluate', label: 'Evaluate - Juger, critiquer' },
      { value: 'Create', label: 'Create - Concevoir, produire' }
    ]
  },
  {
    key: 'function',
    label: 'Fonction pedagogique',
    options: [
      { value: 'Formative', label: 'Formative - Apprentissage et pratique' },
      { value: 'Sommative', label: 'Sommative - Evaluation certificative' }
    ]
  },
  {
    key: 'context',
    label: "Contexte d'usage",
    options: [
      { value: 'Présentiel encadré', label: 'Présentiel encadré - En classe, supervision directe' },
      { value: 'Autonomie supervisée', label: 'Autonomie supervisée - Hors classe, feedback différé' },
      { value: 'Projet long', label: 'Projet long - Semestre ou année' },
      { value: 'Diagnostic', label: 'Diagnostic - Évaluation initiale du niveau' }
    ]
  }
]

const answers = ref({})
const currentStep = ref(0)
const result = ref(null)

function getAnswerLabel(q, value) {
  const opt = q.options.find(o => o.value === value)
  return opt ? opt.label : value
}

function selectAnswer(key, value) {
  answers.value[key] = value
  if (currentStep.value < questions.length - 1) {
    currentStep.value++
  } else {
    computeResult()
  }
}

function computeResult() {
  result.value = getRecommendation({
    year: answers.value.year,
    concept_family: answers.value.concept_family,
    bloom: answers.value.bloom,
    function: answers.value.function,
    context: answers.value.context
  })
}

function goBack() {
  if (result.value) {
    result.value = null
    currentStep.value = questions.length - 1
  } else if (currentStep.value > 0) {
    currentStep.value--
    delete answers.value[questions[currentStep.value].key]
  }
}

function restart() {
  answers.value = {}
  currentStep.value = 0
  result.value = null
}

// Extrait l'ID de concept depuis combo.concept_example (ex. "C2.3 Debugging")
// et filtre les patrons par le contexte choisi dans l'arbre
const patronForResult = computed(() => {
  if (!result.value || result.value.source !== 'combo') return null
  const raw = result.value.combo?.concept_example || ''
  const match = raw.match(/^(C\d+\.\d+)/)
  if (!match) return null
  return getPatronsByConceptAndContext(match[1], answers.value.context)
})
</script>

<style scoped>
.arbre {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.page-header p {
  color: #475569;
  font-size: 0.95rem;
}

.wizard {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-block {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.question-block--active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.question-block--locked {
  opacity: 0.45;
}

.question-block--done {
  border-color: #16a34a;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.25rem;
}

.step-badge {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.question-block--active .step-badge {
  background: #2563eb;
  color: #ffffff;
}

.question-block--done .step-badge {
  background: #16a34a;
  color: #ffffff;
}

.question-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.answer-preview {
  margin-left: auto;
  font-size: 0.82rem;
  color: #16a34a;
  font-weight: 500;
}

.question-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 0 1.25rem 1.25rem;
}

.option-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.1s, background 0.1s;
}

.option-btn:hover {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.option-btn--selected {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.nav-btns {
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.btn-primary,
.btn-secondary {
  padding: 0.55rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border-color: #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.result-panel {
  background: #ffffff;
  border: 1px solid #16a34a;
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.result-header h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
}

.source-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.source-badge--exact { background: #dcfce7; color: #14532d; }
.source-badge--matrix { background: #fef3c7; color: #78350f; }

.result-justification {
  font-size: 0.9rem;
  color: #475569;
  background: #f8fafc;
  border-left: 3px solid #2563eb;
  padding: 0.75rem 1rem;
  border-radius: 0 6px 6px 0;
}

.result-tools {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.result-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.result-patron {
  border-top: 1px solid #fde68a;
  padding-top: 0.25rem;
}

.patron-match-banner {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  border-radius: 5px;
}

.patron-match-banner--exact {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.patron-match-banner--fallback {
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fed7aa;
}
</style>
