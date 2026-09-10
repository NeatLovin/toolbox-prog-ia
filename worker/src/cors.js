// Liste blanche d'origines lue depuis la variable d'environnement ALLOWED_ORIGINS
// (CSV, ex: "https://neatlovin.github.io,http://localhost:5173").
// Toute requête dont l'origine n'y figure pas est rejetée avant tout traitement.
export function resolveCors(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (!origin || !allowed.includes(origin)) return null

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    // navigator.sendBeacon (flush de fin de session, lib/telemetry.js) envoie toujours ses
    // requêtes en credentials:'include', même cross-origin, sans possibilité de le désactiver
    // côté client : sans cet en-tête le préflight échoue et l'événement de fin de session est
    // perdu. Sans danger ici : aucun cookie n'est lu ni posé par le Worker, session_id voyage
    // dans le corps JSON, jamais dans un cookie. Origin explicite ci-dessus (jamais '*'),
    // requis par la spec dès que les credentials sont autorisés.
    'Access-Control-Allow-Credentials': 'true'
  }
}
