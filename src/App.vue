<template>
  <div id="app-layout">
    <header class="site-header">
      <nav class="nav-container">
        <router-link to="/" class="site-title">Toolbox Prog IA</router-link>
        <ul class="nav-links">
          <li><router-link to="/catalogue">Catalogue</router-link></li>
          <li><router-link to="/concepts">Concepts</router-link></li>
          <li><router-link to="/arbre">Arbre de decision</router-link></li>
          <li><router-link to="/methodologie">Methodologie</router-link></li>
        </ul>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
    <footer class="site-footer">
      <p>Travail de Bachelor &mdash; HEG Arc, HES-SO &mdash; 2025-2026</p>
    </footer>
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1e293b;
  background: #f8fafc;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>

<style scoped>
#app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.site-header {
  background: #1e293b;
  color: #f8fafc;
  padding: 0 1.5rem;
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
  gap: 2rem;
  height: 56px;
}

.site-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #f8fafc;
  white-space: nowrap;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 0.25rem;
  margin-left: auto;
}

.nav-links a {
  color: #94a3b8;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: color 0.15s, background 0.15s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #f8fafc;
  background: #334155;
}

.main-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}

.site-footer {
  background: #1e293b;
  color: #64748b;
  text-align: center;
  padding: 1rem 1.5rem;
  font-size: 0.8rem;
}
</style>
