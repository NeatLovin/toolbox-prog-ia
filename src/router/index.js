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

export default router
