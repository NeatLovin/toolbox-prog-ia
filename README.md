# Toolbox Prog IA

Toolbox Prog IA aide les enseignants en programmation à choisir des activités et des modalités
d'évaluation qui gardent leur sens quand les étudiants ont accès à l'IA générative. En quelques
questions, l'outil propose des outils pédagogiques adaptés à un concept et à un contexte
d'enseignement, avec leurs justifications et leurs sources ; il peut aussi analyser un plan de
cours. Il s'adresse aux enseignants et aux responsables de filière en informatique, sans
préparation technique.

**[Essayer l'outil en ligne](https://neatlovin.github.io/toolbox-prog-ia/)**

Prototype développé dans le cadre du Travail de Bachelor *« Apprendre à programmer à l'ère de l'IA
générative »* (HEG Arc, HES-SO, 2025-2026). Voir la section [Rapport](#rapport).

---

## Ce que c'est

Un catalogue d'outils pédagogiques et un arbre de décision pour aider les enseignants en programmation à choisir des stratégies robustes face aux outils d'IA générative. Le PoC couvre trois parcours :

- **Catalogue** : 48 outils classés par famille, fonction, coût et robustesse IA, avec fiches détaillées et sources académiques.
- **Arbre de décision** : wizard zone → concept → contexte → objectif Bloom qui produit une recommandation déterministe et traçable, jamais générée par un modèle de langage. L'URL du résultat est sauvegardable et rejouable.
- **Audit PDF** : dépôt d'un syllabus, classification par section via un modèle de langage relayé par un service serveur (jamais d'appel direct depuis le navigateur), validation humaine obligatoire, puis SWOT et recommandations déterministes croisées avec la même cartographie que l'arbre.

---

## Stack

| Couche | Choix |
|--------|-------|
| Framework | Vue 3, Composition API |
| Données de la cartographie | JSON statiques (`src/data/`), jamais modifiées à l'exécution |
| Service serveur | Cloudflare Worker + D1 (`worker/`) : relais de l'appel au modèle pour l'audit, télémétrie. Clé API jamais exposée au client |
| État global | Pinia + pinia-plugin-persistedstate (audit uniquement) |
| Styling | CSS custom properties (tokens) + primitives `ui-*` globales, CSS scoped par composant |
| Build | Vite |
| Hébergement | GitHub Pages (front) et Cloudflare (Worker), déployés indépendamment l'un de l'autre |

---

## Lancer en local

```bash
npm install

# Mode statique : catalogue, arbre, concepts, cartographie, méthodologie. Aucun appel réseau ;
# la télémétrie est journalisée en console au lieu d'être envoyée.
npm run dev

# Mode complet : ajoute l'audit PDF et la télémétrie réseau, via une émulation locale du Worker
# et de sa base (wrangler dev --local).
npm run dev:full
```

Pour tester l'audit avec un vrai appel en mode complet, copier `worker/.dev.vars.example` en
`worker/.dev.vars` (gitignore) et y renseigner `ANTHROPIC_API_KEY`. Sans cette clé, l'audit
bascule automatiquement sur un message convivial et propose de charger un cours d'exemple
précalculé, sans appel réseau.

**En production, la clé vit uniquement comme secret sur le Worker déployé**
(`wrangler secret put ANTHROPIC_API_KEY`), jamais dans un fichier à la racine du projet ni dans le
code envoyé au navigateur — voir `worker/README.md` pour le déploiement initial.

---

## Données et vie privée

Un bandeau non bloquant demande le consentement à la première visite ; le site reste entièrement
utilisable en cas de refus, et rien n'est envoyé ni mis en file tant qu'aucun consentement n'est
donné. La collecte est anonyme (aucune identité, aucune adresse IP, aucun identifiant permanent) et
sert uniquement à évaluer le prototype pour le Travail de Bachelor. Détail complet de ce qui est
mesuré, et de ce qui ne l'est jamais : page **Transparence** du site publié (`/transparence`). Les
données sont conservées 12 mois puis supprimées automatiquement.

---

## Déployer

```bash
npm run build    # génère dist/ (déclenche automatiquement un contrôle de cohérence, voir plus bas)
npm run deploy   # publie dist/ sur GitHub Pages via gh-pages

npm run worker:deploy   # déploie le Worker sur Cloudflare — action séparée, nécessaire après
                         # tout changement dans worker/, y compris sa taxonomie d'événements
```

## Commandes d'exploitation

Une ligne chacune ; détail complet dans `worker/README.md`.

- `npm run prebuild` — contrôle automatique (avant chaque build) que tout événement de télémétrie émis côté client est bien reconnu par le Worker.
- `npm run preflight` — vérifie en une commande que le site déployé est sain avant d'envoyer un lien (configuration, routes, plafonds réellement en vigueur, état de la base).
- `npm run pilot:replay` — reconstitue chronologiquement la session la plus récente en base.
- `npm run pilot:purge -- <session_id>` — supprime une session de test de la base.

## Version évaluée

L'identité précise de la version soumise au test enseignants (tag, commit publié, hash de bundle,
plafonds en vigueur pendant la période de test) est tenue à jour dans `docs/recette/README.md`,
section **« Version évaluée »**.

---

## Structure

```
src/
  assets/       tokens.css, base.css (reset + primitives ui- + @media print)
  data/         tools.json, concepts.json, matrix.json, combos.json, meta.json, tools_links.json
  lib/          recommendation.js, apiBase.js, consent.js, session.js, telemetry.js, glossary.js,
                fuller.js, references.js, deadClick.js
  composables/  useData.js, useRecommendation.js
  stores/       audit.js (Pinia, persistedstate)
  views/        HomeView, ArboreView, CatalogueView, ConceptsView, CartographieView,
                MethodologieView, AuditView, TransparenceView
  components/   DisclosureCard, PatronBlock, ToolCard, ToolDetailModal, ConceptDetailModal,
                InfoTooltip, ZoneProfile, StatStrip, HeatmapMatrix, ReferenceLinks, PdfDropzone,
                SectionReview, CourseAudit, ConsentBanner, UsabilitySurvey
  router/       index.js
worker/
  src/          index.js (routage), events.js (télémétrie), audit.js (relais du modèle),
                health.js, cors.js, util.js
  scripts/      preflight.mjs, check-event-taxonomy.mjs, session-replay.mjs, purge-session.mjs,
                export-csv.mjs, verify-e2e.mjs
docs/
  recette/      grille de recette, identité de la version évaluée, passage pilote
```

---

## Rapport

<!-- à compléter : partie B (adresse de la version officielle du rapport, à confirmer avec le directeur) -->

## Licence

- **Code** (tout le dépôt, sauf le contenu ci-dessous) : licence MIT, voir [`LICENSE`](LICENSE).
- **Contenu** (cartographie et données de `src/data/`, documentation de `docs/` et fichiers
  Markdown) : Creative Commons Attribution 4.0 International (CC BY 4.0), voir
  [`LICENSE-CONTENT`](LICENSE-CONTENT).

© 2026 Valentino Di Donato et Haute École Arc (HE-Arc). Les noms des outils tiers cités restent la propriété de leurs titulaires.

---

*Artefact démonstratif. Arbitrages orientés simplicité, robustesse en démonstration et traçabilité — pas scalabilité.*
