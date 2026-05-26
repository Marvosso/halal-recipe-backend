# Confidence consolidation — migration plan

## Phase A — Completed (this change)

### Identified mutations (removed or centralized)

| Location | Mutation | Action |
|----------|----------|--------|
| `App.jsx` `adjustConfidenceScore` | ±5 strict/flexible | **Removed** — display canonical score |
| `App.jsx` HKM block | Recipe score ×0.92–0.98 | **Removed** |
| `App.jsx` HKM block | Issue `confidence` min() | **Removed** |
| `evaluationUiModel` | Level fallback over score | **Fixed** — use `clampConfidenceScore(v1.confidence.score)` |
| `convertRecipeJson.js` | Local recipe score function | **Replaced** with `shared/contracts/recipeConfidence.js` |
| `halalConverter.js` | Duplicate recipe score function | **Replaced** with shared module |
| `recipe-conversion/confidenceScore.js` | Separate algorithm | **Replaced** with shared module |

### Still present (intentional)

| Location | Behavior | Why kept |
|----------|----------|----------|
| `backend/confidenceEngine.js` | Modifier-aware level | **Canonical ingredient authority** |
| `convertService.js` | `clampConfidenceScore` | Bounds only, no heuristic |
| `quickLookupResponseFormatter.js` | Legacy level mapping | Back-compat for old API shapes; does not change score |
| `halalEngine.js` / `confidenceScoringEngine.js` | Client scoring | Legacy paths only; not used when server flags on |

## Phase B — Recommended next

1. Move user strictness/madhab into **backend** `evaluateIngredientIntelligence` options (if product requires preference-aware confidence)
2. Delete or gate `confidenceScoringEngine.js` behind `USE_LEGACY_CLIENT_CONFIDENCE`
3. Add `RecipeConversionV1` contract field `confidence: ConfidenceV1` on `POST /convert`
4. Wire HalalStandardPanel copy to reflect server-side preference (when implemented)

## Rollback

- Re-enable UI adjustments: set `USE_UI_CONFIDENCE_ADJUSTMENTS: true` and restore `adjustConfidenceScore` (not recommended)
- Legacy recipe scoring only: `USE_LEGACY_RECIPE_CONVERSION=true` + shared module still applies

## Regression coverage

```bash
# Shared contract tests
node --test shared/contracts/__tests__/confidenceV1.test.js shared/contracts/__tests__/recipeConfidence.test.js

# Backend integration
cd backend && npm test -- src/__tests__/confidence.consolidation.test.js

# Frontend display mapping
cd frontend && npm run test:confidence
```

## Verification checklist

- [ ] Convert recipe with server path — score unchanged when toggling strict/flexible in UI
- [ ] Quick Lookup score matches `POST /api/lookup` `confidence_score`
- [ ] Share modal receives same score as conversion panel
- [ ] Legacy `halalConverter` still returns numeric score (0 when empty detection)

## Does this preserve the rebuild architecture?

**Yes.** Consolidation strengthens single authority; rollback flags remain env-driven without reintroducing client verdict engines.
