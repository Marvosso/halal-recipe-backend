-- Analytics Events Table
-- Stores anonymous analytics events for affiliate monetization
-- GDPR Compliant: No personal data, aggregate only

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  event_props JSONB NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
-- BTREE: expression returns text; GIN has no default opclass for text
CREATE INDEX IF NOT EXISTS idx_analytics_props_ingredient ON analytics_events ((event_props->>'ingredient_id'));
CREATE INDEX IF NOT EXISTS idx_analytics_props_platform ON analytics_events ((event_props->>'platform'));
CREATE INDEX IF NOT EXISTS idx_analytics_props_region ON analytics_events ((event_props->>'region'));

-- Partition by month for better performance (optional, for high volume)
-- CREATE TABLE analytics_events_2024_01 PARTITION OF analytics_events
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Retention policy: Delete events older than 2 years
-- Run monthly cleanup job
-- DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '2 years';
