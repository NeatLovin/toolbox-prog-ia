import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/catalogue', component: () => import('../views/CatalogueView.vue') },
  { path: '/arbre', component: () => import('../views/ArboreView.vue') },
  { path: '/methodologie', component: () => import('../views/MethodologieView.vue') }
]

export default createRouter({
  history: createWebHashHistory('/toolbox-prog-ia/'),
  routes
})
