<template>
  <!-- 1. Aggregate mini-grid -->
  <section class="agg-wrap" aria-label="Vue d'ensemble par famille et zone">
    <p class="u-eyebrow agg-title">Score moyen par famille × zone (sur l'ensemble de la matrice)</p>
    <div class="agg-grid">
      <div class="agg-corner"></div>
      <div v-for="z in ZONES" :key="z" class="agg-zone-head" :style="{ color: `var(--zone-${ZONE_KEYS[z]})` }">{{ z }}</div>
      <template v-for="fam in FAMILIES" :key="fam">
        <div class="agg-fam-head" :title="FAMILY_LABELS[fam]">
          <span class="u-eyebrow">{{ fam }}</span>
          <span class="agg-fam-label">{{ FAMILY_LABELS_SHORT[fam] }}</span>
        </div>
        <div
          v-for="z in ZONES" :key="z"
          class="agg-cell"
          :style="{ background: aggBg(z, fam) }"
          :title="`${FAMILY_LABELS[fam]} × ${z} : ${AGG_SCORES[fam][z].toFixed(2)} / 3`"
        >{{ AGG_SCORES[fam][z] > 0 ? AGG_SCORES[fam][z].toFixed(1) : '-' }}</div>
      </template>
    </div>
  </section>

  <!-- 2. Légende -->
  <section class="legend-wrap">
    <p class="legend-note">
      Le score encode la valeur pédagogique de l'outil pour ce concept, non la capacité de l'IA à le maîtriser.
    </p>
    <div class="legend-items">
      <span class="leg-label u-eyebrow">Intensité :</span>
      <span class="leg-item"><span class="leg-swatch" :style="{ background: swatchBg(3) }"></span>Idéal (3)</span>
      <span class="leg-item"><span class="leg-swatch" :style="{ background: swatchBg(2) }"></span>Utile (2)</span>
      <span class="leg-item"><span class="leg-swatch" :style="{ background: swatchBg(1) }"></span>Contextuel (1)</span>
      <span class="leg-item"><span class="leg-swatch leg-swatch--empty"></span>Non évalué</span>
      <span class="leg-sep" aria-hidden="true">·</span>
      <span class="leg-label u-eyebrow">Teinte :</span>
      <span class="leg-item"><span class="leg-swatch" style="background: var(--zone-syntaxe)"></span>Syntaxe</span>
      <span class="leg-item"><span class="leg-swatch" style="background: var(--zone-logique)"></span>Logique</span>
      <span class="leg-item"><span class="leg-swatch" style="background: var(--zone-architecture)"></span>Architecture</span>
    </div>
  </section>

  <!-- 3. Filtres -->
  <div class="ui-filter-bar hm-filters">
    <div class="ui-filter-group">
      <label for="hm-fz">Zone</label>
      <select id="hm-fz" class="ui-filter-select" v-model="filterZone">
        <option value="">Toutes les zones</option>
        <option v-for="z in ZONES" :key="z" :value="z">{{ z }}</option>
      </select>
    </div>
    <div class="ui-filter-group">
      <label for="hm-ff">Famille</label>
      <select id="hm-ff" class="ui-filter-select" v-model="filterFamily">
        <option value="">Toutes les familles</option>
        <option v-for="f in FAMILIES" :key="f" :value="f">{{ FAMILY_LABELS[f] }}</option>
      </select>
    </div>
    <button class="ui-reset-btn" @click="filterZone = ''; filterFamily = ''">Réinitialiser</button>
    <span class="hm-count u-eyebrow">{{ filteredTools.length }} outils × {{ filteredConcepts.length }} concepts</span>
  </div>

  <!-- 4. Table -->
  <div class="hm-scroll" role="region" aria-label="Matrice de pertinence outils-concepts">
    <table class="hm-table">
      <caption class="sr-only">
        Carte de chaleur : {{ filteredTools.length }} outils pédagogiques × {{ filteredConcepts.length }} concepts de programmation.
        Teinte = zone (bleu Syntaxe, sarcelle Logique, violet Architecture). Intensité = score de 1 (Contextuel) à 3 (Idéal).
      </caption>
      <thead>
        <tr class="hm-tr-zones">
          <th scope="col" rowspan="2" class="hm-corner">Outil</th>
          <th
            v-for="zg in visibleZoneGroups"
            :key="zg.zone"
            scope="colgroup"
            :colspan="zg.count"
            class="hm-th-zone"
            :style="zoneGroupStyle(zg.zone)"
          >{{ zg.zone }}</th>
        </tr>
        <tr class="hm-tr-concepts">
          <th
            v-for="concept in filteredConcepts"
            :key="concept.id"
            scope="col"
            class="hm-th-concept"
            :class="{ 'hm-th--zone-last': zoneLastIds.has(concept.id) }"
            :title="`${concept.id} : ${concept.name}`"
            :style="{ background: `color-mix(in srgb, var(--zone-${ZONE_KEYS[concept.family]}) 9%, var(--color-surface))` }"
          ><span class="hm-concept-id">{{ concept.id }}</span><span class="hm-concept-name">{{ truncateName(concept.name) }}</span></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="fam in visibleFamilies" :key="fam">
          <tr class="hm-tr-family">
            <td :colspan="filteredConcepts.length + 1">
              <div class="hm-td-fam-inner">
                <span :class="['ui-badge', FAMILY_BADGE[fam]]">{{ fam }}</span>
                {{ FAMILY_LABELS[fam] }}
              </div>
            </td>
          </tr>
          <tr v-for="tool in filteredToolsByFamily[fam]" :key="tool.id" class="hm-tr-tool">
            <th scope="row" class="hm-th-tool">
              <div class="hm-tool-inner">
                <span class="hm-tool-name">{{ tool.name }}</span>
                <span class="hm-tool-id">{{ tool.id }}</span>
              </div>
            </th>
            <td
              v-for="concept in filteredConcepts"
              :key="concept.id"
              class="hm-sc"
              :class="{ 'hm-sc--zone-last': zoneLastIds.has(concept.id) }"
              :style="tdStyle(tool.id, concept)"
              :title="tdLabel(tool, concept)"
              :aria-label="tdLabel(tool, concept)"
              @mousemove="showTip($event, tdLabel(tool, concept))"
              @mouseleave="hideTip()"
            >{{ SCORE_MAP[tool.id]?.[concept.id] || '' }}</td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <!-- Infobulle -->
  <Teleport to="body">
    <div v-if="tip.show" class="hm-tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }" aria-hidden="true">
      {{ tip.text }}
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import matrixData   from '../data/matrix.json'
import toolsData    from '../data/tools.json'
import conceptsData from '../data/concepts.json'

// ─── Constantes ───────────────────────────────────────────────────────────────
const ZONES     = ['Syntaxe', 'Logique', 'Architecture']
const ZONE_KEYS = { Syntaxe: 'syntaxe', Logique: 'logique', Architecture: 'architecture' }
const FAMILIES  = ['FM1', 'FM2', 'FM3', 'FM4']
const FAMILY_LABELS = {
  FM1: 'Méthodes pédagogiques traditionnelles',
  FM2: 'Dispositifs traditionnels outillés',
  FM3: 'Tuteurs IA et dispositifs scaffoldés',
  FM4: 'Outils agentiques et IA généraliste'
}
const FAMILY_BADGE  = { FM1: 'ui-badge--family-m', FM2: 'ui-badge--family-t', FM3: 'ui-badge--family-i', FM4: 'ui-badge--family-a' }
const FAMILY_LABELS_SHORT = { FM1: 'Méthodes', FM2: 'Outillés', FM3: 'Tuteurs IA', FM4: 'Agentique' }
const SCORE_LABEL   = { 0: 'Non évalué', 1: 'Contextuel', 2: 'Utile', 3: 'Idéal' }

function truncateName(name, n = 14) {
  return name.length > n ? name.slice(0, n) + '…' : name
}

// ─── Pré-calcul statique ──────────────────────────────────────────────────────
const SCORE_MAP = {}
for (const cell of matrixData.cells) {
  if (!SCORE_MAP[cell.tool]) SCORE_MAP[cell.tool] = {}
  SCORE_MAP[cell.tool][cell.concept] = cell.score
}

const TOOLS_BY_FAMILY = {}
for (const fam of FAMILIES) {
  TOOLS_BY_FAMILY[fam] = toolsData
    .filter(t => t.family === fam)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
}

const CONCEPTS_BY_ZONE = {}
for (const z of ZONES) {
  CONCEPTS_BY_ZONE[z] = conceptsData
    .filter(c => c.family === z)
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
}

const AGG_SCORES = {}
for (const fam of FAMILIES) {
  AGG_SCORES[fam] = {}
  for (const z of ZONES) {
    let total = 0, count = 0
    for (const t of TOOLS_BY_FAMILY[fam]) {
      for (const c of CONCEPTS_BY_ZONE[z]) {
        const s = SCORE_MAP[t.id]?.[c.id]
        if (s) { total += s; count++ }
      }
    }
    AGG_SCORES[fam][z] = count > 0 ? total / count : 0
  }
}

// ─── État réactif ─────────────────────────────────────────────────────────────
const filterZone   = ref('')
const filterFamily = ref('')
const tip = ref({ show: false, text: '', x: 0, y: 0 })

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredConcepts = computed(() => {
  const zones = filterZone.value ? [filterZone.value] : ZONES
  return zones.flatMap(z => CONCEPTS_BY_ZONE[z] ?? [])
})

const filteredTools = computed(() => {
  const fams = filterFamily.value ? [filterFamily.value] : FAMILIES
  return fams.flatMap(f => TOOLS_BY_FAMILY[f] ?? [])
})

const filteredToolsByFamily = computed(() => {
  const result = {}
  for (const fam of FAMILIES) {
    result[fam] = (!filterFamily.value || filterFamily.value === fam)
      ? (TOOLS_BY_FAMILY[fam] ?? [])
      : []
  }
  return result
})

const visibleFamilies = computed(() =>
  filterFamily.value ? [filterFamily.value] : FAMILIES
)

const visibleZoneGroups = computed(() => {
  const zones = filterZone.value ? [filterZone.value] : ZONES
  return zones.map(z => ({ zone: z, count: (CONCEPTS_BY_ZONE[z] ?? []).length }))
})

const zoneLastIds = computed(() => {
  const ids = new Set()
  for (const zg of visibleZoneGroups.value) {
    const arr = CONCEPTS_BY_ZONE[zg.zone] ?? []
    if (arr.length) ids.add(arr[arr.length - 1].id)
  }
  return ids
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cellBg(zoneKey, score) {
  if (!score) return ''
  if (score === 3) return `color-mix(in srgb, var(--zone-${zoneKey}) 62%, var(--color-surface))`
  if (score === 2) return `color-mix(in srgb, var(--zone-${zoneKey}) 35%, var(--color-surface))`
  return `color-mix(in srgb, var(--zone-${zoneKey}) 22%, var(--color-surface))`
}

function swatchBg(score) { return cellBg('logique', score) }

function aggBg(zone, fam) {
  const s = AGG_SCORES[fam]?.[zone] ?? 0
  if (!s) return 'var(--color-bg)'
  const pct = Math.round(s / 3 * 50)
  return `color-mix(in srgb, var(--zone-${ZONE_KEYS[zone]}) ${pct}%, var(--color-surface))`
}

function zoneGroupStyle(zone) {
  return {
    background: `color-mix(in srgb, var(--zone-${ZONE_KEYS[zone]}) 12%, var(--color-surface))`,
    color: `var(--zone-${ZONE_KEYS[zone]})`
  }
}

function tdStyle(toolId, concept) {
  const score = SCORE_MAP[toolId]?.[concept.id] ?? 0
  const bg = cellBg(ZONE_KEYS[concept.family], score)
  return bg ? { background: bg } : {}
}

function tdLabel(tool, concept) {
  const score = SCORE_MAP[tool.id]?.[concept.id] ?? 0
  return `${tool.name}, ${concept.name} : ${SCORE_LABEL[score]}`
}

function showTip(e, text) {
  tip.value = { show: true, text, x: e.clientX + 14, y: e.clientY - 40 }
}
function hideTip() { tip.value.show = false }
</script>

<style scoped>
.sr-only {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
}

/* ── Aggregate ────────────────────────────────────────────────────────────── */
.agg-wrap { display: flex; flex-direction: column; gap: var(--space-3); }
.agg-title { margin-bottom: var(--space-1); }

.agg-grid {
  display: grid;
  grid-template-columns: 7rem repeat(3, 1fr);
  gap: 4px;
  max-width: 520px;
}
.agg-corner {}
.agg-zone-head {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  text-align: center;
  padding: var(--space-2);
}
.agg-fam-head {
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  cursor: default;
}
.agg-fam-label {
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--color-text-faint);
  line-height: 1.2;
}
.agg-cell {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  text-align: center;
  padding: 0.45rem var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  cursor: default;
  transition: filter var(--dur-2) var(--ease);
}
.agg-cell:hover { filter: brightness(0.90); }

/* ── Légende ────────────────────────────────────────────────────────────────── */
.legend-wrap { display: flex; flex-direction: column; gap: var(--space-2); }
.legend-note {
  font-size: var(--text-xs);
  color: var(--color-text-faint);
  font-style: italic;
  line-height: 1.5;
}
.legend-items {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.leg-label { color: var(--color-text-faint); }
.leg-sep   { color: var(--color-border-strong); user-select: none; }
.leg-item  { display: flex; align-items: center; gap: 5px; }
.leg-swatch {
  display: inline-block;
  width: 20px; height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.leg-swatch--empty {
  background: var(--color-surface);
  border: 1.5px solid var(--color-border-strong);
}

/* ── Filtres ────────────────────────────────────────────────────────────────── */
.hm-filters { align-items: flex-end; }
.hm-count {
  margin-left: auto;
  color: var(--color-text-faint);
  align-self: flex-end;
  padding-bottom: 0.5rem;
}

/* ── Conteneur scrollable ───────────────────────────────────────────────────── */
.hm-scroll {
  overflow: auto;
  max-height: 72vh;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  background: var(--color-surface);
}

/* ── Table ──────────────────────────────────────────────────────────────────── */
.hm-table {
  border-collapse: collapse;
  width: max-content;
  min-width: 100%;
}

/* Cellule coin : sticky top + left */
.hm-corner {
  position: sticky;
  top: 0; left: 0;
  z-index: 4;
  background: var(--color-surface);
  border-bottom: 2px solid var(--color-border-strong);
  border-right: 2px solid var(--color-border-strong);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-faint);
  padding: 0.4rem 0.8rem;
  min-width: 168px;
  text-align: left;
  vertical-align: bottom;
  white-space: nowrap;
}

/* En-têtes de zone (row 1) */
.hm-tr-zones .hm-th-zone {
  position: sticky;
  top: 0;
  z-index: 2;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  text-align: center;
  padding: 0.35rem var(--space-2);
  border-bottom: 1px solid var(--color-border);
  border-right: 2px solid var(--color-border-strong);
  white-space: nowrap;
  height: 2.1rem;
}
.hm-tr-zones .hm-th-zone:last-child { border-right: none; }

/* En-têtes de concept (row 2) */
.hm-tr-concepts .hm-th-concept {
  position: sticky;
  top: 2.1rem;
  z-index: 2;
  padding: 0.4rem 0;
  border-bottom: 2px solid var(--color-border-strong);
  border-right: 1px solid var(--color-border);
  vertical-align: bottom;
  text-align: center;
  width: 34px;
  min-width: 34px;
}
.hm-th-concept.hm-th--zone-last {
  border-right: 2px solid var(--color-border-strong);
}

.hm-concept-id {
  display: inline-block;
  vertical-align: bottom;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 700;
  color: var(--color-text-muted);
  white-space: nowrap;
  padding: 0.35rem 0;
  cursor: default;
}

.hm-concept-name {
  display: inline-block;
  vertical-align: bottom;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--color-text-faint);
  white-space: nowrap;
  padding: 0.35rem 0;
  cursor: default;
}

/* Ligne de groupe famille */
.hm-tr-family td {
  background: var(--color-surface-2);
  border-top: 1px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border);
  padding: 0;
}
.hm-td-fam-inner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.3rem 0.8rem;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
}

/* Cellule nom d'outil (sticky left) */
.hm-th-tool {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--color-surface);
  border-right: 2px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border);
  padding: 3px 0.8rem;
  text-align: left;
  vertical-align: middle;
  min-width: 168px;
  max-width: 220px;
  transition: background var(--dur-1) var(--ease);
}
.hm-tr-tool:hover .hm-th-tool { background: var(--color-accent-subtle); }

.hm-tool-inner {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}
.hm-tool-name {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 190px;
}
.hm-tool-id {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-placeholder);
}

/* Cellules de données */
.hm-sc {
  width: 34px;
  min-width: 34px;
  height: 26px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  cursor: default;
  transition: filter var(--dur-1) var(--ease);
  text-align: center;
  vertical-align: middle;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}
.hm-sc:hover { filter: brightness(0.82) saturate(1.15); }
.hm-sc.hm-sc--zone-last { border-right: 2px solid var(--color-border-strong); }

/* Infobulle */
.hm-tip {
  position: fixed;
  z-index: 9999;
  background: var(--color-text);
  color: var(--color-surface);
  font-size: var(--text-xs);
  padding: 0.3rem 0.65rem;
  border-radius: var(--radius-sm);
  pointer-events: none;
  white-space: normal;
  max-width: 280px;
  line-height: 1.45;
  box-shadow: var(--shadow-md);
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .hm-corner, .hm-th-tool { min-width: 110px; }
  .hm-tool-name { font-size: var(--text-2xs); }
  .agg-grid { max-width: 100%; grid-template-columns: 4.5rem repeat(3, 1fr); }
  .legend-items { gap: var(--space-2); }
  .hm-scroll { max-height: 60vh; }
  .hm-count { display: none; }
}
</style>
