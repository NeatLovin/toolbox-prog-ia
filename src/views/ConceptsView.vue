<template>
  <div class="concepts">
    <div class="page-header">
      <h1>Concepts pedagogiques</h1>
      <p>
        La cartographie du TB decompose l'enseignement de la programmation en
        {{ concepts.length }} sous-concepts regroupes en {{ families.length }} familles macroscopiques.
        Chaque concept est annote selon la taxonomie de Bloom, la dimension Fuller et le niveau de risque
        induit par l'IA generative. Les outils de reference sont extraits de la matrice de pertinence.
      </p>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Famille</label>
        <select v-model="selectedFamily" class="filter-select">
          <option value="">Toutes</option>
          <option v-for="f in families" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Niveau Bloom</label>
        <select v-model="selectedBloom" class="filter-select">
          <option value="">Tous</option>
          <option v-for="b in bloomLevels" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Risque IA</label>
        <select v-model="selectedRisk" class="filter-select">
          <option value="">Tous</option>
          <option value="Maximal">Maximal</option>
          <option value="Eleve">Eleve</option>
          <option value="Modere">Modere</option>
        </select>
      </div>
      <button v-if="hasFilters" class="reset-btn" @click="resetFilters">Reinitialiser</button>
    </div>

    <!-- Legende explicative -->
    <details class="legend">
      <summary class="legend-toggle">
        Comprendre les indicateurs : Bloom, Risque IA, Fuller
      </summary>

      <div class="legend-body">

        <div class="legend-section">
          <h3>Taxonomie de Bloom en programmation</h3>
          <p class="legend-intro">
            Grille institutionnelle HES-SO (Guide IA 2024). Chaque sous-concept est annote par le ou
            les niveaux Bloom qu'il mobilise principalement. L'IA generative perturbe differemment
            chaque niveau : elle excelle sur Remember-Apply (production syntaxique), performe moins
            bien sur Analyze-Evaluate et ne remplace pas le jugement requis par Create.
          </p>
          <div class="bloom-grid">
            <div class="bloom-entry bloom-entry--remember">
              <span class="be-tag">Remember</span>
              <div>
                <strong>Memoriser, reconnaitre</strong>
                <p>Citer la syntaxe, reconnaitre un patron, reproduire un exemple vu en cours. Base des S1-S2. Zone ou le risque de fragile knowledge est maximal : l'etudiant peut reciter sans comprendre.</p>
              </div>
            </div>
            <div class="bloom-entry bloom-entry--understand">
              <span class="be-tag">Understand</span>
              <div>
                <strong>Expliquer, predire</strong>
                <p>Expliquer ce que fait un programme, predire la sortie d'une boucle, tracer l'execution. Competence precurseur identifiee par Lister et al. 2004 sur N=941 etudiants comme discriminante pour la reussite en programmation.</p>
              </div>
            </div>
            <div class="bloom-entry bloom-entry--apply">
              <span class="be-tag">Apply</span>
              <div>
                <strong>Executer, implementer</strong>
                <p>Ecrire du code fonctionnel pour un probleme donne, utiliser des constructions connues dans un nouveau contexte. Niveau le plus frequent dans les TP de S1-S3. L'IA generative excelle ici, d'ou le risque de vibe coding.</p>
              </div>
            </div>
            <div class="bloom-entry bloom-entry--analyze">
              <span class="be-tag">Analyze</span>
              <div>
                <strong>Decomposer, differencier</strong>
                <p>Identifier des bugs, comparer des algorithmes, decomposer un probleme en sous-problemes. Le debugging (C2.3) est un exemple typique d'Analyze : l'etudiant doit formuler une hypothese et la tester.</p>
              </div>
            </div>
            <div class="bloom-entry bloom-entry--evaluate">
              <span class="be-tag">Evaluate</span>
              <div>
                <strong>Juger, critiquer</strong>
                <p>Argumenter des choix de conception, critiquer le code d'un pair (peer review), evaluer la pertinence d'une solution. Bloom Evaluate se developpe principalement par la pratique du jugement inter-pairs.</p>
              </div>
            </div>
            <div class="bloom-entry bloom-entry--create">
              <span class="be-tag">Create</span>
              <div>
                <strong>Concevoir, produire</strong>
                <p>Imaginer et concevoir une architecture ou un systeme de zero. Niveau S5-S6. L'IA assiste mais ne remplace pas le jugement architectural : l'etudiant doit evaluer la pertinence des propositions generees.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="legend-section">
          <h3>Risque IA par famille de concepts</h3>
          <p class="legend-intro">
            Niveau de risque que l'etudiant delegue a l'IA sans construire de comprehension reelle.
            Derive de la litterature (Bastani 2025 PNAS, Lister 2004, Fuller 2007) et des 22
            entretiens enseignants du TB. Ce n'est pas un jugement sur l'outil IA mais sur le
            sequençage de son introduction dans le cursus.
          </p>
          <div class="risk-grid">
            <div class="risk-entry risk-entry--max">
              <span class="re-badge risk--max">Risque Maximal</span>
              <div>
                <strong>Famille Syntaxe (F1)</strong>
                <p>L'IA generative produit de la syntaxe correcte de maniere quasi systematique. Un etudiant peut generer et soumettre du code valide sans en comprendre un seul element. C'est la zone du vibe coding et du fragile knowledge, ou la detection est la plus difficile. Les outils d'evaluation doivent etre robustes par construction (examen papier, oral, tracage).</p>
              </div>
            </div>
            <div class="risk-entry risk-entry--high">
              <span class="re-badge risk--high">Risque Eleve</span>
              <div>
                <strong>Famille Logique (F2)</strong>
                <p>L'IA peut aider sur le raisonnement algorithmique mais risque de resoudre le probleme a la place de l'etudiant, notamment sur le debugging et les tests. Le risque de delegation sans comprehension est eleve, en particulier hors classe ou l'usage est non supervise.</p>
              </div>
            </div>
            <div class="risk-entry risk-entry--mod">
              <span class="re-badge risk--mod">Risque Modere</span>
              <div>
                <strong>Famille Architecture (F3)</strong>
                <p>L'IA assiste sur la conception et la documentation mais ne remplace pas le jugement architectural : les choix de design sont non-triviaux et l'etudiant doit evaluer la pertinence des suggestions generees. Le risque reste present (vibe coding architectural en S3-S4) mais l'ecart entre sortie IA et attente pedagogique est plus facilement detectable.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="legend-section">
          <h3>Dimension Fuller (Fuller et al. 2007)</h3>
          <p class="legend-intro">
            Extension CS-specifique de la taxonomie de Bloom publiee par Fuller et al. dans un rapport
            ITiCSE Working Group international de 2007. Elle croise les niveaux Bloom avec deux
            dimensions disciplinaires qui sont au coeur du diagnostic du TB sur l'IA generative.
          </p>
          <div class="fuller-grid">
            <div class="fuller-entry">
              <span class="fe-tag">Produce</span>
              <div>
                <strong>Produire du code, un algorithme, une solution</strong>
                <p>La dimension que l'IA generative supplante le plus facilement : generer du code fonctionnel a partir d'un enonce. Un etudiant qui s'appuie sur l'IA pour la production sans pratiquer lui-meme ne developpe pas cette competence.</p>
              </div>
            </div>
            <div class="fuller-entry">
              <span class="fe-tag">Interpret</span>
              <div>
                <strong>Lire, tracer, expliquer du code existant</strong>
                <p>La dimension que l'IA maitrise moins bien et que l'etudiant peut moins facilement deleguer. Les tuteurs IA scaffoldes (CodeHelp I02, CS50 Duck I04) misent precisement sur Interpret pour verifier la comprehension reelle. Lister et al. 2004 montrent que la maitrise d'Interpret est le meilleur predicteur de reussite en programmation.</p>
              </div>
            </div>
          </div>
          <div class="matrix-legend">
            <span class="ml-title">Scores de la matrice de pertinence :</span>
            <span class="ml-item ml--ideal">Ideal (3)</span>
            <span class="ml-sep">reference litterature ou terrain</span>
            <span class="ml-item ml--utile">Utile (2)</span>
            <span class="ml-sep">complement efficace</span>
            <span class="ml-item ml--ctx">Contextuel (1)</span>
            <span class="ml-sep">pertinent selon les cas</span>
          </div>
        </div>

      </div>
    </details>

    <template v-for="fam in visibleFamilies" :key="fam.id">
      <section class="family-section" :class="'family-section--' + fam.id.toLowerCase()">
        <div class="family-header">
          <div class="family-title-row">
            <h2>{{ fam.name }}</h2>
            <span class="risk-badge" :class="riskClass(fam.risk_ai)">
              Risque IA {{ fam.risk_ai }}
            </span>
            <span class="concept-count">{{ fam.concepts.length }} concept{{ fam.concepts.length > 1 ? 's' : '' }}</span>
          </div>
          <p class="family-description">{{ fam.description }}</p>
        </div>

        <div class="concepts-grid">
          <article
            v-for="concept in fam.concepts"
            :key="concept.id"
            class="concept-card"
          >
            <div class="concept-header">
              <span class="concept-id">{{ concept.id }}</span>
              <span class="concept-year">{{ concept.year }}</span>
            </div>

            <h3 class="concept-name">{{ concept.name }}</h3>
            <p class="concept-desc">{{ concept.description }}</p>

            <div class="concept-bloom">
              <span
                v-for="b in concept.bloom"
                :key="b"
                class="bloom-tag"
                :class="bloomClass(b)"
                :title="bloomDesc[b]"
              >{{ b }}</span>
            </div>

            <div class="concept-fuller">
              <span class="fuller-label">Fuller :</span>
              <span class="fuller-value">{{ concept.fuller }}</span>
              <span class="fuller-hint" :title="fullerHint(concept.fuller)">&#9432;</span>
            </div>

            <div v-if="topTools(concept.id).length" class="concept-tools">
              <span class="tools-label">Outils de reference</span>
              <div class="tools-list">
                <span
                  v-for="entry in topTools(concept.id)"
                  :key="entry.toolId"
                  class="tool-ref"
                  :class="entry.score === 3 ? 'tool-ref--ideal' : 'tool-ref--utile'"
                  :title="toolName(entry.toolId) + (entry.score === 3 ? ' — Ideal' : ' — Utile')"
                >
                  {{ entry.toolId }}
                </span>
              </div>
            </div>

            <div v-if="concept.references" class="concept-refs">
              {{ concept.references }}
            </div>

            <details v-if="getPatronByConcept(concept.id)" class="patron-details">
              <summary class="patron-summary">
                Patron pedagogique
                <span class="patron-summary-titre">{{ getPatronByConcept(concept.id).titre }}</span>
              </summary>
              <PatronBlock :patron="getPatronByConcept(concept.id)" class="patron-in-card" />
            </details>
          </article>
        </div>
      </section>
    </template>

    <div v-if="visibleFamilies.length === 0" class="empty-state">
      Aucun concept ne correspond aux filtres selectionnes.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData.js'
import PatronBlock from '../components/PatronBlock.vue'

const { concepts, tools, matrix, getPatronByConcept } = useData()

const selectedFamily = ref('')
const selectedBloom = ref('')
const selectedRisk = ref('')

const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

const bloomDesc = {
  Remember: 'Memoriser, reconnaitre la syntaxe et les regles. Zone de risque IA maximal.',
  Understand: 'Expliquer, predire le comportement d\'un programme, tracer son execution.',
  Apply: 'Ecrire du code fonctionnel pour un probleme donne. Cible privilegiee du vibe coding.',
  Analyze: 'Decomposer, identifier des bugs, comparer des solutions et des algorithmes.',
  Evaluate: 'Juger la qualite d\'un code, argumenter des choix de conception, faire un code review.',
  Create: 'Concevoir une architecture ou un systeme original. Bloom maximal, S5-S6.'
}

function fullerHint(fuller) {
  if (fuller?.includes('Produce') && fuller?.includes('Interpret')) {
    return 'Produce (ecrire du code) et Interpret (lire/tracer du code) sont tous les deux mobilises.'
  }
  if (fuller?.includes('Produce')) return 'Principalement Produce : l\'etudiant doit produire du code ou un algorithme.'
  if (fuller?.includes('Interpret')) return 'Principalement Interpret : l\'etudiant doit lire, tracer et expliquer du code existant.'
  return fuller || ''
}

const hasFilters = computed(() =>
  selectedFamily.value !== '' || selectedBloom.value !== '' || selectedRisk.value !== ''
)

function resetFilters() {
  selectedFamily.value = ''
  selectedBloom.value = ''
  selectedRisk.value = ''
}

// Map concept_id -> [{toolId, score}] sorted by score desc, score >= 2
const matrixMap = computed(() => {
  const map = {}
  matrix.cells.forEach(cell => {
    if (cell.score < 2) return
    if (!map[cell.concept]) map[cell.concept] = []
    map[cell.concept].push({ toolId: cell.tool, score: cell.score })
  })
  Object.values(map).forEach(arr => arr.sort((a, b) => b.score - a.score))
  return map
})

const toolNameMap = Object.fromEntries(tools.map(t => [t.id, t.name]))

function topTools(conceptId) {
  return (matrixMap.value[conceptId] || []).slice(0, 5)
}

function toolName(id) {
  return toolNameMap[id] || id
}

// Group concepts by family, apply filters
const families = computed(() => {
  const famMap = {}
  concepts.forEach(c => {
    if (!famMap[c.family_id]) {
      famMap[c.family_id] = {
        id: c.family_id,
        name: c.family,
        description: c.family_description,
        risk_ai: c.risk_ai,
        concepts: []
      }
    }
    famMap[c.family_id].concepts.push(c)
  })
  return Object.values(famMap)
})

const visibleFamilies = computed(() => {
  return families.value
    .map(fam => {
      const filtered = fam.concepts.filter(c => {
        if (selectedBloom.value && !c.bloom.includes(selectedBloom.value)) return false
        if (selectedRisk.value && c.risk_ai !== selectedRisk.value) return false
        return true
      })
      return { ...fam, concepts: filtered }
    })
    .filter(fam => {
      if (selectedFamily.value && fam.id !== selectedFamily.value) return false
      return fam.concepts.length > 0
    })
})

function riskClass(risk) {
  if (risk === 'Maximal') return 'risk--max'
  if (risk === 'Eleve') return 'risk--high'
  return 'risk--mod'
}

function bloomClass(b) {
  const map = {
    Remember: 'bloom--remember',
    Understand: 'bloom--understand',
    Apply: 'bloom--apply',
    Analyze: 'bloom--analyze',
    Evaluate: 'bloom--evaluate',
    Create: 'bloom--create'
  }
  return map[b] || ''
}
</script>

<style scoped>
.concepts {
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
  font-size: 0.95rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.65rem;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  min-width: 160px;
  outline: none;
  transition: border-color 0.15s;
}

.filter-select:focus { border-color: #2563eb; background: #ffffff; }

.reset-btn {
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  align-self: flex-end;
}

.reset-btn:hover { background: #e2e8f0; }

/* Family sections */
.family-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.family-header {
  padding: 1.25rem 1.5rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.family-section--f1 .family-header { background: #eff6ff; border: 1px solid #bfdbfe; }
.family-section--f2 .family-header { background: #fff7ed; border: 1px solid #fed7aa; }
.family-section--f3 .family-header { background: #f0fdf4; border: 1px solid #bbf7d0; }

.family-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.family-title-row h2 {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
}

.family-section--f1 .family-title-row h2 { color: #1e40af; }
.family-section--f2 .family-title-row h2 { color: #9a3412; }
.family-section--f3 .family-title-row h2 { color: #166534; }

.risk-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.risk--max { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
.risk--high { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
.risk--mod { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

.concept-count {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: auto;
}

.family-description {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
}

/* Concept cards grid */
.concepts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.concept-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: box-shadow 0.15s;
}

.concept-card:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.concept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.concept-id {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  font-family: monospace;
}

.concept-year {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
}

.concept-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.concept-desc {
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.5;
  flex: 1;
}

.concept-bloom {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.bloom-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 3px;
}

.bloom--remember  { background: #dbeafe; color: #1e40af; }
.bloom--understand { background: #ede9fe; color: #5b21b6; }
.bloom--apply     { background: #d1fae5; color: #065f46; }
.bloom--analyze   { background: #fef3c7; color: #92400e; }
.bloom--evaluate  { background: #ffedd5; color: #9a3412; }
.bloom--create    { background: #fce7f3; color: #9d174d; }

.concept-fuller {
  display: flex;
  gap: 0.35rem;
  align-items: center;
  font-size: 0.75rem;
}

.fuller-label {
  font-weight: 600;
  color: #64748b;
}

.fuller-value {
  color: #475569;
}

.concept-tools {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.4rem;
  border-top: 1px solid #f1f5f9;
}

.tools-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tools-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.tool-ref {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
  cursor: default;
}

.tool-ref--ideal { background: #1e293b; color: #f8fafc; }
.tool-ref--utile { background: #e2e8f0; color: #475569; }

.concept-refs {
  font-size: 0.72rem;
  color: #94a3b8;
  font-style: italic;
  line-height: 1.4;
}

.patron-details {
  border-top: 1px solid #fde68a;
  padding-top: 0.5rem;
}

.patron-summary {
  font-size: 0.75rem;
  font-weight: 700;
  color: #92400e;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  user-select: none;
  padding: 0.2rem 0;
}

.patron-summary::-webkit-details-marker { display: none; }

.patron-summary::before {
  content: '▶';
  font-size: 0.6rem;
  color: #d97706;
  transition: transform 0.15s;
  flex-shrink: 0;
}

details[open] .patron-summary::before {
  transform: rotate(90deg);
}

.patron-summary-titre {
  font-weight: 400;
  color: #78350f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.patron-in-card {
  margin-top: 0.5rem;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 3rem;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 10px;
}

.fuller-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  cursor: help;
  margin-left: 0.15rem;
}

/* Legende */
.legend {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.legend-toggle {
  padding: 0.9rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
}

.legend-toggle::-webkit-details-marker { display: none; }

.legend-toggle::before {
  content: '▶';
  font-size: 0.65rem;
  color: #94a3b8;
  transition: transform 0.2s;
}

details[open] .legend-toggle::before {
  transform: rotate(90deg);
}

.legend-body {
  border-top: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.legend-section h3 {
  font-size: 0.9rem;
  font-weight: 800;
  color: #1e293b;
}

.legend-intro {
  font-size: 0.82rem;
  color: #475569;
  line-height: 1.65;
}

/* Bloom grid */
.bloom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.bloom-entry {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid transparent;
}

.bloom-entry--remember  { background: #eff6ff; border-color: #bfdbfe; }
.bloom-entry--understand { background: #f5f3ff; border-color: #ddd6fe; }
.bloom-entry--apply     { background: #f0fdf4; border-color: #bbf7d0; }
.bloom-entry--analyze   { background: #fffbeb; border-color: #fde68a; }
.bloom-entry--evaluate  { background: #fff7ed; border-color: #fed7aa; }
.bloom-entry--create    { background: #fdf2f8; border-color: #f9a8d4; }

.be-tag {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  white-space: nowrap;
}

.bloom-entry--remember  .be-tag { background: #dbeafe; color: #1e40af; }
.bloom-entry--understand .be-tag { background: #ede9fe; color: #5b21b6; }
.bloom-entry--apply     .be-tag { background: #d1fae5; color: #065f46; }
.bloom-entry--analyze   .be-tag { background: #fef3c7; color: #92400e; }
.bloom-entry--evaluate  .be-tag { background: #ffedd5; color: #9a3412; }
.bloom-entry--create    .be-tag { background: #fce7f3; color: #9d174d; }

.bloom-entry strong {
  display: block;
  font-size: 0.82rem;
  color: #1e293b;
  margin-bottom: 0.2rem;
}

.bloom-entry p {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.5;
}

/* Risk grid */
.risk-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.risk-entry {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  border: 1px solid transparent;
}

.risk-entry--max { background: #fef2f2; border-color: #fecaca; }
.risk-entry--high { background: #fff7ed; border-color: #fed7aa; }
.risk-entry--mod { background: #f0fdf4; border-color: #bbf7d0; }

.re-badge {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.risk-entry strong {
  display: block;
  font-size: 0.82rem;
  color: #1e293b;
  margin-bottom: 0.2rem;
}

.risk-entry p {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.55;
}

/* Fuller grid */
.fuller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

.fuller-entry {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.fe-tag {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: #1e293b;
  color: #f8fafc;
  flex-shrink: 0;
  margin-top: 2px;
}

.fuller-entry strong {
  display: block;
  font-size: 0.82rem;
  color: #1e293b;
  margin-bottom: 0.2rem;
}

.fuller-entry p {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.5;
}

/* Matrix legend */
.matrix-legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.75rem;
}

.ml-title {
  font-weight: 700;
  color: #475569;
}

.ml-item {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: monospace;
}

.ml--ideal { background: #1e293b; color: #f8fafc; }
.ml--utile { background: #e2e8f0; color: #475569; }
.ml--ctx   { background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }

.ml-sep {
  color: #94a3b8;
}
</style>
