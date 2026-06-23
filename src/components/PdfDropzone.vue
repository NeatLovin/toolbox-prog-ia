<template>
  <div class="dropzone-wrapper">
    <div
      class="dropzone"
      :class="{ 'dropzone--over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput.click()"
    >
      <div class="dropzone-icon">&#128196;</div>
      <p class="dropzone-main">Deposez un PDF de cours ici</p>
      <p class="dropzone-sub">ou cliquez pour selectionner un fichier</p>
      <input ref="fileInput" type="file" accept=".pdf" class="file-hidden" @change="onFileChange" />
    </div>

    <div class="demo-separator">
      <span>ou</span>
    </div>

    <button class="btn-demo" @click="$emit('load-fixture')">
      &#9654; Charger le cours exemple (démo sans réseau)
    </button>

    <p class="demo-note">
      Le mode demo rejoue un pipeline precalcule sur un cours d'introduction a la programmation S1.
      Aucun appel API ni PDF requis.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file-selected', 'load-fixture'])
const fileInput = ref(null)
const isDragging = ref(false)

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file?.type === 'application/pdf') emit('file-selected', file)
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) emit('file-selected', file)
}
</script>

<style scoped>
.dropzone-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  max-width: 520px;
  margin: 0 auto;
}

.dropzone {
  width: 100%;
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-2xl);
  padding: 3rem var(--space-8);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.dropzone:hover,
.dropzone--over {
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}

.dropzone-icon { font-size: 2.5rem; }

.dropzone-main {
  font-weight: 700;
  color: var(--color-text);
  font-size: var(--text-base);
}

.dropzone-sub {
  font-size: var(--text-sm);
  color: var(--color-text-faint);
}

.file-hidden { display: none; }

.demo-separator {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
  color: var(--color-text-placeholder);
  font-size: var(--text-sm);
}

.demo-separator::before,
.demo-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.btn-demo {
  width: 100%;
  padding: 0.8rem var(--space-6);
  background: var(--color-accent-hover);
  color: var(--color-bg);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-demo:hover { background: var(--color-accent); }

.demo-note {
  font-size: var(--text-xs);
  color: var(--color-text-placeholder);
  text-align: center;
  line-height: 1.5;
}
</style>
