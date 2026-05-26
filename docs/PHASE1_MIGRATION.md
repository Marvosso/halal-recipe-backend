# Phase 1 — Canonical Ingredient Evaluation Pipeline

## Objective

Establish `POST /api/lookup` as the **only authoritative** path for user-facing single-ingredient evaluation in Quick Lookup and SEO embeds. Eliminate silent client-engine fallback that produced conflicting verdicts.

## Lookup path inventory

| Path | Before Phase 1 | After Phase 1 |
|------|----------------|---------------|
| Quick Lookup UI | `/api/lookup` → on failure `halalEngine.evaluateItem` | `/api/lookup` only; session cache on failure |
| SEO embedded Quick Lookup | Same hook | Same |
| `POST /api/lookup` | `lookupService` → `ingredient-intelligence` | Unchanged (canonical) |
| `POST /convert/classify-ingredient` | Split: simple → lookup; OCR/context → legacy hybrid | **Always lookup** unless `LEGACY_HYBRID_CLASSIFY=true` |
| `POST /api/scan` | `scanService` → per-token intelligence | Unchanged (canonical) |
| Scan UI (client OCR) | Server scan; fallback `evaluateItem` per token | Server scan only; error if unavailable |
| Recipe conversion (`convertRecipeJson`) | Client `evaluateItem` per ingredient | **Out of scope** — Phase 3 |
| `App.jsx` inline ingredient check | Client `evaluateItem` | **Out of scope** — Phase 3 |
| `brandLookup.js` | Client `evaluateItem` | **Out of scope** — Phase 2 |
| `CreatePostModal.jsx` | Client `evaluateItem` | **Out of scope** — Phase 3 |

## Implementation summary

### Frontend

- `lib/lookup/canonicalLookup.js` — single entry for Quick Lookup
- `lib/lookup/lookupCache.js` — sessionStorage of last **server** responses (7-day TTL)
- `hooks/useIngredientLookup.js` — uses canonical lookup only
- `hooks/useIngredientScan.js` — no client token evaluation fallback
- `mapClientToLookupResult` — marked `@deprecated`

### Backend

- `config/consolidationFlags.js` — `LEGACY_HYBRID_CLASSIFY` rollback (default off)
- `routes/convert.js` — `classify-ingredient` routes OCR/recipe/SEO intents through `lookupIngredient`

## Offline-safe behavior

1. **Success:** Cache raw API response in `sessionStorage`.
2. **Network/server error:** If cache exists for query → show cached verdict + `cached_result` banner (same card UI).
3. **No cache:** Show `lookup_failed` error; **no verdict card** (no client engine).

This preserves graceful degradation without alternate rulings.

## Rollback

| Flag | Location | Effect |
|------|----------|--------|
| `LEGACY_HYBRID_CLASSIFY=true` | Backend env | Restores hybrid `classifyIngredient` for OCR/recipe-context classify requests |
| `USE_SERVER_LOOKUP=false` | `frontend/src/lib/featureFlags.js` | Quick Lookup shows server required error (dev only) |
| `USE_SERVER_SCAN=false` | featureFlags | Scan shows server required error |

## Verification

```bash
cd backend && npm test
node --test frontend/src/lib/lookup/__tests__/lookupCache.test.js
```

Critical ingredients (manual or CI): gelatin, soy sauce, vanilla extract, bacon, pork gelatin, rice.

## Next phase

Phase 2: `IngredientEvaluationV1` contract + deprecate `quickLookupResponseFormatter` / dual mappers.
