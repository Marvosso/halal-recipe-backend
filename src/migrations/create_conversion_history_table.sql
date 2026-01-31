-- Conversion History Table
-- Tracks conversions for free users (monthly limit enforcement)

BEGIN;

CREATE TABLE IF NOT EXISTS conversion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_text TEXT, -- First 500 chars for tracking (not full recipe)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_history_user ON conversion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_history_created ON conversion_history(created_at);
CREATE INDEX IF NOT EXISTS idx_conversion_history_user_month ON conversion_history(user_id, created_at);

COMMIT;
