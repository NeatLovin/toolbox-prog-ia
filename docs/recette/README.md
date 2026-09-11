# Grille de recette — Itération 2

Branche `feat/telemetry-and-ux`, tag local `v0.2.0`. Cette grille suit la mission de recette :
aucune ligne n'est marquée conforme sans avoir été observée sur l'environnement **déployé**
(`https://neatlovin.github.io/toolbox-prog-ia/`, paramètre `?src=tb2026`) — une vérification faite
sur `localhost` ne compte pas ici, précisément parce que les bugs les plus graves de l'itération
précédente n'étaient visibles qu'à la frontière dev/prod.

État au moment de la mise à jour de cette grille (clôture de l'itération 2) : `origin/gh-pages`
sert désormais le build de cette branche (`assets/index-CT-YIDU9.js`, vérifié en direct par
`curl`, différent du hash de l'Itération 1 `index-Da7boQFs.js`), le Worker répond
(`toolbox-prog-ia-api.toolbox-prog-ia.workers.dev`, testé en direct), et D1 est vide. La quasi-
totalité des sections ci-dessous a des preuves recueillies contre cet environnement ; les lignes
encore marquées 🚫 le sont pour une raison précise indiquée dans leur propre cellule (clé API pas
encore posée, fusion pas encore accordée), plus pour la fusion elle-même.

Légende statut : ✅ conforme · ⚠️ partiel · ❌ absent · 🚫 bloqué — raison précisée dans la cellule.

## §2 — Chaîne de configuration

| Vérification | Statut | Preuve |
|---|---|---|
| `VITE_API_BASE` résout vers le Worker réel sur le site publié (onglet réseau) | ✅ | Playwright contre `https://neatlovin.github.io/toolbox-prog-ia/` : requête `POST https://toolbox-prog-ia-api.toolbox-prog-ia.workers.dev/events` capturée après acceptation du consentement et flush |
| Aucune requête ne part vers le placeholder `REPLACE_WITH_SUBDOMAIN` | ✅ | Aucun avertissement console, aucune requête avant flush, URL confirmée réelle |
| Garde-fou `src/lib/apiBase.js` : avertissement console si non configuré, pas de requête tentée | ✅ | Testé sur un build avec `.env.production` non renseigné (avant déploiement) : avertissement affiché, zéro requête, bascule fixture en <1s |
| `npm install` / `npm ci` sur un checkout propre | ⚠️ | échoue avec `ERESOLVE` (peer dependency `@vitejs/plugin-vue@5.2.4` veut `vite@^5\|^6`, le projet a `vite@8.1.0`) sans `--legacy-peer-deps` — constaté, non corrigé (hors périmètre : ne pas toucher aux dépendances) |
| `npm run build` aboutit malgré ce décalage | ✅ | le build réussit une fois `node_modules` déjà résolu (ce qui est le cas sur cette machine) |

## §4 — Ergonomie (capture sur le site publié)

| Point du brief | Statut | Preuve |
|---|---|---|
| Densité et palette (contraste WCAG) | ✅ | Audit chiffré Playwright contre le site déployé (Catalogue, Concepts, Cartographie, résultat de l'arbre, clair + sombre) : 0 échec sur tous les badges/boutons/cellules testés |
| Bloc de synthèse en tête de résultat | ✅ | `screenshots/01-arbre-resultat-synthese.png` — "Principe IA : Logique" + "À faire maintenant : Essayer Algorithmique pure papier (avant code)" |
| Noms d'outils au lieu des codes | ✅ | `screenshots/02-arbre-resultat-details-noms-outils.png`, `04-cartographie-matrice-legende.png` — noms affichés, ID en secondaire |
| Lisibilité de la matrice et légende | ✅ | `screenshots/04-cartographie-matrice-legende.png` — valeurs dans les cellules, légende toujours visible |
| Explications et liens des outils | ✅ | `screenshots/03-catalogue-outil-explainer.png` |
| Contexte de cours saisi une seule fois | ✅ | `screenshots/05-audit-contexte-idle.png` (saisie initiale), `06-`/`07-audit-resultat-contexte-*.png` (modifiable depuis le résultat, testé via la fixture démo — sans appel API — : le changement de contexte reste sur l'écran de résultat, aucun reset) |
| Garde-fou de pertinence (non bloquant) | ✅ | `screenshots/08-audit-garde-fou-pertinence.png` — réponse `/audit` interceptée (Playwright) pour simuler une confiance faible sur le site réel : bannière neutre, "Continuer quand même" / "Recommencer", jamais un blocage |
| Affichage à 380px de large | ✅ | `screenshots/09-380px-*.png`, 7 routes, `scrollWidth === clientWidth` partout (aucun débordement horizontal). `/audit` affiche correctement le message grand écran requis |

## §5 — Données analysables

| Vérification | Statut | Preuve |
|---|---|---|
| Parcours réels (reco, catalogue, audit) sur le site publié avec `?src=tb2026` | ✅ | 2 parcours complets joués avec Playwright contre le site déployé (recommandation jusqu'au résultat, filtre catalogue, ouverture d'outil, audit via la fixture avec une vraie correction, sondage UMUX-Lite) |
| `worker/analysis.sql` exécuté en `--remote` sur les données réelles | ✅ | Les 9 requêtes exécutées contre D1 distant, résultats montrés ci-dessous |
| Ordre chronologique reconstituable au sein d'une session | ⚠️ conforme, avec une nuance à documenter | `ts_server` est identique pour tous les événements d'un même lot de flush (assigné une fois par le Worker au moment du traitement du lot, pas par événement) : plusieurs événements d'une session partagent donc le même `ts_server`. `ts_client` (horodatage pris côté navigateur à chaque `track()`) est en revanche strictement croissant et reconstitue l'ordre réel sans ambiguïté. **À documenter dans `worker/README.md`/`analysis.sql` : trier par `ts_client` pour l'ordre fin, `ts_server` ne sert qu'à la rétention/purge.** |
| Marqueur `tb2026` survit à la navigation | ✅ | Requête 9 : 2 sessions `tb2026`, 2 `direct` (mes tests ad hoc antérieurs sans le paramètre) — distinction correcte |
| Événements de fin de session (`sendBeacon`) arrivent bien | ✅ | Déjà prouvé en §2 (requête `/events` via `sendBeacon` après `visibilitychange`) ; les deux parcours de cette section ont par ailleurs laissé le temps au flush périodique (10s) de partir avant la fin de session, donc n'ont pas eu besoin du beacon pour ce test précis |

### Résultats réels des 9 requêtes (contre D1 distant, après les parcours de test)

```
1. Tunnel : 2/2 sessions atteignent chaque étape jusqu'au résultat (dénominateur trop petit pour un vrai taux, mais le calcul est correct)
2a. Repli matrice : 0/3 résultats
3. Zones interrogées : Syntaxe (1), Logique (1), Architecture (1)
5. Outils ouverts : M01 (2 ouvertures)
6a. Taux de correction moyen : 0,047
6b. Corrections par concept : C1.1 retiré (1 fois)
7. Latence médiane jusqu'au résultat : 825 ms
8. UMUX-Lite : 1 réponse, score moyen 83,3/100, équivalent SUS 77,1
9. Campagnes : tb2026 (2 sessions), direct (2 sessions)
```

2b et 4a/4b renvoient des jeux vides : aucun repli matriciel ni aucune relance n'ont eu lieu dans
ces quelques parcours de test, ce qui est attendu (pas un défaut de requête) et se peuplera avec
un usage réel plus large.

**Nettoyage des données de test : fait, avec votre accord.** Les 4 sessions de test de cette
section (`14501712-...`, `6187126f-...`, `b3b3dacd-...`, `c638af61-...`, 48 lignes) ainsi que 3
sessions supplémentaires générées par le test croisé-navigateurs du §7 (`5a682a58-...`,
`ebb16b0f-...`, `f3e95323-...`, 12 lignes) ont été supprimées de `events` et `audit_calls` sur D1
distant après confirmation explicite. `SELECT COUNT(*) FROM events` confirme 0 ligne restante :
la base est vide et prête pour le vrai test enseignants.

## §6 — Chemins de secours

| Vérification | Statut | Preuve |
|---|---|---|
| Coupure d'urgence (`AUDIT_KILL_SWITCH`) → message convivial + fixture proposée | ✅ | Réponse `/audit` interceptée (503, message réel renvoyé par le Worker en cas de coupure) sur le site publié : bouton "Charger le cours exemple" proposé, aucun code technique brut affiché (503/error/NetworkError absents du texte visible). `screenshots/10-audit-coupure-urgence.png` |
| Plafond journalier dépassé → même comportement | ✅ | Réponse `/audit` interceptée (429, message réel du plafond) : même résultat, bouton fixture proposé, aucun code technique brut affiché. `screenshots/11-audit-plafond-journalier.png` |
| Refus de consentement → 3 parcours fonctionnels, zéro requête (onglet réseau) | ✅ | Parcours arbre complet + catalogue (filtre + détail) + audit (fixture, validation, confirmation) après clic sur "Refuser" : 0 requête vers le Worker sur les trois, tous fonctionnels de bout en bout |
| Document hors sujet soumis à l'audit réel | ✅ | `ANTHROPIC_API_KEY` posée, testé avec un vrai document de cuisine romande contre le vrai modèle : réponse réelle `relevance_confidence: high` (confiance élevée que ce n'est pas de la programmation), bannière non bloquante affichée, "Continuer quand même" a repris jusqu'à un vrai écran de résultat. `audit_relevance_check` confirmé en base avec `user_confirmed: true` |
| Document réel de programmation, jusqu'au résultat | ✅ | Testé avec un vrai cours de POO Python (7 sections), 1 appel réel, classification correcte, une vraie correction appliquée (`audit_classification_edited`), résultat affiché |
| Document volumineux (146 809 caractères, 43 pages) | ⚠️ voir constat | Aucun refus explicite via l'interface normale : 4 appels réels enchaînés (plafond client `CHUNK_LIMIT=4`), texte au-delà de ~148 000 caractères tronqué silencieusement, sans avertissement affiché. Le refus serveur `size_exceeded` existe et fonctionne (vérifié séparément par un appel direct au Worker hors interface : 400, message propre, aucun appel au modèle consommé) mais l'interface normale ne l'atteint jamais. Signalé, non corrigé sans votre accord — voir `worker/README.md` section "Coût maximal théorique" |
| Aucune fuite de contenu de document ou de nom de fichier dans `events`/`audit_calls` | ✅ | `audit_calls` n'a structurellement aucune colonne de contenu (id/session_id/ts_server/day) ; recherche de sous-chaînes distinctives des 3 documents de test dans `events.payload` (mots-clés + noms de fichiers) sur les 4 sessions réelles : 0 résultat |

## §7 — Navigateurs

| Vérification | Chromium | Firefox | WebKit |
|---|---|---|---|
| Télémétrie de fin de session (`sendBeacon`) | ✅ 2 requêtes `POST /events` au `visibilitychange→hidden` | ✅ idem | ✅ idem |
| Bandeau de consentement | ✅ affiché et fonctionnel | ✅ idem | ✅ idem |
| Rendu de la matrice | ✅ grille 48×21, scores par famille×zone, légende, filtres | ✅ idem | ✅ idem |

Captures : `screenshots/12-chromium-cartographie.png`, `12-firefox-cartographie.png`, `12-webkit-cartographie.png`.

## §8 — Relecture des explications d'outils

Voir `docs/recette/tools-explainer-review.md`. ✅ document produit, 4 phrases sur 48 signalées en
confiance moyenne (T09, I09, I10, I12), aucun lien de tutoriel inventé.

## §3 — Plafonds de coût

✅ Révisé à la clôture de l'itération 2, avec des valeurs mesurées plutôt qu'estimées.
`AUDIT_RATE_LIMIT_PER_SESSION_HOUR=5` conservé (vérifié ne pas bloquer un usage légitime de 3
tentatives en une heure). `AUDIT_DAILY_GLOBAL_CAP` relevé de 40 à **120 pour la semaine de
lancement** (22 enseignants pouvant tous essayer le même jour), à redescendre à **40-50 en
croisière** une fois le pic initial passé (action manuelle : modifier `worker/wrangler.toml` puis
`npm run worker:deploy`). Mesuré sur le Worker déployé : 1 appel `/audit` pour un document normal,
jusqu'à 4 pour un document volumineux (`CHUNK_LIMIT`). Coût maximal théorique au plafond de
lancement : ~2,40 $/jour si tous les audits sont normaux, ~9,60 $/jour dans le pire cas improbable
où tous seraient volumineux. Détail dans `worker/README.md` section "Coût maximal théorique".
Reste hors de mon accès : une limite de dépense côté console Anthropic et une alerte d'usage côté
Cloudflare (rappelé dans le compte rendu final).

## Cohérence de la durée de conservation (clôture de l'itération 2)

- `RETENTION_DAYS=365` (`worker/wrangler.toml`) et `TransparenceView.vue` annoncent « conservées
  12 mois, puis supprimées automatiquement » : les deux correspondent (365 jours ≈ 12 mois), aucun
  écart constaté.
- La purge planifiée (`worker/src/index.js`, fonction `scheduled()`) lit `env.RETENTION_DAYS`, pas
  de valeur codée en dur pour la table `events`.
- `audit_calls` (compteur de plafond, aucune donnée d'évaluation) est purgée après 7 jours, valeur
  codée en dur et volontairement distincte. Ce choix ne contredit aucune affirmation de la page de
  transparence : celle-ci décrit les catégories de données mesurées pour l'évaluation du
  prototype (parcours, corrections, sondage), et `audit_calls` n'en fait explicitement pas partie
  (« Ce qui n'est jamais collecté » ne s'applique pas non plus, la table ne contenant que
  `session_id`/`ts_server`/`day`, aucun contenu). Aucun changement nécessaire.

## §9 — Publication

| Étape | Statut |
|---|---|
| Branche poussée sur `origin` | ✅ `feat/telemetry-and-ux` poussée, suit `origin/feat/telemetry-and-ux` |
| Pull request ouverte | 🚫 `gh` indisponible sur cette machine — corps de PR rédigé ci-dessous, lien à ouvrir manuellement : https://github.com/NeatLovin/toolbox-prog-ia/pull/new/feat/telemetry-and-ux |
| Fusion | 🚫 attend votre accord explicite |
| Tag `v0.2.0` déplacé sur `main` | 🚫 après fusion uniquement |

### Corps de PR proposé

**Titre :** `Itération 2 : service serveur, télémétrie et recette avant test enseignants`

**Corps :**

```markdown
## Résumé

Itération 2 du prototype Toolbox : Worker Cloudflare + D1 remplaçant le proxy local,
consentement + télémétrie respectant la vie privée, ergonomie retravaillée pour un test
utilisateur avec 22 enseignants de 7 institutions romandes, puis recette complète contre
l'environnement réellement déployé.

- Service serveur (Worker + D1) déployé et vérifié en conditions réelles : `POST /events`,
  `POST /audit` (relais Anthropic, clé jamais exposée au client), plafonds de coût dimensionnés
  pour un pilote de ~25 utilisateurs.
- Consentement en sessionStorage (jamais persistant), télémétrie alignée sur une taxonomie
  d'événements fermée, aucune PII journalisée.
- 8 points d'ergonomie retravaillés (contraste WCAG AA, densité, noms d'outils, légende matrice,
  explications d'outils, contexte de cours modifiable, garde-fou de pertinence non bloquant,
  affichage 380px).
- Page de transparence, questionnaire UMUX-Lite, requêtes d'analyse SQL.
- Recette intégrale menée contre le site publié (jamais localhost) : voir `docs/recette/README.md`.

## Bugs trouvés par le test, pas par la lecture du code

- `sendBeacon` envoie toujours `credentials:'include'` cross-origin ; le Worker ne renvoyait pas
  `Access-Control-Allow-Credentials`, ce qui bloquait silencieusement toute la télémétrie de fin
  de session. Invisible en local, découvert uniquement contre le Worker réellement déployé.
- L'audit PDF restait masqué hors localhost (reliquat de l'architecture à proxy local).
- Le bandeau de consentement s'affichait quasi instantanément à cause de la résolution de route
  initiale de vue-router, confondue avec une navigation réelle.
- `ts_server` est assigné une fois par lot de flush, pas par événement : plusieurs événements
  d'une session partagent le même `ts_server`. `ts_client` reste la seule colonne fiable pour
  l'ordre chronologique fin (documenté dans la recette et dans `worker/scripts/session-replay.mjs`).
- Un document dont le texte extrait dépasse ~148 000 caractères est silencieusement tronqué côté
  client (4 appels `/audit` au maximum, `CHUNK_LIMIT`) sans aucun refus ni avertissement visible
  par l'enseignant. Le refus serveur `size_exceeded` existe et fonctionne (vérifié par un appel
  direct hors interface), mais l'interface normale ne l'atteint jamais. Signalé, non corrigé.

## Recette

Détail complet dans `docs/recette/README.md` : chaîne de configuration, ergonomie (captures),
données analysables (parcours réels + `analysis.sql` en `--remote`), chemins de secours (coupure
d'urgence, plafond, refus de consentement), navigateurs (Chromium/Firefox/WebKit), et désormais un
audit réel de bout en bout contre l'API Anthropic (document de programmation, document hors sujet,
document volumineux) avec vérification qu'aucun contenu ni nom de fichier ne remonte en base.

Plafond journalier (`AUDIT_DAILY_GLOBAL_CAP`) mesuré et relevé à 120 pour la semaine de lancement
(22 enseignants pouvant essayer le même jour), à redescendre à 40-50 en croisière — voir
`worker/README.md` section "Coût maximal théorique" et `docs/recette/pilote.md` pour le passage
pilote avant l'envoi aux 22 enseignants.

## Hors de portée de ce PR (à faire séparément par le porteur du projet)

- Limite de dépense sur la console Anthropic.
- Alerte d'usage sur le tableau de bord Cloudflare.
- Redescendre `AUDIT_DAILY_GLOBAL_CAP` à 40-50 après la semaine de lancement.
- Décider si le comportement de troncature silencieuse des documents volumineux doit être corrigé
  (afficher un avertissement explicite plutôt que de tronquer sans le dire).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
