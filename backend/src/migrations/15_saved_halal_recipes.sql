-- Saved Halal Recipes MVP: distinguish converter saves from social posts

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS recipe_kind TEXT DEFAULT 'saved'
    CHECK (recipe_kind IN ('saved', 'post'));

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS conversion_snapshot JSONB DEFAULT '{}';

COMMENT ON COLUMN recipes.recipe_kind IS 'saved = private conversion from converter; post = feed/social recipe';
COMMENT ON COLUMN recipes.conversion_snapshot IS 'Snapshot: { issues, confidenceScore, ingredientCount, savedFrom }';

-- Backfill: private rows without kind → saved; public → post
UPDATE recipes SET recipe_kind = 'saved'
  WHERE recipe_kind IS NULL AND visibility = 'private';

UPDATE recipes SET recipe_kind = 'post'
  WHERE recipe_kind IS NULL AND visibility = 'public';

CREATE INDEX IF NOT EXISTS idx_recipes_user_saved
  ON recipes (user_id, created_at DESC)
  WHERE recipe_kind = 'saved';
