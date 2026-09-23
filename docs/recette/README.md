# Grille de recette — Itération 2

Cette grille a suivi la mission de recette de l'itération 2 : aucune ligne n'a été marquée
conforme sans avoir été observée sur l'environnement **déployé**
(`https://neatlovin.github.io/toolbox-prog-ia/`, paramètre `?src=tb2026`) — une vérification faite
sur `localhost` ne comptait pas, précisément parce que les bugs les plus graves de l'itération
précédente n'étaient visibles qu'à la frontière dev/prod.

**État au 2026-09-15** (mise à jour de cohérence documentaire, après la fusion et le durcissement
qui l'ont suivie) : l'itération 2 est **fusionnée dans `main`** (fast-forward local, `gh` étant
indisponible sur cette machine — voir §9), le tag `v0.2.0` est **poussé sur `origin`**, et
`origin/gh-pages` sert le build issu de `main` (`assets/index-D4bCTV7A.js`, vérifié en direct par
`curl` au moment de cette mise à jour). D1 est confirmée à **zéro ligne** par une requête directe
faite pour cette même mise à jour, pas recopiée d'une mission antérieure. Deux missions de
durcissement ont suivi la fusion (correctif de troncature visible, puis outillage anti-dérive —
`npm run preflight`, `npm run prebuild`, séquence pilote) : voir l'historique Git et
`worker/README.md` pour leur détail, cette grille reste centrée sur la recette de l'itération 2
elle-même. Les lignes encore marquées 🚫 le sont pour une raison précise indiquée dans leur propre
cellule.

Légende statut : ✅ conforme · ⚠️ partiel · ❌ absent · 🚫 bloqué — raison précisée dans la cellule.

## Version évaluée

Cette section identifie précisément le code republié et vérifié pour le test d'usage envoyé aux 22
enseignants participants, pour être citée telle quelle dans un document externe au dépôt.

| | |
|---|---|
| **Dépôt** | [NeatLovin/toolbox-prog-ia](https://github.com/NeatLovin/toolbox-prog-ia) |
| **Tag** | `v0.4.1` |
| **Commit republié** | `0c242a0` |
| **URL publique** | https://neatlovin.github.io/toolbox-prog-ia/ |
| **Fichier JavaScript principal servi** | `assets/index-z0bjqoZx.js`, vérifié en direct (`curl`) après republication |
| **`app_version` transmis par la télémétrie** | `0c242a0` — vérifié dans plusieurs vraies requêtes `POST /events` capturées en direct sur les trois scénarios de consentement, puis dans les lignes correspondantes de D1, pas déduit du code |
| **Date d'envoi aux participants** | à compléter |
| **Date de republication (correctif de consentement)** | 2026-09-23 |
| **Plafond journalier d'appels à l'audit (`AUDIT_DAILY_GLOBAL_CAP`)** | 120, inchangé. **Date de révision : 2026-10-07** (14 jours après l'envoi réel du lien, confirmé au 2026-09-23 — la valeur précédente, 2026-10-06, supposait un envoi le 2026-09-22 qui n'a pas eu lieu). Worker redéployé et valeur confirmée servie via `npm run preflight`. Voir `worker/README.md` |
| **Plafond par session et par heure (`AUDIT_RATE_LIMIT_PER_SESSION_HOUR`)** | 5 |
| **Durée de conservation des données de télémétrie** | 12 mois (`RETENTION_DAYS=365`), voir la page `/transparence` du site publié |

Le tag `v0.4.0` marque la fin de l'itération 4 (`9d90f4d`), jamais republiée seule. Le tag `v0.4.1`
pointe sur `0c242a0`, qui ajoute au-dessus la correction d'une fuite de consentement trouvée en
recette : `survey_shown` et `survey_dismissed` partaient sans consentement, contrairement à la page
de transparence, au bandeau et au document envoyé aux enseignants (voir `CHANGELOG.md`). C'est
`0c242a0` qu'`app_version` désigne dans les données réellement collectées lors de la vérification
ci-dessous — la seule version qui sera effectivement envoyée aux 22 enseignants.

## Correctif — fuite de consentement (2026-09-23)

Recheck complet du dépôt avant l'envoi aux 22 enseignants, après l'itération 4. Un point bloquant
trouvé : `trackSurveyShown()` et `trackSurveyDismissed()` (`src/lib/telemetry.js`) passaient par la
voie dédiée hors consentement prévue pour `survey_submitted`, alors qu'un affichage automatique et
un refus de répondre ne sont pas des actes de consentement explicite — contrairement à `survey_submitted`,
dont la justification (cliquer « Envoyer » vaut consentement pour cette réponse) ne s'étend pas à
ces deux cas. L'erreur venait de la spécification de l'itération 4, pas de son implémentation. Voir
`CHANGELOG.md` pour le détail complet des changements (télémétrie, `worker/analysis.sql`, page de
transparence).

### Vérifié sur l'environnement déployé (après republication, accord explicite obtenu — 2026-09-23)

| Point du brief | Statut | Preuve |
|---|---|---|
| Consentement refusé, fermeture sans répondre (« Passer ») | ✅ | 0 requête vers le Worker, contenu de chaque requête inspecté (pas seulement leur nombre) |
| Consentement refusé, réponse envoyée | ✅ | Exactement 1 requête, `survey_submitted`, rien avant ni après |
| Aucun choix fait (bandeau ignoré) | ✅ | Même comportement que le refus dans les deux cas ci-dessus (testé sur `/audit`) |
| Consentement accepté | ✅ | `survey_shown` puis `survey_dismissed` (ou `survey_submitted`) arrivent en base avec le bon `parcours`, capturés via une vraie session complète |
| `npm run prebuild` | ✅ | `survey_submitted` seul sous « voie dédiée » ; `survey_shown`/`survey_dismissed` comptés avec les 36 appels `track()` ordinaires |
| `npm run preflight` | ✅ | Au vert, date de révision 2026-10-07 confirmée servie |
| Requête 10 de `analysis.sql` (taux de complétion) | ✅ | Rejouée sur les données de vérification : une soumission sans consentement (session distincte de celle ayant vu le questionnaire) n'est pas comptée dans le taux, confirmé par un `LEFT JOIN` qui ne matche pas les deux sessions différentes |
| Requête 10b (soumissions brutes) | ✅ | Confirme séparément les 2 soumissions hors consentement (1 arbre, 1 audit) que la requête 10 exclut à raison de son taux |
| Purge des données de vérification | ✅ | `events` et `audit_calls` à 0 ligne confirmé après |

## Itération 4 — outils cliquables, questionnaire à 6 items (2026-09-21)

Deux retours du directeur de Travail de Bachelor après essai du prototype déployé, derniers avant
l'envoi aux 22 enseignants — voir `CHANGELOG.md` pour le détail des changements. Republiée avec votre
accord explicite le 2026-09-21.

### Vérifié en local (`npm run dev`, Playwright, mode console développement)

| Point du brief | Statut | Preuve |
|---|---|---|
| Outils du niveau 1 (résultat de l'arbre) cliquables, ouvrent `ToolDetailModal` | ✅ | Clic souris et clavier (Enter) testés sur `.tool-pill`, modale ouverte dans les deux cas |
| `reco_tool_open` identique au niveau 1 et au niveau 2, `from` distinct | ✅ | Capturé en mode console : `{tool_id: M01, from: summary}` au niveau 1, `{tool_id: M01, from: details}` au niveau 2 (même outil, même session) |
| Proposition pédagogique cliquable, déplie le tiroir et fait défiler jusqu'au patron | ✅ | Tiroir fermé avant clic, ouvert après ; bloc `.result-patron` visible après défilement |
| `reco_patron_open` émis une seule fois, jamais en double | ✅ | Un seul événement capturé au premier clic (tiroir fermé → ouvert) ; un second clic sur la proposition (tiroir déjà ouvert) ne réémet rien et ne referme pas le tiroir |
| `.brief-lever` (audit, section « En bref ») cliquable, `audit_recommendation_open` avec `from` correct | ✅ | `{tool_id: M07, from: brief}` depuis « En bref », `{tool_id: M01, from: section}` depuis le détail par section, dans la même session |
| Questionnaire à 6 items sur les deux parcours | ✅ | 6 blocs `.us-question` comptés ; libellés extraits littéralement |
| Items 1 et 2 identiques au mot près aux deux parcours et à la version précédente | ✅ | Comparaison littérale : « Cet outil répond à mes besoins », « Cet outil est facile à utiliser » — inchangés |
| Item 3 adapté par parcours | ✅ | Arbre : « La recommandation correspondait à mon contexte d'enseignement » · Audit : « L'analyse correspondait à mon contexte d'enseignement » |
| Soumission partielle acceptée, items non répondus à `null` | ✅ | Réponse à 2 items sur 5 seulement : payload capturé intégralement (`jsonValue()`, pas la version tronquée du texte de log) confirme `ease_score: null, reuse_intent_score: null, clarity_score: null, comment: null` pour les items ignorés |
| Bouton « Envoyer » jamais désactivé | ✅ | `isDisabled()` à `false` avant toute réponse |
| `survey_shown` émis à l'affichage effectif, une fois | ✅ | `[telemetry:survey_shown] {parcours: arbre}` capturé à l'arrivée sur le résultat |
| `survey_dismissed` émis au clic sur « Passer » | ✅ | `[telemetry:survey_dismissed] {parcours: audit}` capturé, questionnaire masqué ensuite |
| Questionnaire tient sur un écran sans défiler | ✅ mesuré | Hauteur réelle du composant (`boundingBox()`) : **632px** aux trois viewports testés (1366×768, 1280×800, 1440×900) — marge confortable même au plus bas |
| `npm run prebuild` range les 3 événements dédiés dans la bonne catégorie | ✅ | `survey_shown`, `survey_dismissed`, `survey_submitted` tous listés sous « voie d'envoi dédiée, hors track() », `reco_generative_used` seul sous « jamais émis » |
| `npm run build` | ✅ | Aucune erreur |

### Vérifié sur l'environnement déployé (après republication, accord explicite obtenu — 2026-09-21)

Worker redéployé avant la republication du site (`survey_shown`/`survey_dismissed` ajoutés à
`ALLOWED_EVENTS`, confirmé via `npm run preflight`).

| Point du brief | Statut | Preuve |
|---|---|---|
| Outils du niveau 1 (arbre), proposition pédagogique et `.brief-lever` (audit) ouvrent le détail en conditions réelles | ✅ | `ToolDetailModal` ouverte depuis `.tool-pill` et `.brief-lever` sur le site publié ; tiroir « Modèle et outils » ouvert après clic sur la proposition |
| Questionnaire à 6 items sur les deux parcours, en conditions réelles | ✅ | 6 blocs affichés, libellé de contexte correctement adapté (« L'analyse correspondait… » sur l'audit) sur le site publié |
| Soumission partielle confirmée en base, `null` pour les items non répondus | ✅ | Ligne D1 réelle : `{"parcours":"audit","needs_score":6,"ease_score":null,"context_fit_score":null,"reuse_intent_score":null,"clarity_score":null,"comment":null}` |
| `survey_shown`, `survey_dismissed`, `survey_submitted` arrivent tous trois en base avec le bon `parcours` | ✅ | Les trois événements lus directement en D1 distant, `app_version` = `9d90f4d` sur chacun |
| Fonctionnement complet avec consentement refusé, aucune autre requête ne part | ✅ | Sur le site réel, consentement refusé : exactement 2 requêtes `POST /events` au total pour un parcours complet jusqu'à soumission (`survey_shown` puis `survey_submitted`), aucune autre — vérifié en inspectant le corps de chaque requête, pas seulement leur nombre |
| `npm run preflight` sur le site republié | ✅ | « Préflight : OK », nouvelle date de révision confirmée servie |
| Purge des données de vérification, confirmation de zéro ligne dans `events`/`audit_calls` | ✅ | `DELETE FROM events` / `DELETE FROM audit_calls` sur D1 distant, `SELECT COUNT(*)` confirme 0/0 après |
| Mise à jour du tableau « Version évaluée » | ✅ | Voir tableau ci-dessus |

## Itération 3 — questionnaire, clarté, accessibilité (2026-09-21)

Demandes du directeur de Travail de Bachelor avant l'envoi du lien aux 22 enseignants. Contrainte
de cadrage : modifications incrémentales et à faible risque, aucune touche à l'infrastructure
(Worker/D1/plafonds/déploiement), au moteur de recommandation ni à `src/data/` — respectée, voir
`CHANGELOG.md` entrée « Itération 3 » pour le détail des changements. **Republication non encore
effectuée au moment de la rédaction de cette section** : elle nécessite un accord explicite séparé
de l'accord donné pour le plan d'implémentation. Cette section distingue donc ce qui est vérifié en
local de ce qui reste à vérifier sur l'environnement déployé une fois cet accord obtenu.

### Vérifié en local (`npm run dev`, Playwright, mode console développement)

| Point du brief | Statut | Preuve |
|---|---|---|
| Questionnaire répondable une fois par parcours (arbre ET audit, même session) | ✅ | Parcours complet arbre → questionnaire affiché → « Passer » → audit (fixture) → questionnaire ré-affiché avec un intitulé différent ; marqueurs `sessionStorage` distincts (`tb_survey_shown_arbre`, `tb_survey_shown_audit`) |
| Questionnaire visible et envoyable sans consentement télémétrie | ✅ | Bandeau « Refuser » cliqué, questionnaire affiché quand même avec la ligne « seule cette réponse sera transmise », soumission confirmée (message de remerciement affiché) |
| Payload de soumission correct et indépendant de `track()` | ✅ | Mode console développement : `[telemetry:survey] {parcours: arbre, needs_score: 6, ease_score: 6, comment: null}` — capturé directement, pas déduit du code |
| Items notés identiques dans les deux parcours | ✅ | Libellé `#us-needs-label` comparé littéralement entre les deux montages : identique |
| Navigation hiérarchisée (2 liens d'action / 4 de consultation) | ✅ | `nav-links--primary` → [Recommandation, Audit PDF], `nav-links--secondary` → [Catalogue, Concepts, Matrice, Méthodologie] |
| Orientation immédiate à l'accueil | ✅ | Phrase « Deux façons de démarrer, sans préparation nécessaire : » confirmée juste après le titre, avant les deux cartes |
| Densité réduite sans perte d'information (audit) | ✅ | 6 blocs de recommandation par section rendus en `<details>` repliés par défaut, ouverture au clic sur le résumé confirmée |
| Contraste des nouveaux traitements visuels (nav primaire/secondaire, ligne d'orientation) | ✅ | Mesuré (formule de luminance relative WCAG), clair + sombre : le plus bas 6,13:1 (lien secondaire par défaut), seuil 4,5:1 — voir tableau détaillé plus bas |
| `ToolDetailModal` : piège de focus, Échap, focus initial, retour de focus | ✅ | Ouverture réelle, 10 pressions Tab consécutives restent dans la modale, Échap ferme, focus revient sur `.tool-card` déclencheur (pas `BODY`) |
| `ConceptDetailModal` : mêmes quatre mécaniques | ✅ | Même test, focus revient sur `.result-concept-btn` déclencheur |
| Cellules de la matrice (`HeatmapMatrix`) clavier-opérables | ✅ | `Enter` sur une cellule après `.focus()` ouvre bien la modale outil |
| `ToolCard` clavier-opérable (lacune trouvée pendant cette vérification, pas anticipée dans le plan) | ✅ corrigé | Voir note ci-dessous |
| Hiérarchie de titres sans saut sur `/catalogue` et `/concepts` | ✅ | Liste réelle des balises de titre extraite du DOM : `H1>H2>H3>H3>H2>H3>H3...` et `H1>H2>H2>H2>H2>H3>H4>H3>H4...` — aucun saut de plus d'un niveau vers le bas |
| `npm run prebuild` (taxonomie client/Worker) | ✅ | 34 événements client dans la liste blanche, `AUDIT_MAX_CHARS` toujours au-dessus de `CHUNK_MAX` |
| `npm run build` | ✅ | Deux exécutions complètes (après l'implémentation, puis après la correction `ToolCard`), zéro erreur |

**Note sur la lacune `ToolCard`** : le plan initial (section 3.2) avait identifié les cellules de la
matrice et les deux modales comme les seules lacunes clavier, en confirmant explicitement que les
en-têtes de colonnes de la matrice étaient déjà accessibles (vrais `<button>`). Cette vérification a
révélé une quatrième lacune du même type sur `ToolCard.vue` (carte outil cliquable utilisée dans le
niveau « Détails » du résultat de l'arbre) : `@click` seul, sans `tabindex` ni rôle, découverte en
observant que le focus ne revenait pas correctement sur le déclencheur après fermeture de
`ToolDetailModal` (le vrai problème : le déclencheur n'était jamais focalisable, donc jamais
focalisé à l'ouverture). Corrigée par le même geste mécanique que la matrice (`role="button"`,
`tabindex="0"`, activation `Entrée`/`Espace`), sans changement visuel ni changement du moteur de
recommandation.

**Effet de bord découvert sur `npm run prebuild`, non corrigé** : le contrôle de taxonomie signale
désormais `survey_submitted` comme « jamais émis côté client » alors qu'il l'est bel et bien, via
`submitSurveyResponse()`. Le script (`worker/scripts/check-event-taxonomy.mjs`) détecte les
événements par une recherche des appels `track('...')` ; il ne voit pas le nom d'événement fixé en
dur dans la nouvelle fonction dédiée, qui contourne volontairement `track()` (voir §1.3 du plan).
Ce n'est qu'une information (`ℹ`, pas un `✗`) et le contrôle reste au vert — signalé ici sans
correction, une modification du script de vérification n'étant pas nécessaire pour cette itération
et sortant du périmètre incrémental demandé.

Détail des mesures de contraste (formule de luminance relative WCAG, clair + sombre) :

| Élément | Défaut | Survol | Actif |
|---|---|---|---|
| Lien nav primaire (clair) | 6,13:1 | 16,15:1 | 17,93:1 |
| Lien nav primaire (sombre) | 7,50:1 | 13,89:1 | 17,93:1 |
| Lien nav secondaire (clair) | 6,81:1 | — | — |
| Lien nav secondaire (sombre) | 8,05:1 | — | — |
| Phrase d'orientation accueil (clair) | 17,19:1 | — | — |
| Phrase d'orientation accueil (sombre) | 16,27:1 | — | — |

Seuil applicable : 4,5:1 (texte normal). Toutes les valeurs ci-dessus, ainsi que les 34 mesures
faites en préparation du plan (badges, boutons, cellules de matrice, boutons d'échelle du
questionnaire), sont conformes. `prefers-reduced-motion` et le zoom 200 % restent conformes sans
changement (déjà vérifiés en préparation du plan, aucune des modifications de cette itération n'a
touché aux animations ni à la mise en page responsive).

### Vérifié sur l'environnement déployé (après republication, accord explicite obtenu — 2026-09-21)

| Point du brief | Statut | Preuve |
|---|---|---|
| Republication effective, bundle et `app_version` alignés sur le commit republié | ✅ | `curl` sur `https://neatlovin.github.io/toolbox-prog-ia/` confirme `assets/index-DIfKLun8.js` ; requête réelle `POST /events` capturée avec `app_version: "1acaa62"` |
| Les deux parcours affichent leur questionnaire sur le site publié | ✅ | Parcours arbre (site réel, consentement refusé) et parcours audit (site réel, consentement accepté, fixture démo) : questionnaire affiché dans les deux, intitulés distincts |
| Envoi du questionnaire sans consentement, aucune autre requête vers le Worker | ✅ | Sur le site réel : « Refuser » cliqué, 0 requête Worker avant l'envoi, exactement 1 requête (`POST /events`) après clic sur « Envoyer », toujours 1 après 11 s supplémentaires (aucun flush périodique caché derrière) |
| `survey_submitted` arrive réellement en D1 avec le bon `parcours` | ✅ | Ligne réelle lue en D1 distant : `{"parcours":"arbre","needs_score":6,"ease_score":6,"comment":null}`, `app_version:"1acaa62"`, associée à la session ayant refusé le consentement |
| `npm run preflight` sur le site republié | ✅ | « Préflight : OK » — site répondant, `/events` et `/audit` fonctionnels, coupure d'urgence inactive, plafonds déployés conformes au dépôt. Signale par ailleurs que la date de révision du plafond de lancement (2026-09-21) est atteinte — **non traité ici**, hors périmètre de cette mission (plafond d'infrastructure), reporté au porteur du projet |
| Les trois parcours restent fonctionnels avec et sans consentement, en conditions réelles | ✅ | Arbre (refus) et audit (acceptation) testés de bout en bout sur le site réel jusqu'à la soumission du questionnaire ; catalogue non re-testé spécifiquement cette itération (aucun changement de comportement réseau sur ce parcours) |
| Purge des données de vérification, confirmation de zéro ligne dans `events`/`audit_calls` | ✅ | `DELETE FROM events` (21 lignes, y compris les données de test antérieures à cette itération) et `DELETE FROM audit_calls` (1 ligne) sur D1 distant ; `SELECT COUNT(*)` confirme 0/0 après |
| Mise à jour du tableau « Version évaluée » | ✅ | Voir tableau ci-dessus |

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
| Document volumineux (146 809 caractères, 43 pages) | ✅ corrigé | **Correctif d'une imprécision de cette grille** : ce document (146 809 caractères) est en réalité *sous* la capacité totale (160 000), donc traité en entier sur ses 4 appels réels — il n'y a pas eu de troncature ici, contrairement à ce qu'affirmait une version précédente de cette ligne. La vraie troncature ne commence qu'au-delà de 160 000 caractères ; elle est désormais **visible** : voir la ligne suivante. |
| Troncature réellement mesurée et rendue visible (> 160 000 caractères) | ✅ | Document de test à 226 243 caractères extraits (58 pages) : **mesuré** sur le site publié, appel réel — exactement 4 requêtes `/audit`, chacune de 40 000 caractères, soit 160 000 caractères transmis au total (confirme au caractère près la valeur codée `VITE_AUDIT_MAX_DOCUMENT_CHARS=160000`, aucun ajustement nécessaire). Bannière "Analyse partielle" affichée sur le résultat : "environ 71 % du contenu a été pris en compte (160 000 caractères sur 226 243). Les manques signalés plus bas peuvent provenir de la partie non analysée, pas d'un manque réel dans votre cours." Persiste après rechargement de la page. Événement `audit_truncated` confirmé en base : `{"characters_submitted":160000,"characters_total":226243,"coverage_ratio":0.71}` |
| Régression : document sous la capacité, multi-tranches | ✅ | Rejoué avec le même document de 146 809 caractères : 4 appels réels, aucune bannière affichée, 0 événement `audit_truncated` en base — le cas ambigu (plusieurs appels sans perte) ne déclenche pas de faux positif |
| Régression : refus serveur `size_exceeded` pour un appel hors interface | ✅ | Rejoué avec un texte de 206 400 caractères envoyé directement au Worker (hors interface, comme lors de la clôture précédente) : toujours `400 {"reason":"size_exceeded"}`, aucun appel au modèle consommé, comportement identique à avant le correctif |
| Anti-fuite sur les 4 sessions de test de cette section | ✅ | Recherche de sous-chaînes du contenu/nom de fichier des documents de test dans `events.payload` : 0 résultat |
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
| Branche poussée sur `origin` | ✅ `feat/telemetry-and-ux` a été poussée, puis fusionnée |
| Pull request ouverte | Jamais ouverte — `gh` étant indisponible sur cette machine, la fusion a été faite par un fast-forward local (`git merge feat/telemetry-and-ux --ff-only` sur `main`, puis `git push origin main`) après votre accord explicite, plutôt que par une PR GitHub. Le texte ci-dessous, rédigé à l'origine comme corps de PR à soumettre, est conservé tel quel comme résumé rétrospectif de ce qui a été fusionné |
| Fusion | ✅ fast-forward de `feat/telemetry-and-ux` dans `main`, poussée sur `origin/main` |
| Tag `v0.2.0` déplacé sur `main` | ✅ déplacé sur le commit de fusion et **poussé** sur `origin` (`git push origin v0.2.0`) |

### Résumé de ce qui a été fusionné

*(rédigé à l'origine comme corps de pull request ; conservé tel quel malgré la fusion directe, sans PR)*

**Titre prévu :** `Itération 2 : service serveur, télémétrie et recette avant test enseignants`

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
- Un document dont le texte extrait dépasse 160 000 caractères était silencieusement tronqué côté
  client sans aucun refus ni avertissement visible par l'enseignant. **Corrigé** : la capacité
  totale (160 000, mesurée et confirmée au caractère près par un test réel) est désormais explicite
  (`VITE_AUDIT_MAX_DOCUMENT_CHARS`), et un document qui la dépasse affiche une bannière neutre et
  persistante sur l'écran de résultat indiquant la proportion réellement couverte, avec un
  événement `audit_truncated` dédié. Le refus serveur `size_exceeded` reste inchangé (plafond par
  requête, sans lien avec ce correctif).

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

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
