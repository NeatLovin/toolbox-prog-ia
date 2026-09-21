<script setup>
import { ref } from 'vue'
import ConsentBanner from './components/ConsentBanner.vue'
import { reopenBanner } from './lib/consent.js'

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
        <ul class="nav-links nav-links--primary">
          <li><router-link to="/arbre">Recommandation</router-link></li>
          <li><router-link to="/audit">Audit PDF</router-link></li>
        </ul>
        <span class="nav-sep" aria-hidden="true"></span>
        <ul class="nav-links nav-links--secondary">
          <li><router-link to="/catalogue">Catalogue</router-link></li>
          <li><router-link to="/concepts">Concepts</router-link></li>
          <li><router-link to="/cartographie">Matrice</router-link></li>
          <li><router-link to="/methodologie">Méthodologie</router-link></li>
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
      <p class="footer-links">
        <router-link to="/transparence">Transparence</router-link>
        <span aria-hidden="true">·</span>
        <button type="button" class="footer-link-btn" @click="reopenBanner">Confidentialité</button>
      </p>
    </footer>
    <ConsentBanner />
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
  flex-wrap: wrap;
}

.nav-links--primary {
  margin-left: auto;
}

.nav-sep {
  width: 1px;
  align-self: stretch;
  margin: 0.4rem 0;
  background: var(--color-border);
  flex-shrink: 0;
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

/* Les deux parcours d'action se distinguent visuellement des vues de consultation : fond
   permanent plutôt qu'au survol seulement, poids de police plus marqué. */
.nav-links--primary a {
  background: var(--color-accent-subtle);
  font-weight: 700;
}

.nav-links--primary a.router-link-active {
  background: var(--color-accent);
  color: var(--color-surface);
}
.nav-links--primary a.router-link-active:hover {
  background: var(--color-accent);
  color: var(--color-surface);
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

.footer-links {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.footer-links a,
.footer-link-btn {
  color: var(--color-text-faint);
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 2px;
  transition: color var(--dur-1) var(--ease), text-decoration-color var(--dur-1) var(--ease);
}

.footer-links a:hover,
.footer-link-btn:hover {
  color: var(--color-text-muted);
  text-decoration-color: currentColor;
}

.footer-link-btn {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
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

  .nav-sep {
    display: none;
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
