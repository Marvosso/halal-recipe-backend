# Deprecated / restricted systems (Phase 1)

## Removed from Quick Lookup & scan (do not re-enable without Phase 3+ review)

| System | Path | Replacement |
|--------|------|-------------|
| Client lookup fallback | `useIngredientLookup` → `evaluateItem` | `performCanonicalLookup` + `lookupCache` |
| Client scan token eval | `useIngredientScan` → `evaluateItem` loop | `POST /api/scan` only |
| `mapClientToLookupResult` for production UI | `lookupResultModel.js` | `mapApiToLookupResult` from `/api/lookup` |

## Gated behind env (rollback only)

| System | Flag | Default |
|--------|------|---------|
| Legacy hybrid classify | `LEGACY_HYBRID_CLASSIFY` | `false` |
| `classifyIngredient` + `ingredientRuleEngine` for classify route | Same flag | off |

## Still active (Phase 3 scope)

| System | Path | Notes |
|--------|------|-------|
| Client recipe conversion | `convertRecipeJson.js`, `halalEngine.js` | Not authoritative for lookup |
| Backend `halalConverter` | `utils/halalConverter.js` | Used by `POST /convert` |
| `ingredientClassification.js` | Used inside `halalEngine` | Conversion-only until Phase 3 |
| `quickLookupResponseFormatter.js` | Brand/generic formatters | Phase 2 consolidation |
| `halalClassificationService.js` | Legacy hybrid service | Rollback path only |

## Authoritative (canonical)

| System | Entry |
|--------|--------|
| Ingredient intelligence engine | `backend/src/modules/ingredient-intelligence/engine.js` |
| Lookup orchestration | `backend/src/services/lookupService.js` |
| Public lookup API | `POST /api/lookup` |
| Scan pipeline | `backend/src/modules/ocr-scan/scanService.js` |
| Frontend lookup client | `frontend/src/lib/lookup/canonicalLookup.js` |
