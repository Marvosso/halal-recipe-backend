-- Hybrid AI architecture: deterministic ingredient rule engine
-- Base ingredients + modifiers → halal_status, notes, alternatives (AI never overrides status)

-- Canonical base ingredients (slug used in rules)
CREATE TABLE IF NOT EXISTS ingredient_rule_bases (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Modifiers that affect status (e.g. pork, beef, plant, alcohol_free)
CREATE TABLE IF NOT EXISTS ingredient_rule_modifiers (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deterministic rules: (base_slug, modifier_slug) → halal_status, notes, alternatives
-- modifier_slug NULL or 'unspecified' = source/type not specified
CREATE TABLE IF NOT EXISTS ingredient_rules (
  id SERIAL PRIMARY KEY,
  base_slug TEXT NOT NULL REFERENCES ingredient_rule_bases(slug) ON DELETE CASCADE,
  modifier_slug TEXT REFERENCES ingredient_rule_modifiers(slug) ON DELETE CASCADE,
  halal_status TEXT NOT NULL CHECK (halal_status IN ('halal', 'conditional', 'haram')),
  notes TEXT DEFAULT '',
  alternatives JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(base_slug, modifier_slug)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_rules_base ON ingredient_rules(base_slug);
CREATE INDEX IF NOT EXISTS idx_ingredient_rules_modifier ON ingredient_rules(modifier_slug);

-- Seed: modifier slugs used in detection
INSERT INTO ingredient_rule_modifiers (slug, display_name) VALUES
  ('unspecified', 'Unspecified source'),
  ('pork', 'Pork-derived'),
  ('beef', 'Beef-derived'),
  ('plant', 'Plant-based'),
  ('halal_certified', 'Halal-certified'),
  ('alcohol_based', 'Alcohol-based'),
  ('alcohol_free', 'Alcohol-free'),
  ('fermented_trace', 'Fermented (trace alcohol)')
ON CONFLICT (slug) DO NOTHING;

-- Seed: base ingredients for gelatin, soy sauce, vanilla extract
INSERT INTO ingredient_rule_bases (slug, display_name) VALUES
  ('gelatin', 'Gelatin'),
  ('soy_sauce', 'Soy sauce'),
  ('vanilla_extract', 'Vanilla extract')
ON CONFLICT (slug) DO NOTHING;

-- Gelatin rules
INSERT INTO ingredient_rules (base_slug, modifier_slug, halal_status, notes, alternatives) VALUES
  ('gelatin', 'unspecified', 'conditional', 'Source unknown; must be halal-certified if animal-derived.', '["agar_agar", "halal_beef_gelatin", "pectin"]'),
  ('gelatin', 'pork', 'haram', 'Pork-derived gelatin is not permissible.', '["agar_agar", "halal_beef_gelatin", "pectin"]'),
  ('gelatin', 'beef', 'conditional', 'Permissible only if from zabiha/halal-certified beef.', '["agar_agar", "halal_beef_gelatin", "pectin"]'),
  ('gelatin', 'halal_certified', 'halal', 'Halal-certified beef or other permitted source.', '["agar_agar", "pectin"]'),
  ('gelatin', 'plant', 'halal', 'Plant-based; no animal source.', '[]')
ON CONFLICT (base_slug, modifier_slug) DO UPDATE SET
  halal_status = EXCLUDED.halal_status,
  notes = EXCLUDED.notes,
  alternatives = EXCLUDED.alternatives;

-- Soy sauce rules
INSERT INTO ingredient_rules (base_slug, modifier_slug, halal_status, notes, alternatives) VALUES
  ('soy_sauce', 'unspecified', 'conditional', 'Naturally contains trace alcohol from fermentation; many scholars allow.', '["halal_certified_soy_sauce", "tamari_alcohol_free"]'),
  ('soy_sauce', 'fermented_trace', 'conditional', 'Trace alcohol from fermentation; many scholars consider it permissible.', '["halal_certified_soy_sauce", "tamari_alcohol_free"]'),
  ('soy_sauce', 'halal_certified', 'halal', 'Certified halal or alcohol-free.', '[]'),
  ('soy_sauce', 'alcohol_free', 'halal', 'No alcohol; permissible.', '[]')
ON CONFLICT (base_slug, modifier_slug) DO UPDATE SET
  halal_status = EXCLUDED.halal_status,
  notes = EXCLUDED.notes,
  alternatives = EXCLUDED.alternatives;

-- Vanilla extract rules
INSERT INTO ingredient_rules (base_slug, modifier_slug, halal_status, notes, alternatives) VALUES
  ('vanilla_extract', 'unspecified', 'conditional', 'Often alcohol-based; check label or use alcohol-free.', '["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"]'),
  ('vanilla_extract', 'alcohol_based', 'conditional', 'Alcohol as carrier; many scholars avoid. Prefer alcohol-free.', '["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"]'),
  ('vanilla_extract', 'alcohol_free', 'halal', 'Alcohol-free vanilla is permissible.', '[]'),
  ('vanilla_extract', 'plant', 'halal', 'Vanilla powder or bean; no alcohol carrier.', '[]')
ON CONFLICT (base_slug, modifier_slug) DO UPDATE SET
  halal_status = EXCLUDED.halal_status,
  notes = EXCLUDED.notes,
  alternatives = EXCLUDED.alternatives;
