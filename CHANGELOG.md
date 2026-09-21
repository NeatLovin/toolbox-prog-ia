# Changelog

Travail de Bachelor « Apprendre à programmer à l'ère de l'IA générative », HEG Arc, HES-SO.

## Itération 4 — 2026-09-21

Deux retours du directeur de Travail de Bachelor après essai du prototype déployé, derniers avant
l'envoi aux 22 enseignants. Aucune touche au moteur de recommandation, à `src/data/`, à
l'infrastructure ni aux plafonds.

- **Outils recommandés rendus cliquables au niveau 1 du résultat.** Incohérence trouvée : le concept
  ciblé (niveau 1, toujours visible) ouvrait déjà `ConceptDetailModal`, mais les outils recommandés
  juste en dessous n'étaient que du texte, alors que les mêmes outils devenaient cliquables une fois
  le tiroir « Modèle et outils » déplié (niveau 2) — ce qui, en plus de donner l'impression d'un
  outil cassé, limitait `reco_tool_open` aux seuls clics faits après dépliage, un entonnoir plus
  étroit que ce que la métrique est censée capter. Les outils du niveau 1 ouvrent désormais
  `ToolDetailModal` et émettent le même `reco_tool_open` qu'au niveau 2, avec un champ `from`
  (`summary` ou `details`) pour distinguer les deux sans perdre l'agrégat.
- **Même correctif appliqué à deux autres éléments trouvés lors du même balayage** : la proposition
  pédagogique du résultat de l'arbre (nommait un patron sans permettre de l'ouvrir, alors que
  `reco_patron_open` existe déjà) devient cliquable — elle déplie le tiroir du niveau 2 si besoin
  (un clic simulé sur son `<summary>` réel, qui déclenche l'émission existante, jamais un doublon) et
  fait défiler jusqu'au bloc patron ; et les outils phares de la section « En bref » de l'audit
  (`.brief-lever`), qui présentaient le même défaut que les outils du niveau 1 de l'arbre, ouvrent
  désormais `ToolDetailModal` et émettent `audit_recommendation_open` (déjà utilisé par les outils du
  détail par section) avec un champ `from` (`brief` ou `section`).
- **Questionnaire étendu de 2 à 6 items.** Les deux items UMUX-Lite existants (« Cet outil répond à
  mes besoins », « Cet outil est facile à utiliser ») restent inchangés au mot près, en tête, pour
  rester comparables sur l'échelle SUS. Quatre nouveaux items, tous facultatifs comme les deux
  premiers désormais (la soumission n'est plus bloquée par une réponse manquante, qui part à `null`) :
  correspondance au contexte d'enseignement (formulation adaptée par parcours : « la recommandation »
  pour l'arbre, « l'analyse » pour l'audit), intention de réutilisation, clarté des justifications, et
  un champ libre reformulé (« Qu'est-ce qui manque ou vous a gêné ? »). Le conteneur passe de 480 à
  640px et la légende d'échelle, répétée cinq fois auparavant, devient une seule ligne partagée : le
  questionnaire tient sur un écran sans défiler (632px mesurés à 1366×768, 1280×800 et 1440×900).
- **Coût du questionnaire plus long mesurable** : deux événements dédiés, `survey_shown` (affichage
  réel) et `survey_dismissed` (clic sur « Passer »), suivant la même voie hors consentement que
  `survey_submitted` — jamais conditionnés au consentement général, jamais autre chose que leur
  propre nom d'événement. `worker/analysis.sql` gagne une requête de taux de complétion
  (`survey_submitted` / `survey_shown`), globale et par parcours.
- **`src/lib/telemetry.js`** : la voie dédiée hors consentement (jusqu'ici un seul export,
  `submitSurveyResponse`) devient un helper privé partagé plus trois exports fins, chacun son nom
  d'événement figé en dur et son propre marqueur `@client-event` — la propriété « ne peut pas servir
  à envoyer autre chose » établie à la correction précédente du contrôle de taxonomie s'applique
  identiquement aux trois.
- **`worker/src/events.js`** : `survey_shown` et `survey_dismissed` ajoutés à `ALLOWED_EVENTS`,
  Worker redéployé (confirmé via `npm run preflight`) — sans quoi ces deux événements auraient été
  rejetés en silence, comme `audit_truncated` à l'itération 2.

Vérifié en local (`npm run dev`, Playwright) : les trois éléments corrigés ouvrent le bon détail avec
le bon `from`, sans doublon d'événement (`reco_patron_open` émis une seule fois même si le tiroir est
déjà ouvert) ; les 6 items s'affichent sur les deux parcours avec les bons libellés ; une soumission
partielle envoie bien `null` pour les items non répondus ; `survey_shown`/`survey_dismissed`
s'émettent aux bons moments, indépendamment du consentement. Vérification sur l'environnement
déployé en attente de republication, soumise à accord explicite séparé — voir
`docs/recette/README.md`.

## Itération 3 — 2026-09-21

Demandes du directeur de Travail de Bachelor avant l'envoi du lien aux 22 enseignants : rendre le
questionnaire d'utilisabilité réellement visible, simplifier l'interface pour un enseignant qui
découvre l'outil sans préparation, et pousser l'accessibilité au-delà de l'audit de contraste de
l'itération 2. Aucune touche au Worker, à D1, aux plafonds, au déploiement, au moteur de
recommandation ou aux fichiers de `src/data/`.

- **Questionnaire d'utilisabilité enfin visible et répondable dans les deux parcours.** Deux
  défauts empêchaient de le voir en pratique : un marqueur de session unique partagé entre l'arbre
  et l'audit (répondre dans l'un le masquait dans l'autre) et une éligibilité conditionnée au
  consentement à la télémétrie générale (un enseignant qui refusait ou ignorait le bandeau ne
  voyait jamais le questionnaire). Marqueur `sessionStorage` désormais par parcours
  (`tb_survey_shown_arbre` / `tb_survey_shown_audit`), intitulé d'introduction adapté au parcours,
  `parcours` ajouté au payload de `survey_submitted`. Les deux items notés (« Cet outil répond à mes
  besoins », « Cet outil est facile à utiliser ») restent identiques mot pour mot dans les deux
  parcours pour rester comparables sur l'échelle UMUX-Lite/SUS.
- **Soumission du questionnaire découplée du consentement télémétrie général**, décision validée
  explicitement avant implémentation : cliquer « Envoyer » est un acte de consentement explicite et
  suffisant pour cette réponse précise. Nouvelle fonction dédiée `submitSurveyResponse()` dans
  `src/lib/telemetry.js`, volontairement séparée de `track()`/`flush()` : événement figé en dur
  (`survey_submitted`, jamais un paramètre), une seule requête immédiate, aucune interaction avec la
  file d'attente des autres événements — un refus de consentement ne peut donc jamais faire fuiter
  un événement en attente. Une ligne discrète sous les boutons prévient l'enseignant que seule cette
  réponse sera transmise quand le consentement général n'est pas accordé. Aucune activation
  rétroactive de la collecte générale.
- **Navigation hiérarchisée** : les deux parcours d'action (Recommandation, Audit PDF) se
  distinguent visuellement des quatre vues de consultation (Catalogue, Concepts, Matrice,
  Méthodologie) dans l'en-tête, sans suppression ni renommage de route.
- **Orientation immédiate à l'arrivée** : l'accueil affiche désormais une phrase d'orientation juste
  après le titre, avant les deux cartes de choix ; le paragraphe de recommandation générique, plus
  dense, redescend après les cartes.
- **Densité réduite, information déplacée jamais supprimée** : le profil de risque de zone du
  résultat de l'arbre rejoint le niveau « Détails » repliable ; les recommandations par section de
  l'audit passent en blocs repliables individuels (`<details>`) au lieu d'un affichage
  intégralement déplié, qui devenait long sur un cours à nombreuses sections.
- **Vocabulaire renommé à l'affichage uniquement**, validé explicitement avant application : « zone
  conceptuelle » → « zone », « Patron pédagogique » → « Modèle d'activité », « Combinatoire
  exacte/approchée » → « Correspondance exacte/approchée », « Score matriciel » → « Estimation par
  pertinence ». Comme pour le renommage Fil rouge → Axe pédagogique de l'itération précédente :
  aucune clé JSON, classe CSS ni comparaison JS modifiée, le vocabulaire technique reste sur la page
  Méthodologie où il est expliqué.
- **Accessibilité clavier** : trois lacunes réelles trouvées par lecture du code et corrigées par un
  composable partagé (`src/composables/useFocusTrap.js` — piège Tab/Shift+Tab, fermeture Échap,
  focus initial, restauration du focus au déclencheur) ou par l'ajout des attributs manquants :
  - `ToolDetailModal.vue` n'avait aucune des quatre mécaniques (ni Échap, ni focus initial, ni
    piège, ni restauration) alors qu'il est utilisé par les deux parcours principaux — lacune la
    plus sévère trouvée dans cette itération.
  - `ConceptDetailModal.vue` avait déjà Échap et le focus initial, mais ni piège de focus ni
    restauration.
  - `HeatmapMatrix.vue` (cellules de la matrice) et **`ToolCard.vue`** (carte outil cliquable de
    l'arbre) n'avaient aucun chemin clavier (`@click` seul, sans `tabindex` ni rôle) ; `ToolCard`
    n'avait pas été identifié pendant la préparation du plan et a été trouvé pendant la vérification
    fonctionnelle de cette itération, en observant que le focus ne revenait pas au déclencheur après
    fermeture de `ToolDetailModal` — corrigé du même geste mécanique (`role="button"`,
    `tabindex="0"`, activation `Entrée`/`Espace`) que la matrice.
  - Vérifié avec de vraies pressions de touche Tab (pas `.focus()` programmatique, qui donne un
    faux négatif de non-visibilité du focus sous Chromium) : l'anneau de focus global de
    `base.css` s'affiche correctement sur tous les éléments désormais focalisables.
- **Titres réordonnés sans saut de niveau** sur `/catalogue` (H4 → H3) et `/concepts` (H3
  d'introduction → H2, nom de concept → H3), sans changement visuel (sélecteurs CSS vérifiés
  individuellement, adaptés quand ils ciblaient la balise plutôt qu'une classe).
- **Contraste, clavier global, `prefers-reduced-motion` et zoom 200 %** : déjà conformes sur
  l'échantillon mesuré en préparation de cette itération (voir le rapport de mission pour le détail
  chiffré) ; aucune correction nécessaire au-delà des trois lacunes clavier ci-dessus.

Vérifié en local (`npm run dev`, Playwright) puis, après republication avec accord explicite
séparé (commit `1acaa62`), sur le site publié : questionnaire répondable une fois par parcours,
envoi effectif sans consentement accordé (0 requête Worker avant l'envoi, exactement 1 après),
`survey_submitted` confirmé en D1 avec le bon `parcours` et l'`app_version` du commit republié,
`npm run preflight` au vert, données de vérification purgées (D1 à zéro ligne dans `events` et
`audit_calls`). Détail complet dans `docs/recette/README.md`.

## v0.2.1 — 2026-09-15

Tag posé sur `main` (commit `c23bd16`) pour désigner sans ambiguïté la version soumise au pilote
puis aux 22 enseignants. Version de correctif : les commits depuis `v0.2.0` ne touchent que
l'outillage de vérification et la documentation, jamais le comportement applicatif visible par un
enseignant. Voir `docs/recette/README.md` section « Version évaluée » pour l'identité complète de
l'artefact (tag, commit, hash de bundle, plafonds en vigueur).

- Contrôle de cohérence taxonomie client/Worker + valeurs partagées, lancé automatiquement avant
  chaque build (`npm run prebuild`).
- Route `GET /health` et `npm run preflight` : vérification en une commande de l'environnement
  déployé avant l'envoi d'un lien (site, configuration, routes, plafonds réellement en vigueur,
  fraîcheur du plafond de lancement, état global de la base).
- Séquence de passage du pilote simplifiée (`npm run pilot:replay`, `npm run pilot:purge`).
- Correction de mentions devenues fausses dans `docs/recette/README.md` (état de la fusion) et
  clarification, dans `CLAUDE.md` et `Choix_stack_technique_PoC_Toolbox.md`, que la couche
  générative optionnelle de reformulation de la recommandation n'est pas implémentée.

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
- **Limite connue** : la couche optionnelle de génération par modèle de langage décrite dans le
  rapport (voie hybride, `Choix_stack_technique_PoC_Toolbox.md` section 4.3) n'est pas implémentée
  à ce stade. Seul l'audit de plan de cours appelle un modèle de langage, pour la classification ;
  le moteur de recommandation reste entièrement déterministe. Ce n'est pas une régression : le
  socle déterministe a toujours été le choix obligatoire, la couche générative une extension
  facultative jamais développée faute de calendrier.

Voir `Choix_stack_technique_PoC_Toolbox.md` section 7 pour la justification argumentée du Worker
et du module de télémétrie, section 4.5 pour l'état de la couche générative, et `worker/README.md`
pour le déploiement.

## Itération 1

Proof of concept initial : catalogue de 48 outils, 21 sous-concepts, arbre de décision
déterministe, audit de plan de cours (local uniquement). Voir l'historique Git pour le détail.
