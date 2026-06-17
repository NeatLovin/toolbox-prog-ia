<template>
  <div class="home">
    <section class="hero">
      <h1>Toolbox Prog IA</h1>
      <p class="subtitle">
        Un catalogue d'outils pedagogiques et un arbre de decision pour enseigner la programmation
        a l'heure de l'intelligence artificielle generative.
      </p>
      <p class="context">
        Proof of concept, Travail de Bachelor, HEG Arc, HES-SO
      </p>
    </section>

    <section class="cards-grid">
      <router-link to="/arbre" class="feature-card feature-card--primary">
        <div class="card-icon">&#128270;</div>
        <h2>Obtenir une recommandation</h2>
        <p>
          Choisissez une zone conceptuelle (Syntaxe, Logique, Architecture),
          precisez le concept vise et le contexte d'usage : vous obtenez
          les outils adaptes et un patron d'activite pedagogique.
        </p>
        <span class="card-cta">Demarrer l'arbre &rarr;</span>
      </router-link>

      <router-link to="/catalogue" class="feature-card">
        <div class="card-icon">&#128218;</div>
        <h2>Explorer les outils</h2>
        <p>
          Parcourez les {{ toolCount }} outils repertories. Filtrez par famille
          pedagogique, robustesse face a l'IA, cout de mise en oeuvre ou fil rouge.
        </p>
        <span class="card-cta">Voir le catalogue &rarr;</span>
      </router-link>

      <router-link to="/methodologie" class="feature-card">
        <div class="card-icon">&#128196;</div>
        <h2>Comprendre la demarche</h2>
        <p>
          Contexte du Travail de Bachelor, modele de donnees et logique
          de recommandation. Tout est tracable jusqu'a la cartographie source.
        </p>
        <span class="card-cta">Voir la methodologie &rarr;</span>
      </router-link>
    </section>

    <section class="value-banner">
      <div class="value-item">
        <span class="value-icon">&#9654;</span>
        <p>Chaque recommandation est deterministe et tracable : aucun texte genere.</p>
      </div>
      <div class="value-item">
        <span class="value-icon">&#9654;</span>
        <p>{{ toolCount }} outils couvrant {{ conceptCount }} sous-concepts de programmation.</p>
      </div>
      <div class="value-item">
        <span class="value-icon">&#9654;</span>
        <p>Patrons pedagogiques ancres dans l'alignement constructif (Biggs 1996).</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useData } from '../composables/useData.js'

const { tools, concepts } = useData()
const toolCount    = tools.length
const conceptCount = concepts.length
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.hero {
  text-align: center;
  padding: var(--space-10) var(--space-4);
}

.hero h1 {
  font-size: var(--text-4xl);
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: var(--space-4);
}

.subtitle {
  font-size: 1.1rem;
  color: var(--color-text-muted);
  max-width: 600px;
  margin: 0 auto var(--space-3);
  line-height: 1.65;
}

.context {
  font-size: 0.85rem;
  color: var(--color-text-placeholder);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: 1.75rem;
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: pointer;
}

.feature-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.feature-card--primary {
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}

.card-icon { font-size: 2rem; }

.feature-card h2 {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
}

.feature-card p {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  flex: 1;
  line-height: 1.6;
}

.card-cta {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-accent);
  margin-top: auto;
}

.feature-card--primary .card-cta { color: var(--color-accent-hover); }

/* Banniere valeur */
.value-banner {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
}

.value-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.55;
}

.value-icon {
  color: var(--color-accent);
  font-size: 0.6rem;
  margin-top: 0.45rem;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .cards-grid { grid-template-columns: 1fr; }
  .hero h1    { font-size: var(--text-3xl); }
}
</style>
