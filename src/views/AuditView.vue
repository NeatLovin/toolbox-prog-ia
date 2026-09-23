<template>
  <div class="audit-view">
    <div class="ui-page-header">
      <h1>Audit de cours PDF</h1>
      <p class="header-desc">
        Extension exploratoire du PoC. Infère les paramètres de votre cours section par section depuis
        un PDF, puis génère une analyse SWOT déterministe croisée avec la matrice de pertinence.
      </p>
    </div>

    <!-- Avant tout dépôt, et aussi sur petit écran : le lien d'envoi invite à déposer un plan de
         cours, l'information doit donc être lue quelle que soit la largeur. -->
    <aside
      v-if="!isWideEnough || audit.phase === 'idle'"
      class="transmission-notice ui-card"
      aria-labelledby="transmission-notice-title"
    >
      <p id="transmission-notice-title" class="tn-title">Avant de déposer un document</p>
      <p class="tn-text">
        Pour l'analyse, le texte extrait de votre PDF est transmis à un modèle de langage externe
        (Anthropic), le temps du traitement. Ce site ne conserve ni le texte ni le fichier. Évitez
        donc d'y déposer un document confidentiel.
      </p>
      <p class="tn-text">
        Le cours d'exemple, lui, n'envoie rien : il rejoue une analyse déjà calculée, sans aucun
        appel au modèle. C'est un bon moyen de découvrir la fonction.
      </p>
      <router-link to="/transparence" class="tn-link">En savoir plus sur la transmission</router-link>
    </aside>

    <!-- Réservé au grand écran : jamais de dégradation silencieuse, un message explicite -->
    <div v-if="!isWideEnough" class="audit-narrow ui-card">
      <p>
        L'audit de cours est optimisé pour un écran large (tableaux, comparaisons côte à côte).
        Ouvrez ce lien sur un ordinateur pour l'utiliser dans de bonnes conditions.
      </p>
    </div>
    <template v-else>

    <!-- Idle : depot PDF ou fixture -->
    <template v-if="audit.phase === 'idle'">
      <div class="ctx-chooser">
        <label class="ctx-label" for="ctx-select">Contexte du cours</label>
        <select
          id="ctx-select"
          class="ctx-select"
          v-model="audit.courseContext"
          @change="track('audit_context_filled', { context: true })"
        >
          <option value="Présentiel encadré">Présentiel encadré</option>
          <option value="Autonomie supervisée">Autonomie supervisée</option>
          <option value="Projet long">Projet long</option>
          <option value="Diagnostic">Diagnostic</option>
        </select>
        <p class="ctx-hint">Appliqué à toutes les sections lors de l'analyse.</p>
      </div>
      <PdfDropzone
        @file-selected="audit.extractAndClassify"
        @load-fixture="loadFixture"
      />
    </template>

    <!-- Extraction en cours -->
    <div v-else-if="audit.phase === 'extracting'" class="loading-state">
      <div class="spinner"></div>
      <p>Extraction du texte depuis le PDF...</p>
    </div>

    <!-- Classification en cours -->
    <div v-else-if="audit.phase === 'classifying'" class="loading-state">
      <div class="spinner"></div>
      <p>Analyse du document en cours...</p>
      <p class="loading-sub">Segmentation et classification en un seul appel. Cela peut prendre quelques secondes.</p>
    </div>

    <!-- Garde-fou de pertinence : jamais un blocage, toujours une confirmation -->
    <div v-else-if="audit.phase === 'relevance-warning'" class="relevance-warning ui-card">
      <h2 class="rw-title">Ce document ne semble pas clairement porter sur la programmation</h2>
      <p class="rw-text">
        L'analyse automatique n'est pas certaine que ce document soit un cours de programmation
        ou d'informatique. Vous pouvez continuer quand même : l'enseignant reste seul juge, le
        modèle ne fait que signaler un doute.
      </p>
      <div class="rw-actions">
        <button class="ui-btn ui-btn-secondary" @click="audit.confirmRelevance(false)">Recommencer</button>
        <button class="ui-btn ui-btn-primary" @click="audit.confirmRelevance(true)">Continuer quand même</button>
      </div>
    </div>

    <!-- Validation humaine -->
    <template v-else-if="audit.phase === 'reviewing'">
      <div v-if="audit.isDemo" class="demo-banner">
        <span>&#127917; Mode demo</span>
        Classifications pre-calculees chargees. Modifiez librement avant de confirmer.
      </div>
      <SectionReview
        :sections="audit.sections"
        :classifications="audit.classifications"
        @confirm="audit.confirmReview"
      />
    </template>

    <!-- Calcul SWOT -->
    <div v-else-if="audit.phase === 'computing'" class="loading-state">
      <div class="spinner"></div>
      <p>Construction de l'analyse SWOT...</p>
    </div>

    <!-- Resultats -->
    <template v-else-if="audit.phase === 'done'">
      <CourseAudit
        :course-summary="audit.courseSummary"
        :course-context="audit.courseContext"
        :swot="audit.swot"
        :recommendations="audit.recommendations"
        :sections="audit.sections"
        :validated="audit.validated"
        :truncation="audit.truncation"
        @reset="audit.reset"
        @update-context="audit.recomputeWithContext"
      />
    </template>

    <!-- Erreur : jamais une erreur brute, toujours un message clair et une issue immédiate -->
    <div v-else-if="audit.phase === 'error'" class="error-state">
      <p class="error-title">Analyse automatique momentanément indisponible</p>
      <p class="error-msg">{{ friendlyErrorMessage(audit.error) }}</p>
      <div class="error-actions">
        <button class="ui-btn ui-btn-primary" @click="loadFixture">Charger le cours exemple</button>
        <button class="ui-btn ui-btn-secondary" @click="audit.reset">Recommencer</button>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuditStore } from '../stores/audit.js'
import PdfDropzone from '../components/PdfDropzone.vue'
import SectionReview from '../components/SectionReview.vue'
import CourseAudit from '../components/CourseAudit.vue'
import fixtureData from '../data/fixtures/cours-exemple.json'
import { track } from '../lib/telemetry.js'

const audit = useAuditStore()

function loadFixture() {
  audit.loadFixture(fixtureData)
}

// 4.8 : l'audit reste réservé au grand écran, mais avec un message explicite plutôt qu'une
// dégradation silencieuse. Le lien de nav reste visible : seul le contenu de la vue s'adapte.
const isWideEnough = ref(true)
let mql = null
function updateWidth() { isWideEnough.value = mql.matches }

onMounted(() => {
  mql = window.matchMedia('(min-width: 860px)')
  updateWidth()
  mql.addEventListener('change', updateWidth)
})
onBeforeUnmount(() => {
  mql?.removeEventListener('change', updateWidth)
})

// L'enseignant ne voit jamais le code d'erreur brut renvoyé par le Worker (kill_switch,
// session_cap, daily_cap...) : un message neutre, identique quelle que soit la cause technique,
// avec la fixture toujours proposée comme issue immédiate (audit_unavailable est déjà tracé côté
// Worker pour les refus de plafond, côté client uniquement pour les échecs réseau, cf. lot 1).
function friendlyErrorMessage(reason) {
  if (reason === 'size_exceeded') {
    return "Ce document est trop volumineux pour être analysé automatiquement."
  }
  return "L'analyse automatique n'a pas pu aboutir pour le moment. Vous pouvez explorer le cours d'exemple pré-calculé en attendant, ou réessayer plus tard."
}
</script>

<style scoped>
.audit-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* Sélecteur de contexte global */
.ctx-chooser {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 360px;
}

.ctx-label {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--color-text);
}

.ctx-select {
  font-size: var(--text-base);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: 0.45rem 0.75rem;
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
}

.ctx-hint {
  font-size: var(--text-xs);
  color: var(--color-text-placeholder);
}

.header-desc { max-width: 680px; }

.transmission-notice {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  max-width: 720px;
}
.tn-title {
  font-weight: 700;
  color: var(--color-info-text);
}
.tn-text {
  font-size: var(--text-base);
  color: var(--color-text);
  line-height: 1.6;
}
.tn-link {
  align-self: flex-start;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-info-text);
  text-decoration: underline;
}

.audit-narrow {
  max-width: 480px;
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
  border-left: 3px solid var(--color-accent);
}

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

.relevance-warning {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 560px;
  border-left: 3px solid var(--color-warning-border);
}

.rw-title {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--color-text);
}

.rw-text {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.rw-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.error-state {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-text-faint);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 560px;
}

.error-title {
  font-weight: 700;
  color: var(--color-text);
  font-size: var(--text-base);
}

.error-msg {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}
</style>
