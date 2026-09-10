# Grille de recette — Itération 2

Branche `feat/telemetry-and-ux`, tag local `v0.2.0`. Cette grille suit la mission de recette :
aucune ligne n'est marquée conforme sans avoir été observée sur l'environnement **déployé**
(`https://neatlovin.github.io/toolbox-prog-ia/`, paramètre `?src=tb2026`) — une vérification faite
sur `localhost` ne compte pas ici, précisément parce que les bugs les plus graves de l'itération
précédente n'étaient visibles qu'à la frontière dev/prod.

État au moment de la rédaction de cette grille : `origin/gh-pages` sert encore le build de
l'Itération 1 (`assets/index-Da7boQFs.js`, sans Worker ni télémétrie). Toutes les lignes des
sections 2/4/5/6/7 sont donc `bloqué` tant qu'un build de cette branche n'a pas été publié en test
(accord explicite requis, voir le message qui accompagne ce document) et que le Worker n'est pas
déployé.

Légende statut : ✅ conforme · ⚠️ partiel · ❌ absent · 🚫 bloqué — nécessite le Worker déployé et/ou
un build de test publié.

## §2 — Chaîne de configuration

| Vérification | Statut | Preuve |
|---|---|---|
| `VITE_API_BASE` résout vers le Worker réel sur le site publié (onglet réseau) | 🚫 | — |
| Aucune requête ne part vers le placeholder `REPLACE_WITH_SUBDOMAIN` | 🚫 | — |
| Garde-fou `src/lib/apiBase.js` : avertissement console si non configuré, pas de requête tentée | ✅ (vérifié localement, guard fonctionnel par construction) | voir compte rendu — testé avec `.env.production` non renseigné |
| `npm install` / `npm ci` sur un checkout propre | ⚠️ | échoue avec `ERESOLVE` (peer dependency `@vitejs/plugin-vue@5.2.4` veut `vite@^5\|^6`, le projet a `vite@8.1.0`) sans `--legacy-peer-deps` — constaté, non corrigé (hors périmètre : ne pas toucher aux dépendances) |
| `npm run build` aboutit malgré ce décalage | ✅ | le build réussit une fois `node_modules` déjà résolu (ce qui est le cas sur cette machine) |

## §4 — Ergonomie (capture sur le site publié)

| Point du brief | Statut | Preuve |
|---|---|---|
| Densité et palette (contraste WCAG) | 🚫 | — |
| Bloc de synthèse en tête de résultat | 🚫 | — |
| Noms d'outils au lieu des codes | 🚫 | — |
| Lisibilité de la matrice et légende | 🚫 | — |
| Explications et liens des outils | 🚫 | — |
| Contexte de cours saisi une seule fois | 🚫 | — |
| Garde-fou de pertinence (non bloquant) | 🚫 | — |
| Affichage à 380px de large | 🚫 | — |

## §5 — Données analysables

| Vérification | Statut | Preuve |
|---|---|---|
| Parcours réels (reco, catalogue, audit) sur le site publié avec `?src=tb2026` | 🚫 | — |
| `worker/analysis.sql` exécuté en `--remote` sur les données réelles | 🚫 | — |
| Ordre chronologique reconstituable au sein d'une session | 🚫 | — |
| Marqueur `tb2026` survit à la navigation | 🚫 | — |
| Événements de fin de session (`sendBeacon`) arrivent bien | 🚫 | — |

## §6 — Chemins de secours

| Vérification | Statut | Preuve |
|---|---|---|
| Coupure d'urgence (`AUDIT_KILL_SWITCH`) → message convivial + fixture proposée | 🚫 | méthode prévue : interception réseau Playwright contre le site publié (pas de bascule réelle du Worker, hors périmètre §1) |
| Plafond journalier dépassé → même comportement | 🚫 | idem |
| Refus de consentement → 3 parcours fonctionnels, zéro requête (onglet réseau) | 🚫 | — |
| Document hors sujet soumis à l'audit réel | 🚫 | — |

## §7 — Navigateurs

| Vérification | Chromium | Firefox | WebKit |
|---|---|---|---|
| Télémétrie de fin de session (`sendBeacon`) | 🚫 | 🚫 | 🚫 |
| Bandeau de consentement | 🚫 | 🚫 | 🚫 |
| Rendu de la matrice | 🚫 | 🚫 | 🚫 |

## §8 — Relecture des explications d'outils

Voir `docs/recette/tools-explainer-review.md`. ✅ document produit, 4 phrases sur 48 signalées en
confiance moyenne (T09, I09, I10, I12), aucun lien de tutoriel inventé.

## §3 — Plafonds de coût

✅ Option "Conservatrice" retenue : `AUDIT_RATE_LIMIT_PER_SESSION_HOUR=5`,
`AUDIT_DAILY_GLOBAL_CAP=40`. Calcul détaillé dans `worker/README.md` section "Coût maximal
théorique" : ~90 $ de coût maximal théorique sur 3 mois si le plafond journalier était atteint
chaque jour, ~10-20 $ pour un usage réaliste sur la durée du test. Reste hors de mon accès : une
limite de dépense côté console Anthropic et une alerte d'usage côté Cloudflare (rappelé dans le
compte rendu final).

## §9 — Publication

| Étape | Statut |
|---|---|
| Branche poussée sur `origin` | 🚫 accord explicite requis |
| Pull request ouverte | 🚫 `gh` indisponible sur cette machine — corps de PR préparé, lien de comparaison à ouvrir manuellement |
| Fusion | 🚫 attend votre accord |
| Tag `v0.2.0` déplacé sur `main` | 🚫 après fusion uniquement |
