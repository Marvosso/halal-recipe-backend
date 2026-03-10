# Halal Kitchen — Hybrid Architecture Evaluation Test Plan

Evaluation tests verify that **deterministic rules control verdicts**, **AI only enhances text** (explanations/OCR cleanup), and **substitution ranking returns only halal-safe options**.

---

## Goals

| Goal | How we verify |
|------|----------------|
| Deterministic rules control verdicts | `evaluateIngredient` output is driven only by rule engine + DB; no AI input to `halal_status` or `confidence`. |
| AI explanations do not change halal status | Classification returns same `halal_status` with or without AI explanation; explanation is text-only. |
| OCR cleanup improves parse quality | `parseIngredientList` + `cleanToken` (and optional AI normalize) yield more/better tokens than raw OCR; no verdict change from OCR step. |
| Substitution ranking returns halal-safe options | Every item in `getRankedSubstitutes` has `halal_status` in { halal, usually_halal, conditional } or is in permitted-unknown allow-list. |

---

## Test Categories

### 1. Deterministic lookup

- **Scope:** `ingredientRuleEngine.evaluateIngredient`, `normalizeIngredientText`, `identifyBaseIngredient`, category defaults and hard overrides.
- **Assertions:**
  - Return shape includes `halal_status`, `confidence`, `base_slug`/`baseSlug`, `modifiers`, `alternatives`.
  - `halal_status` is one of: `halal`, `conditional`, `haram`, `unknown` (and legacy `usually_halal`→halal, `usually_haram`→haram).
  - Same input (after normalization) → same verdict and confidence (idempotent, no randomness).
- **Cases:** rice, gelatin, cheese, soy sauce, vanilla extract, white wine, bacon (see regression table below).

### 2. Modifier detection

- **Scope:** `detectModifiers`, `parseModifiers`, hard overrides (pork, halal_certified, plant, alcohol_free, wine).
- **Assertions:**
  - "pork gelatin" → modifiers include pork → verdict haram.
  - "bovine gelatin" / "beef gelatin" → beef modifier; DB or category default applied.
  - "halal-certified gelatin" → halal_certified override → verdict halal.
  - "gelatin" (no modifier) → conditional (animal_byproduct default) or per DB.
- **Cases:** pork gelatin, bovine gelatin, halal-certified gelatin, alcohol-free vanilla extract, white wine.

### 3. Explanation generation

- **Scope:** `buildExplanationInput`, `templateFallbackExplanation`, `generateExplanation` (with useLLM false for deterministic test).
- **Assertions:**
  - Explanation is string only; it never overwrites or replaces `halal_status` or `confidence`.
  - For a fixed rule result, template fallback produces non-empty string and status in text matches input status.
  - `buildExplanationInput(ruleResult)` does not mutate `ruleResult` or change verdict.
- **Cases:** Call with rule results for gelatin (conditional), pork gelatin (haram), rice (halal); assert explanation contains expected status wording.

### 4. Substitution ranking

- **Scope:** `getRankedSubstitutes`, `computeSubstituteScore`, `isSubstitutePermitted`, filter by allowed statuses.
- **Assertions:**
  - For haram/conditional ingredients (bacon, white wine, gelatin, mirin), returned list has 0–5 items; each item has `name`, `score`, `reason`, `notes`.
  - Every returned substitute is permitted: either `evaluateIngredient(substitute)` returns halal/usually_halal/conditional, or slug is in permitted-unknown set.
  - No haram-only slug (e.g. pork) appears in the list.
- **Cases:** bacon, white wine, gelatin, mirin; optionally rice (expect empty or minimal substitutes).

### 5. OCR cleanup

- **Scope:** `parseIngredientList`, `cleanToken`, `normalizeToken` (with optional AI), `runPhotoScanPipeline`.
- **Assertions:**
  - `parseIngredientList("a, b\nc; d and e")` returns token list without empty strings; comma/semicolon/newline/“ and ” split correctly.
  - `cleanToken("  sugar  .  syrup  ")` collapses spaces and optional dots.
  - Pipeline with messy input (e.g. "Sugar, Gelatin (Beef), Palm Oil") returns ingredients array; each item has `halal_status` from rule engine only; no verdict from OCR step.
  - When `useAINormalization` is false, result is still valid and verdicts unchanged.
- **Cases:** Comma-separated list; newline-separated; mixed; “ and ”; extra spaces; OCR-like typos (optional AI normalization).

### 6. Regression tests for common ingredients

| Ingredient | Expected base | Expected modifier(s) | Expected halal_status |
|------------|---------------|----------------------|------------------------|
| rice | rice | — | halal |
| gelatin | gelatin | unspecified | conditional (or per DB) |
| bovine gelatin | gelatin | beef | conditional or per DB |
| halal-certified gelatin | gelatin | halal_certified | halal |
| pork gelatin | gelatin | pork | haram |
| cheese | cheese | — | conditional (or per DB) |
| soy sauce | soy_sauce | — | conditional (or per DB) |
| vanilla extract | vanilla_extract | — | conditional (or per DB) |
| white wine | alcohol / wine | wine | haram |
| bacon | bacon | pork (implicit) | haram |

- **Assertions:** For each row, `evaluateIngredient(ingredient)` returns `halal_status` matching expected (and base_slug/modifiers when applicable). Optional: assert confidence level (e.g. haram/halal high, conditional medium).

---

## Unit vs integration

- **Unit:** Mock DB where needed (e.g. `getRule`, `getBaseSlugs`); no network; no OpenAI. Focus: rule engine logic, modifier detection, template explanation, parse/clean, score formula, filter logic.
- **Integration:** Real DB (if available) and real classification/scan flow; optional real OpenAI for explanation (separate suite or env-gated). Focus: end-to-end classify, scan, ranking with real data.

---

## Example test file layout

```
backend/
  docs/
    TEST_PLAN_HYBRID_ARCHITECTURE.md
  src/
    __tests__/
      hybrid.deterministic.test.js   # 1. Deterministic lookup
      hybrid.modifiers.test.js       # 2. Modifier detection
      hybrid.explanation.test.js    # 3. Explanation (template, no LLM)
      hybrid.substitution.test.js   # 4. Substitution ranking
      hybrid.ocr.test.js            # 5. OCR cleanup / parse
      hybrid.regression.test.js     # 6. Common ingredients
```

---

## Running tests

- Backend: `npm test` (Node `--test` runner).
- Require DB for integration: set `DATABASE_URL`; unit tests can skip or mock DB.

---

## Pass criteria

- All unit tests pass with no DB and no API keys.
- Deterministic tests: same input → same output across runs.
- Substitution tests: no haram slug in returned list.
- Regression tests: each common ingredient returns the expected status from the table above (or documented exception).
