<template>
  <div class="home">

    <div class="ui-page-header">
      <h1>Toolbox Prog IA</h1>
      <p>
        Catalogue d'outils pédagogiques et arbre de décision pour enseigner la programmation
        à l'ère de l'intelligence artificielle générative.
        Proof of concept, Travail de Bachelor, HEG Arc, HES-SO.
      </p>
    </div>

    <p class="home-generic-rec">
      Sans précision de votre part : privilégiez l'évaluation orale ou tracée sur la syntaxe, où
      l'IA générative produit du code correct sans garantir la compréhension, et réservez les
      exercices de conception et de débogage à la main avant tout recours à un assistant.
      Répondez aux quelques questions ci-dessous pour une recommandation adaptée à votre cours.
    </p>

    <StatStrip class="reveal" />

    <div class="hub-grid">

      <router-link
        to="/audit"
        class="hub-card hub-card--audit ui-card reveal reveal--stagger"
        style="--i:0"
        @click="track('home_entry_click', { entry: 'audit' })"
      >
        <h2>Auditer un cours</h2>
        <p>
          Importez le PDF de votre cours pour analyser les concepts couverts
          et obtenir des recommandations d'outils ciblées par section.
        </p>
        <span class="hub-cta">Démarrer l'audit →</span>
      </router-link>

      <router-link
        to="/arbre"
        class="hub-card ui-card reveal reveal--stagger"
        style="--i:1"
        @click="track('home_entry_click', { entry: 'reco' })"
      >
        <h2>Obtenir une recommandation</h2>
        <p>
          Parcours guidé en trois étapes : zone conceptuelle, concept précis, contexte d'usage.
          Résultat avec patron pédagogique et outils adaptés.
        </p>
        <span class="hub-cta">Démarrer →</span>
      </router-link>

    </div>

    <ZoneProfile class="reveal" />

  </div>
</template>

<script setup>
import StatStrip   from '../components/StatStrip.vue'
import ZoneProfile from '../components/ZoneProfile.vue'
import { track } from '../lib/telemetry.js'
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 740px;
}

.home-generic-rec {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-lg);
}


.hub-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}

.hub-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-decoration: none;
  transition: box-shadow var(--dur-2) var(--ease), transform var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease);
}

.hub-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--color-accent);
}

.hub-card--audit {
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}

.hub-card h2 {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
}

.hub-card p {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  flex: 1;
  line-height: 1.6;
}

.hub-cta {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-accent);
  margin-top: auto;
}


@media (max-width: 600px) {
  .home      { max-width: 100%; }
  .hub-grid  { grid-template-columns: 1fr; }
}
</style>
