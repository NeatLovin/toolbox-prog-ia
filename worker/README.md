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
| `AUDIT_RATE_LIMIT_PER_SESSION_HOUR` | Appels `/audit` max par session et par heure | `5` |
| `AUDIT_DAILY_GLOBAL_CAP` | Appels `/audit` max, tous visiteurs confondus, par jour UTC | `120` (valeur de lancement, à redescendre à 40-50 ensuite) |
| `AUDIT_DAILY_CAP_REVIEW_DATE` | Date au-delà de laquelle le Worker signale (jamais ne modifie) que le plafond ci-dessus mérite d'être révisé | `2026-10-07` (14 jours après l'envoi du lien aux 22 enseignants, 2026-09-23) |
| `RETENTION_DAYS` | Ancienneté au-delà de laquelle les `events` sont purgés | `365` |

Modifier une variable puis `npm run worker:deploy` pour l'appliquer. `AUDIT_KILL_SWITCH=true` est la
procédure de coupure d'urgence : l'audit devient indisponible côté serveur en quelques secondes, sans
toucher au reste du site (la télémétrie et les parcours 1/2 continuent de fonctionner).

### Coût maximal théorique

Modèle utilisé : `claude-haiku-4-5-20251001`, tarif 1,00 $ / 5,00 $ par million de tokens en
entrée/sortie (écriture cache ≈1,25×, lecture cache ≈0,10×).

**Nombre d'appels par audit, mesuré (pas déduit) en conditions réelles contre le Worker déployé** :
un document normal (quelques milliers de caractères, un plan de cours typique) déclenche
**1 appel `/audit`**, vérification de pertinence comprise (même appel, même prompt en deux
étapes). Un document volumineux (testé avec 146 809 caractères extraits, 43 pages) déclenche
**4 appels** — le plafond client (`CHUNK_LIMIT` dans `stores/audit.js`, tranches de
`CHUNK_MAX` = 40 000 caractères) : le texte au-delà de ~148 000 caractères est silencieusement
tronqué côté client, sans refus explicite ni avertissement affiché à l'enseignant (le refus
serveur `size_exceeded` existe et fonctionne, mais protège un appel direct au Worker avec un texte
non découpé — un chemin que l'interface normale n'emprunte jamais).

Coût mesuré par appel (chunk ~40 000 caractères, `max_tokens=2000`) : environ 0,02 $ maximum.
Coût maximal par document volumineux (4 appels) : environ 0,08 $. Un document normal (1 appel) :
environ 0,02 $.

Avec `AUDIT_DAILY_GLOBAL_CAP=120` (valeur de lancement, dimensionnée pour permettre a 22
enseignants d'essayer le meme jour) : coût théorique maximal si le plafond est atteint chaque jour
uniquement avec des documents normaux, 120 × 0,02 $ ≈ **2,40 $/jour** ; si atteint uniquement avec
des documents volumineux, 120 × 0,08 $ ≈ **9,60 $/jour** (scénario d'abus soutenu improbable, pas
un usage normal). **À redescendre à 40-50 après la semaine de lancement** (modifier
`AUDIT_DAILY_GLOBAL_CAP` dans `worker/wrangler.toml` puis `npm run worker:deploy` — action
manuelle, pas automatique).

Le plafond par session et par heure (`AUDIT_RATE_LIMIT_PER_SESSION_HOUR=5`) a été vérifié ne pas
bloquer un usage légitime : un parcours réel de deux documents suivi d'une relance (3 tentatives
dans la même session, la même heure) passe sans être bloqué.

Ces plafonds bornent le risque côté code, mais restent une limite applicative : ajouter en
complément, hors de portée du code, une limite de dépense sur la console Anthropic et une alerte
d'usage côté tableau de bord Cloudflare.

## Capacité totale d'un document vs plafond par requête

`VITE_AUDIT_MAX_DOCUMENT_CHARS` (front, `.env.production`/`.env.development`, défaut 160 000) est
la capacité totale de caractères extraits qu'un audit traite réellement avant troncature
(`src/stores/audit.js`) : au-delà, le document est tronqué à cette limite et l'écran de résultat
affiche une bannière expliquant la proportion couverte (voir `CourseAudit.vue`), avec l'événement
`audit_truncated` (caractères soumis, caractères totaux, proportion couverte).

C'est une valeur distincte d'`AUDIT_MAX_CHARS` ci-dessus, qui plafonne une seule requête `/audit`
(toujours ≤ 40 000 caractères en pratique, la taille d'une tranche côté client) : ce plafond reste
une protection de défense en profondeur contre un appel direct hors interface avec un texte non
découpé, largement au-dessus de la taille réelle d'une tranche, sans lien avec la capacité totale
du document.

## ts_client vs ts_server

`ts_client` est pris côté navigateur à chaque appel de `track()` : strictement croissant, c'est la
seule colonne fiable pour reconstituer l'ordre chronologique réel des événements d'une session.
`ts_server` est assigné une fois par lot de flush (`handleEvents` dans `worker/src/events.js`), donc
identique pour tous les événements d'un même lot reçu par le Worker : il ne sert qu'à la
rétention/purge (`scheduled()` dans `worker/src/index.js`), jamais à trier pour reconstituer un
déroulé. Voir le commentaire d'en-tête de `worker/analysis.sql` et `worker/scripts/
session-replay.mjs` pour un exemple de tri sur `ts_client`.

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

## Contrôle avant envoi (`npm run preflight`)

`worker/scripts/preflight.mjs` vérifie en une commande, contre l'environnement **réellement
déployé** (jamais localhost), que le site est sain avant d'envoyer un lien à des enseignants :
le site publié répond, `VITE_API_BASE` n'est pas le placeholder, `POST /events` accepte un
événement de test (nettoyé ensuite), `POST /audit` répond sans consommer d'appel au modèle (texte
vide → même chemin que `size_exceeded`, distingue au passage une coupure d'urgence active), et
`GET /health` confirme que les plafonds réellement déployés correspondent à `worker/wrangler.toml`
local — sinon c'est une dérive entre le code et ce qui tourne, exactement le risque que cette
vérification existe pour attraper. Sort en erreur (code 1) si un contrôle échoue.

```bash
npm run preflight
```

`GET /health` (non authentifié, aucune donnée sensible : les mêmes valeurs sont déjà visibles en
clair dans ce fichier et dans la sortie de `wrangler deploy`) retourne l'état de la coupure
d'urgence, les deux plafonds en vigueur, et si la date de révision du plafond de lancement
(`AUDIT_DAILY_CAP_REVIEW_DATE`) est dépassée. Le Worker log aussi un avertissement dans ce dernier
cas à chaque appel réel à `/audit` (visible via `wrangler tail`) — dans les deux cas, un
signalement, jamais une modification automatique du plafond.

Le préflight affiche enfin, à titre purement informatif (jamais un échec : des lignes en base sont
normales pendant une période de test), le nombre de lignes dans `events` et dans `audit_calls` —
pour voir l'état global de la base sans avoir à l'interroger à la main.

## Séquence de passage du pilote

`npm run pilot:replay` (sans argument, cible automatiquement la session la plus récente, ou
`npm run pilot:replay -- <session_id>` pour une session précise) reconstitue le parcours
chronologique complet, affiche sa durée, son premier et son dernier événement, et vérifie la
présence du marqueur de campagne. `npm run pilot:purge -- <session_id>` supprime ensuite cette
session (`events` + `audit_calls`) et confirme 0 ligne restante. Voir `docs/recette/pilote.md`
pour la séquence complète à faire suivre au pilote.
