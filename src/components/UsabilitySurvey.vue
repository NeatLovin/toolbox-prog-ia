<template>
  <div v-if="visible" class="usability-survey ui-card no-print">
    <template v-if="!submitted">
      <h3 class="us-title">Votre avis nous aide</h3>
      <p class="us-hint">{{ introHint }}</p>

      <div class="us-question">
        <p class="us-label" id="us-needs-label">Cet outil répond à mes besoins</p>
        <div class="us-scale" role="radiogroup" aria-labelledby="us-needs-label">
          <button
            v-for="n in 7" :key="'needs-' + n"
            type="button"
            class="us-scale-btn"
            :class="{ 'us-scale-btn--active': needsScore === n }"
            :aria-pressed="needsScore === n"
            @click="needsScore = n"
          >{{ n }}</button>
        </div>
        <div class="us-scale-labels"><span>Pas du tout</span><span>Tout à fait</span></div>
      </div>

      <div class="us-question">
        <p class="us-label" id="us-ease-label">Cet outil est facile à utiliser</p>
        <div class="us-scale" role="radiogroup" aria-labelledby="us-ease-label">
          <button
            v-for="n in 7" :key="'ease-' + n"
            type="button"
            class="us-scale-btn"
            :class="{ 'us-scale-btn--active': easeScore === n }"
            :aria-pressed="easeScore === n"
            @click="easeScore = n"
          >{{ n }}</button>
        </div>
        <div class="us-scale-labels"><span>Pas du tout</span><span>Tout à fait</span></div>
      </div>

      <div class="us-question">
        <label class="us-label" for="us-comment">Commentaire (facultatif)</label>
        <textarea id="us-comment" v-model="comment" class="us-textarea" maxlength="500" rows="3"></textarea>
      </div>

      <div class="us-actions">
        <button type="button" class="ui-btn ui-btn-ghost" @click="dismiss">Passer</button>
        <button type="button" class="ui-btn ui-btn-primary" :disabled="!canSubmit" @click="submit">Envoyer</button>
      </div>
      <p v-if="consentStatus !== 'granted'" class="us-consent-note">
        Vous n'avez pas activé (ou avez refusé) la mesure d'audience : seule cette réponse sera transmise, rien d'autre.
      </p>
    </template>
    <p v-else class="us-thanks">Merci pour votre retour.</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { consentStatus } from '../lib/consent.js'
import { submitSurveyResponse } from '../lib/telemetry.js'

const props = defineProps({
  // 'arbre' | 'audit' : détermine le marqueur de session (un questionnaire par parcours) et
  // l'intitulé d'introduction. Les deux items notés restent identiques quel que soit le parcours,
  // pour rester comparables sur l'échelle UMUX-Lite/SUS.
  parcours: {
    type: String,
    required: true,
    validator: v => ['arbre', 'audit'].includes(v)
  }
})

const SHOWN_KEY = computed(() => `tb_survey_shown_${props.parcours}`)
const introHint = computed(() => props.parcours === 'audit'
  ? 'Deux questions rapides sur l\'analyse de votre plan de cours, facultatives, une seule fois.'
  : 'Deux questions rapides sur la recommandation obtenue, facultatives, une seule fois.')

const localMarkedShown = ref(false)
const dismissed = ref(false)
const submitted = ref(false)
const needsScore = ref(null)
const easeScore = ref(null)
const comment = ref('')

// Indépendant du consentement à la télémétrie générale (voir submitSurveyResponse dans
// telemetry.js) : un enseignant qui refuse ou ignore le bandeau peut quand même répondre. Un
// marqueur de session distinct par parcours permet de répondre une fois à l'arbre et une fois à
// l'audit.
const eligible = computed(() => {
  if (localMarkedShown.value) return true
  try {
    if (sessionStorage.getItem(SHOWN_KEY.value)) return false
  } catch {
    // pas de sessionStorage : autant l'afficher, pas de moyen de dédupliquer entre pages
  }
  return true
})

watch(eligible, (val) => {
  if (val && !localMarkedShown.value) {
    localMarkedShown.value = true
    try { sessionStorage.setItem(SHOWN_KEY.value, '1') } catch {}
  }
}, { immediate: true })

const visible = computed(() => eligible.value && !dismissed.value)
const canSubmit = computed(() => needsScore.value !== null && easeScore.value !== null)

function dismiss() {
  dismissed.value = true
}

function submit() {
  if (!canSubmit.value) return
  submitSurveyResponse({
    parcours: props.parcours,
    needs_score: needsScore.value,
    ease_score: easeScore.value,
    comment: comment.value.trim().slice(0, 500) || null
  })
  submitted.value = true
}
</script>

<style scoped>
.usability-survey {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 480px;
}

.us-title {
  font-size: var(--text-md);
  font-weight: 800;
  color: var(--color-text);
}

.us-hint {
  font-size: var(--text-sm);
  color: var(--color-text-faint);
  margin-top: -0.5rem;
}

.us-question {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.us-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
}

.us-scale {
  display: flex;
  gap: 0.35rem;
}

.us-scale-btn {
  flex: 1;
  padding: 0.4rem 0;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.us-scale-btn:hover { border-color: var(--color-accent); }
.us-scale-btn--active {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-surface);
}

.us-scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.us-textarea {
  font: inherit;
  font-size: var(--text-sm);
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.75rem;
  resize: vertical;
}

.us-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.us-thanks {
  font-size: var(--text-base);
  color: var(--color-text-muted);
}

.us-consent-note {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
  text-align: right;
}
</style>
