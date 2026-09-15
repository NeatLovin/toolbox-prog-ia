# Choix de la stack technique du Proof of Concept Toolbox

*Document de décision argumentée. Travail de Bachelor « Apprendre à programmer à l'ère de l'IA générative », HEG Arc, HES-SO.*

---

## 1. Objet et cadre

Ce document établit et justifie les choix technologiques du Proof of Concept Toolbox, deuxième livrable majeur du Travail de Bachelor. Dans la démarche Design Science Research qui structure le travail, la justification des choix de conception de l'artefact relève du cycle Design. Documenter ces choix fait donc partie de la production scientifique attendue, au même titre que l'artefact lui-même.

Le PoC est un artefact **démonstratif** et non productif. Il vise à prouver la viabilité du concept de Toolbox et à le présenter au jury, pas à être déployé en production sur des centaines d'utilisateurs. Cette nature démonstrative est le critère implicite qui oriente la plupart des arbitrages : on privilégie la simplicité, la robustesse en démonstration et la maintenabilité sur la scalabilité ou la richesse fonctionnelle.

Six couches techniques sont à arbitrer : le framework front-end, la gestion des données, le styling, l'outillage de build, l'hébergement, et la méthode de génération de la recommandation par l'arbre de décision. Cette dernière couche fait l'objet d'une analyse approfondie en section 4 car elle est la plus structurante pour la valeur démonstrative du PoC.

---

## 2. Critères de décision

Les choix sont guidés par six critères, ordonnés par importance décroissante pour ce contexte.

1. **Compétences disponibles.** Le développeur maîtrise Vue. Capitaliser sur cette compétence réduit le risque et le temps de développement, deux ressources critiques sur un calendrier de cinq semaines.
2. **Temps disponible.** Le développement s'inscrit dans une fenêtre courte, en parallèle de la rédaction du rapport final. Toute technologie imposant une courbe d'apprentissage significative est pénalisante.
3. **Robustesse en démonstration.** Le PoC sera présenté en direct au jury. Une panne en démonstration (dépendance externe défaillante, comportement non déterministe) a un coût élevé. La prévisibilité prime.
4. **Maintenabilité post-Travail de Bachelor.** Si la HES-SO souhaite reprendre le projet, une stack standard et documentée facilite la reprise. Les technologies de niche sont à éviter.
5. **Simplicité de déploiement.** Le PoC doit être accessible par une URL stable, sans infrastructure lourde à maintenir.
6. **Caractère démonstratif assumé.** Pas besoin de base de données, d'authentification, ni de scalabilité. Les solutions surdimensionnées sont contre-productives.

---

## 3. Choix par couche technique

### 3.1 Framework front-end

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| **Vue 3** | Maîtrisé par le développeur, courbe nulle, réactivité native adaptée aux filtres et à l'arbre, excellent écosystème Vite | Aucun rédhibitoire dans ce contexte | **Retenu** |
| React | Très répandu, signal employabilité | Courbe d'apprentissage à payer, pas maîtrisé | Écarté |
| Svelte | Très léger, performant | Moins connu, pas maîtrisé, écosystème plus restreint | Écarté |
| HTML/JS vanilla | Zéro dépendance | Gestion d'état manuelle fastidieuse pour les filtres dynamiques et l'arbre de décision | Écarté |

Le choix de **Vue 3 avec la Composition API** s'impose par le critère de compétence. La réactivité de Vue est particulièrement adaptée aux deux fonctionnalités centrales du PoC : le filtrage dynamique du catalogue (qui doit réagir instantanément aux sélections de l'utilisateur) et l'arbre de décision (dont l'état progresse au fil des questions).

### 3.2 Gestion des données

Les données du PoC sont les 48 fiches d'outils, les 21 sous-concepts, la matrice de pertinence et les 16 combinatoires. Elles sont **statiques** : elles ne changent pas pendant l'utilisation et proviennent directement de la cartographie.

Le choix retenu est le **fichier JSON statique** chargé au démarrage de l'application. Aucune base de données ni backend n'est nécessaire. Cette solution est la plus simple, la plus robuste en démonstration (pas de serveur à maintenir) et la plus cohérente avec le caractère démonstratif. Les données sont versionnables dans le dépôt Git, donc traçables et modifiables sans recompilation lourde.

Les feuilles du tableur de cartographie seront converties en quatre fichiers : `concepts.json`, `tools.json`, `matrix.json` et `combos.json`.

### 3.3 Styling

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| **CSS scoped Vue** | Natif, zéro dépendance, styles encapsulés par composant | Pas de système d'utilitaires prêt à l'emploi | **Retenu (socle)** |
| Tailwind CSS | Productivité élevée, design cohérent | Courbe d'apprentissage, configuration build supplémentaire | Alternative |
| Framework UI (Vuetify, PrimeVue) | Composants prêts à l'emploi | Lourd, esthétique générique, surdimensionné pour un PoC | Écarté |

Le **CSS scoped natif de Vue** est retenu comme socle : il n'ajoute aucune dépendance et suffit largement pour un PoC à quatre vues. Tailwind reste une alternative envisageable si le besoin de rapidité de stylage se fait sentir, mais il n'est pas nécessaire au démarrage. Les frameworks UI complets sont écartés car ils imposent une esthétique générique et un poids disproportionné.

### 3.4 Outillage de build

**Vite** est retenu. C'est l'outil de build standard de l'écosystème Vue 3, extrêmement rapide en développement (rechargement à chaud instantané) et simple à configurer pour un déploiement statique. Il génère un bundle optimisé prêt pour GitHub Pages avec une configuration minimale.

### 3.5 Hébergement

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|---------------|---------|
| **GitHub Pages** | Gratuit, URL stable, déploiement par simple push, traçabilité du dépôt | Sites statiques uniquement (suffisant ici) | **Retenu** |
| Netlify / Vercel | Déploiement continu, fonctions serverless | Surdimensionné, compte tiers supplémentaire | Écarté |
| Serveur HES-SO | Signal institutionnel fort | Complexité administrative, délais, hors scope MVP | Reporté post-Travail de Bachelor |

**GitHub Pages** est retenu pour le MVP. Il fournit une URL stable et gratuite, le déploiement se fait par un simple push sur le dépôt, et le code reste public et traçable, ce qui sert la transparence de la démarche. Une migration vers un hébergement HES-SO reste possible après le Travail de Bachelor si le projet est repris institutionnellement.

---

## 4. Décision structurante : génération de la recommandation

L'arbre de décision est le cœur fonctionnel du PoC. L'utilisateur répond à cinq questions (Année de cursus, Famille de concepts, Niveau Bloom, Fonction pédagogique, Contexte d'usage) et reçoit une recommandation de deux à quatre outils combinés. La manière de produire cette recommandation est le choix le plus structurant pour la valeur du PoC. Deux approches sont comparées, puis une voie hybride est proposée.

### 4.1 Approche A : logique de filtrage déterministe

La recommandation est produite par une logique programmée qui croise les réponses de l'utilisateur avec les 16 combinatoires préconfigurées de la cartographie et avec la matrice de pertinence. À chaque combinaison de paramètres correspond une recommandation prédéfinie, éventuellement complétée par un classement des outils selon leur score, leur coût enseignant et leur fonction.

**Avantages.** Comportement entièrement prévisible et reproductible, ce qui sécurise la démonstration au jury. Aucune dépendance externe ni clé API, donc aucun risque de panne réseau ou de coût d'exécution. Chaque recommandation est explicable et traçable jusqu'à la cartographie, ce qui renforce la rigueur scientifique. Développement rapide et maintenance simple.

**Inconvénients.** Les recommandations sont limitées aux combinaisons anticipées. La formulation est figée et moins naturelle qu'un texte généré. L'effet de démonstration est plus sobre.

### 4.2 Approche B : génération par appel à un modèle de langage

La recommandation est produite par un appel à un modèle de langage (par exemple l'API Claude) qui reçoit en contexte la cartographie et les réponses de l'utilisateur, puis génère une recommandation rédigée en langage naturel.

**Avantages.** Recommandations formulées de manière fluide et personnalisée. Capacité à traiter des combinaisons non explicitement anticipées. Effet de démonstration impressionnant, cohérent avec le sujet même du Travail de Bachelor (l'IA générative).

**Inconvénients.** Comportement non déterministe, donc risque en démonstration directe (réponse variable, latence, hallucination possible d'un outil inexistant). Dépendance à une clé API et à une connexion réseau au moment de la démonstration. Coût d'exécution, même faible. Reproductibilité plus difficile à garantir pour le jury. Traçabilité scientifique plus délicate, car la recommandation n'est plus directement dérivable de la cartographie.

### 4.3 Voie hybride

Une troisième voie combine les deux approches en limitant leurs risques respectifs. Le socle reste la **logique déterministe** : elle sélectionne les outils recommandés à partir de la cartographie, de manière prévisible et traçable. Une **couche optionnelle de génération par modèle de langage** intervient ensuite uniquement pour reformuler la recommandation déjà calculée en un texte plus fluide, sans changer les outils sélectionnés.

Dans cette voie, le modèle de langage ne décide de rien : il habille une décision déjà prise par la logique déterministe. Le risque d'hallucination d'un outil inexistant disparaît, puisque la liste d'outils est fixée en amont. Et si l'appel échoue (réseau, API), le PoC retombe automatiquement sur la formulation déterministe, sans planter.

### 4.4 Recommandation

Le socle déterministe (approche A) est retenu comme **obligatoire** pour le MVP. Il garantit un PoC robuste, reproductible et scientifiquement traçable, ce qui est prioritaire pour une démonstration au jury et pour la rigueur de la démarche.

La couche de génération par modèle de langage (volet de l'approche hybride) est retenue comme **extension optionnelle**, à développer seulement si le calendrier le permet après stabilisation du socle. Elle apporte une plus-value démonstrative cohérente avec le sujet du travail, sans introduire de dépendance critique grâce au repli automatique sur la formulation déterministe.

Cette décision présente l'avantage d'être défendable en soutenance : le PoC fonctionne de bout en bout sans IA générative (ce qui est paradoxalement rassurant pour un outil destiné à encadrer l'usage de l'IA), et l'éventuelle couche générative est présentée comme un raffinement contrôlé plutôt que comme le cœur du système.

### 4.5 État à l'itération 2

La voie hybride décrite ci-dessus reste le choix d'architecture retenu ; rien n'est rouvert dans cet
arbitrage. À l'itération 2, la couche optionnelle de génération par modèle de langage (sections 4.2
et 4.3) **n'est pas implémentée**. Le socle déterministe (approche A) assure seul la production des
recommandations en production : aucun appel à un modèle de langage n'intervient dans le chemin de
décision de l'arbre de recommandation. Le seul appel à un modèle de langage du prototype se trouve
dans l'extension d'audit de plan de cours (section 7), pour la classification d'un document déposé,
une fonctionnalité distincte de la recommandation elle-même. L'événement de télémétrie
`reco_generative_used` reste défini dans la taxonomie (`worker/src/events.js`) pour le jour où cette
couche serait implémentée, mais n'est aujourd'hui émis nulle part dans le code.

---

## 5. Stack retenue (synthèse)

| Couche | Choix | Justification principale |
|--------|-------|--------------------------|
| Framework front-end | Vue 3 (Composition API) | Compétence maîtrisée, réactivité adaptée aux filtres et à l'arbre |
| Gestion des données | JSON statique (4 fichiers) | Données statiques, robustesse, versionnable, pas de backend |
| Styling | CSS scoped Vue (socle), Tailwind en option | Zéro dépendance, suffisant pour quatre vues |
| Build | Vite | Standard Vue 3, rapide, déploiement statique simple |
| Hébergement | GitHub Pages | Gratuit, URL stable, déploiement par push, traçable |
| Génération de la recommandation | Logique déterministe (socle) + couche modèle de langage optionnelle | Robustesse et traçabilité en priorité, raffinement génératif maîtrisé |

---

## 6. Implications pour le développement

La stack retenue dessine une structure de projet simple et un ordre de développement logique.

Structure de fichiers envisagée : un dossier `data` contenant les quatre fichiers JSON dérivés de la cartographie, un dossier `components` pour les composants Vue (catalogue, fiche outil, arbre de décision, recommandation), un dossier `views` pour les quatre vues principales, et la configuration Vite avec le paramètre de base adapté à GitHub Pages.

Ordre de développement suggéré : d'abord la conversion de la cartographie en JSON (socle de données), puis le catalogue interactif (vue la plus simple, permet de valider le chargement des données et les filtres), ensuite l'arbre de décision avec sa logique déterministe (cœur fonctionnel), enfin les vues d'accueil et de méthodologie. La couche générative optionnelle interviendrait en dernier, uniquement si le calendrier le permet.

Cette progression permet d'avoir un PoC fonctionnel de bout en bout dès l'achèvement de l'arbre de décision, les éléments suivants n'étant que des enrichissements.

---

## 7. Extension Itération 2 : service serveur et instrumentation

### 7.1 Contexte et besoin

Le PoC initial (section 3) n'avait volontairement aucun backend : les données sont statiques, la recommandation est calculée dans le navigateur, et l'unique appel réseau (l'audit de plan de cours, section 4.3) transitait par un proxy Express local, jamais déployé. Cette absence de service serveur en production a un coût concret au moment où le PoC change de statut : il n'est plus seulement présenté au jury, il est envoyé à 22 enseignants de 7 institutions romandes pour un test d'usage réel. Deux besoins nouveaux apparaissent, que l'architecture initiale ne couvre pas :

- rendre l'audit de plan de cours utilisable sur le site déployé, sans exposer la clé API Anthropic au client ;
- mesurer l'usage réel du prototype (taux de complétion, points d'abandon, corrections apportées par les enseignants), condition pour que ce test alimente l'évaluation de l'artefact et une publication scientifique.

Les deux besoins partagent la même contrainte : un point de collecte côté serveur, minimal, qui ne remette pas en cause le caractère statique et déterministe du reste du PoC (contrainte non négociable : le socle de recommandation reste souverain, aucune recommandation ne dépend d'un appel réseau).

### 7.2 Choix du service serveur

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|----------------|---------|
| **Cloudflare Worker + D1** | Sans serveur à administrer, cohérent avec l'hébergement statique déjà retenu (GitHub Pages), gratuit dans les volumes visés (22 participants), déploiement par CLI, D1 est une base SQLite gérée suffisante pour un volume d'événements modeste | Écosystème propre à Cloudflare (Workers, D1) à apprendre, contrairement à Vue déjà maîtrisé | **Retenu** |
| Fonction serverless classique (Vercel/Netlify Functions) + base hébergée tierce | Écosystème proche de Vite/Vue, déploiement simple | Deux services à coordonner (fonction + base), CORS et secrets à gérer sur deux plateformes, gratuité moins généreuse à ce volume | Écarté |
| Backend dédié (Node/Express sur un VPS ou un PaaS) | Contrôle total, familiarité avec Express (déjà utilisé pour le proxy local) | Un serveur à administrer et sécuriser en continu, disproportionné pour deux routes et un volume de 22 utilisateurs, contraire au critère de simplicité qui a guidé tous les choix précédents | Écarté |
| Firebase / Supabase (BaaS) | Base de données et fonctions intégrées, tableau de bord prêt à l'emploi | Modèle de données orienté document/relationnel plus riche que nécessaire, dépendance à un écosystème tiers plus lourd pour un besoin de deux routes HTTP et une table | Écarté |

Le Worker Cloudflare est retenu pour les mêmes raisons qui ont guidé le choix de GitHub Pages en section 3.5 : gratuité, absence d'administration, cohérence avec un artefact démonstratif plutôt qu'un produit. D1 est retenu comme base plutôt qu'un service de base de données managé séparé parce qu'il partage le même compte et le même déploiement que le Worker, réduisant le nombre de pièces mobiles à une seule plateforme.

**Localisation de la base** : Europe de l'Ouest, choisie à la création (`wrangler d1 create --location=weur`), cohérente avec le public visé (enseignants romands) et avec les exigences de protection des données évoquées dans la page de transparence.

### 7.3 Choix de la télémétrie

| Option | Avantages | Inconvénients | Verdict |
|--------|-----------|----------------|---------|
| **Module maison minimal** (`src/lib/telemetry.js` + table D1 `events`) | Contrôle total du schéma d'événements et de son alignement avec les questions d'évaluation du TB, aucune dépendance tierce, aucun cookie de suivi, traçabilité complète jusqu'aux requêtes SQL d'analyse | Développement et maintenance à la charge du projet, pas de tableau de bord prêt à l'emploi | **Retenu** |
| Bibliothèque d'analytics tierce (Plausible, Umami, Google Analytics) | Tableau de bord immédiat, développement quasi nul | Schéma d'événements imposé ou générique, mal aligné avec les questions d'évaluation précises du TB (repli matriciel, corrections de classification...), dépendance externe explicitement écartée par les contraintes de la mission | Écarté |

Le choix d'un module maison découle directement d'une contrainte non négociable de cette itération : ne pas ajouter de bibliothèque d'analytics tierce ni de cookie de suivi. Les événements mesurés ne sont pas des métriques web génériques (pages vues, rebonds) mais des signaux spécifiques à l'évaluation du PoC (taux de repli sur la matrice, corrections de classification IA, temps par étape du tunnel de recommandation), qu'aucun outil générique ne peut capturer sans un développement sur mesure de toute façon. Le coût de maintenance d'un module maison est faible : moins de 200 lignes, une seule responsabilité (mettre en file, envoyer par lots, respecter le consentement).

### 7.4 Conséquences sur les critères de décision (section 2)

Cette extension respecte les critères qui ont guidé l'ensemble du PoC : le socle déterministe reste seul décisionnaire des recommandations (le Worker relaie un appel IA existant, il n'en introduit pas de nouveau dans le chemin de décision) ; la robustesse en démonstration est préservée par un repli automatique sur la fixture précalculée si le service est indisponible ; la simplicité prime sur la richesse fonctionnelle, d'où l'absence de tableau de bord et le choix de requêtes SQL préparées plutôt que d'une interface d'analyse dédiée.