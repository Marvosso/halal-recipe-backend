# Regression hardening suite

## Purpose

Detect **deterministic drift**, **response shape drift**, and **confidence inconsistencies** without weakening rebuild architecture (server-authoritative verdicts, V1 contracts, deferred monetization).

**Does this preserve rebuild architecture?** **Yes.** Tests assert API ≡ engine, AI does not change verdicts, and affiliate links stay on substitutes only.

---

## 1. Test plan

| Layer | Suite | Coverage |
|-------|--------|----------|
| **Shared** | `shared/regression/contractValidators.test.js` | Envelope, V1, share, confidence, fingerprints |
| **Shared** | `shared/regression/criticalIngredients.js` | Fixture SSOT for 6 critical ingredients |
| **Backend** | `backend/src/__tests__/regression.hardening.test.js` | Lookup, modifiers, OCR, conversion, drift, AI stability |
| **Frontend** | `frontend/src/lib/regression/__tests__/regression.frontend.test.js` | SEO metadata, share payloads, affiliate shape |
| **Existing** | phase1–3, modifiers, OCR MVP, monetization | Run via full `npm test` |

### Critical ingredients (fixtures)

| Ingredient | Expected verdict (stable) |
|------------|---------------------------|
| gelatin | conditional |
| soy sauce | conditional |
| vanilla extract | conditional / usually_haram / haram |
| cheese | conditional |
| marshmallows (with gelatin) | conditional / usually_haram / haram |
| white wine | haram / usually_haram |

Control: **rice → halal**

---

## 2. Run commands

```bash
# Backend regression (lookup, OCR, conversion, modifiers)
cd backend && npm run test:regression

# Frontend regression (SEO, share, affiliate)
cd frontend && npm run test:regression

# Shared contract validators only
node --test shared/regression/__tests__/contractValidators.test.js

# Full backend CI (includes regression + legacy hybrid)
cd backend && npm test
```

---

## 3. Contract validation

| Contract | Validator | Asserts |
|----------|-----------|---------|
| POST /api/lookup envelope | `validateLookupApiEnvelope` | `contract_version`, verdict fields, confidence, substitutes |
| IngredientEvaluationV1 | `validateIngredientEvaluationV1` | strict V1 confidence object |
| Ingredient share URL | `validateShareIngredientPayload` | type, contract_version, verdict display fields |
| Recipe share | `validateShareRecipePayload` | type, title, arrays |
| Affiliate link (UI) | `validateAffiliateLinkShape` | platform_display, url type |

Import from: `shared/regression/contractValidators.js`

---

## 4. Drift detection strategy

### 4.1 Deterministic idempotency

`computeEvaluationFingerprint()` hashes verdict-affecting fields:

- `verdict`, `halal_status`, `base_slug`, sorted `modifiers`, `confidence_level`, `confidence_score`

**Test:** double `evaluateIngredientIntelligence(query)` → `diffEvaluationFingerprints` must be empty.

### 4.2 API vs engine alignment

Every critical ingredient: `lookupIngredient()` verdict **must equal** `evaluateIngredientIntelligence()`.

### 4.3 AI layer isolation

Lookup with `useAiExplanation: true` must not change verdict, halal_status, or confidence vs template-only.

### 4.4 When to update fixtures

| Change type | Action |
|-------------|--------|
| Intentional taxonomy/rule update | Update `criticalIngredients.js` + changelog |
| Accidental engine drift | Fix engine; **do not** loosen fixtures |
| New contract field | Extend validators + phase2 tests |
| AI explanation wording only | No fixture update |

### 4.5 CI recommendation

Add to PR checks:

```bash
cd backend && npm run test:regression
cd frontend && npm run test:regression
```

Fail PR if regression suite fails before merging rule-engine changes.

### 4.6 Future: snapshot file (optional)

Store committed fingerprints at `shared/regression/snapshots/critical.json` and compare in CI when intentional releases ship. Not enabled by default to avoid brittle AI explanation coupling.

---

## 5. Architecture integrity guards

Tests enforce:

- [ ] No lookup path where API verdict ≠ engine verdict
- [ ] Confidence level/score within sane bounds per fixture
- [ ] Conversion pipeline returns `contract_version: "1"`
- [ ] Share payloads include `contract_version: "1"`
- [ ] Affiliate recommendations defer links (`extractConversionRecommendations` has no embedded links)
- [ ] OCR rows include halal_status + confidence

---

## Related docs

- [ARCHITECTURE_HARDENING.md](./ARCHITECTURE_HARDENING.md)
- [CONFIDENCE_STRATEGY.md](./CONFIDENCE_STRATEGY.md)
- [PHASE1_MIGRATION.md](./PHASE1_MIGRATION.md)
- [MONETIZATION_CONSOLIDATION.md](./MONETIZATION_CONSOLIDATION.md)
