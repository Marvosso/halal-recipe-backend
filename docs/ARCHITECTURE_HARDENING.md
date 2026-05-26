# Architecture hardening

## Purpose

Enforce rebuild architecture at runtime — not only in tests. Single verdict authority, V1 contracts at API boundaries, legacy paths gated, trust boundaries on persistence.

**Does this preserve rebuild architecture?** **Yes.** These changes block production drift into parallel engines and client-side verdict mutation paths.

---

## Hardening layers

| Layer | Mechanism | Location |
|-------|-----------|----------|
| **Contract guards** | Validate responses before `res.json()` | `backend/src/middleware/contractGuard.js` |
| **Legacy flag gates** | Block rollback flags in production | `backend/src/config/consolidationFlags.js` |
| **Unified scan** | One engine for `/api/scan` and `/convert/scan-ingredients` | `photoScanPipelineService.js` → `runIngredientLabelScan` |
| **Classify canonical** | `lookupService` + `contract_version: "1"` | `routes/convert.js` `/classify-ingredient` |
| **Saved recipe boundary** | Clamp confidence, cap issues, truncate text | `savedRecipeValidation.js` |
| **Dev route gate** | `/api/dev/*` off in production unless `ENABLE_DEV_ROUTES=true` | `index.js` |
| **Pipeline observability** | `pipeline: "lookup_v1"` on lookup; `contract_version: "1"` on scan | `lookupService.js`, `scanService.js` |
| **Canonical confidence** | `CANONICAL_RECIPE_CONFIDENCE_OPTIONS` | `shared/contracts/recipeConfidence.js` |

---

## Contract guards

Set `CONTRACT_GUARD_STRICT=true` to **fail requests** on contract violations (default: log only).

| Endpoint | Guard | Validator |
|----------|-------|-----------|
| `POST /api/lookup` | `assertLookupResponse` | `validateLookupApiEnvelope` |
| `POST /api/scan` | `assertScanResponse` | `validateScanApiEnvelope` |
| `POST /convert` | `assertConvertResponse` | `validateConvertApiEnvelope` |
| `POST /convert/classify-ingredient` | `assertClassifyResponse` | `validateLegacyClassifyShape` |
| `POST /convert/scan-ingredients` | `assertScanResponse` | `validateScanApiEnvelope` |

---

## Production legacy policy

| Env flag | Production default | Override |
|----------|-------------------|----------|
| `LEGACY_HYBRID_CLASSIFY` | **Ignored** | `ALLOW_LEGACY_IN_PRODUCTION=true` |
| `USE_LEGACY_RECIPE_CONVERSION` | **Ignored** | `ALLOW_LEGACY_IN_PRODUCTION=true` |
| `USE_SERVER_RECIPE_CONVERSION=false` | **Ignored** | `ALLOW_LEGACY_IN_PRODUCTION=true` |
| Dev routes | **Disabled** | `ENABLE_DEV_ROUTES=true` |

All active legacy flags log `[FLAGS] … active`.

---

## Removed bypass paths

1. **Photo scan AI-normalization branch** — `runPhotoScanPipeline` no longer calls `ingredientRuleEngine` directly with raw 0–1 confidence. Always uses intelligence engine.
2. **Debug agent logging** — removed from `index.js` startup.

### Phase 2 (this pass)

3. **Single lookup orchestration** — `lookupIngredientEvaluation` / `lookupIngredientForRecipe`; recipe conversion and OCR scan use it (no direct engine calls in those paths).
4. **Client HKM isolated** — `evaluateItem` only when `VITE_OFFLINE_CONVERSION_FALLBACK=true` (non-prod); production uses server conversion only.
5. **`useRecipeConversion`** — conversion orchestration extracted from `App.jsx` (~350 lines).

---

## Run verification

```bash
cd backend && npm run test:architecture
cd backend && npm run test:regression
cd backend && npm test
```

---

## Related docs

- [REGRESSION_HARDENING.md](./REGRESSION_HARDENING.md)
- [CONFIDENCE_STRATEGY.md](./CONFIDENCE_STRATEGY.md)
- [PHASE1_MIGRATION.md](./PHASE1_MIGRATION.md)
