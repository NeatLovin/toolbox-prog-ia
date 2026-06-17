<script setup>
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
</script>

<template>
  <div id="app-layout">
    <header class="site-header">
      <nav class="nav-container" aria-label="Navigation principale">
        <router-link to="/" class="site-title">Toolbox Prog IA</router-link>
        <ul class="nav-links">
          <li><router-link to="/catalogue">Catalogue</router-link></li>
          <li><router-link to="/concepts">Concepts</router-link></li>
          <li><router-link to="/arbre">Arbre de decision</router-link></li>
          <li><router-link to="/methodologie">Methodologie</router-link></li>
          <li v-if="isLocal"><router-link to="/audit" class="nav-audit">Audit PDF</router-link></li>
        </ul>
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
  background: var(--color-text);
  color: var(--color-bg);
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.nav-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  min-height: 56px;
  flex-wrap: wrap;
  padding: 0.4rem 0;
}

.site-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-bg);
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 0.25rem;
  margin-left: auto;
  flex-wrap: wrap;
}

.nav-links a {
  color: var(--color-text-placeholder);
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  transition: color 0.15s, background 0.15s;
  display: block;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--color-bg);
  background: var(--color-accent);
}

.nav-audit { color: var(--patron-border) !important; }
.nav-audit:hover,
.nav-audit.router-link-active {
  background: var(--patron-title) !important;
}

.main-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.site-footer {
  background: var(--color-text);
  color: var(--color-text-faint);
  text-align: center;
  padding: var(--space-4) var(--space-6);
  font-size: 0.8rem;
}

@media (max-width: 640px) {
  .nav-container {
    gap: var(--space-4);
  }

  .nav-links {
    margin-left: 0;
    width: 100%;
    padding-bottom: 0.4rem;
  }

  .nav-links a {
    font-size: 0.82rem;
    padding: 0.3rem 0.55rem;
  }

  .main-content {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
