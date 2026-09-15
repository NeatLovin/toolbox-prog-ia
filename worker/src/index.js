import { resolveCors } from './cors.js'
import { handleEvents } from './events.js'
import { handleAudit } from './audit.js'
import { handleHealth } from './health.js'
import { jsonResponse } from './util.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const corsHeaders = resolveCors(request, env)

    if (request.method === 'OPTIONS') {
      return corsHeaders
        ? new Response(null, { status: 204, headers: corsHeaders })
        : new Response(null, { status: 403 })
    }

    // Toute requête dont l'origine n'est pas dans la liste blanche est rejetée ici,
    // avant tout accès à D1 ou à la clé Anthropic.
    if (!corsHeaders) {
      return jsonResponse({ error: 'origin_not_allowed' }, 403)
    }

    let response
    if (request.method === 'POST' && url.pathname === '/events') {
      response = await handleEvents(request, env)
    } else if (request.method === 'POST' && url.pathname === '/audit') {
      response = await handleAudit(request, env)
    } else if (request.method === 'GET' && url.pathname === '/health') {
      response = await handleHealth(request, env)
    } else {
      response = jsonResponse({ error: 'not_found' }, 404)
    }

    const headers = new Headers(response.headers)
    for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value)
    return new Response(response.body, { status: response.status, headers })
  },

  // Purge quotidienne : events au-delà de RETENTION_DAYS (annoncé sur la page de transparence,
  // 12 mois par défaut), audit_calls (simple compteur de plafond, pas une donnée d'évaluation)
  // purgée bien plus tôt.
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(purgeOldData(env))
  }
}

async function purgeOldData(env) {
  const retentionDays = parseInt(env.RETENTION_DAYS || '365', 10)
  const eventsCutoff = Date.now() - retentionDays * 86_400_000
  await env.DB.prepare('DELETE FROM events WHERE ts_server < ?').bind(eventsCutoff).run()

  const auditCallsCutoff = Date.now() - 7 * 86_400_000
  await env.DB.prepare('DELETE FROM audit_calls WHERE ts_server < ?').bind(auditCallsCutoff).run()
}
