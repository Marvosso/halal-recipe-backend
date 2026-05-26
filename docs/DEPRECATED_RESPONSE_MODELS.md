# Deprecated response models (Phase 2)

## Replace with IngredientEvaluationV1

| Model / file | Was used for | Replacement |
|--------------|--------------|-------------|
| Ad-hoc `toApiResponse` fields only | Lookup API | `ingredientEvaluationV1ToApiEnvelope()` |
| `mapApiToLookupResult` inline normalization | Quick Lookup | `apiEnvelopeToUiModel()` |
| `mapClientToLookupResult` | Client fallback | **Deprecated** — server only |
| `quickLookupResponseFormatter` (full) | Brand generic fallback | `v1ToLegacyQuickLookupShape()` after bridge |
| Scan row ad-hoc `{ halal_status, verdict }` | Scan UI | `scanRowToIngredientEvaluationV1()` |
| Share payload without `contract_version` | URL `?d=` | Payloads include `contract_version: "1"` |

## Still valid (non-ingredient)

| Model | Scope |
|-------|--------|
| `RecipeConversionV1` (future) | Whole recipe convert — Phase 3 |
| `buildSharePayload` | Recipe share cards |
| Brand premium response | Not an ingredient evaluation |

## UI view model (not deprecated)

`ingredientEvaluationV1ToUiModel()` output (`statusLabel`, `statusClass`, etc.) remains the **presentation layer** — not sent to API.
