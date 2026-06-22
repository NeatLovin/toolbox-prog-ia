<template>
  <div class="stat-strip ui-card" role="region" aria-label="Statistiques de la Toolbox">

    <div class="kpi-row">
      <div v-for="kpi in kpis" :key="kpi.label" class="kpi-item">
        <strong class="kpi-value">{{ kpi.value }}</strong>
        <span class="u-eyebrow kpi-label">{{ kpi.label }}</span>
      </div>
    </div>

    <div class="proof-section">
      <span class="u-eyebrow proof-heading">Niveau de preuve</span>
      <div
        class="proof-bar"
        role="img"
        :aria-label="`Niveau de preuve des outils : Validée ${counts.Validée}, Établie ${counts.Établie}, Émergente ${counts.Émergente}`"
      >
        <div class="proof-seg proof-seg--validee"   :style="{ flexBasis: pct(counts.Validée) }"   />
        <div class="proof-seg proof-seg--etablie"   :style="{ flexBasis: pct(counts.Établie) }"   />
        <div class="proof-seg proof-seg--emergente" :style="{ flexBasis: pct(counts.Émergente) }" />
      </div>
      <div class="proof-legend" aria-hidden="true">
        <span v-for="item in proofItems" :key="item.label" class="proof-legend-item">
          <span class="proof-swatch" :class="`proof-swatch--${item.cls}`" />
          {{ item.label }} <strong>{{ item.count }}</strong>
        </span>
      </div>
    </div>

  </div>
</template>

<script setup>
import toolsData   from '../data/tools.json'
import conceptsData from '../data/concepts.json'
import matrixData  from '../data/matrix.json'

const totalTools    = toolsData.length
const totalConcepts = conceptsData.length
const totalZones    = [...new Set(conceptsData.map(c => c.family))].length
const totalFamilies = [...new Set(toolsData.map(t => t.family))].length
const totalCells    = matrixData.cells.length
const idealCouples  = matrixData.cells.filter(c => c.score === 3).length

const kpis = [
  { value: totalTools,    label: 'outils' },
  { value: totalConcepts, label: 'concepts' },
  { value: totalZones,    label: 'zones' },
  { value: totalFamilies, label: 'familles' },
  { value: totalCells,    label: 'cellules' },
  { value: idealCouples,  label: 'idéaux' }
]

const counts = { Validée: 0, Établie: 0, Émergente: 0 }
toolsData.forEach(t => { if (t.efficacite in counts) counts[t.efficacite]++ })

function pct(n) { return `${(n / totalTools * 100).toFixed(1)}%` }

const proofItems = [
  { label: 'Validée',   count: counts.Validée,   cls: 'validee' },
  { label: 'Établie',   count: counts.Établie,   cls: 'etablie' },
  { label: 'Émergente', count: counts.Émergente, cls: 'emergente' }
]
</script>

<style scoped>
.stat-strip {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ---- KPI row ---- */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--space-2);
}

.kpi-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.kpi-value {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
  line-height: 1;
}

.kpi-label {
  color: var(--color-text-faint);
}

/* ---- Proof section ---- */
.proof-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.proof-heading {
  color: var(--color-text-faint);
}

.proof-bar {
  display: flex;
  height: 0.45rem;
  border-radius: var(--radius-pill);
  overflow: hidden;
  gap: 2px;
}

.proof-seg {
  height: 100%;
  flex-shrink: 0;
  transition: flex-basis var(--dur-3) var(--ease);
}

.proof-seg--validee   { background: var(--zone-logique); border-radius: var(--radius-pill) 0 0 var(--radius-pill); }
.proof-seg--etablie   { background: var(--color-border-strong); }
.proof-seg--emergente { background: var(--color-border); border-radius: 0 var(--radius-pill) var(--radius-pill) 0; }

.proof-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.proof-legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.proof-swatch {
  display: inline-block;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.proof-swatch--validee   { background: var(--zone-logique); }
.proof-swatch--etablie   { background: var(--color-border-strong); }
.proof-swatch--emergente { background: var(--color-border); border: 1.5px solid var(--color-border-strong); }

@media (max-width: 600px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
