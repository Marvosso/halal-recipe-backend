# Phase 2 — Response Contract Consolidation

## Canonical schema

**Location:** `shared/contracts/ingredientEvaluationV1.js`  
**JSON Schema:** `shared/contracts/ingredientEvaluation.v1.schema.json`

### Required canonical fields

| Field | Type | Notes |
|-------|------|--------|
| `contract_version` | `"1"` | Always present on API + share payloads |
| `ingredient` | string | Normalized slug / resolved key |
| `query` | string | User-facing input |
| `base_ingredient` | object \| null | `{ slug, display_name, category? }` |
| `modifiers` | string[] | Modifier slugs |
| `halal_status` | enum | `halal` \| `conditional` \| `haram` \| `unknown` |
| `confidence` | object | `{ level, score, value? }` |
| `warnings` | array | `{ message, severity?, type? }` |
| `explanation` | string | Human-readable (AI/template) |
| `references` | array | Scholarly / source refs |
| `substitutes` | object | `{ best, alternatives[] }` |

Also carried for precision: `verdict` (`usually_halal`, `usually_haram`, etc.).

### API envelope (backward compatible)

`POST /api/lookup` still returns legacy flat fields **plus** `contract_version`:

- `normalized_query` ↔ `ingredient`
- `confidence_level` / `confidence_score` ↔ `confidence`
- `base_ingredient_detail` ↔ `base_ingredient`

Clients may read either shape; new code should use `apiEnvelopeToIngredientEvaluationV1()`.

## Migration strategy

| Step | Status | Action |
|------|--------|--------|
| 1 | Done | Shared V1 module + schema |
| 2 | Done | `lookupService.toApiResponse` emits V1 envelope |
| 3 | Done | Frontend `evaluationUiModel` — single UI mapper |
| 4 | Done | Share/scan formatters → `ingredientEvaluationFormatters.js` |
| 5 | Pending | Recipe conversion issues → V1 per ingredient (Phase 3) |
| 6 | Pending | Remove `quickLookupResponseFormatter` body duplication |

## Formatter consolidation plan

```
ingredient-intelligence engine
    → evaluationToIngredientEvaluationV1()
        → ingredientEvaluationV1ToApiEnvelope()  [API]
        → ingredientEvaluationV1ToUiModel()      [Quick Lookup UI]
        → v1ToShareIngredientData()              [Share cards]
        → scanRowToIngredientEvaluationV1()        [OCR rows]
        → v1ToLegacyQuickLookupShape()           [Brand fallback only]
```

### Import paths

- Backend: `backend/src/contracts/ingredientEvaluationV1.js` → shared
- Frontend: `@contracts/ingredientEvaluationV1.js` (Vite alias) or `frontend/src/contracts/`

## Deprecated response models

See `docs/DEPRECATED_RESPONSE_MODELS.md`.

## Regression tests

```bash
node --test shared/contracts/__tests__/ingredientEvaluationV1.test.js
cd backend && node --test src/__tests__/phase2.response.contract.test.js
cd frontend && npm run test:lookup
cd frontend && npm run build
```
