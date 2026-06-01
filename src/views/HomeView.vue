<template>
  <div class="home">
    <section class="hero">
      <h1>Toolbox Prog IA</h1>
      <p class="subtitle">
        Catalogue d'outils pedagogiques et arbre de decision pour enseigner la programmation
        a l'ere de l'intelligence artificielle generative.
      </p>
      <p class="context">
        Proof of concept - Travail de Bachelor, HEG Arc, HES-SO
      </p>
    </section>

    <section class="cards-grid">
      <router-link to="/catalogue" class="feature-card">
        <div class="card-icon">&#128218;</div>
        <h2>Catalogue</h2>
        <p>
          Parcourez les {{ toolCount }} outils repertories, filtrez par famille, fonction
          pedagogique ou cout enseignant.
        </p>
        <span class="card-cta">Explorer le catalogue &rarr;</span>
      </router-link>

      <router-link to="/arbre" class="feature-card feature-card--primary">
        <div class="card-icon">&#128270;</div>
        <h2>Arbre de decision</h2>
        <p>
          Repondez a 5 questions sur votre contexte et obtenez une recommandation
          de 2 a 4 outils adaptee a votre situation.
        </p>
        <span class="card-cta">Demarrer l'arbre &rarr;</span>
      </router-link>

      <router-link to="/methodologie" class="feature-card">
        <div class="card-icon">&#128196;</div>
        <h2>Methodologie</h2>
        <p>
          Contexte du travail de Bachelor, sources de la cartographie et
          description du modele de donnees.
        </p>
        <span class="card-cta">En savoir plus &rarr;</span>
      </router-link>
    </section>

    <section class="stats">
      <div class="stat">
        <span class="stat-value">{{ toolCount }}</span>
        <span class="stat-label">outils repertories</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ conceptCount }}</span>
        <span class="stat-label">sous-concepts couverts</span>
      </div>
      <div class="stat">
        <span class="stat-value">{{ comboCount }}</span>
        <span class="stat-label">combinatoires preconfigures</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useData } from '../composables/useData.js'

const { tools, concepts, combos } = useData()
const toolCount = tools.length
const conceptCount = concepts.length
const comboCount = combos.length
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.hero {
  text-align: center;
  padding: 2.5rem 1rem;
}

.hero h1 {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #475569;
  max-width: 600px;
  margin: 0 auto 0.75rem;
}

.context {
  font-size: 0.85rem;
  color: #94a3b8;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.75rem;
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: pointer;
}

.feature-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.feature-card--primary {
  border-color: #2563eb;
  background: #eff6ff;
}

.card-icon {
  font-size: 2rem;
}

.feature-card h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

.feature-card p {
  font-size: 0.9rem;
  color: #475569;
  flex: 1;
}

.card-cta {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  margin-top: auto;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
  padding: 2rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #2563eb;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}
</style>
