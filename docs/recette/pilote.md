# Passage pilote — un enseignant en conditions réelles

Avant l'envoi aux 22 enseignants, un passage complet par un seul enseignant pilote permet de
vérifier que tout fonctionne en dehors des tests automatisés. Ce document liste ce qu'il faut lui
demander de faire, et comment vérifier ensuite que sa session est bien remontée en base.

## Consignes à transmettre au pilote

Lien à envoyer : `https://neatlovin.github.io/toolbox-prog-ia/?src=tb2026`

1. **Accepter (ou refuser) le bandeau de consentement** qui apparaît en bas d'écran — les deux
   choix sont valides, le site fonctionne dans les deux cas.
2. **Obtenir une recommandation** (`/arbre`) : choisir une zone, un concept précis (pas "toute la
   zone"), un contexte d'usage, un niveau Bloom si souhaité, jusqu'à l'écran de résultat.
3. **Parcourir le catalogue** (`/catalogue`) : appliquer au moins un filtre, ouvrir le détail d'au
   moins un outil ("Détails et usage").
4. **Auditer son propre plan de cours** (`/audit`) : déposer un vrai PDF de son cours (pas la
   fixture de démonstration), corriger au moins une classification si elle lui semble incorrecte
   avant de valider, aller jusqu'à l'écran de résultat.
5. **Répondre au questionnaire UMUX-Lite** s'il apparaît en bas du résultat de l'arbre.

Aucune autre consigne technique n'est nécessaire — le but est un usage naturel, pas un test scripté.

## Vérifier sa session après son passage

Une seule commande, sans avoir besoin de récupérer son `session_id` : elle cible automatiquement
la session la plus récente en base.

```bash
npm run pilot:replay
```

Le script trie explicitement sur `ts_client` (l'horodatage pris côté navigateur), la seule colonne
fiable pour reconstituer l'ordre réel des événements — voir `worker/README.md` section
"ts_client vs ts_server". Il affiche directement ce qu'il faut vérifier : la durée totale du
parcours, le premier et le dernier événement, la présence (ou non) du marqueur de campagne
`tb2026`, et le déroulé chronologique complet. Vérifier que la séquence correspond bien à son
parcours réel (consentement, étapes de l'arbre, ouverture d'outil, dépôt de document,
classification, validation, résultat, sondage) sans trou ni doublon suspect.

Pour cibler une session précise plutôt que la plus récente : `npm run pilot:replay -- <session_id>`.

## Purger sa session de test ensuite

Une fois la vérification faite, purger sa session pour que la base reparte vierge avant le vrai
lancement — `session_id` obligatoire, affiché en tête de la sortie de `npm run pilot:replay` :

```bash
npm run pilot:purge -- <son_session_id>
```

Le script confirme lui-même que 0 ligne reste pour cette session dans `events` et `audit_calls`.
