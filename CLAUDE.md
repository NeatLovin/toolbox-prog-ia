# CLAUDE.md — PoC Toolbox

Application web démonstrative développée dans le cadre d'un Travail de Bachelor. Instructions pour le développement, à lire au début de chaque session.

## Contexte (condensé)

Le TB « Apprendre à programmer à l'ère de l'IA générative » (HEG Arc, HES-SO) évalue l'intégration de l'IA générative dans l'apprentissage de la programmation. La Toolbox en est le proof of concept : un catalogue d'outils pédagogiques et un arbre de décision qui aide un enseignant à choisir le ou les bons outils selon son contexte. C'est un artefact démonstratif, pas un produit. Il sera présenté en soutenance, pas déployé en production. Les arbitrages privilégient donc la simplicité, la robustesse en démonstration et la traçabilité, jamais la scalabilité.

Le détail des choix techniques et leur justification complète sont dans le fichier à la racine du dépôt : @Choix_stack_technique_PoC_Toolbox.md

## Stack

- Vue 3, Composition API.
- Données : fichiers JSON statiques chargés au démarrage. Pas de backend, pas de base de données.
- Styling : CSS scoped Vue comme socle. Tailwind acceptable en option si besoin de rapidité, pas au démarrage.
- Build : Vite.
- Hébergement : GitHub Pages, dépôt `NeatLovin/toolbox-prog-ia`. Mettre `base: '/toolbox-prog-ia/'` dans `vite.config.js`.
- Ne pas réintroduire React, Svelte, ni framework UI lourd (Vuetify, PrimeVue).

## Modèle de données

Quatre fichiers JSON dans `src/data/`, dérivés de la cartographie du TB :

- `tools.json` : 49 outils. Chaque outil porte ses attributs pédagogiques (concept couvert, niveau Bloom, fonction, contexte, score de pertinence, coût enseignant).
- `concepts.json` : 21 sous-concepts de programmation, regroupés par familles.
- `matrix.json` : matrice de pertinence outil × concept, enrichie de deux dimensions, le coût enseignant (1/2/3) et la fonction pédagogique (F formative, S sommative, FS les deux).
- `combos.json` : 16 combinatoires préconfigurées, chacune reliant une configuration de paramètres à une recommandation d'outils.

Règle stricte : les données JSON sont la source de vérité. Ne jamais inventer un outil, un concept ou un score qui n'y figure pas. Toute donnée affichée doit être traçable jusqu'à ces fichiers.

## Fonctionnalités centrales

Deux vues portent la valeur du PoC.

1. Catalogue interactif : liste filtrable des 49 outils, les filtres réagissent instantanément aux sélections (réactivité Vue).
2. Arbre de décision : l'utilisateur répond à 5 questions et reçoit une recommandation de 2 à 4 outils. Les 5 paramètres sont Année de cursus, Famille de concepts, Niveau Bloom, Fonction pédagogique, Contexte d'usage.

## Logique de recommandation

Socle obligatoire, déterministe : croiser les réponses de l'utilisateur avec les 16 combinatoires et la matrice de pertinence pour sélectionner et classer les outils. Comportement entièrement prévisible et reproductible, sans dépendance externe. C'est le mode par défaut, et il doit fonctionner de bout en bout sans IA.

Extension optionnelle, à ne développer qu'après stabilisation du socle : un appel à un modèle de langage qui reformule en langage naturel la recommandation déjà calculée. Le modèle ne choisit aucun outil, il habille une décision déjà prise. En cas d'échec de l'appel (réseau, API), repli automatique sur la formulation déterministe, sans planter.

## Architecture

```
toolbox-prog-ia/
├── README.md
├── Choix_stack_technique_PoC_Toolbox.md   ← document de référence des choix techno
├── CLAUDE.md                              ← document de référence du contexte
├── index.html
├── package.json
├── vite.config.js                         ← base: '/toolbox-prog-ia/'
└── src/
    ├── data/         concepts.json, tools.json, matrix.json, combos.json
    ├── components/   catalogue, fiche outil, arbre de décision, recommandation
    ├── views/        accueil, catalogue, arbre, méthodologie
    └── App.vue
```

Ordre de développement suggéré : 1) données JSON, 2) catalogue interactif (valide le chargement et les filtres), 3) arbre de décision avec logique déterministe (cœur fonctionnel), 4) vues accueil et méthodologie, 5) couche générative optionnelle. Le PoC est fonctionnel de bout en bout dès l'arbre de décision terminé.

## Commandes

- `npm install` puis `npm run dev` pour le développement.
- `npm run build` génère le bundle statique pour GitHub Pages.

## Convention de rédaction

Pour tout texte affiché dans l'interface ou tout contenu rédigé : pas de longs tirets (em-dash), ponctuation naturelle.
