PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  description TEXT NOT NULL
) STRICT;
INSERT OR IGNORE INTO schema_migrations VALUES (1, 'consumer content and editorial publication');
INSERT OR IGNORE INTO schema_migrations VALUES (2, 'self-report survey publication');
INSERT OR IGNORE INTO schema_migrations VALUES (3, 'reviewed consumer portrait and case lessons');

CREATE TABLE portrait_publications (
  id INTEGER PRIMARY KEY CHECK (id=1),
  payload TEXT NOT NULL CHECK (json_valid(payload))
) STRICT;

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('law','case','reference','portal')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  verified TEXT,
  eligible INTEGER NOT NULL CHECK (eligible IN (0,1)),
  payload TEXT NOT NULL CHECK (json_valid(payload))
) STRICT;

CREATE TABLE topics (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload))
) STRICT;

CREATE TABLE authority_rules (
  topic_slug TEXT NOT NULL REFERENCES topics(slug),
  id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  PRIMARY KEY (topic_slug,id)
) STRICT;

CREATE TABLE topic_sources (
  topic_slug TEXT NOT NULL REFERENCES topics(slug),
  source_id TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (topic_slug,source_id)
) STRICT;

CREATE TABLE rule_sources (
  topic_slug TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (topic_slug,rule_id,source_id),
  FOREIGN KEY (topic_slug,rule_id) REFERENCES authority_rules(topic_slug,id)
) STRICT;

CREATE TABLE real_cases (
  id TEXT PRIMARY KEY REFERENCES sources(id),
  topic_slug TEXT REFERENCES topics(slug),
  locator TEXT NOT NULL,
  facts TEXT NOT NULL,
  holding TEXT NOT NULL,
  boundary TEXT NOT NULL,
  review_state TEXT NOT NULL CHECK (review_state IN ('collected','verified')),
  tags TEXT NOT NULL CHECK (json_valid(tags))
) STRICT;

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  topic_slug TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  real_case_id TEXT REFERENCES real_cases(id),
  origin TEXT NOT NULL CHECK (origin IN ('case-adaptation','rule-synthesis','case-inspired-survey')),
  review_state TEXT NOT NULL CHECK (review_state IN ('draft','published','retired')),
  editorial_note TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  FOREIGN KEY (topic_slug,rule_id) REFERENCES authority_rules(topic_slug,id),
  CHECK (review_state <> 'published' OR (real_case_id IS NOT NULL AND origin = 'case-inspired-survey' AND json_extract(payload,'$.mode')='self-report'))
) STRICT;

CREATE TABLE journeys (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE,
  payload TEXT NOT NULL CHECK (json_valid(payload))
) STRICT;

CREATE TABLE journey_questions (
  journey_id TEXT NOT NULL REFERENCES journeys(id),
  question_id TEXT NOT NULL UNIQUE REFERENCES questions(id),
  position INTEGER NOT NULL,
  PRIMARY KEY (journey_id,position)
) STRICT;

CREATE INDEX idx_sources_review ON sources(kind,eligible);
CREATE INDEX idx_cases_topic ON real_cases(topic_slug,review_state);
CREATE INDEX idx_questions_publication ON questions(review_state,topic_slug);

-- The public survey content query. Drafts, retired questions and unverified cases stay internal.
CREATE VIEW published_questions AS
SELECT q.id,q.payload,q.real_case_id
FROM questions q
JOIN real_cases c ON c.id=q.real_case_id
JOIN sources s ON s.id=c.id
JOIN authority_rules r ON r.topic_slug=q.topic_slug AND r.id=q.rule_id
WHERE q.review_state='published' AND c.review_state='verified' AND s.eligible=1 AND s.kind='case'
  AND r.status='现行'
  AND c.facts<>'' AND c.boundary<>''
  AND EXISTS (
    SELECT 1 FROM rule_sources direct
    WHERE direct.topic_slug=q.topic_slug AND direct.rule_id=q.rule_id AND direct.source_id=q.real_case_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM rule_sources rs JOIN sources src ON src.id=rs.source_id
    WHERE rs.topic_slug=q.topic_slug AND rs.rule_id=q.rule_id AND src.eligible=0
  );
