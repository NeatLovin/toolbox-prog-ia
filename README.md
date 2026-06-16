# Toolbox Prog IA

Proof of concept du Travail de Bachelor *Apprendre a programmer a l'ere de l'IA generative* — HEG Arc, HES-SO, 2025-2026.

## Presentation

La Toolbox aide les enseignants a choisir les bons outils pedagogiques pour enseigner la programmation en presence d'IA generative. Elle croise une cartographie de 48 outils, 21 sous-concepts et 32 patrons d'activite issus du TB.

## Fonctionnalites

- **Catalogue** : 48 outils filtrables par famille, fonction, cout enseignant, robustesse IA et fil rouge. Clic sur une fiche pour voir tous les attributs, avec lien vers la ressource pour les outils en ligne.
- **Concepts** : 21 sous-concepts en 3 familles (Syntaxe, Logique, Architecture), avec niveaux Bloom, risque IA, outils de reference issus de la matrice et patrons pedagogiques associes.
- **Arbre de decision** : 5 questions (annee, famille de concepts, niveau Bloom, fonction, contexte) produisent une recommandation deterministe 2-4 outils + le patron d'activite correspondant au contexte, dans un affichage hierarchise (outils visibles en premier, justification et patron repliables).
- **Methodologie** : contexte DSR du TB, modele de donnees, familles d'outils, taxonomies Bloom et Fuller.
- **Audit PDF** *(local uniquement)* : deposer un PDF de cours pour obtenir une recommandation globale deterministe (famille dominante, risque IA agrege, leviers prioritaires) puis une analyse SWOT et des recommandations par section, sans generation de texte libre.

## Donnees

Six fichiers JSON dans `src/data/`, source de verite absolue. Toute donnee affichee est tracable jusqu'a eux.

| Fichier | Contenu |
|---|---|
| `tools.json` | 48 outils, 4 familles (FM1-FM4), attributs : robustesse IA (0-4), cout, cyberlearn, fils rouges, lien externe |
| `concepts.json` | 21 sous-concepts, 3 familles, avec risque IA, dimension Fuller et niveau etudiant (Novice / Intermediaire / Avance / Transversal) |
| `matrix.json` | Matrice de pertinence outil x concept (840 cellules, scores 1-3) |
| `combos.json` | 16 combinatoires preconfigures avec justification pedagogique |
| `meta.json` | Definitions des fils rouges (Fil A-D) et scenarios (S1-S3) |
| `patrons.json` | 32 patrons d'activite (1-2 par concept), alignement constructif Biggs 1996, filtres par contexte |

## Deux modes d'execution

**Mode statique** (`npm run dev` ou GitHub Pages) : catalogue, concepts, arbre, methodologie.

**Mode local avec audit** (`npm run dev:full`) : ajoute la vue Audit PDF. Necessite un fichier `.env` avec `ANTHROPIC_API_KEY` a la racine (voir `.env.example`). Le proxy Express tourne en parallele sur le port 3001.

## Stack technique

- Vue 3, Composition API, CSS scoped natif
- Vite, Vue Router (hash history)
- pdfjs-dist (import dynamique, uniquement en mode audit)
- Hebergement : GitHub Pages (`base: '/toolbox-prog-ia/'`)

## Commandes

```bash
npm install
npm run dev         # dev sans audit (mode statique)
npm run dev:full    # dev avec audit PDF (Vite + proxy Anthropic)
npm run build       # bundle statique pour GitHub Pages
```

## Structure

```
src/
  data/           tools.json, concepts.json, matrix.json, combos.json, meta.json
                  patrons.json
                  fixtures/cours-exemple.json
  lib/            recommendation.js  (moteur deterministe factorise)
  composables/    useData.js, useRecommendation.js, useAudit.js
  views/          HomeView, CatalogueView, ConceptsView, ArboreView,
                  MethodologieView, AuditView
  components/     ToolCard, ToolDetailModal, PatronBlock,
                  PdfDropzone, SectionReview, CourseAudit
  router/         index.js
  App.vue, main.js
proxy/
  server.js       proxy Express Node >= 18 (non deploye sur GitHub Pages)
```

## Choix techniques

Voir [Choix_stack_technique_PoC_Toolbox.md](Choix_stack_technique_PoC_Toolbox.md) pour la justification argumentee de chaque arbitrage.
