# Phase 3 — Server-authoritative recipe conversion

## Goal

Recipe conversion uses the same **ingredient-intelligence** engine as Quick Lookup and scan. The client no longer runs `evaluateItem()` for conversion verdicts when `USE_SERVER_RECIPE_CONVERSION` is enabled.

## Pipeline

```
Recipe text
  → detectIngredientPhrasesInRecipe (DB bases + aliases, longest match)
  → evaluateIngredientIntelligence (per phrase)
  → formatConversionIssue (IngredientEvaluationV1 per issue)
  → applyRecipeReplacements
  → calculateRecipeConfidenceScore
  → POST /convert response
```

## Backend

| Module | Role |
|--------|------|
| `backend/src/modules/recipe-conversion/` | Detection, evaluation, replace, score |
| `backend/src/services/convertService.js` | Routes to intelligence or `halalConverter.js` |
| `backend/src/config/consolidationFlags.js` | `isServerRecipeConversionEnabled()` |

### Env flags

| Variable | Default | Effect |
|----------|---------|--------|
| (none) | — | Intelligence pipeline **on** |
| `USE_SERVER_RECIPE_CONVERSION=false` | — | Force legacy `halalConverter.js` |
| `USE_LEGACY_RECIPE_CONVERSION=true` | — | Same as above |

## Frontend

| Module | Role |
|--------|------|
| `frontend/src/lib/recipe/canonicalRecipeConversion.js` | `POST /convert` |
| `frontend/src/lib/recipe/recipeConversionModel.js` | API → UI issues |
| `frontend/src/lib/recipe/enrichConversionAffiliates.js` | Deferred affiliate links |
| `frontend/src/lib/featureFlags.js` | `USE_SERVER_RECIPE_CONVERSION` |

### Env flags

| Variable | Default | Effect |
|----------|---------|--------|
| (none) | — | Server conversion **on** |
| `VITE_USE_LEGACY_JSON_RECIPE_CONVERSION=true` | — | Fallback to client `convertRecipeWithJson` on server error |

## Request body

`POST /convert` accepts `recipe` or `recipeText` (string).

## Response (additive)

```json
{
  "originalText": "...",
  "convertedText": "...",
  "issues": [],
  "confidenceScore": 85,
  "contract_version": "1",
  "pipeline": "ingredient_intelligence_v1",
  "meta": { "phrases_scanned": 3, "issues_found": 1 }
}
```

Each issue includes `evaluation` (IngredientEvaluationV1) and legacy fields (`ingredient_id`, `replacement_id`, `ranked_substitutes`, …).

## Rollback

1. Backend: `USE_LEGACY_RECIPE_CONVERSION=true`
2. Frontend: `USE_SERVER_RECIPE_CONVERSION: false` in `featureFlags.js` or restore `USE_JSON_CONVERSION_PRIMARY: true`

## Tests

```bash
cd backend && npm test -- src/__tests__/phase3.recipe.conversion.test.js
```
