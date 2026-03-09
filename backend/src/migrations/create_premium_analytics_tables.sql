-- Premium Analytics Events Table
-- Tracks premium subscription success metrics

BEGIN;

CREATE TABLE IF NOT EXISTS premium_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  event_props JSONB NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional, for authenticated users
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_premium_analytics_event_type ON premium_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_premium_analytics_created_at ON premium_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_premium_analytics_session_id ON premium_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_premium_analytics_user_id ON premium_analytics_events(user_id);

-- BTREE on text expressions; GIN has no default opclass for text
CREATE INDEX IF NOT EXISTS idx_premium_analytics_props_plan ON premium_analytics_events ((event_props->>'plan'));
CREATE INDEX IF NOT EXISTS idx_premium_analytics_props_feature ON premium_analytics_events ((event_props->>'feature'));
CREATE INDEX IF NOT EXISTS idx_premium_analytics_props_trigger ON premium_analytics_events ((event_props->>'trigger_feature'));

COMMIT;
