-- Save Halal Version: store substitutions used for each saved recipe
-- Run after 00_create_core_tables.sql (recipes table must exist)

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS substitutions_used JSONB DEFAULT '[]';

COMMENT ON COLUMN recipes.substitutions_used IS 'Substitutions applied during conversion: [{ ingredient, replacement, alternatives, status?, ... }]';
