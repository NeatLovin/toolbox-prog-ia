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
      &#9654; Charger le cours exemple (demo sans reseau)
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
  gap: 1.25rem;
  max-width: 520px;
  margin: 0 auto;
}

.dropzone {
  width: 100%;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.dropzone:hover,
.dropzone--over {
  border-color: #2563eb;
  background: #eff6ff;
}

.dropzone-icon {
  font-size: 2.5rem;
}

.dropzone-main {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.dropzone-sub {
  font-size: 0.85rem;
  color: #64748b;
}

.file-hidden {
  display: none;
}

.demo-separator {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.demo-separator::before,
.demo-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.btn-demo {
  width: 100%;
  padding: 0.8rem 1.5rem;
  background: #1e293b;
  color: #f8fafc;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-demo:hover {
  background: #334155;
}

.demo-note {
  font-size: 0.78rem;
  color: #94a3b8;
  text-align: center;
  line-height: 1.5;
}
</style>
