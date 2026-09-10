import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'

function commitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig({
  plugins: [vue()],
  base: '/toolbox-prog-ia/',
  define: {
    // Version applicative pour la télémétrie (src/lib/telemetry.js), jamais lue depuis npm.
    __APP_VERSION__: JSON.stringify(commitHash())
  }
})
