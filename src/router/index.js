import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/',            component: HomeView },
  { path: '/arbre',       component: () => import('../views/ArboreView.vue') },
  { path: '/catalogue',   component: () => import('../views/CatalogueView.vue') },
  { path: '/concepts',    component: () => import('../views/ConceptsView.vue') },
  { path: '/methodologie',component: () => import('../views/MethodologieView.vue') },
  { path: '/audit',       component: () => import('../views/AuditView.vue') }
]

const router = createRouter({
  history: createWebHashHistory('/toolbox-prog-ia/'),
  routes
})

// En dehors de localhost, '/' redirige vers l'arbre (pas de carte audit inaccessible)
router.beforeEach((to, from, next) => {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  if (to.path === '/' && !isLocal) next('/arbre')
  else next()
})

export default router
