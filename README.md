# Toolbox Prog IA

Proof of concept du Travail de Bachelor *Apprendre a programmer a l'ere de l'IA generative* — HEG Arc, HES-SO, 2025-2026.

## Presentation

La Toolbox est un catalogue interactif de 49 outils pedagogiques accompagne d'un arbre de decision a 5 parametres. Elle aide les enseignants a choisir les outils adaptes a leur contexte pour enseigner la programmation dans un environnement ou l'IA generative est omnipresente.

## Fonctionnalites

- **Catalogue** : liste filtrable des 49 outils (famille, fonction pedagogique, cout enseignant, recherche libre).
- **Arbre de decision** : 5 questions (annee de cursus, famille de concepts, niveau Bloom, fonction pedagogique, contexte) produisent une recommandation deterministe de 2 a 4 outils.
- **Methodologie** : description du modele de donnees et du contexte scientifique.

## Donnees

Quatre fichiers JSON dans `src/data/`, derives de la cartographie du TB :

| Fichier | Contenu |
|---|---|
| `tools.json` | 49 outils avec attributs pedagogiques |
| `concepts.json` | 21 sous-concepts (3 familles : Syntaxe, Logique, Architecture) |
| `matrix.json` | Matrice de pertinence outil x concept (scores 1-3) |
| `combos.json` | 16 combinatoires preconfigures avec justification |

Les fichiers JSON sont la source de verite. Toute donnee affichee est tracable jusqu'a eux.

## Stack technique

- Vue 3, Composition API
- Vite
- Vue Router (hash history)
- CSS scoped natif, pas de framework UI
- Hebergement : GitHub Pages

## Developpement

```bash
npm install
npm run dev      # serveur de developpement
npm run build    # bundle statique dans dist/
```

## Structure

```
src/
  data/           tools.json, concepts.json, matrix.json, combos.json
  composables/    useData.js, useRecommendation.js
  views/          HomeView, CatalogueView, ArboreView, MethodologieView
  components/     ToolCard.vue
  router/         index.js
  App.vue
  main.js
```

## Choix techniques

Voir [Choix_stack_technique_PoC_Toolbox.md](Choix_stack_technique_PoC_Toolbox.md) pour la justification detaillee de chaque arbitrage.
