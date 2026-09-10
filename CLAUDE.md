# CLAUDE.md — PoC Toolbox

Application web demonstrative developpee dans le cadre d'un Travail de Bachelor. Instructions pour le developpement, a lire au debut de chaque session.

## Contexte (condense)

Le TB "Apprendre a programmer a l'ere de l'IA generative" (HEG Arc, HES-SO) evalue l'integration de l'IA generative dans l'apprentissage de la programmation. La Toolbox en est le proof of concept : un catalogue d'outils pedagogiques, un arbre de decision et une extension d'audit de cours. C'est un artefact demonstratif, pas un produit. Les arbitrages privilegient la simplicite, la robustesse en demonstration et la tracabilite, jamais la scalabilite.

Le detail des choix techniques est dans @Choix_stack_technique_PoC_Toolbox.md

## Stack

- Vue 3, Composition API.
- Donnees : fichiers JSON statiques dans src/data/. Pas de base de donnees applicative cote client.
- Service serveur : Cloudflare Worker + D1 dans `worker/` (Itération 2). Deux responsabilites : `POST /events` (télémetrie) et `POST /audit` (relais de l'appel Anthropic, cle API jamais exposee au client). Voir la section « Service serveur, télémetrie et consentement » ci-dessous et `worker/README.md`.
- Etat global : Pinia + pinia-plugin-persistedstate (uniquement pour l'audit). Le store src/stores/audit.js persiste le resultat en localStorage sous la cle `audit_v1`. Les composables src/composables/ ne gerent pas d'etat global.
- Styling : systeme de design a deux couches. `src/assets/tokens.css` : 90+ CSS custom properties importees une fois dans main.js (couleurs, espacement, typographie, ombres). `src/assets/base.css` : reset global + primitives partagees prefixees `ui-` (ui-card, ui-badge + 30 variantes, ui-btn, ui-collapsible, ui-page-header, ui-filter-bar, ui-empty-state) + bloc `@media print` global (masque chrome, break-inside: avoid, print-color-adjust). Classe `.no-print` pour masquer un element a l'impression. Les composants utilisent ces primitives globales + CSS scoped pour les styles specifiques. Pas de framework UI. Toute nouvelle couleur de badge/bouton doit passer un contraste WCAG AA (4.5:1 texte normal, 3:1 elements larges/UI) — verifie avec un script Playwright ad hoc, pas a l'oeil.
- Build : Vite.
- Hebergement : GitHub Pages, depot NeatLovin/toolbox-prog-ia. base: '/toolbox-prog-ia/' dans vite.config.js. Le Worker se deploie separement sur Cloudflare (`npm run worker:deploy`).
- Ne pas reintroduire React, Svelte, ni framework UI lourd.

## Modele de donnees etendu : patrons.json

**Role :** couche actionnable au-dessus de la matrice. La matrice dit quels outils sont pertinents pour un concept ; le patron dit quoi faire concretement avec, comment l'exercer et comment l'evaluer. 32 patrons sur 21 sous-concepts, densite variable (1 ou 2 patrons par concept selon la pertinence d'un deuxieme contexte).

**Structure de chaque patron :**
```
id             : "AP-C2.3-01" (normalise avec suffixe numerique)
concepts       : ["C2.3"]  (tableau d'IDs, reference vers concepts.json)
contexte       : "Presentiel encadre" | "Autonomie supervisee" | "Projet long" | "Diagnostic"
competence     : description observable de ce que l'etudiant sait faire
phase_couverte : ["apprendre", "exercer", "evaluer"]
titre          : intitule court de l'activite
activite       : description de l'activite pedagogique concrete
outils         : tableau d'IDs d'outils existants dans tools.json
risque_ia      : description du risque de delegation IA sur ce concept
parade         : contre-mesure pedagogique
evaluation     : modalite d'evaluation alignee (Biggs 1996)
references     : sources academiques
```

**Densité variable :** les concepts de la zone logique/architecture ont souvent 2 patrons distingues par leur contexte (ex. C2.3 : "Autonomie supervisee" + "Projet long"). L'indexation retourne toujours un tableau.

**Ancrage theorique :** alignement constructif Biggs 1996. Contenu redige a la main, non genere.

**Helpers exposes par `useData()` :**
- `getPatronsByConcept(conceptId)` : tableau de tous les patrons du concept (peut etre vide)
- `getPatronsByConceptAndContext(conceptId, contexte)` : retourne `{ exact, others, all, hasExact }`. `exact` = patrons dont le contexte correspond. Utilise pour le filtrage dans l'arbre et l'audit.

**Points d'affichage et logique de filtrage :**
- `ConceptsView` : slot "details" du DisclosureCard concept (niveau 2 « Indicateurs et description »). Affiche tous les patrons en pile via PatronBlock, avec leur badge contexte.
- `ArboreView` : le concept est selectionne directement par l'utilisateur (pas de regex sur combo.concept_example). Appelle `getPatronsByConceptAndContext(selectedConcept.id, selectedContext)`. Si patron exact : banniere verte. Si pas de match exact : banniere orange et affiche toutes les variantes. Si "toute la zone" selectionne (selectedConcept === null) : pas de PatronBlock, invite a choisir un concept precis. Le patron est dans le slot "details" du DisclosureCard résultat.
- `CourseAudit` : par section, appelle `getPatronsByConceptAndContext(cid, section.context)`. Si exact, affiche uniquement les patrons matchants. Sinon, affiche tous avec note "Variantes".

**Composant partage :** `PatronBlock.vue` - prend `:patron` en prop, affiche badge contexte en tete, gere son propre `ToolDetailModal` en interne. Les outils du patron sont cliquables.

## Modes d'execution

Depuis l'Itération 2 (Worker Cloudflare), les trois parcours (catalogue/arbre, cartographie/methodologie, audit PDF) sont accessibles a la fois en local et sur le site deploye : l'audit n'est plus reserve a `localhost`, il appelle le Worker public au lieu d'un proxy local. Route / : hub avec deux cartes (Auditer un cours + Obtenir une recommandation), identique dans les deux environnements.

**Local (dev)** : `npm run dev` (mode statique, arbre/catalogue/concepts/cartographie/methodologie, aucun appel reseau au-dela du chargement) ou `npm run dev:full` (Vite + `wrangler dev --local` en parallele via concurrently, emule fidelement le Worker et D1 hors ligne, necessaire pour tester l'audit et la télémetrie en reseau).

**Deploye (GitHub Pages)** : `VITE_API_BASE` (charge depuis `.env.production` au build) pointe sur le Worker Cloudflare reel. Voir `worker/README.md` pour le deploiement initial.

L'audit reste reserve au grand ecran (min-width 860px) quel que soit l'environnement : message explicite en dessous, jamais une degradation silencieuse (AuditView.vue).

## Modele de donnees

Quatre fichiers JSON dans src/data/, derives de la cartographie du TB. Source de verite absolue. Ne jamais inventer un outil, un concept ou un score absent de ces fichiers.

- tools.json : 48 outils (M01-M13, T01-T11, I01-I16, A01-A08). Champs : id, name, description, detail, scenarios[], family, family_label, fils_rouges[], cursus, cyberlearn, cost_teacher, cost_num (1/2/3), cost_student, robustness_ai, robustness_num (0-4), function (F/S/FS/R), sources, link (optionnel, URL externe pour ~9 outils), efficacite ("Validée", "Établie", "Émergente"). Le champ cursus est un séquencement conseillé (valeurs : "Transversal", "Novices", "Début de cursus", "Après fondamentaux") affiché sous le libellé "Séquencement conseillé" dans ToolCard et ToolDetailModal. Champ display-only, non filtré, non parsé. Le champ efficacite est un signal de niveau de preuve affiché comme badge dans ToolCard et ToolDetailModal (avec InfoTooltip). Tri secondaire par efficacite (Validée avant Établie avant Émergente) dans getToolsForConcept, le repli matriciel de getRecommendation et computeCourseGlobalRec. Jamais filtre éliminatoire, jamais paramètre du moteur.
- concepts.json : 21 sous-concepts en 3 familles. Champs : id, family, family_id, family_description, risk_ai, name, gloss, description, bloom[], fuller, level, references. (Champ "gloss" = explication en langage courant, affichee dans la carte resumee de ConceptsView et dans ConceptDetailModal sous le label "En clair". Champ "level" = niveau etudiant : Novice / Intermediaire / Avance / Transversal. Ancien champ "year" supprime.)
- matrix.json : matrice de pertinence outil x concept. { scale, cells: [{tool, concept, score}] }. Scores 1/2/3. Revision de coherence : tuteurs IA differencies (I06, I08, I09, I10, I13, I14, I15, I16 ne sont plus plats). I13 EduAide passe de vide a contextuel. M13 controle continu devient degressif : score 2 en Syntaxe et Logique, score 1 en Architecture. Total 861 cellules.
- combos.json : 16 combinatoires. Champs : id, year, concept_family, bloom, function, context, recommended_tools[], justification.
- meta.json : definitions des fils_rouges (Fil A/B/C/D) et scenarios (S1/S2/S3).
- fixtures/cours-exemple.json : classification pre-calculee d'un cours S1 pour la demo sans reseau.

**Accompagnement des outils (Itération 2, hors cartographie)** : `src/data/tools_links.json`, indexe par ID d'outil, `{ explainer, tutorial_link }`. `explainer` : phrase redigee a la main expliquant l'outil a un enseignant qui ne le connait pas. `tutorial_link` : laisse a `null` par defaut, jamais d'URL inventee — a completer manuellement. Ne modifie jamais tools.json ; fusionne au chargement par `src/data/toolsResolved.js`, point d'entree unique reutilise par `useData.js` ET `lib/recommendation.js` (qui importait tools.json directement avant l'Itération 2 — sans ce partage, les outils renvoyes par le moteur de recommandation n'auraient jamais l'accompagnement). `tool.link` (URL officielle, dans tools.json) reste distinct de `tutorial_link` et n'est pas duplique dans tools_links.json.

## Moteur de recommandation

src/lib/recommendation.js : module factorise avec exports :
- getRecommendation({ year, concept_family, bloom, function, context }) : moteur principal. 3 passes : (1) exact family+bloom+function+context -> source 'combo', (2) relache function -> source 'combo-approche', (3) relache bloom+function -> source 'combo-approche', repli matriciel -> source 'matrix'. year ignore si undefined (yearCovers retourne true).
- getToolsForConcept(conceptId, minScore) : outils de la matrice pour un concept.
- getMatchingCombos({ year, families, bloom, fn, context }) : combinatoires correspondantes.
- bloomCovers, familyCovers, yearCovers : predicats de matching. yearCovers retourne true si userYear est falsy.
- GENERIC_RECOMMENDATION : constante texte explicatif de la methodologie.
- ZONE_PRINCIPLES : objet { Syntaxe, Logique, Architecture } avec le principe IA de chaque zone, affiche en banniere dans ArboreView.
- computeCourseGlobalRec(validatedClassifs) : recommandation globale deterministe (famille dominante, risque, bloom, leviers).

src/composables/useRecommendation.js : re-exporte getRecommendation pour compatibilite.

## Fonctionnalites

1. **Accueil / hub** (/) : deux cartes de choix — « Auditer un cours » (/audit) et « Obtenir une recommandation » (/arbre), toutes deux actives dans tous les environnements depuis l'Itération 2. Paragraphe de recommandation generique sous l'en-tete, valable sans rien renseigner.
2. **Catalogue** (/catalogue) : liste filtrable des 48 outils. Filtres : famille, fonction, cout, robustesse, fil rouge. Chaque outil en DisclosureCard sur trois niveaux : résumé (id, famille, nom, description, efficacité), « Détails et usage » (detail, explainer de tools_links.json, attributs, scénarios, fils rouges, lien officiel + lien tutoriel si présents), « Sources et littérature ». ToolDetailModal n'est plus utilisé dans CatalogueView ; il reste actif dans PatronBlock pour le détail des outils du patron.
3. **Concepts** (/concepts) : 21 sous-concepts groupés par famille (sections par zone avec en-tête coloré). Chaque concept en DisclosureCard sur trois niveaux : résumé (id, level, risque, nom, gloss "En clair"), « Indicateurs et description » (description technique, Bloom, outils idéaux score 3 issus de la matrice — nom affiché, ID en secondaire —, patrons via PatronBlock), « Références et cadre » (Fuller, bibliographie). Clic sur l'ID d'un concept ouvre ConceptDetailModal.
4. **Arbre de decision** (/arbre) : wizard zone → concept → contexte → objectif cognitif (facultatif, avec hint sous chaque bouton). Pas de question semestre ni de question fonction (Formative par defaut). Résultat en DisclosureCard sur trois niveaux : principe IA de la zone + action immédiate ("À faire maintenant", patron ou premier outil) + badge de provenance + pills des premiers outils (niveau 1), « Patron et outils » (PatronBlock + liste complète des ToolCard, cliquables vers ToolDetailModal) (niveau 2), « Justification et sources » (niveau 3). Mode "toute la zone" disponible. **URL sauvegardable** : quand le résultat est affiché, les paramètres zone/concept/context/bloom sont encodés en query string (router.replace) ; recharger l'URL ou la partager reproduit exactement le même résultat. "Nouvelle recherche" vide les paramètres. Questionnaire UMUX-Lite (UsabilitySurvey.vue) affiché sous les actions du résultat, une fois par session.
5. **Methodologie** (/methodologie) : contexte TB, modele de donnees, familles d'outils.
6. **Audit PDF** (/audit) : voir section ci-dessous.
7. **Transparence** (/transparence) : page de transparence sur la mesure d'audience, accessible depuis le pied de page et le bandeau de consentement. Voir « Service serveur, télémetrie et consentement ».

## Audit PDF

Extension exploratoire. Pipeline en 7 etapes :

1. **Extraction** : depot PDF par l'enseignant, extraction texte avec pdf.js (import dynamique) dans le navigateur.
2. **Segmentation** : detection des titres par hauteur de police (pdf.js text items) + repli regex.
3. **Classification** : appel au Worker Cloudflare (`POST /audit`, voir section suivante) pour chaque section/chunk. Le client n'envoie que `{ session_id, text }` ; modele, `max_tokens` et prompt systeme sont fixes cote Worker (`worker/src/audit.js`), pas cote client. Sortie JSON stricte : `{ is_programming, relevance_confidence, course_summary, sections: [{ concept_ids[], bloom, confidence }] }`. Les IDs de concept sont valides uniquement parmi les 21 de concepts.json.
4. **Garde-fou de pertinence** : si `is_programming` est faux ou `relevance_confidence` est "low", phase `relevance-warning` (jamais un blocage) — l'enseignant choisit "Continuer quand même" ou "Recommencer" (audit.confirmRelevance(bool) dans stores/audit.js).
5. **Validation humaine** (SectionReview.vue) : l'enseignant corrige les classifications avant de continuer. Etape obligatoire et visible. Contexte de cours saisi une seule fois en amont (AuditView.vue, phase idle), modifiable ensuite depuis le résultat sans relancer l'extraction (`audit.recomputeWithContext`).
6. **SWOT deterministe** : croiser les concepts valides avec matrix.json et combos.json. Aucun texte libre du modele. Forces/Faiblesses/Risques/Opportunites tous traceables jusqu'aux donnees.
7. **Restitution** (CourseAudit.vue) : SWOT 2x2 + recommandations par section issues du moteur factorise. UsabilitySurvey.vue en pied de résultat.

**Fixture demo** : src/data/fixtures/cours-exemple.json. Charger depuis PdfDropzone pour rejouer sans reseau ni API. Reutilisee comme repli automatique quand l'audit reel est indisponible (plafond atteint, coupure d'urgence, erreur reseau).

**Persistance Pinia** : l'etat de l'audit (phase, sections, validated, swot, recommendations, courseContext, courseSummary, isDemo) est persiste en localStorage via pinia-plugin-persistedstate (cle `audit_v1`). Un rechargement de page apres une analyse terminee restaure le resultat automatiquement. "Nouvelle analyse" appelle `audit.reset()` qui execute `$reset()` puis supprime la cle localStorage. Les champs transitoires (classifications, error, relevanceConfidence) ne sont PAS persistes.

## Architecture src/

```
src/
  assets/         tokens.css (design tokens), base.css (reset + primitives ui- + @media print)
  data/           tools.json, concepts.json, matrix.json, combos.json, meta.json, tools_links.json
                  toolsResolved.js (fusion tools.json + tools_links.json, point d'entree unique)
                  fixtures/cours-exemple.json
  lib/            recommendation.js (moteur factorise), glossary.js (14 definitions InfoTooltip),
                  fuller.js (fullerHint), references.js (DOI_MAP + Scholar fallback),
                  telemetry.js (track(), file + flush par lots, sendBeacon), consent.js (etat
                  reactif du consentement), session.js (identifiant de session sessionStorage),
                  deadClick.js (detection generique de clics repetes sur zone non interactive)
  composables/    useData.js, useRecommendation.js
  stores/         audit.js (Pinia + persistedstate, remplace useAudit.js supprime)
  views/          HomeView, ArboreView, CatalogueView, ConceptsView, MethodologieView, AuditView,
                  CartographieView, TransparenceView
  components/     DisclosureCard (primitive 3 niveaux, emet @toggle), PatronBlock, ToolCard,
                  ToolDetailModal (auto-instrumente tool_detail_open via watch sur sa prop tool),
                  ConceptDetailModal, InfoTooltip (emet @open), PdfDropzone, SectionReview,
                  CourseAudit, ReferenceLinks, ZoneProfile, StatStrip, HeatmapMatrix,
                  ConsentBanner, UsabilitySurvey
  router/         index.js (getLastFromPath() pour matrix_open{from})
  App.vue, main.js (Pinia + pinia-plugin-persistedstate cree ici avant le mount ; capture de
                  ?src= avant le routeur ; app.config.errorHandler pour app_error)
worker/
  src/            index.js (routage + purge planifiee), audit.js, events.js, cors.js, util.js
  scripts/        export-csv.mjs, verify-e2e.mjs
  schema.sql, analysis.sql, wrangler.toml, README.md
```

## Service serveur, télémetrie et consentement (Itération 2)

**Worker** (`worker/`) : deux routes, `POST /events` (télémetrie) et `POST /audit` (relais Anthropic). CORS strict sur liste blanche (`ALLOWED_ORIGINS`), jamais l'en-tete `CF-Connecting-IP` ni aucune donnee reseau persistee. `Access-Control-Allow-Credentials: true` necessaire car `navigator.sendBeacon` envoie toujours ses requetes en `credentials:'include'`, meme cross-origin, sans possibilite de le desactiver cote client — aucun cookie n'est lu ni pose par le Worker, sans danger ici. Garde-fous sur `/audit` : interrupteur d'urgence (`AUDIT_KILL_SWITCH`), taille de texte max, plafond horaire par session et journalier global (table `audit_calls`, distincte de `events`). Detail complet : `worker/README.md`.

**Consentement** (`src/lib/consent.js`, `src/components/ConsentBanner.vue`) : bandeau non bloquant en bas d'ecran, affichage differe (timer ~2.5s OU premiere navigation utilisateur reelle — `router.isReady()` est indispensable pour ignorer la resolution de route initiale de vue-router, qui declenche sinon un faux positif). Choix en `sessionStorage['tb_consent']` (`'granted'|'denied'`), jamais en localStorage. Reouverture via le pied de page ("Confidentialite", `reopenBanner()`).

**Télémetrie** (`src/lib/telemetry.js`) : `track(event, payload)` n'envoie et ne met en file strictement rien tant que `hasConsent()` est faux. Identifiant de session (`src/lib/session.js`, `sessionStorage`, jamais un identifiant persistant), campagne `?src=` capturee une seule fois dans main.js avant que le routeur a diese ne l'efface (un `router.replace({query})` ailleurs dans l'app ecrase la query entiere). File en memoire, flush par lots (10s ou 20 evenements) via `fetch`, flush de fin de session sur `visibilitychange -> hidden` via `sendBeacon`. Mode developpement (`import.meta.env.DEV` ou `VITE_API_BASE` absent) : `console.debug` au lieu du reseau — donc `npm run dev` seul ne peut jamais peupler D1, il faut un build "production" (`vite build`, meme avec `--mode development` pour charger `.env.development`) pour tester la télémetrie en reseau, voir `worker/README.md`.

**Taxonomie des evenements** : liste blanche exacte dans `worker/src/events.js` (ALLOWED_EVENTS), point de reference unique — n'ajouter un evenement ni cote client ni cote serveur sans l'ajouter aux deux. `reco_generative_used` est dans la liste mais n'est emis nulle part : aucune couche generative de reformulation de la recommandation n'existe dans le code (seul l'audit appelle un modele, pour la classification).

**Variables d'environnement client** (Vite, chargees automatiquement selon le mode) : `VITE_API_BASE` — adresse du Worker. `.env.development` (localhost:8787, committe), `.env.production` (adresse reelle du Worker, committee, non secrete). `.env.example` documente l'usage.

## Systeme de design (tokens + primitives)

**Accent** : `--color-accent: #334155` (slate-700, neutre encre). Jamais confondu avec les couleurs de zone. Utilise pour les boutons, focus, liens actifs, bordures d'emphase.

**Zones** : bleu = Syntaxe, vert = Logique, violet = Architecture. Ces trois couleurs sont reservees aux affichages de zone (cartes de selection, badges, bannieres de principe). Ne pas les reutiliser ailleurs.

**Etats semantiques** : success (vert), warning (orange), danger (rouge), info (cyan/sarcelle `#0e7490`). Le SWOT se mappe : Forces = success, Faiblesses = warning, Risques = danger, Opportunites = info.

**Badges** : toujours `class="ui-badge ui-badge--variante"`. Les fonctions JS (`familyClass`, `sourceBadgeClass`, `riskClass`) retournent la chaine de classe `ui-badge--*`. Ne pas creer de classes de couleur locales redupliquant les variantes globales.

**Boutons** : `ui-btn` + modificateur (`ui-btn-primary`, `ui-btn-secondary`, `ui-btn-ghost`). Les styles locaux n'ajoutent que des proprietes de mise en page (width, flex-shrink), jamais de couleur.

**Repliables** : `<details class="ui-collapsible">` + `<div class="ui-collapsible-body">`. Variante compacte : ajouter `ui-collapsible--compact`.

**DisclosureCard** : `src/components/DisclosureCard.vue`. Primitive generique a trois niveaux, construite sur `.ui-card` + `.ui-collapsible`. Props : `title` (String, optionnel), `detailsLabel` (String, defaut "Détails"), `deepLabel` (String, defaut "Creuser"). Slots nommes : `summary` (toujours visible), `details` (replié, rendu uniquement si slot rempli), `deep` (replié, rendu uniquement si slot rempli). La presence du slot est detectée via `useSlots()`. Utilisee dans ArboreView (résultat), CatalogueView (chaque outil) et ConceptsView (chaque concept). ToolCard (ArboreView niveau 2) et ToolDetailModal (PatronBlock) restent des composants independants.

**Regles de migration** : aucune couleur hex (#rrggbb) dans les fichiers `.vue` hors tokens.css et base.css. Seule exception admise : `rgba(255,255,255,0.7)` et `rgba(0,0,0,0.08)` pour des superpositions translucides sans equivalent en token.

## Composant InfoTooltip

`src/components/InfoTooltip.vue` : infobulle declenchee au survol (desktop) ET au tap (tablette). Prop unique : `content` (String, texte de la definition). Deux modes de declencheur : (1) bouton `?` par defaut (aria-label, aria-expanded) ; (2) si un slot default est fourni, le contenu du slot devient le declencheur interactif (role="button", tabindex="0", gestion clavier Enter/Space) — utilise pour les badges Axe/Scenario dans ToolCard.

**Glossaire centralise** : `src/lib/glossary.js` exporte un objet `GLOSSARY` avec 14 entrees. Chaque entree a `term` (intitule) et `short` (definition courte passee au composant). Termes couverts : robustesse IA, axe pedagogique (ex-fil rouge), scenario, fonction pedagogique, famille d'outils, combinatoire, patron pedagogique, Bloom, contexte d'usage, alignement constructif, cout enseignant, efficacite documentee, parade, dimension Fuller.

**Points d'integration** : labels des filtres avances de CatalogueView (Fonction, Cout, Robustesse IA, Axe pedagogique), etape contexte et etape Bloom de ArboreView, badge source du resultat de l'arbre, label "Parade" dans PatronBlock, label "Dimension Fuller" dans ConceptDetailModal.

## Composant ConceptDetailModal

`src/components/ConceptDetailModal.vue` : fiche modale d'un concept (meme pattern que ToolDetailModal). Teleporte dans `<body>`. Props : `concept` (Object|null). Emits : `close`. Affiche : id + badges zone/level/risque, nom, gloss "En clair", description, niveaux Bloom, Dimension Fuller (avec InfoTooltip GLOSSARY.fuller + hint fullerHint()), Risque IA, references via ReferenceLinks. Gere focus trap (ref modalEl, watch concept -> nextTick -> focus) et fermeture Escape.

Pointe d'entree : bouton "concept ciblé" dans le slot #summary du résultat ArboreView. Ouvre aussi depuis les en-tetes de colonnes de HeatmapMatrix.

## Renommage "Fil rouge" → "Axe pedagogique"

Transformation d'affichage uniquement. Les IDs de donnees (Fil A, Fil B, Fil C, Fil D), les cles JSON, les classes CSS (ui-badge--fil-a etc.) et les comparaisons JS restent inchanges. Seul l'affichage visible est transforme :
- Le filtre s'appelle "Axe pedagogique" dans CatalogueView.
- Les badges affichent "Axe A".."Axe D" via `axeLabel(id) { return id.replace('Fil', 'Axe') }` (defini dans ToolCard, ToolDetailModal, CatalogueView).
- La section s'appelle "Axes pedagogiques" dans les fiches outils.

## Export PDF

Bouton "Exporter en PDF" (classe `no-print`) present dans CourseAudit et ArboreView (résultat), appelle `window.print()`. Le bloc `@media print` dans base.css masque le chrome (header, footer, theme-toggle, filtres, boutons `.no-print`), force `break-inside: avoid` sur les blocs de contenu (.rec-block, .swot-quadrant, .quad-item, .patron-block, .dc-root, etc.), et active `print-color-adjust: exact` sur les elements colores.

## Commandes

- `npm install` pour installer les dependances.
- `npm run dev` pour le dev sans audit/télémetrie reseau (mode statique, télémetrie en console).
- `npm run dev:full` pour le dev avec audit (Vite + `wrangler dev --local` en parallele).
- `npm run worker:dev` lance uniquement le Worker local (`wrangler dev --local`).
- `npm run worker:deploy` deploie le Worker sur Cloudflare.
- `npm run build` genere le bundle statique pour GitHub Pages (mode production : télémetrie reseau active, cible `.env.production`).
- `npm run deploy` publie dist/ sur GitHub Pages via gh-pages.
- `node worker/scripts/verify-e2e.mjs` verifie bout en bout que les evenements attendus arrivent en base (voir `worker/README.md` pour les prerequis).

## Convention de rédaction

Pour tout texte affiché dans l'interface ou tout contenu rédigé : pas de longs tirets (em-dash), ponctuation naturelle.

**Accents** : les valeurs de chaînes JSON destinées à l'affichage portent les accents français corrects (ex. : "Validée", "Établie", "Émergente", "Élevé", "Modéré", "Début de cursus", "Après fondamentaux"). Les noms de propriétés JSON (clés de champ), les identifiants techniques (M01, C2.2, F/S/FS, S1-S3, Bloom en anglais, Fuller en anglais) restent en ASCII sans accent. Quand une valeur accentuée sert de clé de comparaison dans le code JS (EFFICACITE_RANK, riskClass(), filtres), les deux côtés de la comparaison utilisent la même forme accentuée.
