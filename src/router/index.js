import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/',            component: () => import('../views/ArboreView.vue') },
  { path: '/arbre',       redirect: '/' },
  { path: '/catalogue',   component: () => import('../views/CatalogueView.vue') },
  { path: '/concepts',    component: () => import('../views/ConceptsView.vue') },
  { path: '/methodologie',component: () => import('../views/MethodologieView.vue') },
  { path: '/audit',       component: () => import('../views/AuditView.vue') }
]

export default createRouter({
  history: createWebHashHistory('/toolbox-prog-ia/'),
  routes
})
