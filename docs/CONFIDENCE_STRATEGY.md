# Confidence system — unified strategy

## Authority model (single source per layer)

| Layer | Authority | Module |
|-------|-----------|--------|
| **Ingredient** | ingredient-intelligence engine | `backend/.../confidenceEngine.js` → `computeConfidence()` |
| **Recipe aggregate** | Shared deterministic rules | `shared/contracts/recipeConfidence.js` |
| **API envelope** | IngredientEvaluationV1 | `shared/contracts/ingredientEvaluationV1.js` → `confidence: { level, score, value }` |
| **UI display** | Pass-through + clamp only | `shared/contracts/confidenceV1.js` → `clampConfidenceScore`, `displayConfidencePercent` |

**Rule:** UI and client engines must not apply strictness, madhab, inheritance, or preference multipliers to scores after the server returns them.

## What UI may do

- Clamp 0–100 for display (`clampConfidenceScore`)
- Format as percent string
- Map level → badge copy (High / Needs review / Likely haram) using **unchanged** score thresholds

## What UI must not do

- ±5 for strict/flexible mode (removed from `App.jsx`)
- Post-conversion HKM multipliers on recipe score (removed)
- Per-issue `Math.min(existing, engineResult.confidence)` overrides (removed from legacy enrichment)
- Re-derive score from level when canonical score is present (use `v1.confidence.score` directly)

## Conversion workflows

1. **Canonical (default):** `POST /convert` → intelligence pipeline → `calculateRecipeConfidenceScore()` in shared module
2. **Legacy backend:** `halalConverter.js` → same shared function with `{ emptyScore: null, allowFullReplacementBoost: true }`
3. **Legacy client JSON:** `convertRecipeJson.js` → shared function with `{ allowFullReplacementBoost: true }` only when explicitly enabled

## Ingredient lookup / scan

- Lookup: `POST /api/lookup` → `lookupService` → V1 confidence fields
- Scan: pipeline rows → `scanRowToIngredientEvaluationV1`
- Quick Lookup UI: `evaluationUiModel` reads V1 score without adjustment

## Deprecated (do not use for new code)

- `frontend/lib/halalEngine.js` → `calculateConfidenceScore()` (client ingredient scoring)
- `frontend/lib/confidenceScoringEngine.js` (parallel client engine)
- `frontend/lib/ingredientModifiers.js` confidence reductions (client-only)

## Feature flags

| Flag | Default | Purpose |
|------|---------|---------|
| `USE_UI_CONFIDENCE_ADJUSTMENTS` | `false` | Reserved; must stay false in production |
| `USE_SERVER_RECIPE_CONVERSION` | `true` | Recipe score from server pipeline |

## Does this preserve the rebuild architecture?

**Yes.** Verdicts and confidence originate from deterministic backend systems; UI is display-only; no silent client re-scoring on conversion.
