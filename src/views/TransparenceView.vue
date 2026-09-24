<template>
  <div class="transparence">
    <div class="ui-page-header">
      <h1>Transparence sur la mesure d'audience</h1>
      <p>
        Ce prototype est envoyé à des enseignants ayant participé aux entretiens du Travail de
        Bachelor. Mesurer son usage sert à évaluer l'outil lui-même et à documenter cette
        évaluation dans le travail. Cette page explique ce qui est mesuré, ce qui ne l'est
        jamais, et comment revenir sur votre choix.
      </p>
    </div>

    <section class="tr-section ui-card">
      <h2>Votre choix</h2>
      <p>
        Un bandeau vous propose d'accepter ou de refuser cette mesure lors de votre première
        visite. Tant que vous n'avez rien choisi, rien n'est envoyé, à une exception près : le
        questionnaire de satisfaction en fin de parcours peut être rempli et envoyé même sans ce
        choix, voir « Questionnaire de satisfaction » ci-dessous. Si vous refusez, l'outil reste
        entièrement utilisable : aucune fonctionnalité n'en dépend. Votre choix est mémorisé pour
        la durée de votre visite seulement ; il vous sera reproposé la prochaine fois que vous
        ouvrirez le site.
      </p>
      <button class="ui-btn ui-btn-secondary" @click="withdraw">
        {{ withdrawn ? 'Consentement retiré' : 'Retirer mon consentement maintenant' }}
      </button>
    </section>

    <section class="tr-section ui-card">
      <h2>Ce qui est mesuré, et pourquoi</h2>
      <p class="tr-intro">
        Uniquement des statistiques d'usage anonymes, jamais votre identité. Les catégories
        suivantes sont enregistrées :
      </p>
      <div class="tr-cat-list">
        <div class="tr-cat">
          <h3>Arrivée sur le site et démarrage</h3>
          <p>
            D'où vient votre visite (lien de campagne ou visite directe), la catégorie
            approximative de la taille de votre écran, la langue de votre navigateur, et votre
            choix de consentement.
          </p>
        </div>
        <div class="tr-cat">
          <h3>Parcours de recommandation</h3>
          <p>
            Les étapes du questionnaire (zone, concept, contexte, objectif), le temps passé sur
            chacune, si vous revenez en arrière ou relancez avec une réponse différente, et le
            résultat obtenu (quels outils, à partir de quelle donnée de la cartographie). Sert à
            repérer les questions qui bloquent et à mesurer si les recommandations correspondent
            aux attentes.
          </p>
        </div>
        <div class="tr-cat">
          <h3>Catalogue et matrice de pertinence</h3>
          <p>
            Les filtres utilisés et le nombre de résultats obtenus, quelles fiches d'outils sont
            consultées et combien de temps, quelles cellules de la matrice sont ouvertes. Sert à
            repérer les outils jamais consultés et les zones de la matrice réellement explorées.
          </p>
        </div>
        <div class="tr-cat">
          <h3>Audit de plan de cours</h3>
          <p>
            Des statistiques sur le document déposé : nombre de pages, nombre de caractères, si
            l'extraction a réussi. Les corrections que vous apportez aux notions détectées par
            l'IA (quelle notion remplacée par quelle autre), sans jamais inclure le contenu du
            document lui-même dans cette mesure (sa transmission pour l'analyse est décrite dans
            « Analyse d'un plan de cours » ci-dessous). Sert à mesurer la fiabilité de la
            classification automatique.
          </p>
        </div>
        <div class="tr-cat">
          <h3>Fiabilité technique</h3>
          <p>
            Les erreurs inattendues rencontrées dans l'application, pour les corriger.
          </p>
        </div>
        <div class="tr-cat">
          <h3>Questionnaire de satisfaction</h3>
          <p>
            Si vous choisissez d'y répondre en fin de parcours : cinq échelles (utilité, facilité
            d'utilisation, adéquation à votre contexte d'enseignement, intention de réutilisation,
            clarté des justifications) et une question ouverte facultative. Vous pouvez y répondre
            même si vous avez refusé (ou n'avez pas encore choisi) la mesure d'usage ci-dessus :
            dans ce cas, seule votre réponse est transmise, uniquement au moment où vous cliquez
            sur « Envoyer », rien d'autre.
          </p>
        </div>
      </div>
    </section>

    <section class="tr-section ui-card">
      <h2>Ce qui n'est jamais collecté</h2>
      <ul class="tr-never-list">
        <li>Votre identité, votre nom ou votre institution</li>
        <li>Votre adresse IP ou toute autre donnée réseau permettant de vous localiser</li>
        <li>
          Le contenu de vos documents ou plans de cours n'est jamais conservé par ce site (il est
          transmis pour analyse, voir « Analyse d'un plan de cours » ci-dessous)
        </li>
        <li>Le nom des fichiers que vous déposez</li>
        <li>Les détails techniques bruts de votre navigateur ou appareil</li>
        <li>Un identifiant qui vous suivrait d'une visite à l'autre</li>
      </ul>
    </section>

    <section id="analyse-plan-de-cours" class="tr-section ui-card">
      <h2>Analyse d'un plan de cours</h2>
      <p>
        Cette fonction est distincte de la mesure d'audience et ne dépend pas de votre choix sur
        celle-ci.
      </p>
      <ul class="tr-audit-list">
        <li>
          <strong>Ce qui est transmis :</strong> le texte extrait de votre PDF, jamais le fichier
          lui-même ni son nom.
        </li>
        <li>
          <strong>À qui :</strong> un modèle de langage d'Anthropic, via le serveur du prototype,
          qui garde la clé d'accès (elle n'est jamais dans votre navigateur).
        </li>
        <li>
          <strong>Pourquoi :</strong> identifier les concepts de programmation abordés dans chaque
          section, et vérifier que le document porte bien sur l'informatique.
        </li>
        <li>
          <strong>Ce qui n'est pas fait :</strong> le prototype ne conserve pas ce texte, ni dans sa
          base de données ni dans ses journaux, et ne le relie pas à la mesure d'audience. Le
          résultat de l'analyse (titres de sections et résumé) reste seulement dans votre propre
          navigateur, le temps de votre visite : il disparaît à la fermeture de l'onglet ou au clic
          sur « Nouvelle analyse ».
        </li>
        <li>
          <strong>Côté Anthropic :</strong> le traitement relève de ses conditions pour l'API. Voir
          ses
          <a href="https://www.anthropic.com/legal/commercial-terms" target="_blank" rel="noopener noreferrer">conditions commerciales</a>
          et sa page sur la
          <a href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data" target="_blank" rel="noopener noreferrer">durée de conservation des données de l'API</a>
          (en anglais).
        </li>
      </ul>
      <p>
        Pour découvrir la fonction sans rien transmettre, utilisez le cours d'exemple : il rejoue
        une analyse déjà calculée, sans aucun appel au modèle.
      </p>
    </section>

    <section class="tr-section ui-card">
      <h2>Durée de conservation</h2>
      <p>
        Les données de mesure d'audience sont conservées 12 mois, puis supprimées
        automatiquement. Aucune action de votre part n'est nécessaire.
      </p>
    </section>

    <section class="tr-section ui-card">
      <h2>Contact</h2>
      <p>
        Pour toute question sur cette mesure d'audience ou sur le Travail de Bachelor :
        <span class="tr-email">{{ email }}</span>
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { denyConsent } from '../lib/consent.js'

// Assemblage en JavaScript plutôt qu'une adresse en clair dans le HTML, pour freiner la
// collecte automatisée par des robots qui aspirent le code source.
const EMAIL_LOCAL = 'valentino.vdd'
const EMAIL_DOMAIN = 'gmail.com'
const email = computed(() => `${EMAIL_LOCAL}@${EMAIL_DOMAIN}`)

const withdrawn = ref(false)
function withdraw() {
  denyConsent()
  withdrawn.value = true
}
</script>

<style scoped>
.transparence {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 720px;
}

.tr-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tr-section h2 {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--color-text);
}

.tr-section p {
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.65;
}

.tr-intro { margin-bottom: 0; }

.tr-cat-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.tr-cat h3 {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}

.tr-cat p {
  font-size: var(--text-sm);
  line-height: 1.6;
}

.tr-never-list {
  list-style: disc;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.tr-audit-list {
  list-style: disc;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: var(--text-base);
  color: var(--color-text-muted);
  line-height: 1.6;
}
.tr-audit-list strong { color: var(--color-text); }
.tr-audit-list a { color: var(--color-info-text); text-decoration: underline; }

.tr-email {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text);
}
</style>
