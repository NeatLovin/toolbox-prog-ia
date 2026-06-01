# CLAUDE.md — PoC Toolbox

Application web demonstrative developpee dans le cadre d'un Travail de Bachelor. Instructions pour le developpement, a lire au debut de chaque session.

## Contexte (condense)

Le TB "Apprendre a programmer a l'ere de l'IA generative" (HEG Arc, HES-SO) evalue l'integration de l'IA generative dans l'apprentissage de la programmation. La Toolbox en est le proof of concept : un catalogue d'outils pedagogiques, un arbre de decision et une extension d'audit de cours. C'est un artefact demonstratif, pas un produit. Les arbitrages privilegient la simplicite, la robustesse en demonstration et la tracabilite, jamais la scalabilite.

Le detail des choix techniques est dans @Choix_stack_technique_PoC_Toolbox.md

## Stack

- Vue 3, Composition API.
- Donnees : fichiers JSON statiques dans src/data/. Pas de backend, pas de base de donnees.
- Styling : CSS scoped Vue.
- Build : Vite.
- Hebergement : GitHub Pages, depot NeatLovin/toolbox-prog-ia. base: '/toolbox-prog-ia/' dans vite.config.js.
- Ne pas reintroduire React, Svelte, ni framework UI lourd.

## Deux modes d'execution

**Mode statique (GitHub Pages)** : catalogue + concepts + arbre de decision + methodologie. Aucun appel reseau. Le lien "Audit PDF" est invisible (detection localhost au runtime).

**Mode local (dev)** : toutes les vues, y compris Audit PDF. Lancer avec `npm run dev:full` (Vite + proxy Anthropic en parallele via concurrently).

## Modele de donnees

Quatre fichiers JSON dans src/data/, derives de la cartographie du TB. Source de verite absolue. Ne jamais inventer un outil, un concept ou un score absent de ces fichiers.

- tools.json : 49 outils. Champs : id, name, description, detail, scenarios[], family, family_label, fils_rouges[], cursus, cyberlearn, cost_teacher, cost_num (1/2/3), cost_student, robustness_ai, robustness_num (0-4), function (F/S/FS/R), sources.
- concepts.json : 21 sous-concepts en 3 familles. Champs : id, family, family_id, family_description, risk_ai, name, description, bloom[], fuller, year, references.
- matrix.json : matrice de pertinence outil x concept. { scale, cells: [{tool, concept, score}] }. Scores 1/2/3.
- combos.json : 16 combinatoires. Champs : id, year, concept_family, bloom, function, context, recommended_tools[], justification.
- meta.json : definitions des fils_rouges (Fil A/B/C/D) et scenarios (S1/S2/S3).
- fixtures/cours-exemple.json : classification pre-calculee d'un cours S1 pour la demo sans reseau.

## Moteur de recommandation

src/lib/recommendation.js : module factorise avec exports :
- getRecommendation({ year, concept_family, bloom, function, context }) : moteur principal (combos + fallback matriciel).
- getToolsForConcept(conceptId, minScore) : outils de la matrice pour un concept.
- getMatchingCombos({ year, families, bloom, fn, context }) : combinatoires correspondantes.
- bloomCovers, familyCovers, yearCovers : predicats de matching.

src/composables/useRecommendation.js : re-exporte getRecommendation pour l'arbre de decision.

## Fonctionnalites

1. **Catalogue** (/catalogue) : liste filtrable des 49 outils. Filtres : famille, fonction, cout, robustesse, fil rouge. Clic sur une carte ouvre ToolDetailModal.
2. **Concepts** (/concepts) : 21 sous-concepts groupes par famille avec risque IA, niveaux Bloom, outils de reference de la matrice.
3. **Arbre de decision** (/arbre) : wizard 5 questions (annee, famille, Bloom, fonction, contexte) → recommandation deterministe 2-4 outils.
4. **Methodologie** (/methodologie) : contexte TB, modele de donnees, familles d'outils.
5. **Audit PDF** (/audit, LOCAL UNIQUEMENT) : voir section ci-dessous.

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

## Architecture src/

```
src/
  data/           tools.json, concepts.json, matrix.json, combos.json, meta.json
                  fixtures/cours-exemple.json
  lib/            recommendation.js (moteur factorise)
  composables/    useData.js, useRecommendation.js, useAudit.js
  views/          HomeView, CatalogueView, ConceptsView, ArboreView, MethodologieView, AuditView
  components/     ToolCard, ToolDetailModal, PdfDropzone, SectionReview, CourseAudit
  router/         index.js
  App.vue, main.js
proxy/
  server.js       (Express, Node >= 18, non bundle par Vite)
```

## Commandes

- `npm install` pour installer les dependances.
- `npm run dev` pour le dev sans audit (mode statique).
- `npm run dev:full` pour le dev avec audit (Vite + proxy en parallele).
- `npm run build` genere le bundle statique pour GitHub Pages.

## Convention de redaction

Pour tout texte affiche dans l'interface ou tout contenu redige : pas de longs tirets (em-dash), ponctuation naturelle.
