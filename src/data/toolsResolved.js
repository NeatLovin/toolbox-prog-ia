import toolsBase from './tools.json'
import toolsLinksData from './tools_links.json'

// tools.json reste la source de vérité issue du tableur, jamais modifiée : l'accompagnement
// (explainer, tutorial_link) est fusionné ici depuis un fichier séparé. Point d'entrée unique
// réutilisé par useData.js et lib/recommendation.js pour que les outils affichés dans le
// catalogue et ceux renvoyés par le moteur de recommandation ne divergent jamais.
export const tools = toolsBase.map(t => ({ ...t, ...(toolsLinksData[t.id] || {}) }))
