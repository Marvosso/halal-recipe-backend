-- Phase 1: Ingredient Intelligence Engine (deterministic layer)
-- Safe to re-run: IF NOT EXISTS / ON CONFLICT throughout.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- In-memory alias seeds (works without full ingredients schema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_lookup_aliases (
  id SERIAL PRIMARY KEY,
  alias_normalized TEXT UNIQUE NOT NULL,
  target_phrase TEXT NOT NULL,
  is_misspelling BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ingredient_lookup_aliases (alias_normalized, target_phrase, is_misspelling) VALUES
  ('parm', 'parmesan cheese', false),
  ('parmesan', 'parmesan cheese', false),
  ('soy sause', 'soy sauce', true),
  ('marshmellow', 'marshmallow', true),
  ('gelatn', 'gelatin', true),
  ('gelatine', 'gelatin', false),
  ('vanila extract', 'vanilla extract', true),
  ('white wine', 'white wine', false),
  ('pork gelatin', 'pork gelatin', false),
  ('beef gelatin', 'beef gelatin', false),
  ('halal certified gelatin', 'halal certified gelatin', false)
ON CONFLICT (alias_normalized) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Taxonomy defaults (DB-backed category → verdict; code fallback if empty)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_taxonomy_defaults (
  category TEXT PRIMARY KEY,
  default_verdict TEXT NOT NULL CHECK (default_verdict IN (
    'halal', 'usually_halal', 'conditional', 'usually_haram', 'haram', 'unknown'
  )),
  default_confidence TEXT NOT NULL CHECK (default_confidence IN ('high', 'medium', 'low')),
  notes_template TEXT DEFAULT ''
);

INSERT INTO ingredient_taxonomy_defaults (category, default_verdict, default_confidence, notes_template) VALUES
  ('plain_plant', 'halal', 'high', 'Plain plant ingredient; generally permissible.'),
  ('natural_plant', 'halal', 'high', 'Natural plant ingredient; generally permissible.'),
  ('processed_plant', 'usually_halal', 'medium', 'Processed plant; check additives when listed.'),
  ('pork', 'haram', 'high', 'Pork and pork-derived ingredients are not permissible.'),
  ('alcohol', 'haram', 'high', 'Intoxicating alcohol is not permissible.'),
  ('meat', 'conditional', 'medium', 'Meat requires halal slaughter and certification.'),
  ('animal_meat', 'conditional', 'medium', 'Animal meat requires halal slaughter and certification.'),
  ('animal_byproduct', 'conditional', 'medium', 'Source unknown; must be halal-certified if animal-derived.'),
  ('cheese', 'conditional', 'medium', 'Depends on rennet and enzymes; verify halal or microbial source.'),
  ('flavoring_extract', 'conditional', 'medium', 'Often alcohol-based; check label or use alcohol-free.'),
  ('fermentation_derived', 'conditional', 'medium', 'Fermentation may leave trace alcohol; verify certification.'),
  ('flavoring', 'conditional', 'medium', 'Check carrier and alcohol content on the label.'),
  ('additive', 'conditional', 'low', 'Additive identity unclear; verify with manufacturer or scholar.'),
  ('synthetic', 'conditional', 'low', 'Synthetic additive; verify source and certification.')
ON CONFLICT (category) DO UPDATE SET
  default_verdict = EXCLUDED.default_verdict,
  default_confidence = EXCLUDED.default_confidence,
  notes_template = EXCLUDED.notes_template;

-- -----------------------------------------------------------------------------
-- Deterministic evaluation cache (optional; lookupService may use later)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_evaluation_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_evaluation_cache_expires
  ON ingredient_evaluation_cache (expires_at);
