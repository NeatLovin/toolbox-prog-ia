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
          <p>{{ toolCount }} outils en 4 familles. Attributs : fonction pédagogique, coût enseignant, robustesse face à l'IA, niveau de preuve, sources. Les concepts couverts et les scores de pertinence sont portés par matrix.json, les niveaux Bloom et les contextes d'usage par combos.json.</p>
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
        La recommandation est entièrement déterministe. Les paramètres saisis (famille de
        concepts, niveau Bloom, contexte d'usage, et fonction pédagogique, formative par défaut)
        sont croisés en cascade avec les {{ comboCount }} combinatoires préconfigurées :
      </p>
      <ol class="cascade-list">
        <li>correspondance exacte : famille, niveau Bloom, fonction et contexte ;</li>
        <li>à défaut, la fonction pédagogique est relâchée : famille, niveau Bloom et contexte ;</li>
        <li>à défaut, le niveau Bloom est relâché à son tour : famille et contexte seulement.</li>
      </ol>
      <p>
        Les outils de la première combinatoire trouvée sont retournés avec sa justification, et
        le résultat indique si la correspondance est exacte ou approchée. Si aucune combinatoire
        ne convient, un repli automatique retient les trois outils les mieux notés dans la
        matrice de pertinence pour la famille de concepts sélectionnée, parmi ceux compatibles
        avec la fonction visée.
      </p>

      <div class="info-box">
        <strong>Principe de traçabilité :</strong> aucun modèle de langage n'intervient dans la
        recommandation : chaque recommandation est directement dérivable de la cartographie du
        TB. Seul l'audit d'un plan de cours fait appel à un modèle de langage, pour classer les
        sections du document ; les recommandations qui en découlent sont calculées de la même
        façon.
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
        <li><strong>Données de la cartographie :</strong> fichiers JSON statiques embarqués dans l'application, jamais modifiés à l'exécution</li>
        <li><strong>Recommandation :</strong> calculée entièrement dans le navigateur, de façon déterministe, sans modèle de langage</li>
        <li>
          <strong>Service serveur :</strong> Cloudflare Worker et base D1, pour la mesure d'usage
          anonyme avec consentement (voir la page
          <router-link to="/transparence">Transparence</router-link>) et pour le relais de
          l'audit d'un plan de cours vers un modèle de langage d'Anthropic. La clé d'accès reste
          sur le serveur, jamais dans le navigateur.
        </li>
        <li><strong>Build :</strong> Vite</li>
        <li><strong>Hébergement :</strong> GitHub Pages pour le site (dépôt NeatLovin/toolbox-prog-ia), Cloudflare pour le service serveur</li>
        <li><strong>Styling :</strong> CSS tokens + primitives partagées (pas de framework UI)</li>
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
  font-family: var(--font-mono);
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
.tech-list a { color: var(--color-accent); text-decoration: underline; }
.cascade-list {
  padding-left: 1.5rem;
  list-style: decimal;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
}

@media (max-width: 640px) {
  .data-cards { grid-template-columns: 1fr; }
}
</style>
