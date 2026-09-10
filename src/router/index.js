import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/',            component: HomeView },
  { path: '/arbre',       component: () => import('../views/ArboreView.vue') },
  { path: '/catalogue',   component: () => import('../views/CatalogueView.vue') },
  { path: '/concepts',    component: () => import('../views/ConceptsView.vue') },
  { path: '/methodologie',  component: () => import('../views/MethodologieView.vue') },
  { path: '/cartographie', component: () => import('../views/CartographieView.vue') },
  { path: '/audit',       component: () => import('../views/AuditView.vue') }
]

const router = createRouter({
  history: createWebHashHistory('/toolbox-prog-ia/'),
  routes
})

// Retenu pour matrix_open{from} (lot 3). beforeEach, pas afterEach : garantit que la valeur est
// déjà à jour quand le composant de destination s'exécute (setup/onMounted), contrairement à
// afterEach dont l'ordre par rapport au montage du composant n'est pas garanti.
let lastFromPath = null
router.beforeEach((to, from) => {
  lastFromPath = from.path
})

export function getLastFromPath() {
  return lastFromPath
}

export default router
