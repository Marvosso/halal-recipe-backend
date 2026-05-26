-- Hybrid AI: cached explanation outputs (deterministic verdict is never stored as AI-derived)

CREATE TABLE IF NOT EXISTS ai_explanation_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_explanation_cache_expires
  ON ai_explanation_cache (expires_at);

COMMENT ON TABLE ai_explanation_cache IS 'Cached AI/template explanation responses keyed by verdict fingerprint; never stores AI verdicts.';
