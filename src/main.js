import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router/index.js'
import { track } from './lib/telemetry.js'
import { safeLocalStorage } from './lib/safeStorage.js'
import './assets/tokens.css'
import './assets/base.css'

// Capture du paramètre de campagne (?src=) au tout premier chargement, avant que le routeur à
// dièse ne le fasse disparaître dès la première navigation (router.replace remplace l'objet
// query en entier ailleurs dans l'app, ex. ArboreView). Couvre les deux formes d'URL possibles :
// avant le # (search classique) et dans la query du hash lui-même (lien partagé du type
// .../#/arbre?src=tb2026). Un seul jeton partagé pour tous les destinataires du lien, jamais un
// jeton par personne.
function captureCampaignOnce() {
  try {
    if (sessionStorage.getItem('tb_campaign')) return
    const hash = window.location.hash || ''
    const hashQueryIndex = hash.indexOf('?')
    const hashQuery = hashQueryIndex >= 0 ? hash.slice(hashQueryIndex + 1) : ''
    const params = new URLSearchParams(hashQuery || window.location.search.replace(/^\?/, ''))
    sessionStorage.setItem('tb_campaign', params.get('src') === 'tb2026' ? 'tb2026' : 'direct')
  } catch {
    // sessionStorage indisponible : lib/telemetry.js retombe sur 'direct' à la lecture
  }
}
captureCampaignOnce()

// Le résultat d'audit était persisté en localStorage avant de passer en sessionStorage : efface
// l'éventuel résidu laissé par une visite antérieure sur ce navigateur.
safeLocalStorage.removeItem('audit_v1')

const pinia = createPinia()
pinia.use(piniaPersistedstate)

const app = createApp(App)

// Fiabilité en conditions réelles (app_error) : capte les erreurs de composants Vue non
// rattrapées ailleurs, sans jamais faire planter l'interface pour l'utilisateur.
app.config.errorHandler = (err, instance, info) => {
  track('app_error', {
    code: (err && err.message ? String(err.message) : String(err)).slice(0, 200),
    area: info || (instance ? instance.$options.name : 'unknown') || 'unknown'
  })
  console.error(err)
}

app.use(pinia).use(router).mount('#app')
