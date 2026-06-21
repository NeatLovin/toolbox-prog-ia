import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './assets/tokens.css'
import './assets/base.css'

createApp(App).use(router).mount('#app')
