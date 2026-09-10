# Worker Toolbox Prog IA

Service serveur Cloudflare Worker + D1, deux responsabilités :

- `POST /events` : collecte de télémétrie (voir la taxonomie du lot 3 dans `CLAUDE.md`).
- `POST /audit` : relais de l'appel au modèle Anthropic pour l'audit de plan de cours. Le prompt
  système, le modèle et `max_tokens` sont fixés côté serveur (`worker/src/audit.js`) : le client
  n'envoie que `{ session_id, text }`, jamais de quoi faire varier le coût par appel.

Remplace `proxy/server.js` (supprimé), qui ne fonctionnait qu'en développement local et rendait
l'audit inutilisable sur le déploiement GitHub Pages.

## Déploiement initial (une fois)

Ces étapes nécessitent une authentification interactive à un compte Cloudflare et ne peuvent pas être
automatisées.

```bash
npx wrangler login

# Localisation en Europe de l'Ouest (indicative, D1 réplique globalement).
npx wrangler d1 create toolbox-telemetry --location=weur
# -> copier le database_id retourné dans worker/wrangler.toml (champ database_id)

npx wrangler d1 execute toolbox-telemetry --remote --file=worker/schema.sql

npx wrangler secret put ANTHROPIC_API_KEY --config worker/wrangler.toml
# -> coller la clé API Anthropic (peut être recopiée depuis le .env local si vous en avez déjà un)

npm run worker:deploy
```

Noter l'adresse du Worker affichée en fin de déploiement (ex.
`toolbox-prog-ia-api.<sous-domaine>.workers.dev`) et la reporter dans `.env.production` à la racine
du dépôt (`VITE_API_BASE=...`), utilisée au build du front (`npm run build` / `npm run deploy`).

## Développement local

```bash
npx wrangler d1 execute toolbox-telemetry --local --file=worker/schema.sql
npm run dev:full   # lance `vite` + `wrangler dev --local` en parallèle
```

`wrangler dev --local` émule le Worker et D1 entièrement hors ligne, sauf l'appel réel à l'API
Anthropic sur `/audit` qui nécessite une clé valide dans `worker/.dev.vars` (fichier gitignore, voir
`worker/.dev.vars.example`) :

```
ANTHROPIC_API_KEY=sk-ant-...
```

Sans cette clé, `/audit` répond `503 { reason: "missing_key" }` et le front bascule automatiquement
sur le message d'indisponibilité + la proposition du cours d'exemple précalculé
(`src/data/fixtures/cours-exemple.json`).

## Trois valeurs à ne pas confondre

| Valeur | Où se configure |
|---|---|
| Nom et adresse du Worker | Cloudflare (déploiement) |
| Origines autorisées en CORS | `ALLOWED_ORIGINS` dans `worker/wrangler.toml` |
| Adresse appelée par le client | `VITE_API_BASE` dans `.env.production` / `.env.development` à la racine |

## Variables d'environnement du Worker

Toutes dans `worker/wrangler.toml [vars]`, sauf la clé API (secret).

| Variable | Rôle | Défaut |
|---|---|---|
| `ALLOWED_ORIGINS` | CSV des origines autorisées en CORS | GitHub Pages + localhost:5173 (vite dev) + localhost:4173 (vite preview, utilisé par verify-e2e.mjs) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (secret, jamais dans `wrangler.toml`) | — |
| `AUDIT_KILL_SWITCH` | `"true"` coupe `/audit` sans redéployer le code | `"false"` |
| `AUDIT_MAX_CHARS` | Taille max du texte extrait envoyé au modèle | `160000` |
| `AUDIT_RATE_LIMIT_PER_SESSION_HOUR` | Appels `/audit` max par session et par heure | `8` |
| `AUDIT_DAILY_GLOBAL_CAP` | Appels `/audit` max, tous visiteurs confondus, par jour UTC | `200` |
| `RETENTION_DAYS` | Ancienneté au-delà de laquelle les `events` sont purgés | `365` |

Modifier une variable puis `npm run worker:deploy` pour l'appliquer. `AUDIT_KILL_SWITCH=true` est la
procédure de coupure d'urgence : l'audit devient indisponible côté serveur en quelques secondes, sans
toucher au reste du site (la télémétrie et les parcours 1/2 continuent de fonctionner).

## Export des données collectées

```bash
npx wrangler d1 execute toolbox-telemetry --remote --command "SELECT * FROM events" --json \
  | node worker/scripts/export-csv.mjs > events.csv
```

## Requêtes d'analyse

Voir `worker/analysis.sql` (lot 7) pour les requêtes préparées correspondant aux métriques
d'évaluation du prototype.

## Vérification bout en bout

`worker/scripts/verify-e2e.mjs` simule un parcours de recommandation complet dans un vrai
navigateur (Playwright) puis interroge la base D1 locale pour confirmer que les événements
attendus sont arrivés. La télémétrie n'envoyant rien sur le réseau en mode développement, il faut
un build "production" pointant sur le Worker local :

```bash
npx wrangler d1 execute toolbox-telemetry --local --file=worker/schema.sql   # une fois
npm run worker:dev                                                          # terminal 1
npm run build -- --mode development && npm run preview                      # terminal 2
node worker/scripts/verify-e2e.mjs                                          # terminal 3
```

`--mode development` ne change que les fichiers `.env` chargés (donc `VITE_API_BASE` pointe sur
`localhost:8787`), pas le mode DEV/PROD de Vite lui-même : la télémétrie envoie donc bien sur le
réseau, contrairement à `npm run dev`.
