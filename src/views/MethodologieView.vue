<template>
  <div class="methodologie">
    <div class="ui-page-header">
      <h1>Méthodologie</h1>
      <p>Contexte scientifique et description du modèle de données de la Toolbox.</p>
    </div>

    <section class="section">
      <h2>Contexte du Travail de Bachelor</h2>
      <p>
        Ce proof of concept s'inscrit dans le Travail de Bachelor
        <em>Apprendre à programmer à l'ère de l'IA générative</em> (HEG Arc, HES-SO).
        Il évalue l'intégration de l'IA générative dans l'apprentissage de la programmation,
        selon une démarche Design Science Research.
      </p>
      <p>
        La Toolbox est un artefact démonstratif : un catalogue d'outils pédagogiques et
        un arbre de décision qui aide un enseignant à choisir le ou les bons outils
        selon son contexte. Les arbitrages privilégient la simplicité, la robustesse en
        démonstration et la traçabilité plutôt que la scalabilité.
      </p>
    </section>

    <section class="section">
      <h2>Modèle de données</h2>
      <p>
        Quatre fichiers JSON constituent la source de vérité. Toute donnée affichée
        est directement traçable jusqu'à ces fichiers.
      </p>

      <div class="data-cards">
        <div class="ui-card data-card">
          <div class="data-icon">&#128295;</div>
          <h3>tools.json</h3>
          <p>{{ toolCount }} outils. Attributs pédagogiques : concept couvert, niveau Bloom, fonction, contexte, score de pertinence, coût enseignant.</p>
        </div>
        <div class="ui-card data-card">
          <div class="data-icon">&#128218;</div>
          <h3>concepts.json</h3>
          <p>{{ conceptCount }} sous-concepts de programmation regroupés en 3 familles : Syntaxe, Logique, Architecture.</p>
        </div>
        <div class="ui-card data-card">
          <div class="data-icon">&#128202;</div>
          <h3>matrix.json</h3>
          <p>Matrice de pertinence outil x concept. Scores sur 3 niveaux : Idéal (3), Utile (2), Contextuel (1).</p>
        </div>
        <div class="ui-card data-card">
          <div class="data-icon">&#128269;</div>
          <h3>combos.json</h3>
          <p>{{ comboCount }} combinatoires préconfigurées. Chacune relie une configuration de paramètres à une recommandation d'outils avec justification.</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Logique de recommandation</h2>
      <p>
        La recommandation est entièrement déterministe. Les paramètres saisis
        (famille de concepts, niveau Bloom, contexte) sont croisés avec les
        {{ comboCount }} combinatoires préconfigurées.
      </p>
      <p>
        Si une correspondance exacte est trouvée, les outils de cette combinatoire
        sont retournés avec leur justification. Sinon, un repli automatique classe les
        outils selon leur score dans la matrice de pertinence pour la famille de concepts sélectionnée.
      </p>
      <div class="info-box">
        <strong>Principe de traçabilité :</strong> le modèle ne génère aucun outil. Chaque
        recommandation est directement dérivable de la cartographie du TB.
      </div>
    </section>

    <section class="section">
      <h2>Familles d'outils</h2>
      <div class="families-list">
        <div class="family-item">
          <span class="ui-badge ui-badge--family-m">FM1</span>
          <div>
            <strong>Méthodes pédagogiques traditionnelles</strong>
            <p>Examens, soutenances, pair programming, worked examples, code reading.</p>
          </div>
        </div>
        <div class="family-item">
          <span class="ui-badge ui-badge--family-t">FM2</span>
          <div>
            <strong>Dispositifs traditionnels outillés</strong>
            <p>Git monitoring, détection de plagiat, plateformes d'examen sécurisé.</p>
          </div>
        </div>
        <div class="family-item">
          <span class="ui-badge ui-badge--family-i">FM3</span>
          <div>
            <strong>Tuteurs IA et dispositifs scaffoldés</strong>
            <p>CodeAid, CodeHelp, CS50 Duck, NotebookLM (garde-fous pédagogiques explicites).</p>
          </div>
        </div>
        <div class="family-item">
          <span class="ui-badge ui-badge--family-a">FM4</span>
          <div>
            <strong>Outils agentiques et IA généraliste</strong>
            <p>Cursor, Claude Code, GitHub Copilot, ChatGPT (usage encadré en S3-S6).</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Stack technique</h2>
      <ul class="tech-list">
        <li><strong>Framework :</strong> Vue 3, Composition API</li>
        <li><strong>Données :</strong> JSON statiques chargés au démarrage (pas de backend)</li>
        <li><strong>Build :</strong> Vite</li>
        <li><strong>Hebergement :</strong> GitHub Pages (depot NeatLovin/toolbox-prog-ia)</li>
        <li><strong>Styling :</strong> CSS tokens + primitives partagees (pas de framework UI)</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { useData } from '../composables/useData.js'

const { tools, concepts, combos } = useData()
const toolCount    = tools.length
const conceptCount = concepts.length
const comboCount   = combos.length
</script>

<style scoped>
.methodologie { display: flex; flex-direction: column; gap: var(--space-8); }

.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section h2 {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.6rem;
}

.section p {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
}

.data-card {
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.data-icon { font-size: 1.5rem; }

.data-card h3 {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  font-family: monospace;
}

.data-card p { font-size: var(--text-sm); color: var(--color-text-muted); }

.info-box {
  background: var(--color-accent-subtle);
  border: 1px solid var(--color-border-strong);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: 0.9rem var(--space-4);
  font-size: var(--text-base);
  color: var(--color-text);
}

.families-list { display: flex; flex-direction: column; gap: var(--space-3); }

.family-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.family-item strong { display: block; font-size: var(--text-base); color: var(--color-text); }
.family-item p { font-size: var(--text-sm); color: var(--color-text-faint); margin-top: 0.2rem; }

.tech-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--text-base);
  color: var(--color-text-muted);
}
.tech-list strong { color: var(--color-text); }

@media (max-width: 640px) {
  .data-cards { grid-template-columns: 1fr; }
}
</style>
