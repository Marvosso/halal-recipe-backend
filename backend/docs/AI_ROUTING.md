# AI Routing Logic – Halal Kitchen

Cheapest reliable path first; escalate only when necessary. Most ingredient lookups stay **non-AI** or **low-cost AI**. Halal verdicts are **always** from the deterministic rule engine.

---

## Routing rules

| Use case | Path | AI usage |
|----------|------|----------|
| **Simple ingredient lookup** | Deterministic rules only | Optional: explanation (LLM or template); substitutes (deterministic scoring). |
| **Known ingredient page** | Deterministic + **cached** explanation | Prefer cache; on miss, LLM or template. |
| **Recipe conversion** | Rule engine + AI-assisted substitution ranking | Explanation optional; ranked substitutes (data-driven, no LLM). |
| **OCR ingredient cleanup** | Clean/normalize after OCR | AI cleanup only when `AI_OCR_CLEANUP_ENABLED` (or fallback). |
| **Ambiguous / failed OCR** | Fallback to stronger AI path | Explanation + substitutes + OCR cleanup when `AI_FALLBACK_ENABLED`. |

---

## Routing logic (high level)

```
INPUT: intent (+ optional context: ocrConfidence, recipeContext, fromCache)

1. Resolve route from intent:
   - simple_lookup     → useExplanationAI = flag, useSubstitutesAI = flag
   - known_page       → useExplanationAI = flag, useSubstitutesAI = flag (cache preferred)
   - recipe_conversion → useExplanationAI = flag, useSubstitutesAI = flag
   - ocr_cleanup      → useOCRCleanupAI = flag
   - ambiguous_fallback → all AI flags allowed; useFallbackAI = flag

2. For classification:
   - Run rule engine (always).
   - OCR cleanup: only if useOCRNormalization && route.useOCRCleanupAI (or ambiguous + low ocrConfidence).
   - Explanation: cache lookup (if known_page); else LLM if route.useExplanationAI else template.
   - Substitutes: run ranked substitutes only if route.useSubstitutesAI.

3. On LLM failure: use template explanation; if route.useFallbackAI, log fallback.
4. On OCR cleanup failure: keep raw text; if fallback enabled, log fallback.
```

---

## Pseudocode

### Route resolution

```
function resolveRoute(intent, context):
  flags = { useExplanationAI: false, useSubstitutesAI: false, useOCRCleanupAI: false, useFallbackAI: false }

  switch intent:
    case SIMPLE_LOOKUP, KNOWN_PAGE, RECIPE_CONVERSION:
      flags.useExplanationAI = isExplanationAIEnabled()
      flags.useSubstitutesAI = isSubstitutesAIEnabled()
    case OCR_CLEANUP:
      flags.useOCRCleanupAI = isOCRCleanupAIEnabled()
    case AMBIGUOUS_FALLBACK:
      flags.useExplanationAI = isExplanationAIEnabled()
      flags.useSubstitutesAI = isSubstitutesAIEnabled()
      flags.useOCRCleanupAI = isOCRCleanupAIEnabled()
      flags.useFallbackAI = isFallbackAIEnabled()

  return flags
```

### Classification with routing

```
function classifyIngredient(phrase, options):
  intent = options.intent ?? inferIntent(options)   // e.g. recipeContext present → recipe_conversion
  route = resolveRoute(intent, options)

  // OCR cleanup (optional, gated)
  if options.useOCRNormalization and (route.useOCRCleanupAI or (low ocrConfidence and route.useFallbackAI)):
    try:
      phrase = normalizeIngredientOCR(phrase) or phrase
    catch:
      if route.useFallbackAI: logFallbackAI("ocr_cleanup_failed", ...)

  ruleResult = evaluateIngredient(phrase)   // always deterministic

  // Explanation: cache first for known_page, else LLM or template
  if intent == KNOWN_PAGE and cache.has(key(ruleResult)):
    explanation = cache.get(key(ruleResult))
  else if route.useExplanationAI:
    try:
      explanation = generateExplanation(ruleResult, { useLLM: true })
      if intent == KNOWN_PAGE: cache.set(key(ruleResult), explanation)
    catch:
      explanation = templateFallbackExplanation(ruleResult)
      if route.useFallbackAI: logFallbackAI("explanation_llm_failed", ...)
  else:
    explanation = templateFallbackExplanation(ruleResult)

  substitutes = route.useSubstitutesAI ? rankSubstitutes(ruleResult, ...) : { best: null, alternatives: [] }

  return { ...ruleResult, explanation, substitutes }
```

### Scan pipeline (OCR path)

```
function runPhotoScanPipeline(rawText, options):
  ocrConfidence = options.ocrConfidence ?? 0.7
  intent = (ocrConfidence < 0.5) ? AMBIGUOUS_FALLBACK : OCR_CLEANUP
  useAI = shouldUseOCRCleanupAI(intent, { ocrConfidence }) or (ocrConfidence < 0.5 and isFallbackAIEnabled())

  for each token in parseIngredientList(rawText):
    normalized = useAI ? normalizeIngredientOCR(cleanToken(token)) : cleanToken(token)
    ruleResult = evaluateIngredient(normalized)   // always deterministic
    append to ingredients
  return { summary, ingredients, ocr_confidence }
```

---

## Caching plan

- **What is cached:** Explanation text only (output of LLM or template).
- **Key:** Fingerprint of rule result: `exp:${base_slug}:${halal_status}:${sorted_modifiers}:${notes_snippet}`. Same ingredient + status + modifiers → same key.
- **Where:** In-memory `Map`; max 500 entries; evict oldest when full (FIFO).
- **When:** 
  - **Write:** After generating explanation (LLM or template) when `useCache` is true (e.g. known_page or any path that calls `getExplanationWithCache` with cache enabled).
  - **Read:** In `getExplanationWithCache` before calling LLM; for intent `known_page` we set `useCache = true` so repeated requests for the same ingredient/status hit cache.
- **TTL:** Not implemented; entries stay until eviction. Optional future: add `at` timestamp and evict after e.g. 1 hour.
- **Scope:** Single process; no Redis. For multi-instance, add a shared cache (e.g. Redis) keyed the same way.

---

## Failure handling

| Failure | Behavior | Logging |
|--------|----------|--------|
| **Explanation LLM fails** (timeout, API error, no key) | Use template fallback from `templateFallbackExplanation(input)`. Verdict unchanged. | If `useFallbackAI`: `logFallbackAI("explanation_llm_failed", { intent, error })`. |
| **OCR cleanup fails** | Keep original token text; continue pipeline with `evaluateIngredient(raw)`. | If fallback enabled: `logFallbackAI("ocr_cleanup_failed", { intent, error })`. |
| **Substitute ranking** | No LLM in current impl; if DB/data fails, return `{ best: null, alternatives: [] }`. | No specific fallback log. |
| **Rule engine failure** | Propagate; no AI fallback for verdict. | Standard error handling. |

**Principle:** Never replace a deterministic verdict with AI. On any AI failure, fall back to template or raw text and optionally log when the fallback AI path was used.

---

## Feature flags (env)

| Env var | Default | Effect |
|---------|---------|--------|
| `AI_EXPLANATION_ENABLED` | `1` if `OPENAI_API_KEY` set else `0` | Use LLM for explanation when route allows. |
| `AI_SUBSTITUTES_ENABLED` | `1` | Use ranked substitutes (data-only in current impl). |
| `AI_OCR_CLEANUP_ENABLED` | `0` | Use AI to normalize OCR text per token. |
| `AI_FALLBACK_ENABLED` | `1` if `OPENAI_API_KEY` set else `0` | Allow fallback AI path for ambiguous/failed cases; log when used. |

**API:** `GET /convert/ai-flags` (authenticated) returns `{ explanation, substitutes, ocrCleanup, fallback }` (booleans).

---

## Files

| File | Role |
|------|------|
| `config/aiFeatureFlags.js` | Flags: explanation, substitutes, ocrCleanup, fallback. |
| `services/aiRoutingService.js` | `resolveRoute`, `getExplanationWithCache`, cache, `logFallbackAI`, `shouldUseOCRCleanupAI`, `shouldUseSubstitutesAI`. |
| `services/halalClassificationService.js` | Uses router for intent, explanation cache, OCR cleanup, substitutes. |
| `routes/convert.js` | Scan pipeline uses route for AI cleanup; `GET /convert/ai-flags`. |
