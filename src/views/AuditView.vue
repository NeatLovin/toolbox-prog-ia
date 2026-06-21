<template>
  <div class="audit-view">
    <div class="ui-page-header">
      <h1>Audit de cours PDF</h1>
      <p class="header-desc">
        Extension exploratoire du PoC. Infere les parametres de votre cours section par section depuis
        un PDF, puis genere une analyse SWOT deterministe croisee avec la matrice de pertinence.
      </p>
    </div>

    <!-- Idle : depot PDF ou fixture -->
    <template v-if="audit.phase.value === 'idle'">
      <PdfDropzone
        @file-selected="audit.extractAndClassify"
        @load-fixture="loadFixture"
      />
    </template>

    <!-- Extraction en cours -->
    <div v-else-if="audit.phase.value === 'extracting'" class="loading-state">
      <div class="spinner"></div>
      <p>Extraction du texte depuis le PDF...</p>
    </div>

    <!-- Classification en cours -->
    <div v-else-if="audit.phase.value === 'classifying'" class="loading-state">
      <div class="spinner"></div>
      <p>Classification des sections via le modele ({{ audit.sections.value.length }} sections)...</p>
      <p class="loading-sub">Un seul appel API par section. Cela peut prendre quelques secondes.</p>
    </div>

    <!-- Validation humaine -->
    <template v-else-if="audit.phase.value === 'reviewing'">
      <div v-if="audit.isDemo.value" class="demo-banner">
        <span>&#127917; Mode demo</span>
        Classifications pre-calculees chargees. Modifiez librement avant de confirmer.
      </div>
      <SectionReview
        :sections="audit.sections.value"
        :classifications="audit.classifications.value"
        @confirm="audit.confirmReview"
      />
    </template>

    <!-- Calcul SWOT -->
    <div v-else-if="audit.phase.value === 'computing'" class="loading-state">
      <div class="spinner"></div>
      <p>Construction de l'analyse SWOT...</p>
    </div>

    <!-- Resultats -->
    <template v-else-if="audit.phase.value === 'done'">
      <CourseAudit
        :swot="audit.swot.value"
        :recommendations="audit.recommendations.value"
        :sections="audit.sections.value"
        :validated="audit.validated.value"
        @reset="audit.reset"
      />
    </template>

    <!-- Erreur -->
    <div v-else-if="audit.phase.value === 'error'" class="error-state">
      <p class="error-title">Une erreur est survenue</p>
      <p class="error-msg">{{ audit.error.value }}</p>
      <div class="error-hints">
        <p>Verifications :</p>
        <ul>
          <li>Le proxy local tourne-t-il ? Lancer <code>npm run dev:full</code> au lieu de <code>npm run dev</code>.</li>
          <li>Le fichier <code>.env</code> existe-t-il a la racine avec une cle <code>ANTHROPIC_API_KEY</code> valide ?</li>
          <li>En mode demo, utilisez le bouton "Charger le cours exemple" pour eviter tout appel API.</li>
        </ul>
      </div>
      <button class="btn-retry" @click="audit.reset">Recommencer</button>
    </div>
  </div>
</template>

<script setup>
import { useAudit } from '../composables/useAudit.js'
import PdfDropzone from '../components/PdfDropzone.vue'
import SectionReview from '../components/SectionReview.vue'
import CourseAudit from '../components/CourseAudit.vue'
import fixtureData from '../data/fixtures/cours-exemple.json'

const audit = useAudit()

function loadFixture() {
  audit.loadFixture(fixtureData)
}
</script>

<style scoped>
.audit-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.header-desc { max-width: 680px; }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: 4rem var(--space-8);
  color: var(--color-text-muted);
  font-size: var(--text-md);
}

.loading-sub {
  font-size: var(--text-sm);
  color: var(--color-text-placeholder);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.demo-banner {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1.25rem;
  font-size: var(--text-sm);
  color: var(--color-warning-text);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.demo-banner span { font-weight: 700; }

.error-state {
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 600px;
}

.error-title {
  font-weight: 700;
  color: var(--color-danger-text);
  font-size: var(--text-base);
}

.error-msg {
  font-size: var(--text-sm);
  color: var(--color-danger-text);
  font-family: var(--font-mono);
}

.error-hints {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.error-hints ul {
  margin-top: 0.35rem;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.error-hints code {
  background: var(--risk-max-bg);
  padding: 0.1rem 0.3rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.btn-retry {
  padding: 0.55rem 1.25rem;
  background: var(--color-danger-text);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  transition: opacity 0.15s;
}

.btn-retry:hover { opacity: 0.85; }
</style>
