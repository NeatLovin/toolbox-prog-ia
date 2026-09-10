-- Schéma D1 du service serveur Toolbox Prog IA.
-- Appliquer avec : wrangler d1 execute toolbox-telemetry --file=worker/schema.sql
-- (ajouter --remote pour appliquer à la base de production plutôt qu'à l'émulation locale).

CREATE TABLE IF NOT EXISTS events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT    NOT NULL,
  ts_client       INTEGER NOT NULL,
  ts_server       INTEGER NOT NULL,
  event           TEXT    NOT NULL,
  payload         TEXT,
  app_version     TEXT,
  schema_version  TEXT,
  campaign        TEXT,
  viewport_bucket TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name    ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_ts      ON events(ts_server);

-- Compteur d'appels au relais /audit, distinct de la table events : sert uniquement aux
-- plafonds de coût (par session/heure et global/jour), pas à l'évaluation de l'artefact.
-- Purgée à 7 jours par la tâche planifiée, indépendamment de la rétention des events.
CREATE TABLE IF NOT EXISTS audit_calls (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT    NOT NULL,
  ts_server  INTEGER NOT NULL,
  day        TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_calls_session ON audit_calls(session_id, ts_server);
CREATE INDEX IF NOT EXISTS idx_audit_calls_day     ON audit_calls(day);
