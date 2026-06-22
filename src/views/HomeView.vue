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

    <StatStrip class="reveal" />

    <p class="trust-line">
      Recommandations déterministes et traçables.
    </p>

    <div class="hub-grid">

      <router-link
        v-if="isLocal"
        to="/audit"
        class="hub-card hub-card--audit ui-card reveal reveal--stagger"
        style="--i:0"
      >
        <h2>Auditer un cours</h2>
        <p>
          Importez le PDF de votre cours pour analyser les concepts couverts
          et obtenir des recommandations d'outils ciblées par section.
        </p>
        <span class="hub-cta">Démarrer l'audit →</span>
      </router-link>
      <div
        v-else
        class="hub-card hub-card--audit hub-card--disabled ui-card reveal reveal--stagger"
        style="--i:0"
        aria-disabled="true"
      >
        <h2>Auditer un cours</h2>
        <p>
          Importez le PDF de votre cours pour analyser les concepts couverts
          et obtenir des recommandations d'outils ciblées par section.
        </p>
        <span class="hub-cta-disabled">Disponible en local uniquement</span>
      </div>

      <router-link to="/arbre" class="hub-card ui-card reveal reveal--stagger" style="--i:1">
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

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 740px;
}

.trust-line {
  font-size: var(--text-sm);
  color: var(--color-text-placeholder);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.trust-line::before {
  content: '▶';
  font-size: 0.5rem;
  color: var(--color-accent);
  flex-shrink: 0;
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

.hub-card--disabled {
  opacity: 0.42;
  cursor: default;
  pointer-events: none;
}

.hub-cta-disabled {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-faint);
  margin-top: auto;
  font-style: italic;
}

@media (max-width: 600px) {
  .home      { max-width: 100%; }
  .hub-grid  { grid-template-columns: 1fr; }
}
</style>
