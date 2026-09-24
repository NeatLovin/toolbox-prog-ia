<template>
  <div v-if="visible" class="consent-banner no-print" role="region" aria-label="Consentement à la mesure d'audience">
    <p class="cb-text">
      Ce prototype peut mesurer anonymement son usage pour l'évaluation du Travail de Bachelor.
      Aucune donnée personnelle, aucun contenu de document. Vous pouvez continuer à utiliser
      l'outil sans vous prononcer.
    </p>
    <div class="cb-actions">
      <router-link to="/transparence" class="ui-btn ui-btn-ghost cb-more" @click="closeBanner">
        En savoir plus
      </router-link>
      <button type="button" class="ui-btn ui-btn-secondary" @click="refuse">Refuser</button>
      <button type="button" class="ui-btn ui-btn-primary" @click="accept">Accepter</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { consentStatus, bannerForcedOpen, grantConsent, denyConsent, closeBanner } from '../lib/consent.js'
import { safeSessionStorage } from '../lib/safeStorage.js'
import { track } from '../lib/telemetry.js'

const route = useRoute()
const router = useRouter()

// Affichage différé : jamais avant que l'utilisateur ait vu de quoi il s'agit. Se révèle au
// premier des deux déclencheurs : un court délai, ou la première navigation utilisateur.
// router.isReady() est indispensable ici : la toute première résolution de route (celle qui
// amène de l'URL chargée à sa route effective) déclenche aussi un changement de fullPath, sans
// être une navigation voulue par l'utilisateur — il ne faut pas la compter.
const revealed = ref(false)

function reveal() {
  revealed.value = true
}

onMounted(() => {
  setTimeout(reveal, 2500)

  router.isReady().then(() => {
    const initialPath = route.fullPath
    watch(() => route.fullPath, (path) => {
      if (path !== initialPath) reveal()
    })
  })
})

const visible = computed(() =>
  bannerForcedOpen.value || (revealed.value && consentStatus.value === null)
)

function accept() {
  grantConsent()
  // session_start / consent_choice se déclenchent ici plutôt qu'au chargement : c'est le
  // premier instant où un envoi est autorisé, donc le vrai "début de session" mesurable.
  track('session_start', {
    channel: safeSessionStorage.getItem('tb_campaign') || 'direct',
    viewport: window.innerWidth < 640 ? 'small' : window.innerWidth < 1024 ? 'medium' : 'large',
    lang: navigator.language || ''
  })
  track('consent_choice', { granted: true })
  closeBanner()
}

function refuse() {
  denyConsent()
  closeBanner()
}
</script>

<style scoped>
.consent-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 300;
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-wrap: wrap;
  padding: var(--space-4) var(--space-6);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-strong);
  box-shadow: var(--shadow-lg);
}

.cb-text {
  flex: 1;
  min-width: 240px;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.55;
}

.cb-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.cb-more {
  font-size: var(--text-sm);
}

@media (max-width: 640px) {
  .consent-banner {
    padding: var(--space-4);
  }
  .cb-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
