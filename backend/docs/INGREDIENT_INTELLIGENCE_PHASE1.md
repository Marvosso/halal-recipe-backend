# Ingredient Intelligence Engine — Phase 1

## Endpoints

- `POST /api/lookup` — public deterministic lookup (no auth)
  - Body: `{ "query": "beef gelatin", "source": "typed", "locale": "en" }`
- `POST /convert/classify-ingredient` — uses `/api/lookup` path when no OCR/recipe context (auth required)

## Enable Postgres-backed rules

1. Apply migrations: `npm run migrate:intelligence` (requires `DATABASE_URL`)
2. Set `INGREDIENT_INTELLIGENCE_DB=1` in `.env`
3. Restart backend

Without step 2–3, the engine uses in-code rules (`INLINE_RULES`, `INLINE_ALIASES`, `BASE_KEYWORDS`).

## Module layout

```
src/modules/ingredient-intelligence/
  constants.js      — verdicts, taxonomy, inline rules
  normalize.js      — text normalization
  aliasResolver.js  — misspelling → canonical phrase
  baseResolver.js   — base slug + category
  modifierDetector.js — uses modifiers/ subsystem
  modifiers/
    taxonomy.js     — patterns + effects (halal_certified, plant_based, …)
    phraseParser.js — base phrase + modifier detection
    priority.js     — override + primary modifier order
    overrides.js    — deterministic verdict overrides
    confidence.js   — confidence adjustments per modifier
    index.js
  ruleEvaluator.js
  confidenceEngine.js
  engine.js
```

## Modifier examples

| Input | Modifiers | Verdict |
|-------|-----------|---------|
| pork gelatin | pork | haram |
| halal-certified bovine gelatin | halal_certified, bovine | halal |
| plant-based glycerin | plant_based | halal |
