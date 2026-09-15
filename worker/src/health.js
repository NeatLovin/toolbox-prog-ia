import { jsonResponse, todayUTC } from './util.js'

// Toutes ces valeurs sont déjà publiques (committées dans worker/wrangler.toml, un dépôt public,
// et affichées en clair par `wrangler deploy`) : cette route n'expose rien de nouveau, elle permet
// seulement de vérifier depuis l'extérieur ce qui est réellement déployé, sans avoir à faire
// confiance au fichier local (voir worker/scripts/preflight.mjs).

export function isCapReviewDue(env) {
  const reviewDate = env.AUDIT_DAILY_CAP_REVIEW_DATE
  if (!reviewDate) return false
  return todayUTC() >= reviewDate
}

export async function handleHealth(request, env) {
  return jsonResponse({
    kill_switch: String(env.AUDIT_KILL_SWITCH || 'false').toLowerCase() === 'true',
    audit_daily_global_cap: parseInt(env.AUDIT_DAILY_GLOBAL_CAP || '0', 10),
    audit_rate_limit_per_session_hour: parseInt(env.AUDIT_RATE_LIMIT_PER_SESSION_HOUR || '0', 10),
    audit_daily_cap_review_date: env.AUDIT_DAILY_CAP_REVIEW_DATE || null,
    audit_daily_cap_review_due: isCapReviewDue(env)
  }, 200)
}
