<template>
  <div
    class="zone-profile"
    :class="{
      'zone-profile--single': visibleZones.length === 1,
      'zone-profile--double': visibleZones.length === 2
    }"
    role="region"
    :aria-label="visibleZones.length < 3 ? 'Profil des zones pédagogiques détectées' : 'Profil des trois zones pédagogiques'"
  >
    <div
      v-for="z in visibleZones"
      :key="z.key"
      class="zone-col"
      :class="{ 'zone-col--emphasis': z.key === 'logique' }"
    >
      <div class="zone-header">
        <span class="u-eyebrow zone-eyebrow">Zone</span>
        <h3 class="zone-name" :style="{ color: `var(--zone-${z.key})` }">{{ z.name }}</h3>
      </div>

      <div class="gauge-block">
        <span class="u-eyebrow gauge-title">Risque de dérive IA</span>
        <div class="gauge-row">
          <div
            class="gauge-dots"
            role="img"
            :aria-label="`Risque de dérive IA : ${z.riskLabel}, ${z.riskLevel} sur 3`"
          >
            <span
              v-for="n in 3"
              :key="n"
              class="dot"
              :class="n <= z.riskLevel ? 'dot--filled' : 'dot--empty'"
              :style="n <= z.riskLevel ? { background: `var(--zone-${z.key})`, borderColor: `var(--zone-${z.key})` } : {}"
            />
          </div>
          <span class="gauge-text">{{ z.riskLabel }}</span>
        </div>
      </div>

      <div class="gauge-block">
        <span class="u-eyebrow gauge-title">Exigence cognitive</span>
        <div class="gauge-row">
          <div
            class="gauge-dots"
            role="img"
            :aria-label="`Exigence cognitive : ${z.cogLabel}, ${z.cogLevel} sur 3`"
          >
            <span
              v-for="n in 3"
              :key="n"
              class="dot"
              :class="n <= z.cogLevel ? 'dot--filled' : 'dot--empty'"
              :style="n <= z.cogLevel ? { background: `var(--zone-${z.key})`, borderColor: `var(--zone-${z.key})` } : {}"
            />
          </div>
          <span class="gauge-text">{{ z.cogLabel }}</span>
        </div>
      </div>

      <div v-if="showPosture" class="zone-posture">
        <span class="u-eyebrow gauge-title">Posture conseillée</span>
        <p class="zone-posture-text">{{ z.posture }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import conceptsData from '../data/concepts.json'
import { ZONE_POSTURES } from '../lib/recommendation.js'

const BLOOM_RANK = { Remember: 1, Understand: 2, Apply: 3, Analyze: 4, Evaluate: 5, Create: 6 }
const RISK_LEVEL = { 'Maximal': 3, 'Élevé': 2, 'Modéré': 1 }

const props = defineProps({
  zone:        { type: String,  default: null },
  zones:       { type: Array,   default: null },
  showPosture: { type: Boolean, default: true }
})

function bloomMean(zoneName) {
  const concepts = conceptsData.filter(c => c.family === zoneName)
  const values = concepts.flatMap(c => c.bloom.map(b => BLOOM_RANK[b]).filter(Boolean))
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
}

function cogLevel(mean) {
  if (mean < 3.5) return { level: 1, label: 'Appliquer' }
  if (mean < 4.5) return { level: 2, label: 'Analyser' }
  return { level: 3, label: 'Concevoir' }
}

function buildZone(name, key) {
  const concept = conceptsData.find(c => c.family === name)
  const riskLevel = RISK_LEVEL[concept?.risk_ai] ?? 0
  const riskLabel = concept?.risk_ai ?? ''
  const cog = cogLevel(bloomMean(name))
  return { key, name, riskLevel, riskLabel, cogLevel: cog.level, cogLabel: cog.label, posture: ZONE_POSTURES[name] ?? '' }
}

const ALL_ZONES = [
  buildZone('Syntaxe', 'syntaxe'),
  buildZone('Logique', 'logique'),
  buildZone('Architecture', 'architecture')
]

const visibleZones = computed(() => {
  if (props.zone)  return ALL_ZONES.filter(z => z.name === props.zone)
  if (props.zones) return ALL_ZONES.filter(z => props.zones.includes(z.name))
  return ALL_ZONES
})
</script>

<style scoped>
.zone-profile {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
}

.zone-profile--single {
  grid-template-columns: 1fr;
  max-width: 280px;
}

.zone-profile--double {
  grid-template-columns: 1fr 1fr;
}

.zone-col {
  padding: var(--space-5);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.zone-col:last-child {
  border-right: none;
}

.zone-col--emphasis {
  background: var(--zone-logique-bg);
  box-shadow: inset 0 3px 0 var(--zone-logique);
}

.zone-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.zone-eyebrow {
  color: var(--color-text-faint);
}

.zone-name {
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.gauge-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.gauge-title {
  color: var(--color-text-faint);
}

.gauge-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.gauge-dots {
  display: flex;
  gap: 0.35rem;
}

.dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background var(--dur-2) var(--ease);
}

.dot--empty {
  background: transparent;
  border: 1.5px solid var(--color-border-strong);
}

.dot--filled {
  border: 1.5px solid transparent;
}

.gauge-text {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
}

.zone-posture {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: auto;
}

.zone-posture-text {
  font-size: var(--text-sm);
  color: var(--color-text);
  font-weight: 500;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .zone-profile {
    grid-template-columns: 1fr;
  }

  .zone-col {
    border-right: none;
    border-bottom: 1px solid var(--color-border);
  }

  .zone-col:last-child {
    border-bottom: none;
  }

  .zone-col--emphasis {
    box-shadow: inset 3px 0 0 var(--zone-logique);
  }
}
</style>
