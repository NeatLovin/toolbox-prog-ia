<script setup>
import { ref } from 'vue'

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)

// Theme toggle - initialise depuis localStorage, sinon suit la préférence OS
const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = ref(saved ? saved === 'dark' : prefersDark)

function applyTheme(dark) {
  isDark.value = dark
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

applyTheme(isDark.value)

function toggleTheme() {
  applyTheme(!isDark.value)
}
</script>

<template>
  <div id="app-layout">
    <header class="site-header">
      <nav class="nav-container" aria-label="Navigation principale">
        <router-link to="/" class="site-title">Toolbox Prog IA</router-link>
        <ul class="nav-links">
          <li><router-link to="/arbre">Arbre</router-link></li>
          <li><router-link to="/catalogue">Catalogue</router-link></li>
          <li><router-link to="/concepts">Concepts</router-link></li>
          <li><router-link to="/cartographie">Matrice</router-link></li>
          <li><router-link to="/methodologie">Methodologie</router-link></li>
          <li v-if="isLocal"><router-link to="/audit" class="nav-audit">Audit PDF</router-link></li>
        </ul>
        <button
          class="theme-toggle"
          @click="toggleTheme"
          :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          :title="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
        >{{ isDark ? '☀' : '☾' }}</button>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
    <footer class="site-footer">
      <p>Travail de Bachelor, HEG Arc, HES-SO, 2025-2026</p>
    </footer>
  </div>
</template>

<style scoped>
#app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  min-height: 52px;
  flex-wrap: wrap;
  padding: 0.35rem 0;
}

.site-title {
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  color: var(--color-text);
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 0.15rem;
  margin-left: auto;
  flex-wrap: wrap;
}

.nav-links a {
  color: var(--color-text-muted);
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  display: block;
  transition: color var(--dur-1) var(--ease), background var(--dur-1) var(--ease);
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  text-decoration-thickness: 2px;
  transition: color var(--dur-1) var(--ease), background var(--dur-1) var(--ease), text-decoration-color var(--dur-1) var(--ease);
}

.nav-links a:hover {
  color: var(--color-text);
  background: var(--color-accent-subtle);
}

.nav-links a.router-link-active {
  color: var(--color-text);
  background: transparent;
  text-decoration-color: var(--color-accent);
}

.nav-audit {
  font-style: italic;
  opacity: 0.8;
}

.main-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.site-footer {
  background: var(--color-surface-2);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-faint);
  text-align: center;
  padding: var(--space-4) var(--space-6);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: color var(--dur-1) var(--ease), background var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease);
}

.theme-toggle:hover {
  background: var(--color-accent-subtle);
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.theme-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-ring);
}

@media (max-width: 640px) {
  .nav-container {
    gap: var(--space-4);
  }

  .nav-links {
    margin-left: 0;
    width: 100%;
    padding-bottom: 0.35rem;
  }

  .nav-links a {
    font-size: 0.82rem;
    padding: 0.3rem 0.5rem;
  }

  .main-content {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
