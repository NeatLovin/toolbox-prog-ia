# Relecture des explications d'outils (§8 de la mission recette)

Les 48 phrases de `src/data/tools_links.json` (champ `explainer`) ont été rédigées à la main à
partir des champs `description`/`detail` déjà présents et vérifiés dans `tools.json`. Elles
seront lues par des enseignants qui connaissent souvent ces outils mieux que moi : ce document
sert de support de relecture, pas une validation.

Aucun `tutorial_link` n'est renseigné (tous `null` dans `tools_links.json`) : je n'ai vérifié
aucune URL de tutoriel et n'en ai inventé aucune.

## Colonne « Confiance »

- **Haute** : phrase qui reformule directement `description`/`detail` sans ajout d'interprétation.
- **Moyenne** : phrase où j'ai dû interpréter ou reformuler un point plus elliptique de la fiche
  source. Signalées ci-dessous avec le texte source exact qui a demandé l'interprétation.

## Points signalés (confiance Moyenne)

- **T09 — Editrail** : j'ai qualifié l'outil d'« outil de recherche » ; la fiche source dit
  seulement « Visualisation de l'interaction étudiant-IA dans un IDE, capturant éditions et
  chronologie », sans préciser explicitement qu'il s'agit d'un outil de recherche académique
  plutôt que d'un produit disponible. À vérifier si cette nuance compte pour vous.
- **I09 — Tutor CoPilot** : la fiche source dit « Premier RCT Human-AI en tutorat live... Augmente
  les tuteurs, pas les étudiants. » J'ai traduit cela en « assiste... le tuteur humain », ce qui
  est fidèle mais compresse un résultat de recherche expérimental (RCT) en description d'outil
  utilisable, alors qu'il s'agit peut-être d'un dispositif de recherche non disponible tel quel.
- **I10 — AI-Lab** : « documente le Junior-Year Wall » de la fiche source est devenu « documente...
  la transition entre les cours d'introduction et les cours avancés » — traduction/interprétation
  du terme, pas une simple reformulation.
- **I12 — Farah/Ingram** : « Architecture de chatbots éducationnels LLM (configuration objects) »
  est devenu « une architecture technique... pour construire des chatbots pédagogiques sur mesure »
  — fidèle mais le terme technique « configuration objects » n'est pas repris, à valider si cette
  précision importe pour un public d'enseignants.

## Tableau complet

| Code | Nom | Famille | Phrase proposée | Confiance |
|---|---|---|---|---|
| M01 | Examen papier-crayon | Méthodes traditionnelles | Un examen classique sur papier, sans ordinateur : la manière la plus simple de garantir qu'aucune IA n'a pu intervenir dans la production de l'étudiant. | Haute |
| M02 | Examen contrôle en environnement sécurisé | Méthodes traditionnelles | Un examen sur ordinateur mais dans une salle contrôlée, avec accès réseau coupé ou restreint, pour empêcher le recours à une IA pendant l'épreuve. | Haute |
| M03 | Examen oral et soutenance individuelle | Méthodes traditionnelles | Un entretien individuel où l'étudiant explique son raisonnement à l'oral : impossible de déléguer sa réflexion à une IA pendant l'échange. | Haute |
| M04 | Soutenance de projet en groupe | Méthodes traditionnelles | Une défense orale collective d'un projet, où chaque membre du groupe doit être capable d'expliquer les choix faits, y compris ceux d'architecture. | Haute |
| M05 | Peer review | Méthodes traditionnelles | Les étudiants relisent et commentent le code d'un camarade selon une grille de critères : cela développe leur capacité à juger un code, le leur ou celui d'une IA. | Haute |
| M06 | Pair programming | Méthodes traditionnelles | Deux étudiants codent ensemble sur le même poste, en alternant qui écrit et qui relit, pour maintenir une réflexion partagée plutôt que déléguée. | Haute |
| M07 | Worked examples (exemples travaillés) | Méthodes traditionnelles | Montrer un exemple entièrement résolu avant de poser un exercice similaire, pour réduire la charge mentale des débutants et construire des repères avant l'autonomie. | Haute |
| M08 | Code reading tasks (Lister 2004) | Méthodes traditionnelles | De courts exercices où l'étudiant lit et explique un code déjà écrit, sans rien produire lui-même : cela mesure sa compréhension indépendamment de sa capacité à faire écrire du code par une IA. | Haute |
| M09 | Think-aloud avec doodles | Méthodes traditionnelles | L'étudiant réfléchit à voix haute pendant qu'il résout un problème sur papier, ce qui permet de repérer précisément où son raisonnement bloque. | Haute |
| M10 | Algorithmique pure papier (avant code) | Méthodes traditionnelles | Une période où les étudiants conçoivent des algorithmes uniquement sur papier, avant tout accès à un environnement de code, pour construire le raisonnement avant la syntaxe. | Haute |
| M11 | Évaluation 360 entre pairs | Méthodes traditionnelles | Les étudiants s'évaluent mutuellement sur des critères définis à l'avance, ce qui répartit le jugement au-delà du seul enseignant. | Haute |
| M12 | Évaluation par portfolio | Méthodes traditionnelles | Une collection de productions et de réflexions de l'étudiant rassemblée sur la durée, pour évaluer une progression plutôt qu'un instantané isolé. | Haute |
| M13 | Contrôle continu (TPs notés) | Méthodes traditionnelles | Des travaux pratiques notés tout au long du semestre plutôt qu'un seul examen final ; à encadrer avec attention, les TPs faits hors classe sont plus exposés à une délégation à l'IA. | Haute |
| T01 | Git monitoring (commits, fréquence) | Dispositifs outillés | Observer la fréquence et la régularité des commits Git d'un étudiant donne un indice discret sur son processus de travail, sans rien lui imposer de plus. | Haute |
| T02 | Tableau de bord de suivi des commits (regex) | Dispositifs outillés | Un tableau de bord qui synthétise automatiquement l'activité Git des étudiants par des règles simples, sans IA, pour repérer d'un coup d'œil les profils atypiques. | Haute |
| T03 | JPlag (détection plagiat code) | Dispositifs outillés | Un outil qui compare le code de tous les étudiants entre eux pour repérer les similitudes suspectes de plagiat inter-étudiants ; il ne détecte pas le code généré par IA. | Haute |
| T04 | Dolos (UGent) | Dispositifs outillés | Comme JPlag, un outil gratuit de détection de similitudes entre codes d'étudiants, déjà utilisé à grande échelle dans une HES romande. | Haute |
| T05 | GitHub Classroom | Dispositifs outillés | La version enseignement de GitHub : distribuer des exercices, suivre qui a rendu quoi, et faire tourner automatiquement des tests sur chaque rendu. | Haute |
| T06 | Plateforme Electron HEIG-VD | Dispositifs outillés | Une application développée en interne dans une HES romande pour faire passer des examens sur machine avec surveillance d'écran et accès réseau contrôlé. | Haute |
| T07 | Nexus HEPIA | Dispositifs outillés | Une plateforme d'examen sur machine virtuelle coupée d'internet, développée dans une autre HES romande, comme alternative à l'examen papier. | Haute |
| T08 | Compilatio | Dispositifs outillés | L'outil de détection de plagiat textuel déjà intégré à Cyberlearn ; utile contre le copier-coller entre étudiants, mais ne détecte pas un texte ou du code généré par IA. | Haute |
| T09 | Editrail (Zhang et al. 2026) | Dispositifs outillés | Un outil de recherche qui enregistre dans l'éditeur de code les interactions de l'étudiant avec une IA (éditions, chronologie), pour rendre visible ce qui se passait jusqu'ici en coulisses. | Moyenne |
| T10 | Fingerprinting commits | Dispositifs outillés | Des travaux de recherche récents qui cherchent à repérer, à partir du style d'un commit, s'il a probablement été écrit par un humain ou généré par une IA. | Haute |
| T11 | Argos (HE-Arc Ingénierie) | Dispositifs outillés | Une plateforme d'apprentissage de la programmation développée dans une HES romande, citée par plusieurs enseignants interrogés dans le cadre de ce travail. | Haute |
| I01 | CodeAid (Kazemitabaar 2024) | Tuteurs IA | Un tuteur IA qui n'offre que quatre types d'aide bien délimités (expliquer, corriger, faire écrire un bout de code, poser une question), ce qui l'empêche de simplement donner la solution complète. | Haute |
| I02 | CodeHelp / Gen-Ed (Liffiton 2024) | Tuteurs IA | Un tuteur IA open source pensé pour donner des indices plutôt que des réponses toutes faites ; candidat principal pour une intégration future dans les cours HES-SO. | Haute |
| I03 | Iris / Artemis (Bassner 2024, TUM) | Tuteurs IA | Un tuteur IA sous forme de chat, intégré directement à la plateforme d'enseignement d'une grande école allemande et utilisé par plus de 2000 étudiants. | Haute |
| I04 | CS50 Duck (Harvard, Liu 2024) | Tuteurs IA | Le tuteur IA du cours d'introduction à la programmation le plus suivi au monde (Harvard CS50), conçu pour guider sans jamais donner la solution directement. | Haute |
| I05 | GenAI-Ped (Nathaniel 2025-2026) | Tuteurs IA | Un cadre pédagogique en six étapes qui organise l'introduction progressive de l'IA générative dans un cours, en s'appuyant sur plusieurs théories de l'apprentissage reconnues. | Haute |
| I06 | LearnLM / Eedi (Google 2025) | Tuteurs IA | Un modèle d'IA de Google spécifiquement entraîné pour l'enseignement plutôt que pour la production générale de texte, testé en conditions réelles dans des écoles britanniques. | Haute |
| I07 | NotebookLM (Google) | Tuteurs IA | Une IA conversationnelle qu'on limite à un ensemble de documents qu'on lui fournit soi-même (cours, guides, normes) : elle répond en s'appuyant sur ce corpus, ce qui réduit le risque qu'elle invente des réponses. | Haute |
| I08 | ChatGPT Study Mode (OpenAI 2025) | Tuteurs IA | Un mode spécial de ChatGPT, pensé pour accompagner l'apprentissage plutôt que donner directement la réponse, mais qui reste contournable par l'étudiant. | Haute |
| I09 | Tutor CoPilot (Stanford 2024) | Tuteurs IA | Un outil qui assiste en temps réel non pas l'étudiant mais le tuteur humain pendant une séance de soutien, pour l'aider à mieux réagir aux difficultés de l'élève. | Moyenne |
| I10 | AI-Lab (Purdue, Dickey 2024) | Tuteurs IA | Un programme de recherche qui documente comment l'IA générative complique particulièrement la transition entre les cours d'introduction et les cours avancés. | Moyenne |
| I11 | Maieutic Prompting (Jung 2022) | Tuteurs IA | Une méthode formalisée pour interroger une IA par questions successives façon maïeutique socratique, plutôt que de lui demander directement une réponse. | Haute |
| I12 | Farah/Ingram (HEFR + EPFL) | Tuteurs IA | Une architecture technique, développée conjointement par une HES romande et l'EPFL, pour construire des chatbots pédagogiques sur mesure. | Moyenne |
| I13 | EduAide | Tuteurs IA | Un service commercial qui aide l'enseignant lui-même à générer du contenu de cours, des évaluations et des retours, plutôt qu'un outil destiné aux étudiants. | Haute |
| I14 | HES-GPT / EASYBEASY (HE-Arc) | Tuteurs IA | Des projets de recherche internes à la HES-SO explorant des modèles de langage hébergés localement, pour garder la maîtrise des données pédagogiques. | Haute |
| I15 | Wiki GenAI HE-Arc Ingénierie | Tuteurs IA | Un wiki interne créé dans une HES romande pour former les étudiants eux-mêmes à un usage réfléchi de l'IA générative. | Haute |
| I16 | Student Learning Compass (HES-SO) | Tuteurs IA | Un outil HES-SO qui cartographie les compétences acquises par chaque étudiant, avec une réflexion en cours sur son adaptation à l'ère de l'IA. | Haute |
| A01 | Cursor | Agentique / IA généraliste | Un éditeur de code, dérivé de VS Code, avec une IA capable d'agir directement dans le projet ; très répandu chez les développeurs professionnels. | Haute |
| A02 | Codeium Windsurf | Agentique / IA généraliste | Un assistant de code IA intégré à l'éditeur, capable d'agir de façon autonome sur le code, comparable à Cursor. | Haute |
| A03 | Anthropic Claude Code | Agentique / IA généraliste | Un agent IA en ligne de commande d'Anthropic, utile pour explorer rapidement une architecture logicielle, mais à réserver aux étudiants ayant déjà les bases : un débutant risque de générer des choix de conception sans les comprendre. | Haute |
| A04 | OpenAI Codex CLI | Agentique / IA généraliste | L'équivalent chez OpenAI de Claude Code : un agent en ligne de commande capable d'écrire et modifier du code de façon autonome. | Haute |
| A05 | GitHub Copilot | Agentique / IA généraliste | L'outil de complétion de code par IA le plus répandu, intégré directement dans l'éditeur, standard dans le monde professionnel. | Haute |
| A06 | ChatGPT (consumer) | Agentique / IA généraliste | Le modèle d'IA généraliste grand public d'OpenAI ; c'est l'outil le plus utilisé par les étudiants HES-SO, avec ou sans l'accord de l'enseignant. | Haute |
| A07 | Google Gemini | Agentique / IA généraliste | Le modèle d'IA généraliste de Google, deuxième outil le plus utilisé par les étudiants après ChatGPT. | Haute |
| A08 | Microsoft Copilot | Agentique / IA généraliste | L'IA générative intégrée à la suite Office 365, disponible pour les étudiants via leur licence HES-SO. | Haute |
