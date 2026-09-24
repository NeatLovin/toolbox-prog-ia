import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router/index.js'
import { track } from './lib/telemetry.js'
import { safeLocalStorage } from './lib/safeStorage.js'
import { captureCampaignOnce } from './lib/campaign.js'
import './assets/tokens.css'
import './assets/base.css'

// Capture du marqueur de campagne (?src=) avant que le routeur à dièse ne le fasse disparaître
// (voir lib/campaign.js).
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
