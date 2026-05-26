# Saved Halal Recipes

Lightweight MVP for storing recipe converter outputs (private saves, separate from social feed posts).

## Schema

Migration: `src/migrations/15_saved_halal_recipes.sql`

| Column | Purpose |
|--------|---------|
| `recipe_kind` | `'saved'` (converter) or `'post'` (feed) |
| `conversion_snapshot` | JSON: `{ issues, confidenceScore, savedFrom, savedAt }` |
| Existing columns | `original_recipe`, `converted_recipe`, `substitutions_used`, `visibility='private'` |

Run: `npm run migrate:saved-recipes`

## API

Base: `/api/saved-recipes` (auth required)

| Method | Path | Action |
|--------|------|--------|
| GET | `/` | List user's saved conversions |
| POST | `/` | Save conversion |
| GET | `/:id` | Get one save |
| DELETE | `/:id` | Delete save |

**POST body:**

```json
{
  "title": "Optional title",
  "originalRecipe": "…",
  "convertedRecipe": "…",
  "confidenceScore": 85,
  "substitutionsUsed": [{ "ingredient": "bacon", "replacement": "turkey bacon" }]
}
```

Falls back to `backend/data/recipes.json` when PostgreSQL is unavailable.

## Frontend

- `api/savedRecipesApi.js` — API + localStorage for guests
- `pages/MyHalalRecipesPage.jsx` — list, detail sheet, delete, open in converter
- App converter — **Save Halal Version** → `saveHalalRecipe()`
- Reopen — navigates to `/app` with `state.loadRecipe` (shows saved conversion without re-running)

## Guest mode

Saves stored in `localStorage` key `halalSavedRecipes` (legacy `halalRecipes` migrated once).
