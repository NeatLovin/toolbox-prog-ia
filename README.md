# Toolbox Prog IA

Proof of concept du Travail de Bachelor *Apprendre a programmer a l'ere de l'IA generative* — HEG Arc, HES-SO, 2025-2026.

## Presentation

La Toolbox aide les enseignants a choisir les bons outils pedagogiques pour enseigner la programmation en presence d'IA generative. Elle croise une cartographie de 48 outils, 21 sous-concepts et 32 patrons d'activite issus du TB. Les recommandations sont deterministes et tracables : aucun texte genere par l'IA.

## Fonctionnalites

- **Accueil / hub** (`/`, local uniquement) : deux cartes de choix cote a cote — « Auditer un cours » (`/audit`) et « Obtenir une recommandation » (`/arbre`). En dehors de localhost, la route `/` redirige automatiquement vers `/arbre` via un guard router.
- **Arbre de decision** (`/arbre`) : wizard zone → concept → contexte → objectif cognitif (facultatif). Resultat en carte a trois niveaux : principe IA de la zone + approche + pills des premiers outils (niveau 1), patron pedagogique et liste complete des outils (niveau 2), justification et sources (niveau 3).
- **Catalogue** (`/catalogue`) : 48 outils filtrables par famille, fonction, cout enseignant, robustesse IA et fil rouge. Chaque outil s'ouvre en ligne sur trois niveaux : resume (id, famille, nom, description, efficacite), details et usage (attributs, scenarios, fils rouges, lien externe), sources et litterature.
- **Concepts** (`/concepts`) : 21 sous-concepts en 3 familles (Syntaxe, Logique, Architecture), groupes par zone avec en-tete colore. Chaque concept sur trois niveaux : resume (id, level, risque, description), indicateurs et description (Bloom, outils ideaux score 3, patrons), references et cadre (Fuller, bibliographie).
- **Methodologie** (`/methodologie`) : contexte DSR du TB, modele de donnees, familles d'outils, taxonomies Bloom et Fuller.
- **Audit PDF** (`/audit`, local uniquement) : deposer un PDF de cours pour obtenir une recommandation globale deterministe (famille dominante, risque IA agrege, leviers prioritaires) puis une analyse SWOT et des recommandations par section, sans generation de texte libre.

## Donnees

Six fichiers JSON dans `src/data/`, source de verite absolue. Toute donnee affichee est tracable jusqu'a eux.

| Fichier | Contenu |
|---|---|
| `tools.json` | 48 outils, 4 familles (FM1-FM4), attributs : robustesse IA (0-4), cout, cyberlearn, fils rouges, lien externe, efficacite documentee |
| `concepts.json` | 21 sous-concepts, 3 familles, avec risque IA, dimension Fuller, niveaux Bloom et sequencement conseille |
| `matrix.json` | Matrice de pertinence outil x concept (861 cellules, scores 1-3) |
| `combos.json` | 16 combinatoires preconfigures avec justification pedagogique |
| `meta.json` | Definitions des fils rouges (Fil A-D) et scenarios (S1-S3) |
| `patrons.json` | 32 patrons d'activite (1-2 par concept), alignement constructif Biggs 1996, filtres par contexte |

## Deux modes d'execution

**Mode statique** (`npm run dev` ou GitHub Pages) : la route `/` redirige vers `/arbre`. Catalogue, concepts, arbre et methodologie accessibles. Aucun appel reseau. Hub et audit PDF masques.

**Mode local avec audit** (`npm run dev:full`) : la route `/` affiche le hub (deux cartes : Auditer un cours + Obtenir une recommandation). Audit PDF actif. Necessite un fichier `.env` avec `ANTHROPIC_API_KEY` a la racine (voir `.env.example`). Proxy Express sur le port 3001.

## Stack technique

- Vue 3, Composition API, CSS scoped natif
- Vite, Vue Router (hash history, guard `beforeEach` pour redirect non-local)
- Design system a deux couches : `tokens.css` (90+ CSS custom properties) + `base.css` (reset + primitives `ui-*`)
- `DisclosureCard.vue` : primitive generique a trois niveaux (slots `summary` / `details` / `deep`), utilisee dans l'arbre, le catalogue et les concepts
- pdfjs-dist (import dynamique, uniquement en mode audit)
- Hebergement : GitHub Pages (`base: '/toolbox-prog-ia/'`)

## Commandes

```bash
npm install
npm run dev         # dev sans audit (mode statique, '/' redirige vers /arbre)
npm run dev:full    # dev avec audit PDF (Vite + proxy Anthropic en parallele)
npm run build       # bundle statique pour GitHub Pages
```

## Structure

```
src/
  assets/         tokens.css (design tokens), base.css (reset + primitives ui-)
  data/           tools.json, concepts.json, matrix.json, combos.json, meta.json, patrons.json
                  fixtures/cours-exemple.json
  lib/            recommendation.js  (moteur deterministe factorise)
                  glossary.js        (12 definitions pour InfoTooltip)
  composables/    useData.js, useRecommendation.js, useAudit.js
  views/          HomeView (hub local), ArboreView, CatalogueView, ConceptsView,
                  MethodologieView, AuditView
  components/     DisclosureCard, PatronBlock, ToolCard, ToolDetailModal, InfoTooltip,
                  PdfDropzone, SectionReview, CourseAudit
  router/         index.js
  App.vue, main.js
proxy/
  server.js       proxy Express Node >= 18 (non deploye sur GitHub Pages)
```

## Choix techniques

Voir [Choix_stack_technique_PoC_Toolbox.md](Choix_stack_technique_PoC_Toolbox.md) pour la justification argumentee de chaque arbitrage.
