-- =============================================================================
-- Halal Kitchen: Ingredient Intelligence Schema (scalable)
-- Supports: thousands of ingredients, aliases/misspellings, modifier rules,
--           SEO pages, substitutions, source references, last-reviewed dates.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ingredients
-- Core entity: one row per canonical ingredient. Slug is stable for URLs/API.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'plain_plant', 'meat', 'animal_byproduct', 'dairy', 'cheese',
    'flavoring_extract', 'alcohol', 'pork', 'other'
  )),
  default_verdict TEXT NOT NULL CHECK (default_verdict IN (
    'halal', 'usually_halal', 'conditional', 'usually_haram', 'haram', 'unknown'
  )),
  default_confidence TEXT NOT NULL CHECK (default_confidence IN ('high', 'medium', 'low')),
  notes_summary TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredients_slug ON ingredients(slug);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active) WHERE is_active = true;

COMMENT ON TABLE ingredients IS 'Canonical ingredients; slug used in rules and SEO paths.';
COMMENT ON COLUMN ingredients.last_reviewed_at IS 'When this ingredient was last reviewed for accuracy.';

-- -----------------------------------------------------------------------------
-- 2. ingredient_aliases
-- Aliases and common misspellings for matching user/OCR input to an ingredient.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id SERIAL PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  alias_normalized TEXT NOT NULL,
  alias_display TEXT,
  is_misspelling BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredient_aliases_normalized ON ingredient_aliases(alias_normalized);
CREATE INDEX IF NOT EXISTS idx_ingredient_aliases_ingredient ON ingredient_aliases(ingredient_id);

COMMENT ON COLUMN ingredient_aliases.alias_normalized IS 'Lowercase, no extra spaces; used for matching.';
COMMENT ON COLUMN ingredient_aliases.alias_display IS 'Optional display form (e.g. "Soy Sauce").';

-- -----------------------------------------------------------------------------
-- 3. ingredient_modifiers
-- Modifiers that change verdict (e.g. pork, halal_certified, plant_based).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_modifiers (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  effect TEXT NOT NULL CHECK (effect IN (
    'override_halal', 'override_haram', 'strengthen', 'weaken', 'context'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredient_modifiers_slug ON ingredient_modifiers(slug);

-- -----------------------------------------------------------------------------
-- 4. ingredient_rule_overrides
-- (ingredient + modifier) → verdict override. Replaces category default when matched.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_rule_overrides (
  id SERIAL PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  modifier_id INTEGER NOT NULL REFERENCES ingredient_modifiers(id) ON DELETE CASCADE,
  verdict TEXT NOT NULL CHECK (verdict IN (
    'halal', 'usually_halal', 'conditional', 'usually_haram', 'haram'
  )),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_id, modifier_id)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_rule_overrides_ingredient ON ingredient_rule_overrides(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_rule_overrides_modifier ON ingredient_rule_overrides(modifier_id);

-- -----------------------------------------------------------------------------
-- 5. ingredient_references
-- Source references (Quran, hadith, scholarly) for an ingredient.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_references (
  id SERIAL PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  ref_type TEXT NOT NULL CHECK (ref_type IN ('quran', 'hadith', 'scholarly', 'other')),
  ref_text TEXT NOT NULL,
  ref_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_references_ingredient ON ingredient_references(ingredient_id);

-- -----------------------------------------------------------------------------
-- 6. ingredient_substitutions
-- Halal substitutes for an ingredient. substitute_ingredient_id or substitute_slug.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_substitutions (
  id SERIAL PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  substitute_ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  substitute_slug TEXT,
  substitute_display_name TEXT,
  sort_order INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_substitute_ref CHECK (
    substitute_ingredient_id IS NOT NULL OR (substitute_slug IS NOT NULL AND substitute_slug <> '')
  )
);

CREATE INDEX IF NOT EXISTS idx_ingredient_substitutions_ingredient ON ingredient_substitutions(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitutions_substitute ON ingredient_substitutions(substitute_ingredient_id);

-- -----------------------------------------------------------------------------
-- 7. ingredient_pages
-- SEO pages: one per ingredient (or per locale). Slug = URL path.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredient_pages (
  id SERIAL PRIMARY KEY,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  locale TEXT NOT NULL DEFAULT 'en',
  slug TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  h1 TEXT,
  content_html TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_id, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredient_pages_slug_locale ON ingredient_pages(slug, locale);
CREATE INDEX IF NOT EXISTS idx_ingredient_pages_ingredient ON ingredient_pages(ingredient_id);

-- -----------------------------------------------------------------------------
-- Seed: modifier slugs (required for rule overrides)
-- -----------------------------------------------------------------------------
INSERT INTO ingredient_modifiers (slug, display_name, effect) VALUES
  ('unspecified', 'Unspecified', 'context'),
  ('pork', 'Pork-derived', 'override_haram'),
  ('beef', 'Beef-derived', 'strengthen'),
  ('bovine', 'Bovine', 'strengthen'),
  ('halal_certified', 'Halal-certified', 'override_halal'),
  ('plant', 'Plant-based', 'override_halal'),
  ('plant_based', 'Plant-based', 'override_halal'),
  ('alcohol_free', 'Alcohol-free', 'override_halal'),
  ('alcohol_based', 'Alcohol-based', 'override_haram'),
  ('wine', 'Wine', 'override_haram'),
  ('fermented', 'Fermented', 'context'),
  ('enzyme', 'Enzyme', 'context'),
  ('rennet', 'Rennet', 'context')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Seed: ingredients + aliases + overrides + references + substitutions + pages
-- Gelatin, cheese, soy sauce, vanilla extract, rice
-- -----------------------------------------------------------------------------

-- Gelatin
INSERT INTO ingredients (id, slug, display_name, category, default_verdict, default_confidence, notes_summary, last_reviewed_at) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'gelatin', 'Gelatin', 'animal_byproduct', 'conditional', 'medium',
   'Source often unknown; must be halal-certified if animal-derived.', NOW())
ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, category = EXCLUDED.category,
  default_verdict = EXCLUDED.default_verdict, default_confidence = EXCLUDED.default_confidence,
  notes_summary = EXCLUDED.notes_summary, last_reviewed_at = EXCLUDED.last_reviewed_at, updated_at = NOW();

INSERT INTO ingredient_aliases (ingredient_id, alias_normalized, alias_display, is_misspelling) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'gelatin', 'gelatin', false),
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'gelatine', 'gelatine', false),
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'gelatn', 'gelatin', true)
ON CONFLICT (alias_normalized) DO NOTHING;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'haram', 'high', 'Pork-derived gelatin is not permissible.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'gelatin' AND m.slug = 'pork'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'conditional', 'medium', 'Permissible only if from zabiha/halal-certified beef.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'gelatin' AND m.slug = 'beef'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'halal', 'high', 'Halal-certified source.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'gelatin' AND m.slug = 'halal_certified'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'halal', 'high', 'Plant-based; no animal source.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'gelatin' AND m.slug = 'plant'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_references (ingredient_id, ref_type, ref_text, sort_order) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'quran', 'Surah Al-Baqarah 2:173', 1),
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'hadith', 'Sahih Bukhari 7:67:400', 2);

INSERT INTO ingredient_substitutions (ingredient_id, substitute_slug, substitute_display_name, sort_order, notes) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'agar_agar', 'Agar agar', 1, '1:0.5 ratio for setting'),
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'halal_beef_gelatin', 'Halal beef gelatin', 2, 'Check certification'),
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'pectin', 'Pectin', 3, 'For fruit-based gels');

INSERT INTO ingredient_pages (ingredient_id, locale, slug, meta_title, meta_description, h1, is_published) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'gelatin'), 'en', 'is-gelatin-halal',
   'Is Gelatin Halal? | Halal Kitchen', 'Learn when gelatin is halal or haram and best halal substitutes.',
   'Is Gelatin Halal?', true);

-- Cheese
INSERT INTO ingredients (id, slug, display_name, category, default_verdict, default_confidence, notes_summary, last_reviewed_at) VALUES
  ('a0000001-0001-4000-8000-000000000002', 'cheese', 'Cheese', 'cheese', 'conditional', 'medium',
   'Depends on rennet and enzymes; check for halal or microbial rennet.', NOW())
ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, category = EXCLUDED.category,
  default_verdict = EXCLUDED.default_verdict, default_confidence = EXCLUDED.default_confidence,
  notes_summary = EXCLUDED.notes_summary, last_reviewed_at = EXCLUDED.last_reviewed_at, updated_at = NOW();

INSERT INTO ingredient_aliases (ingredient_id, alias_normalized, alias_display, is_misspelling) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'cheese'), 'cheese', 'cheese', false)
ON CONFLICT (alias_normalized) DO NOTHING;

INSERT INTO ingredient_references (ingredient_id, ref_type, ref_text, sort_order) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'cheese'), 'scholarly', 'Rennet source determines permissibility.', 1);

INSERT INTO ingredient_substitutions (ingredient_id, substitute_slug, substitute_display_name, sort_order, notes) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'cheese'), 'halal_cheese', 'Halal-certified cheese', 1, 'Check label for microbial rennet'),
  ((SELECT id FROM ingredients WHERE slug = 'cheese'), 'vegan_cheese', 'Vegan cheese', 2, 'Plant-based');

INSERT INTO ingredient_pages (ingredient_id, locale, slug, meta_title, meta_description, h1, is_published) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'cheese'), 'en', 'is-cheese-halal',
   'Is Cheese Halal? | Halal Kitchen', 'When is cheese halal? Rennet and halal cheese substitutes.',
   'Is Cheese Halal?', true);

-- Soy sauce
INSERT INTO ingredients (id, slug, display_name, category, default_verdict, default_confidence, notes_summary, last_reviewed_at) VALUES
  ('a0000001-0001-4000-8000-000000000003', 'soy_sauce', 'Soy sauce', 'flavoring_extract', 'conditional', 'medium',
   'Naturally contains trace alcohol from fermentation; many scholars allow.', NOW())
ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, category = EXCLUDED.category,
  default_verdict = EXCLUDED.default_verdict, default_confidence = EXCLUDED.default_confidence,
  notes_summary = EXCLUDED.notes_summary, last_reviewed_at = EXCLUDED.last_reviewed_at, updated_at = NOW();

INSERT INTO ingredient_aliases (ingredient_id, alias_normalized, alias_display, is_misspelling) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'soy sauce', 'soy sauce', false),
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'soy_sauce', 'soy sauce', false),
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'shoyu', 'shoyu', false)
ON CONFLICT (alias_normalized) DO NOTHING;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'halal', 'high', 'Certified halal or alcohol-free.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'soy_sauce' AND m.slug = 'halal_certified'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'halal', 'high', 'No alcohol; permissible.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'soy_sauce' AND m.slug = 'alcohol_free'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_references (ingredient_id, ref_type, ref_text, sort_order) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'quran', 'Surah Al-Ma''idah 5:90', 1),
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'hadith', 'Sahih Muslim 10:3893', 2);

INSERT INTO ingredient_substitutions (ingredient_id, substitute_slug, substitute_display_name, sort_order, notes) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'halal_soy_sauce', 'Halal-certified soy sauce', 1, ''),
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'tamari_alcohol_free', 'Tamari (alcohol-free)', 2, 'Gluten-free option');

INSERT INTO ingredient_pages (ingredient_id, locale, slug, meta_title, meta_description, h1, is_published) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'soy_sauce'), 'en', 'is-soy-sauce-halal',
   'Is Soy Sauce Halal? | Halal Kitchen', 'Soy sauce and trace alcohol: is it halal? Halal soy sauce substitutes.',
   'Is Soy Sauce Halal?', true);

-- Vanilla extract
INSERT INTO ingredients (id, slug, display_name, category, default_verdict, default_confidence, notes_summary, last_reviewed_at) VALUES
  ('a0000001-0001-4000-8000-000000000004', 'vanilla_extract', 'Vanilla extract', 'flavoring_extract', 'conditional', 'medium',
   'Often alcohol-based; check label or use alcohol-free.', NOW())
ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, category = EXCLUDED.category,
  default_verdict = EXCLUDED.default_verdict, default_confidence = EXCLUDED.default_confidence,
  notes_summary = EXCLUDED.notes_summary, last_reviewed_at = EXCLUDED.last_reviewed_at, updated_at = NOW();

INSERT INTO ingredient_aliases (ingredient_id, alias_normalized, alias_display, is_misspelling) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'vanilla extract', 'vanilla extract', false),
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'vanilla_extract', 'vanilla extract', false),
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'pure vanilla extract', 'pure vanilla extract', false)
ON CONFLICT (alias_normalized) DO NOTHING;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'halal', 'high', 'Alcohol-free vanilla is permissible.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'vanilla_extract' AND m.slug = 'alcohol_free'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_rule_overrides (ingredient_id, modifier_id, verdict, confidence_level, notes)
SELECT i.id, m.id, 'halal', 'high', 'Vanilla powder or bean; no alcohol carrier.'
FROM ingredients i, ingredient_modifiers m WHERE i.slug = 'vanilla_extract' AND m.slug = 'plant'
ON CONFLICT (ingredient_id, modifier_id) DO UPDATE SET verdict = EXCLUDED.verdict, notes = EXCLUDED.notes;

INSERT INTO ingredient_references (ingredient_id, ref_type, ref_text, sort_order) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'quran', 'Surah Al-Ma''idah 5:90', 1),
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'hadith', 'Sahih Muslim 10:3893', 2);

INSERT INTO ingredient_substitutions (ingredient_id, substitute_slug, substitute_display_name, sort_order, notes) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'alcohol_free_vanilla', 'Alcohol-free vanilla', 1, ''),
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'vanilla_powder', 'Vanilla powder', 2, '½ tsp ≈ 1 tsp extract'),
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'vanilla_bean_paste', 'Vanilla bean paste', 3, '');

INSERT INTO ingredient_pages (ingredient_id, locale, slug, meta_title, meta_description, h1, is_published) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'vanilla_extract'), 'en', 'is-vanilla-extract-halal',
   'Is Vanilla Extract Halal? | Halal Kitchen', 'Alcohol in vanilla extract: halal or not? Alcohol-free vanilla options.',
   'Is Vanilla Extract Halal?', true);

-- Rice
INSERT INTO ingredients (id, slug, display_name, category, default_verdict, default_confidence, notes_summary, last_reviewed_at) VALUES
  ('a0000001-0001-4000-8000-000000000005', 'rice', 'Rice', 'plain_plant', 'halal', 'high',
   'Plain plant; permissible.', NOW())
ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, category = EXCLUDED.category,
  default_verdict = EXCLUDED.default_verdict, default_confidence = EXCLUDED.default_confidence,
  notes_summary = EXCLUDED.notes_summary, last_reviewed_at = EXCLUDED.last_reviewed_at, updated_at = NOW();

INSERT INTO ingredient_aliases (ingredient_id, alias_normalized, alias_display, is_misspelling) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'rice'), 'rice', 'rice', false),
  ((SELECT id FROM ingredients WHERE slug = 'rice'), 'rices', 'rice', true)
ON CONFLICT (alias_normalized) DO NOTHING;

INSERT INTO ingredient_references (ingredient_id, ref_type, ref_text, sort_order) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'rice'), 'quran', 'Surah Al-Baqarah 2:172', 1);

INSERT INTO ingredient_pages (ingredient_id, locale, slug, meta_title, meta_description, h1, is_published) VALUES
  ((SELECT id FROM ingredients WHERE slug = 'rice'), 'en', 'is-rice-halal',
   'Is Rice Halal? | Halal Kitchen', 'Rice is a plain plant and halal. Learn about different types of rice.',
   'Is Rice Halal?', true);
