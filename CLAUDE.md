# CLAUDE.md — PoC Toolbox

Application web demonstrative developpee dans le cadre d'un Travail de Bachelor. Instructions pour le developpement, a lire au debut de chaque session.

## Contexte (condense)

Le TB "Apprendre a programmer a l'ere de l'IA generative" (HEG Arc, HES-SO) evalue l'integration de l'IA generative dans l'apprentissage de la programmation. La Toolbox en est le proof of concept : un catalogue d'outils pedagogiques, un arbre de decision et une extension d'audit de cours. C'est un artefact demonstratif, pas un produit. Les arbitrages privilegient la simplicite, la robustesse en demonstration et la tracabilite, jamais la scalabilite.

Le detail des choix techniques est dans @Choix_stack_technique_PoC_Toolbox.md

## Stack

- Vue 3, Composition API.
- Donnees : fichiers JSON statiques dans src/data/. Pas de backend, pas de base de donnees.
- Etat global : Pinia + pinia-plugin-persistedstate (uniquement pour l'audit). Le store src/stores/audit.js persiste le resultat en localStorage sous la cle `audit_v1`. Les composables src/composables/ ne gerent pas d'etat global.
- Styling : systeme de design a deux couches. `src/assets/tokens.css` : 90+ CSS custom properties importees une fois dans main.js (couleurs, espacement, typographie, ombres). `src/assets/base.css` : reset global + primitives partagees prefixees `ui-` (ui-card, ui-badge + 30 variantes, ui-btn, ui-collapsible, ui-page-header, ui-filter-bar, ui-empty-state) + bloc `@media print` global (masque chrome, break-inside: avoid, print-color-adjust). Classe `.no-print` pour masquer un element a l'impression. Les composants utilisent ces primitives globales + CSS scoped pour les styles specifiques. Pas de framework UI.
- Build : Vite.
- Hebergement : GitHub Pages, depot NeatLovin/toolbox-prog-ia. base: '/toolbox-prog-ia/' dans vite.config.js.
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

## Deux modes d'execution

**Mode statique (GitHub Pages)** : la route / redirige vers /arbre (guard router beforeEach). Catalogue, concepts, arbre et methodologie accessibles. Aucun appel reseau. Hub et audit PDF masques.

**Mode local (dev)** : la route / affiche le hub (deux cartes : Auditer un cours + Obtenir une recommandation). Toutes les vues accessibles, y compris Audit PDF. Lancer avec `npm run dev:full` (Vite + proxy Anthropic en parallele via concurrently).

## Modele de donnees

Quatre fichiers JSON dans src/data/, derives de la cartographie du TB. Source de verite absolue. Ne jamais inventer un outil, un concept ou un score absent de ces fichiers.

- tools.json : 48 outils (M01-M13, T01-T11, I01-I16, A01-A08). Champs : id, name, description, detail, scenarios[], family, family_label, fils_rouges[], cursus, cyberlearn, cost_teacher, cost_num (1/2/3), cost_student, robustness_ai, robustness_num (0-4), function (F/S/FS/R), sources, link (optionnel, URL externe pour ~9 outils), efficacite ("Validée", "Établie", "Émergente"). Le champ cursus est un séquencement conseillé (valeurs : "Transversal", "Novices", "Début de cursus", "Après fondamentaux") affiché sous le libellé "Séquencement conseillé" dans ToolCard et ToolDetailModal. Champ display-only, non filtré, non parsé. Le champ efficacite est un signal de niveau de preuve affiché comme badge dans ToolCard et ToolDetailModal (avec InfoTooltip). Tri secondaire par efficacite (Validée avant Établie avant Émergente) dans getToolsForConcept, le repli matriciel de getRecommendation et computeCourseGlobalRec. Jamais filtre éliminatoire, jamais paramètre du moteur.
- concepts.json : 21 sous-concepts en 3 familles. Champs : id, family, family_id, family_description, risk_ai, name, gloss, description, bloom[], fuller, level, references. (Champ "gloss" = explication en langage courant, affichee dans la carte resumee de ConceptsView et dans ConceptDetailModal sous le label "En clair". Champ "level" = niveau etudiant : Novice / Intermediaire / Avance / Transversal. Ancien champ "year" supprime.)
- matrix.json : matrice de pertinence outil x concept. { scale, cells: [{tool, concept, score}] }. Scores 1/2/3. Revision de coherence : tuteurs IA differencies (I06, I08, I09, I10, I13, I14, I15, I16 ne sont plus plats). I13 EduAide passe de vide a contextuel. M13 controle continu devient degressif : score 2 en Syntaxe et Logique, score 1 en Architecture. Total 861 cellules.
- combos.json : 16 combinatoires. Champs : id, year, concept_family, bloom, function, context, recommended_tools[], justification.
- meta.json : definitions des fils_rouges (Fil A/B/C/D) et scenarios (S1/S2/S3).
- fixtures/cours-exemple.json : classification pre-calculee d'un cours S1 pour la demo sans reseau.

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

1. **Accueil / hub** (/, LOCAL UNIQUEMENT) : deux cartes de choix — « Auditer un cours » (/audit) et « Obtenir une recommandation » (/arbre). En dehors de localhost, la route / redirige automatiquement vers /arbre via un guard router beforeEach dans router/index.js. HomeView.vue reste dans le depot mais n'est rendu qu'en local.
2. **Catalogue** (/catalogue) : liste filtrable des 48 outils. Filtres : famille, fonction, cout, robustesse, fil rouge. Chaque outil en DisclosureCard sur trois niveaux : résumé (id, famille, nom, description, efficacité), « Détails et usage » (detail, attributs, scénarios, fils rouges, lien externe), « Sources et littérature ». ToolDetailModal n'est plus utilisé dans CatalogueView ; il reste actif dans PatronBlock pour le détail des outils du patron.
3. **Concepts** (/concepts) : 21 sous-concepts groupés par famille (sections par zone avec en-tête coloré). Chaque concept en DisclosureCard sur trois niveaux : résumé (id, level, risque, nom, gloss "En clair"), « Indicateurs et description » (description technique, Bloom, outils idéaux score 3 issus de la matrice, patrons via PatronBlock), « Références et cadre » (Fuller, bibliographie). Clic sur l'ID d'un concept ouvre ConceptDetailModal.
4. **Arbre de decision** (/arbre) : wizard zone → concept → contexte → objectif cognitif (facultatif, avec hint sous chaque bouton). Pas de question semestre ni de question fonction (Formative par defaut). Résultat en DisclosureCard sur trois niveaux : principe IA de la zone + badge de provenance + pills des premiers outils (niveau 1), « Patron et outils » (PatronBlock + liste complète des ToolCard) (niveau 2), « Justification et sources » (niveau 3). Mode "toute la zone" disponible. **URL sauvegardable** : quand le résultat est affiché, les paramètres zone/concept/context/bloom sont encodés en query string (router.replace) ; recharger l'URL ou la partager reproduit exactement le même résultat. "Nouvelle recherche" vide les paramètres.
5. **Methodologie** (/methodologie) : contexte TB, modele de donnees, familles d'outils.
6. **Audit PDF** (/audit, LOCAL UNIQUEMENT) : voir section ci-dessous.

## Audit PDF (mode local)

Extension exploratoire. Pipeline en 6 etapes :

1. **Extraction** : depot PDF par l'enseignant, extraction texte avec pdf.js (import dynamique) dans le navigateur.
2. **Segmentation** : detection des titres par hauteur de police (pdf.js text items) + repli regex.
3. **Classification** : appel API Anthropic via proxy local (localhost:3001) pour chaque section. Sortie JSON stricte : { concept_ids[], bloom, context, confidence }. Les IDs sont valides uniquement parmi les 21 de concepts.json.
4. **Validation humaine** (SectionReview.vue) : l'enseignant corrige les classifications avant de continuer. Etape obligatoire et visible.
5. **SWOT deterministe** : croiser les concepts valides avec matrix.json et combos.json. Aucun texte libre du modele. Forces/Faiblesses/Risques/Opportunites tous traceables jusqu'aux donnees.
6. **Restitution** (CourseAudit.vue) : SWOT 2x2 + recommandations par section issues du moteur factorise.

**Fixture demo** : src/data/fixtures/cours-exemple.json. Charger depuis PdfDropzone pour rejouer sans reseau ni API.

**Proxy local** : proxy/server.js (Express, port 3001). Lit ANTHROPIC_API_KEY depuis .env (gitignore). Ne jamais exposer la cle dans le front.

**Persistance Pinia** : l'etat de l'audit (phase, sections, validated, swot, recommendations, courseContext, courseSummary, isProgramming, isDemo) est persiste en localStorage via pinia-plugin-persistedstate (cle `audit_v1`). Un rechargement de page apres une analyse terminee restaure le resultat automatiquement. "Nouvelle analyse" appelle `audit.reset()` qui execute `$reset()` puis supprime la cle localStorage. Les champs transitoires (classifications, error) ne sont PAS persistes.

## Architecture src/

```
src/
  assets/         tokens.css (design tokens), base.css (reset + primitives ui- + @media print)
  data/           tools.json, concepts.json, matrix.json, combos.json, meta.json
                  fixtures/cours-exemple.json
  lib/            recommendation.js (moteur factorise), glossary.js (14 definitions InfoTooltip),
                  fuller.js (fullerHint), references.js (DOI_MAP + Scholar fallback)
  composables/    useData.js, useRecommendation.js
  stores/         audit.js (Pinia + persistedstate, remplace useAudit.js supprime)
  views/          HomeView (hub local, non rendu en statique), ArboreView, CatalogueView,
                  ConceptsView, MethodologieView, AuditView
  components/     DisclosureCard (primitive 3 niveaux), PatronBlock, ToolCard, ToolDetailModal,
                  ConceptDetailModal, InfoTooltip, PdfDropzone, SectionReview, CourseAudit,
                  ReferenceLinks, ZoneProfile, StatStrip, HeatmapMatrix
  router/         index.js (guard beforeEach : '/' -> /arbre hors localhost)
  App.vue, main.js (Pinia + pinia-plugin-persistedstate cree ici avant le mount)
proxy/
  server.js       (Express, Node >= 18, non bundle par Vite)
```

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
- `npm run dev` pour le dev sans audit (mode statique).
- `npm run dev:full` pour le dev avec audit (Vite + proxy en parallele).
- `npm run build` genere le bundle statique pour GitHub Pages.
- `npm run deploy` publie dist/ sur GitHub Pages via gh-pages.

## Convention de rédaction

Pour tout texte affiché dans l'interface ou tout contenu rédigé : pas de longs tirets (em-dash), ponctuation naturelle.

**Accents** : les valeurs de chaînes JSON destinées à l'affichage portent les accents français corrects (ex. : "Validée", "Établie", "Émergente", "Élevé", "Modéré", "Début de cursus", "Après fondamentaux"). Les noms de propriétés JSON (clés de champ), les identifiants techniques (M01, C2.2, F/S/FS, S1-S3, Bloom en anglais, Fuller en anglais) restent en ASCII sans accent. Quand une valeur accentuée sert de clé de comparaison dans le code JS (EFFICACITE_RANK, riskClass(), filtres), les deux côtés de la comparaison utilisent la même forme accentuée.
