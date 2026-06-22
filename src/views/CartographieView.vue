<template>
  <div class="cartographie">
    <div class="ui-page-header">
      <h1>Cartographie</h1>
      <p>
        Matrice de pertinence complète : 48 outils × 21 concepts, 861 couples évalués.
        La teinte encode la zone conceptuelle, l'intensité encode le score pédagogique (1 à 3).
      </p>
    </div>
    <HeatmapMatrix />
  </div>
</template>

<script setup>
import HeatmapMatrix from '../components/HeatmapMatrix.vue'
</script>

<style scoped>
.cartographie {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
