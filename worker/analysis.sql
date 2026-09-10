-- Requêtes d'analyse (lot 7) pour les métriques d'évaluation du prototype.
-- Exécution : wrangler d1 execute toolbox-telemetry --remote --command "<requête>"
-- (retirer --remote pour interroger la base locale émulée par `wrangler dev --local`).
--
-- Toutes les requêtes lisent la table `events` (schéma dans worker/schema.sql). `payload` est
-- du JSON texte ; json_extract() est la fonction JSON1 de SQLite, disponible nativement dans D1.

-- 1. Taux de complétion du tunnel de recommandation, étape par étape.
-- Funnel par session (une session peut relancer le tunnel plusieurs fois ; on mesure ici
-- combien de sessions distinctes atteignent chaque étape au moins une fois, pas chaque tentative).
WITH starts AS (
  SELECT DISTINCT session_id FROM events WHERE event = 'reco_start'
),
step_zone AS (
  SELECT DISTINCT session_id FROM events
  WHERE event = 'reco_question_answered' AND json_extract(payload, '$.step') = 'zone'
),
step_concept AS (
  SELECT DISTINCT session_id FROM events
  WHERE event = 'reco_question_answered' AND json_extract(payload, '$.step') = 'concept'
),
step_context AS (
  SELECT DISTINCT session_id FROM events
  WHERE event = 'reco_question_answered' AND json_extract(payload, '$.step') = 'context'
),
step_bloom AS (
  SELECT DISTINCT session_id FROM events
  WHERE event = 'reco_question_answered' AND json_extract(payload, '$.step') = 'bloom'
),
step_result AS (
  SELECT DISTINCT session_id FROM events WHERE event = 'reco_result_shown'
)
SELECT
  (SELECT COUNT(*) FROM starts) AS sessions_started,
  (SELECT COUNT(*) FROM step_zone    WHERE session_id IN (SELECT session_id FROM starts)) AS reached_zone,
  (SELECT COUNT(*) FROM step_concept WHERE session_id IN (SELECT session_id FROM starts)) AS reached_concept,
  (SELECT COUNT(*) FROM step_context WHERE session_id IN (SELECT session_id FROM starts)) AS reached_context,
  (SELECT COUNT(*) FROM step_bloom   WHERE session_id IN (SELECT session_id FROM starts)) AS reached_bloom,
  (SELECT COUNT(*) FROM step_result  WHERE session_id IN (SELECT session_id FROM starts)) AS reached_result;

-- 2a. Taux de repli sur la matrice (resolution = matrix_fallback) parmi tous les résultats affichés.
SELECT
  COUNT(*) AS total_resultats,
  SUM(CASE WHEN json_extract(payload, '$.resolution') = 'matrix_fallback' THEN 1 ELSE 0 END) AS replis_matrice,
  SUM(CASE WHEN json_extract(payload, '$.resolution') = 'matrix_fallback' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS taux_repli_matrice
FROM events
WHERE event = 'reco_result_shown';

-- 2b. Quadruplets (zone, concept, contexte, bloom) les plus souvent en repli matriciel.
SELECT
  json_extract(payload, '$.zone')    AS zone,
  json_extract(payload, '$.concept') AS concept,
  json_extract(payload, '$.context') AS context,
  json_extract(payload, '$.bloom')   AS bloom,
  COUNT(*) AS occurrences
FROM events
WHERE event = 'reco_result_shown' AND json_extract(payload, '$.resolution') = 'matrix_fallback'
GROUP BY zone, concept, context, bloom
ORDER BY occurrences DESC
LIMIT 20;

-- 3. Répartition des zones conceptuelles interrogées (syntaxe, logique, architecture).
SELECT json_extract(payload, '$.zone') AS zone, COUNT(*) AS occurrences
FROM events
WHERE event = 'reco_result_shown'
GROUP BY zone
ORDER BY occurrences DESC;

-- 4a. Taux de relance avec paramètre modifié (reco_restart / reco_result_shown).
SELECT
  (SELECT COUNT(*) FROM events WHERE event = 'reco_restart') * 1.0 /
  NULLIF((SELECT COUNT(*) FROM events WHERE event = 'reco_result_shown'), 0) AS taux_relance;

-- 4b. Paramètre le plus souvent changé lors d'une relance.
SELECT json_extract(payload, '$.changed_param') AS changed_param, COUNT(*) AS occurrences
FROM events
WHERE event = 'reco_restart'
GROUP BY changed_param
ORDER BY occurrences DESC;

-- 5. Classement des outils par nombre d'ouvertures (détail consulté depuis l'arbre ou le catalogue).
-- La "part des outils jamais ouverts" se calcule en comparant ce résultat aux identifiants de
-- src/data/tools.json (48 outils) : cette référence n'existe pas dans D1, voir
-- worker/scripts/verify-e2e.mjs pour un exemple de croisement.
SELECT json_extract(payload, '$.tool_id') AS tool_id, COUNT(*) AS ouvertures
FROM events
WHERE event IN ('tool_detail_open', 'reco_tool_open')
GROUP BY tool_id
ORDER BY ouvertures DESC;

-- 6a. Taux de correction de la classification de l'audit, global (moyenne des taux par validation).
SELECT AVG(CAST(json_extract(payload, '$.correction_rate') AS REAL)) AS taux_correction_moyen
FROM events
WHERE event = 'audit_validation_confirmed';

-- 6b. Corrections par concept (ajout ou retrait d'un concept lors de la relecture).
SELECT
  COALESCE(json_extract(payload, '$.concept_before'), json_extract(payload, '$.concept_after')) AS concept_id,
  json_extract(payload, '$.action') AS action,
  COUNT(*) AS occurrences
FROM events
WHERE event = 'audit_classification_edited' AND json_extract(payload, '$.action') IN ('add', 'remove')
GROUP BY concept_id, action
ORDER BY occurrences DESC;

-- 7. Temps médian jusqu'à la première recommandation affichée (latency_ms de reco_result_shown).
-- SQLite n'a pas d'agrégat MEDIAN natif : calcul par fenêtre (moyenne du ou des rangs centraux).
WITH latencies AS (
  SELECT CAST(json_extract(payload, '$.latency_ms') AS INTEGER) AS latency_ms
  FROM events
  WHERE event = 'reco_result_shown' AND json_extract(payload, '$.latency_ms') IS NOT NULL
),
ordered AS (
  SELECT latency_ms,
         ROW_NUMBER() OVER (ORDER BY latency_ms) AS rn,
         COUNT(*) OVER () AS n
  FROM latencies
)
SELECT AVG(latency_ms) AS mediane_latence_ms
FROM ordered
WHERE rn IN ((n + 1) / 2, (n + 2) / 2);

-- 8. Score UMUX-Lite moyen (échelle 0-100) et conversion sur l'échelle SUS
-- (Lewis, Utesch & Maher 2013 : SUS-équivalent ≈ 0,65 × UMUX-Lite + 22,9).
WITH scores AS (
  SELECT
    ((CAST(json_extract(payload, '$.needs_score') AS REAL) - 1) +
     (CAST(json_extract(payload, '$.ease_score')  AS REAL) - 1)) * 100.0 / 12 AS umux_lite_score
  FROM events
  WHERE event = 'survey_submitted'
)
SELECT
  COUNT(*) AS nb_reponses,
  AVG(umux_lite_score) AS umux_lite_moyen,
  AVG(umux_lite_score) * 0.65 + 22.9 AS equivalent_sus_moyen
FROM scores;

-- 9. Répartition des sessions par campagne (distinguer les participants tb2026 des visiteurs directs).
SELECT campaign, COUNT(DISTINCT session_id) AS sessions
FROM events
GROUP BY campaign
ORDER BY sessions DESC;
