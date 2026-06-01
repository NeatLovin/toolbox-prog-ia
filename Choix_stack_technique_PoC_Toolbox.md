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

Les données du PoC sont les 49 fiches d'outils, les 21 sous-concepts, la matrice de pertinence et les 16 combinatoires. Elles sont **statiques** : elles ne changent pas pendant l'utilisation et proviennent directement de la cartographie.

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