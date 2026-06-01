<template>
  <div class="methodologie">
    <div class="page-header">
      <h1>Methodologie</h1>
      <p>Contexte scientifique et description du modele de donnees de la Toolbox.</p>
    </div>

    <section class="section">
      <h2>Contexte du Travail de Bachelor</h2>
      <p>
        Ce proof of concept s'inscrit dans le Travail de Bachelor
        <em>Apprendre a programmer a l'ere de l'IA generative</em> (HEG Arc, HES-SO).
        Il evalue l'integration de l'IA generative dans l'apprentissage de la programmation,
        selon une demarche Design Science Research.
      </p>
      <p>
        La Toolbox est un artefact demonstratif : un catalogue d'outils pedagogiques et
        un arbre de decision qui aide un enseignant a choisir le ou les bons outils
        selon son contexte. Les arbitrages privilegient la simplicite, la robustesse en
        demonstration et la tracabilite plutot que la scalabilite.
      </p>
    </section>

    <section class="section">
      <h2>Modele de donnees</h2>
      <p>
        Quatre fichiers JSON constituent la source de verite. Toute donnee affichee
        est directement tracable jusqu'a ces fichiers.
      </p>

      <div class="data-cards">
        <div class="data-card">
          <div class="data-icon">&#128295;</div>
          <h3>tools.json</h3>
          <p>{{ toolCount }} outils. Attributs pedagogiques : concept couvert, niveau Bloom, fonction, contexte, score de pertinence, cout enseignant.</p>
        </div>
        <div class="data-card">
          <div class="data-icon">&#128218;</div>
          <h3>concepts.json</h3>
          <p>{{ conceptCount }} sous-concepts de programmation regroupes en 3 familles : Syntaxe, Logique, Architecture.</p>
        </div>
        <div class="data-card">
          <div class="data-icon">&#128202;</div>
          <h3>matrix.json</h3>
          <p>Matrice de pertinence outil x concept. Scores sur 3 niveaux : Ideal (3), Utile (2), Contextuel (1).</p>
        </div>
        <div class="data-card">
          <div class="data-icon">&#128269;</div>
          <h3>combos.json</h3>
          <p>{{ comboCount }} combinatoires preconfigures. Chacune relie une configuration de 5 parametres a une recommandation d'outils avec justification.</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Logique de recommandation</h2>
      <p>
        La recommandation est entierement deterministe. Les 5 parametres saisis
        (annee, famille de concepts, niveau Bloom, fonction pedagogique, contexte) sont
        croises avec les {{ comboCount }} combinatoires preconfigures.
      </p>
      <p>
        Si une correspondance exacte est trouvee, les outils de cette combinatoire
        sont retournes avec leur justification. Sinon, un repli automatique classe les
        outils selon leur score dans la matrice de pertinence pour la famille de concepts selectionnee.
      </p>
      <div class="info-box">
        <strong>Principe de tracabilite :</strong> le modele ne genere aucun outil. Chaque
        recommandation est directement derivable de la cartographie du TB.
      </div>
    </section>

    <section class="section">
      <h2>Familles d'outils</h2>
      <div class="families-list">
        <div class="family-item">
          <span class="fam-badge fam--m">FM1</span>
          <div>
            <strong>Methodes pedagogiques traditionnelles</strong>
            <p>Examens, soutenances, pair programming, worked examples, code reading.</p>
          </div>
        </div>
        <div class="family-item">
          <span class="fam-badge fam--t">FM2</span>
          <div>
            <strong>Dispositifs traditionnels outilles</strong>
            <p>Git monitoring, detection de plagiat, plateformes d'examen securise.</p>
          </div>
        </div>
        <div class="family-item">
          <span class="fam-badge fam--i">FM3</span>
          <div>
            <strong>Tuteurs IA et dispositifs scaffoldes</strong>
            <p>CodeAid, CodeHelp, CS50 Duck, NotebookLM - garde-fous pedagogiques explicites.</p>
          </div>
        </div>
        <div class="family-item">
          <span class="fam-badge fam--a">FM4</span>
          <div>
            <strong>Outils agentiques et IA generaliste</strong>
            <p>Cursor, Claude Code, GitHub Copilot, ChatGPT - usage encadre en S3-S6.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Stack technique</h2>
      <ul class="tech-list">
        <li><strong>Framework :</strong> Vue 3, Composition API</li>
        <li><strong>Donnees :</strong> JSON statiques charges au demarrage (pas de backend)</li>
        <li><strong>Build :</strong> Vite</li>
        <li><strong>Hebergement :</strong> GitHub Pages (depot NeatLovin/toolbox-prog-ia)</li>
        <li><strong>Styling :</strong> CSS scoped Vue (pas de framework UI)</li>
      </ul>
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
.methodologie {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.4rem;
}

.page-header p {
  color: #475569;
}

.section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section h2 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.6rem;
}

.section p {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.65;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.data-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.data-icon {
  font-size: 1.5rem;
}

.data-card h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  font-family: monospace;
}

.data-card p {
  font-size: 0.8rem;
  color: #475569;
}

.info-box {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.9rem 1rem;
  font-size: 0.875rem;
  color: #1e40af;
}

.families-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.family-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.fam-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 5px;
  flex-shrink: 0;
  margin-top: 2px;
}

.fam--m { background: #dbeafe; color: #1e40af; }
.fam--t { background: #d1fae5; color: #065f46; }
.fam--i { background: #fef3c7; color: #92400e; }
.fam--a { background: #fce7f3; color: #9d174d; }

.family-item strong {
  display: block;
  font-size: 0.875rem;
  color: #1e293b;
}

.family-item p {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.tech-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
}

.tech-list strong {
  color: #1e293b;
}
</style>
