# Toolbox Prog IA

Proof of concept développé dans le cadre du Travail de Bachelor *« Apprendre à programmer à l'ère de l'IA générative »* (HEG Arc, HES-SO, 2025-2026).

**Démo en ligne :** https://neatlovin.github.io/toolbox-prog-ia/

---

## Ce que c'est

Un catalogue d'outils pédagogiques et un arbre de décision pour aider les enseignants en programmation à choisir des stratégies robustes face aux outils d'IA générative. Le PoC couvre trois fonctionnalités principales :

- **Catalogue** : 48 outils classés par famille, fonction, coût et robustesse IA, avec fiches détaillées et sources académiques.
- **Arbre de décision** : wizard en 4 étapes (zone conceptuelle → concept → contexte → objectif Bloom) qui produit une recommandation déterministe et traçable. L'URL du résultat est sauvegardable et rejouable.
- **Audit PDF** *(local uniquement)* : dépôt d'un syllabus PDF, classification par section via Claude, validation humaine, puis SWOT et recommandations déterministes.

---

## Stack

| Couche | Choix |
|--------|-------|
| Framework | Vue 3, Composition API |
| Données | JSON statiques (`src/data/`) — pas de backend |
| État global | Pinia + pinia-plugin-persistedstate (audit uniquement) |
| Styling | CSS custom properties (tokens) + primitives `ui-*` globales, CSS scoped par composant |
| Build | Vite |
| Hébergement | GitHub Pages |
| Audit PDF | pdf.js (extraction) + proxy Express local + API Anthropic |

---

## Lancer en local

```bash
npm install

# Mode statique (catalogue + arbre + concepts + méthodologie)
npm run dev

# Mode complet avec audit PDF (nécessite un fichier .env avec ANTHROPIC_API_KEY)
npm run dev:full
```

Le fichier `.env` à la racine doit contenir :

```
ANTHROPIC_API_KEY=sk-ant-...
```

Sans clé API, utilisez le bouton **"Charger le cours exemple"** dans l'audit pour rejouer la démo sans appel réseau.

---

## Déployer

```bash
npm run build    # génère dist/
npm run deploy   # publie sur GitHub Pages via gh-pages
```

---

## Structure

```
src/
  assets/       tokens.css, base.css (reset + primitives ui- + @media print)
  data/         tools.json, concepts.json, matrix.json, combos.json, meta.json
  lib/          recommendation.js, glossary.js, fuller.js, references.js
  composables/  useData.js, useRecommendation.js
  stores/       audit.js (Pinia, persistedstate)
  views/        ArboreView, CatalogueView, ConceptsView, MethodologieView, AuditView, HomeView
  components/   DisclosureCard, PatronBlock, ToolCard, ToolDetailModal, ConceptDetailModal,
                InfoTooltip, ZoneProfile, StatStrip, HeatmapMatrix, ReferenceLinks,
                PdfDropzone, SectionReview, CourseAudit
  router/       index.js
proxy/
  server.js     proxy Express (port 3001), ne jamais exposer ANTHROPIC_API_KEY côté front
```

---

*Artefact démonstratif. Arbitrages orientés simplicité, robustesse en démonstration et traçabilité — pas scalabilité.*
