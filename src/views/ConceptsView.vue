<template>
  <div class="concepts">
    <div class="ui-page-header">
      <h1>Concepts pédagogiques</h1>
      <p>
        La cartographie du TB décompose l'enseignement de la programmation en
        {{ concepts.length }} sous-concepts regroupés en {{ families.length }} familles macroscopiques.
        Chaque concept est annoté selon la taxonomie de Bloom, la dimension Fuller et le niveau de risque
        induit par l'IA générative. Les outils de référence sont extraits de la matrice de pertinence.
      </p>
    </div>

    <div class="ui-filter-bar">
      <div class="ui-filter-group">
        <label>Famille</label>
        <select v-model="selectedFamily" class="ui-filter-select">
          <option value="">Toutes</option>
          <option v-for="f in families" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>
      <div class="ui-filter-group">
        <label>Niveau Bloom</label>
        <select v-model="selectedBloom" class="ui-filter-select">
          <option value="">Tous</option>
          <option v-for="b in bloomLevels" :key="b" :value="b">{{ b }}</option>
        </select>
      </div>
      <div class="ui-filter-group">
        <label>Risque IA</label>
        <select v-model="selectedRisk" class="ui-filter-select">
          <option value="">Tous</option>
          <option value="Maximal">Maximal</option>
          <option value="Élevé">Élevé</option>
          <option value="Modéré">Modéré</option>
        </select>
      </div>
      <button v-if="hasFilters" class="ui-reset-btn" @click="resetFilters">Réinitialiser</button>
    </div>

    <!-- Légende explicative -->
    <details class="ui-collapsible">
      <summary>Comprendre les indicateurs : Bloom, Risque IA, Fuller</summary>

      <div class="ui-collapsible-body legend-body">

        <div class="legend-section">
          <h3>Taxonomie de Bloom en programmation</h3>
          <p class="legend-intro">
            Grille institutionnelle HES-SO (Guide IA 2024). Chaque sous-concept est annoté par le ou
            les niveaux Bloom qu'il mobilise principalement. L'IA générative perturbe différemment
            chaque niveau : elle excelle sur Remember-Apply (production syntaxique), performe moins
            bien sur Analyze-Evaluate et ne remplace pas le jugement requis par Create.
          </p>
          <div class="bloom-grid">
            <div v-for="b in bloomEntries" :key="b.key" class="bloom-entry" :class="`bloom-entry--${b.key}`">
              <span class="ui-badge" :class="`ui-badge--bloom-${b.key}`">{{ b.label }}</span>
              <div>
                <strong>{{ b.strong }}</strong>
                <p>{{ b.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="legend-section">
          <h3>Risque IA par famille de concepts</h3>
          <p class="legend-intro">
            Niveau de risque que l'étudiant délègue à l'IA sans construire de compréhension réelle.
            Dérivé de la littérature (Bastani 2025 PNAS, Lister 2004, Fuller 2007) et des 22
            entretiens enseignants du TB. Ce n'est pas un jugement sur l'outil IA mais sur le
            séquençage de son introduction dans le cursus.
          </p>
          <div class="risk-grid">
            <div class="risk-entry risk-entry--max">
              <span class="ui-badge ui-badge--risk-max">Risque Maximal</span>
              <div>
                <strong>Famille Syntaxe (F1)</strong>
                <p>L'IA générative produit de la syntaxe correcte de manière quasi systématique. Un étudiant peut générer et soumettre du code valide sans en comprendre un seul élément. C'est la zone du vibe coding et du fragile knowledge, où la détection est la plus difficile. Les outils d'évaluation doivent être robustes par construction (examen papier, oral, traçage).</p>
              </div>
            </div>
            <div class="risk-entry risk-entry--high">
              <span class="ui-badge ui-badge--risk-high">Risque Élevé</span>
              <div>
                <strong>Famille Logique (F2)</strong>
                <p>L'IA peut aider sur le raisonnement algorithmique mais risque de résoudre le problème à la place de l'étudiant, notamment sur le debugging et les tests. Le risque de délégation sans compréhension est élevé, en particulier hors classe où l'usage est non supervisé.</p>
              </div>
            </div>
            <div class="risk-entry risk-entry--mod">
              <span class="ui-badge ui-badge--risk-mod">Risque Modéré</span>
              <div>
                <strong>Famille Architecture (F3)</strong>
                <p>L'IA assiste sur la conception et la documentation mais ne remplace pas le jugement architectural : les choix de design sont non-triviaux et l'étudiant doit évaluer la pertinence des suggestions générées. Le risque reste présent (vibe coding architectural en S3-S4) mais l'écart entre sortie IA et attente pédagogique est plus facilement détectable.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="legend-section">
          <h3>Dimension Fuller (Fuller et al. 2007)</h3>
          <p class="legend-intro">
            Extension CS-spécifique de la taxonomie de Bloom publiée par Fuller et al. dans un rapport
            ITiCSE Working Group international de 2007. Elle croise les niveaux Bloom avec deux
            dimensions disciplinaires qui sont au coeur du diagnostic du TB sur l'IA générative.
          </p>
          <div class="fuller-grid">
            <div class="fuller-entry">
              <span class="fe-tag">Produce</span>
              <div>
                <strong>Produire du code, un algorithme, une solution</strong>
                <p>La dimension que l'IA générative supplante le plus facilement : générer du code fonctionnel à partir d'un énoncé. Un étudiant qui s'appuie sur l'IA pour la production sans pratiquer lui-même ne développe pas cette compétence.</p>
              </div>
            </div>
            <div class="fuller-entry">
              <span class="fe-tag">Interpret</span>
              <div>
                <strong>Lire, tracer, expliquer du code existant</strong>
                <p>La dimension que l'IA maîtrise moins bien et que l'étudiant peut moins facilement déléguer. Les tuteurs IA scaffoldés (CodeHelp I02, CS50 Duck I04) misent précisément sur Interpret pour vérifier la compréhension réelle. Lister et al. 2004 montrent que la maîtrise d'Interpret est le meilleur prédicteur de réussite en programmation.</p>
              </div>
            </div>
          </div>
          <div class="matrix-legend">
            <span class="ml-title">Scores de la matrice de pertinence :</span>
            <span class="ui-badge ui-badge--score-ideal">Idéal (3)</span>
            <span class="ml-sep">référence littérature ou terrain</span>
            <span class="ui-badge ui-badge--score-utile">Utile (2)</span>
            <span class="ml-sep">complément efficace</span>
            <span class="ui-badge ui-badge--score-ctx">Contextuel (1)</span>
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
            <span class="ui-badge" :class="riskClass(fam.risk_ai)">
              Risque IA {{ fam.risk_ai }}
            </span>
            <span class="concept-count">{{ fam.concepts.length }} concept{{ fam.concepts.length > 1 ? 's' : '' }}</span>
          </div>
          <p class="family-description">{{ fam.description }}</p>
        </div>

        <!-- Pile de DisclosureCard, une par concept -->
        <div class="concepts-list">
          <DisclosureCard
            v-for="concept in fam.concepts"
            :key="concept.id"
            details-label="Indicateurs et description"
            deep-label="Références et cadre"
          >
            <!-- Niveau 1 : identité + description -->
            <template #summary>
              <div class="cs-meta-row">
                <span class="cs-id">{{ concept.id }}</span>
                <span class="ui-badge ui-badge--level">{{ concept.level }}</span>
                <span class="ui-badge" :class="riskClass(fam.risk_ai)" style="margin-left:auto;">{{ fam.risk_ai }}</span>
              </div>
              <p class="cs-name">{{ concept.name }}</p>
              <p class="cs-desc">{{ concept.description }}</p>
            </template>

            <!-- Niveau 2 : Bloom, outils idéaux, patrons -->
            <template #details>
              <div class="cs-details-body">

                <div class="cs-block">
                  <span class="cs-block-label">Niveaux Bloom</span>
                  <div class="cs-badge-row">
                    <span
                      v-for="b in concept.bloom"
                      :key="b"
                      class="ui-badge"
                      :class="bloomClass(b)"
                      :title="bloomDesc[b]"
                    >{{ b }}</span>
                  </div>
                </div>

                <div v-if="idealTools(concept.id).length" class="cs-block">
                  <span class="cs-block-label">Outils idéaux (score 3)</span>
                  <div class="cs-badge-row">
                    <span
                      v-for="entry in idealTools(concept.id)"
                      :key="entry.toolId"
                      class="ui-badge ui-badge--score-ideal cs-tool-id"
                      :title="toolName(entry.toolId)"
                    >{{ entry.toolId }}</span>
                  </div>
                </div>

                <div v-if="getPatronsByConcept(concept.id).length" class="cs-block">
                  <span class="cs-block-label">
                    {{ getPatronsByConcept(concept.id).length > 1 ? 'Patrons' : 'Patron' }}
                    pédagogique{{ getPatronsByConcept(concept.id).length > 1 ? 's' : '' }}
                  </span>
                  <div class="cs-patrons">
                    <PatronBlock
                      v-for="patron in getPatronsByConcept(concept.id)"
                      :key="patron.id"
                      :patron="patron"
                    />
                  </div>
                </div>

              </div>
            </template>

            <!-- Niveau 3 : Fuller + références -->
            <template #deep>
              <div class="cs-deep-body">
                <div class="cs-deep-block">
                  <span class="cs-block-label">Dimension Fuller</span>
                  <p class="cs-deep-strong">{{ concept.fuller }}</p>
                  <p class="cs-deep-hint">{{ fullerHint(concept.fuller) }}</p>
                </div>
                <div v-if="concept.references" class="cs-deep-block">
                  <span class="cs-block-label">Références</span>
                  <p class="cs-deep-refs">{{ concept.references }}</p>
                </div>
              </div>
            </template>
          </DisclosureCard>
        </div>

      </section>
    </template>

    <div v-if="visibleFamilies.length === 0" class="ui-empty-state">
      Aucun concept ne correspond aux filtres sélectionnés.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useData } from '../composables/useData.js'
import DisclosureCard from '../components/DisclosureCard.vue'
import PatronBlock from '../components/PatronBlock.vue'

const { concepts, tools, matrix, getPatronsByConcept } = useData()

const selectedFamily = ref('')
const selectedBloom  = ref('')
const selectedRisk   = ref('')

const bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']

const bloomDesc = {
  Remember:  'Mémoriser, reconnaître la syntaxe et les règles. Zone de risque IA maximal.',
  Understand:'Expliquer, prédire le comportement d\'un programme, tracer son exécution.',
  Apply:     'Écrire du code fonctionnel pour un problème donné. Cible privilégiée du vibe coding.',
  Analyze:   'Décomposer, identifier des bugs, comparer des solutions et des algorithmes.',
  Evaluate:  'Juger la qualité d\'un code, argumenter des choix de conception, faire un code review.',
  Create:    'Concevoir une architecture ou un système original. Bloom maximal, S5-S6.'
}

const bloomEntries = [
  { key: 'remember',   label: 'Remember',  strong: 'Mémoriser, reconnaître',    desc: bloomDesc.Remember   },
  { key: 'understand', label: 'Understand', strong: 'Expliquer, prédire',        desc: bloomDesc.Understand },
  { key: 'apply',      label: 'Apply',      strong: 'Exécuter, implémenter',     desc: bloomDesc.Apply      },
  { key: 'analyze',    label: 'Analyze',    strong: 'Décomposer, différencier',  desc: bloomDesc.Analyze    },
  { key: 'evaluate',   label: 'Evaluate',   strong: 'Juger, critiquer',          desc: bloomDesc.Evaluate   },
  { key: 'create',     label: 'Create',     strong: 'Concevoir, produire',       desc: bloomDesc.Create     }
]

function fullerHint(fuller) {
  if (fuller?.includes('Produce') && fuller?.includes('Interpret'))
    return 'Produce (écrire du code) et Interpret (lire/tracer du code) sont tous les deux mobilisés.'
  if (fuller?.includes('Produce'))   return 'Principalement Produce : l\'étudiant doit produire du code ou un algorithme.'
  if (fuller?.includes('Interpret')) return 'Principalement Interpret : l\'étudiant doit lire, tracer et expliquer du code existant.'
  return fuller || ''
}

const hasFilters = computed(() =>
  selectedFamily.value !== '' || selectedBloom.value !== '' || selectedRisk.value !== ''
)

function resetFilters() { selectedFamily.value = ''; selectedBloom.value = ''; selectedRisk.value = '' }

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
function idealTools(conceptId) { return (matrixMap.value[conceptId] || []).filter(e => e.score === 3) }
function toolName(id) { return toolNameMap[id] || id }

const families = computed(() => {
  const famMap = {}
  concepts.forEach(c => {
    if (!famMap[c.family_id]) {
      famMap[c.family_id] = { id: c.family_id, name: c.family, description: c.family_description, risk_ai: c.risk_ai, concepts: [] }
    }
    famMap[c.family_id].concepts.push(c)
  })
  return Object.values(famMap)
})

const visibleFamilies = computed(() =>
  families.value
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
)

function riskClass(risk) {
  if (risk === 'Maximal') return 'ui-badge--risk-max'
  if (risk === 'Élevé')   return 'ui-badge--risk-high'
  return 'ui-badge--risk-mod'
}

function bloomClass(b) {
  const map = {
    Remember:  'ui-badge--bloom-remember',
    Understand:'ui-badge--bloom-understand',
    Apply:     'ui-badge--bloom-apply',
    Analyze:   'ui-badge--bloom-analyze',
    Evaluate:  'ui-badge--bloom-evaluate',
    Create:    'ui-badge--bloom-create'
  }
  return map[b] || ''
}
</script>

<style scoped>
.concepts { display: flex; flex-direction: column; gap: var(--space-8); }

/* Sections par famille */
.family-section { display: flex; flex-direction: column; gap: var(--space-4); }

.family-header {
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.family-section--f1 .family-header { background: var(--zone-syntaxe-bg);      border: 1px solid var(--zone-syntaxe-border); }
.family-section--f2 .family-header { background: var(--zone-logique-bg);       border: 1px solid var(--zone-logique-border); }
.family-section--f3 .family-header { background: var(--zone-architecture-bg);  border: 1px solid var(--zone-architecture-border); }

.family-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.family-title-row h2 { font-size: var(--text-2xl); font-weight: 800; }

.family-section--f1 .family-title-row h2 { color: var(--zone-syntaxe-text); }
.family-section--f2 .family-title-row h2 { color: var(--zone-logique-text); }
.family-section--f3 .family-title-row h2 { color: var(--zone-architecture-text); }

.concept-count { font-size: 0.8rem; color: var(--color-text-faint); margin-left: auto; }
.family-description { font-size: var(--text-base); color: var(--color-text-muted); line-height: 1.6; }

/* Pile de DisclosureCard */
.concepts-list { display: flex; flex-direction: column; gap: var(--space-3); }

/* Contenu du slot summary */
.cs-meta-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.cs-id {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-placeholder);
  font-family: monospace;
}

.cs-name {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.cs-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* Contenu du slot details */
.cs-details-body { display: flex; flex-direction: column; gap: var(--space-4); }

.cs-block { display: flex; flex-direction: column; gap: 0.4rem; }

.cs-block-label {
  font-size: var(--text-2xs);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-faint);
}

.cs-badge-row { display: flex; flex-wrap: wrap; gap: 0.3rem; }

.cs-tool-id { font-family: monospace; }

.cs-patrons { display: flex; flex-direction: column; gap: var(--space-3); }

/* Contenu du slot deep */
.cs-deep-body { display: flex; flex-direction: column; gap: var(--space-4); }

.cs-deep-block { display: flex; flex-direction: column; gap: 0.3rem; }

.cs-deep-strong {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text);
}

.cs-deep-hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  line-height: 1.55;
}

.cs-deep-refs {
  font-size: var(--text-sm);
  color: var(--color-text-placeholder);
  font-style: italic;
  line-height: 1.5;
}

/* Légende */
.legend-body { display: flex; flex-direction: column; gap: var(--space-8); }

.legend-section { display: flex; flex-direction: column; gap: var(--space-3); }
.legend-section h3 { font-size: var(--text-base); font-weight: 800; color: var(--color-text); }
.legend-intro { font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.65; }

.bloom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}

.bloom-entry {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
}

.bloom-entry--remember  { background: var(--bloom-remember-bg);  border-color: rgba(0,0,0,0.08); }
.bloom-entry--understand { background: var(--bloom-understand-bg); border-color: rgba(0,0,0,0.08); }
.bloom-entry--apply     { background: var(--bloom-apply-bg);      border-color: rgba(0,0,0,0.08); }
.bloom-entry--analyze   { background: var(--bloom-analyze-bg);    border-color: rgba(0,0,0,0.08); }
.bloom-entry--evaluate  { background: var(--bloom-evaluate-bg);   border-color: rgba(0,0,0,0.08); }
.bloom-entry--create    { background: var(--bloom-create-bg);     border-color: rgba(0,0,0,0.08); }

.bloom-entry strong { display: block; font-size: var(--text-sm); color: var(--color-text); margin-bottom: 0.2rem; }
.bloom-entry p      { font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.5; }

.risk-grid { display: flex; flex-direction: column; gap: var(--space-3); }
.risk-entry {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: 0.9rem var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
}
.risk-entry--max  { background: var(--risk-max-bg);  border-color: var(--risk-max-border);  }
.risk-entry--high { background: var(--risk-high-bg); border-color: var(--risk-high-border); }
.risk-entry--mod  { background: var(--risk-mod-bg);  border-color: var(--risk-mod-border);  }

.risk-entry strong { display: block; font-size: var(--text-sm); color: var(--color-text); margin-bottom: 0.2rem; }
.risk-entry p      { font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.55; }

.fuller-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
}

.fuller-entry {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.fe-tag {
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-bg);
  flex-shrink: 0;
  margin-top: 2px;
}

.fuller-entry strong { display: block; font-size: var(--text-sm); color: var(--color-text); margin-bottom: 0.2rem; }
.fuller-entry p      { font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.5; }

.matrix-legend {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: 0.6rem 0.75rem;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
}

.ml-title { font-weight: 700; color: var(--color-text-muted); }
.ml-sep   { color: var(--color-text-placeholder); }

@media (max-width: 640px) {
  .bloom-grid  { grid-template-columns: 1fr; }
  .fuller-grid { grid-template-columns: 1fr; }
}
</style>
