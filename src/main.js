import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router/index.js'
import './assets/tokens.css'
import './assets/base.css'

const pinia = createPinia()
pinia.use(piniaPersistedstate)

createApp(App).use(pinia).use(router).mount('#app')
