# Monetization consolidation

## Unified architecture

```
Features (lookup, conversion, App, batch)
        │
        ▼
  lib/monetization/          ← public API (import only this)
    ├── config.js            flags (affiliate tips, AdSense)
    ├── recommendations.js   contextual recs (lookup + conversion)
    ├── affiliateGateway.js  fetch + normalize links
    └── issueAffiliateEnrichment.js  attach links to conversion issues
        │
        ▼
  lib/affiliateService.js    @internal — API + mock fallback
```

**Does this preserve the rebuild architecture?** **Yes.** Monetization is non-blocking, substitute-only, and does not affect halal verdicts or confidence.

## Public API (`lib/monetization`)

| Export | Use |
|--------|-----|
| `fetchAffiliateLinksBySubstitute` | Single gateway for link maps |
| `enrichIssuesWithAffiliateLinks` | Conversion issues (deferred in App) |
| `extractLookupRecommendations` | Quick Lookup contextual UI |
| `extractConversionRecommendations` | Conversion contextual UI |
| `collectSubstituteSlugsFromIssues` | Slug collection for fetch |
| `useDeferredAffiliateLinks` (hook) | Imports gateway via barrel |

## Duplicate systems removed

| Before | After |
|--------|-------|
| `convertRecipeJson` → `affiliateService` directly (blocking) | No affiliate fetch; deferred `enrichIssuesWithAffiliateLinks` |
| `recipe/enrichConversionAffiliates` duplicate logic | Re-exports monetization |
| `IngredientShopSection` generic shop UI | `ContextualSubstituteRecommendations` (trust-first) |
| Inline link normalization in convertRecipeJson | `normalizeAffiliateLink` in gateway |
| `extractConversionRecommendations` pre-filled `affiliateLinks` | Deferred load only |

## Deferred behavior (preserved)

1. **Server conversion:** `performCanonicalRecipeConversion` returns issues without links → `void enrichIssuesWithAffiliateLinks(...)` updates UI when ready.
2. **Quick Lookup:** `ContextualSubstituteRecommendations` + `useDeferredAffiliateLinks` (idle callback).
3. **Legacy JSON conversion:** Same deferred enrich from caller; convert no longer blocks on affiliates.

## Trust-first UX (preserved)

- Links only on **halal substitutes**, never on haram ingredient rows.
- Section copy: “Optional shopping links — verify labels yourself.”
- Affiliate tips off via `VITE_ENABLE_AFFILIATE_RECOMMENDATIONS=false`.
- AdSense remains opt-in (`VITE_ENABLE_CONTEXTUAL_ADS`).

## Migration checklist

- [x] Route gateway through `affiliateService` only internally
- [x] Consolidate issue enrichment in `issueAffiliateEnrichment.js`
- [x] Remove blocking affiliate fetch from `convertRecipeJson`
- [x] App uses `ContextualSubstituteRecommendations` for conversion
- [x] Batch convert awaits enrich (batch is async background)
- [ ] Migrate remaining `SubstitutePurchaseCard` inline usages in accordion to contextual recs (optional)

## Regression

```bash
cd frontend && npm run test:monetization && npm run build
```

Legacy tests (`convertRecipeMonetization.test.js`) may need gateway mocks — run separately if vitest is configured.

## Rollback

- Re-enable blocking links in `convertRecipeJson` only if needed (not recommended).
- Restore `IngredientShopSection` in `App.jsx` alongside contextual recs.
