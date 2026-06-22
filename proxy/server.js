// Proxy local Anthropic - ne tourne qu'en dev, jamais deploye sur GitHub Pages.
// Prerequis : Node >= 18, fichier .env a la racine avec ANTHROPIC_API_KEY=sk-ant-...
// Lancement : node proxy/server.js (ou via npm run dev:full)

const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PROXY_PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '1mb' }))

app.post('/api/classify', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || key === 'sk-ant-VOTRE_CLE_ICI') {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY absente ou non configuree dans .env' })
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
        'content-type': 'application/json'
      },
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Proxy Anthropic actif sur http://localhost:${PORT}`)
  console.log('Cle API : ' + (process.env.ANTHROPIC_API_KEY ? 'configuree' : 'MANQUANTE'))
})
