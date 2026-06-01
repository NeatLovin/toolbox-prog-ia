import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/catalogue', component: () => import('../views/CatalogueView.vue') },
  { path: '/concepts', component: () => import('../views/ConceptsView.vue') },
  { path: '/arbre', component: () => import('../views/ArboreView.vue') },
  { path: '/methodologie', component: () => import('../views/MethodologieView.vue') },
  { path: '/audit', component: () => import('../views/AuditView.vue') }
]

export default createRouter({
  history: createWebHashHistory('/toolbox-prog-ia/'),
  routes
})
