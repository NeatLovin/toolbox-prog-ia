# Changelog

Travail de Bachelor « Apprendre à programmer à l'ère de l'IA générative », HEG Arc, HES-SO.

## Itération 2 — 2026-09-10

Préparation du prototype pour un test d'usage réel auprès de 22 enseignants de 7 institutions de
Suisse romande ayant participé aux entretiens de recherche. Deux objectifs : rendre l'audit de
plan de cours utilisable sur le site déployé (il ne fonctionnait qu'en local), et instrumenter
l'usage du prototype pour alimenter l'évaluation de l'artefact et une publication scientifique.

- **Service serveur** : Cloudflare Worker + D1 (`worker/`), remplace le proxy Express local qui ne
  tournait jamais en production. Deux routes : `POST /events` (télémétrie) et `POST /audit`
  (relais de l'appel Anthropic, prompt système et modèle fixés côté serveur, clé API jamais
  exposée au client). Garde-fous de coût (plafonds par session et journaliers, interrupteur
  d'urgence, taille maximale du document), purge automatique au-delà de la rétention annoncée.
- **Consentement et télémétrie** : bandeau non bloquant, aucune fonctionnalité conditionnée au
  choix de l'enseignant. Module `src/lib/telemetry.js` respectant strictement le consentement
  (rien n'est envoyé ni mis en file avant acceptation). Taxonomie d'une trentaine d'événements
  couvrant les trois parcours (recommandation, catalogue/cartographie, audit), alignée sur les
  questions d'évaluation du travail.
- **Ergonomie** : audit de contraste WCAG chiffré (11 échecs réels corrigés) ; bloc de
  recommandation immédiate en tête de résultat ; noms d'outils complets partout ; accompagnement
  des outils (`src/data/tools_links.json`, phrase d'explication par outil) ; contexte de cours
  modifiable après coup sans relancer l'audit ; garde-fou de pertinence du document non bloquant
  (confirmation plutôt qu'impasse) ; vérification à 380px de large.
- **Page de transparence** (`/transparence`) : catégories de données collectées, ce qui n'est
  jamais collecté, durée de conservation, retrait du consentement.
- **Questionnaire UMUX-Lite** en fin de parcours, une fois par session.
- **Requêtes d'analyse** (`worker/analysis.sql`) et script de vérification bout en bout
  (`worker/scripts/verify-e2e.mjs`).
- **Correctif** : l'audit de plan de cours était masqué hors `localhost` depuis l'itération
  précédente (dépendance au proxy local) ; rendu accessible partout, désormais adossé au Worker.

Voir `Choix_stack_technique_PoC_Toolbox.md` section 7 pour la justification argumentée du Worker
et du module de télémétrie, et `worker/README.md` pour le déploiement.

## Itération 1

Proof of concept initial : catalogue de 48 outils, 21 sous-concepts, arbre de décision
déterministe, audit de plan de cours (local uniquement). Voir l'historique Git pour le détail.
