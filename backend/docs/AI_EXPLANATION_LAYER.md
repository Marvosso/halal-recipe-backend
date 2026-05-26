# AI Explanation Layer

Deterministic ingredient intelligence produces **verdict, confidence, and warnings**. The AI explanation layer only rewrites or augments **prose** — it never determines halal rulings.

## Architecture

```
evaluateIngredientIntelligence()  →  verdict (authoritative)
        ↓
enhanceEvaluationWithExplanation()  →  explanation + explanation_source
```

Module: `backend/src/modules/ai-enhancement/`

| Piece | Role |
|-------|------|
| `contracts/explanationContract.js` | Input/output schema, fatwa guardrails, cache keys |
| `prompts/explanationPrompts.js` | System/user prompts (JSON output) |
| `templates/explanationTemplates.js` | Template fallback (no LLM) |
| `cache/explanationCache.js` | Memory L1 + optional Postgres L2 |
| `providers/openaiProvider.js` | OpenAI chat (explanation only) |
| `explanationService.js` | Orchestration + verdict guardrail |

## Feature flags

- `AI_EXPLANATION_ENABLED=1` — force on/off (default: on when `OPENAI_API_KEY` is set)
- `AI_EXPLANATION_MODEL` — default `gpt-4o-mini`
- `INGREDIENT_INTELLIGENCE_DB=1` — enables Postgres cache table (`ai_explanation_cache`)

Run migration: `npm run migrate:ai-explanation`

## Integration

- `POST /api/lookup` — `lookupService` calls `enhanceEvaluationWithExplanation` when explanation AI is enabled
- `classifyIngredient` — same enhancement; response includes `explanation_source`
- Legacy facades: `aiExplanationService.js`, `aiRoutingService.getExplanationWithCache`

## Rules enforced in code

1. AI output may only contain `explanation`, `tone`, `uncertainty_acknowledged`
2. Forbidden keys (`verdict`, `halal_status`, etc.) are stripped or rejected
3. Fatwa-like phrases are rejected → template fallback
4. `enhanceEvaluationWithExplanation` asserts verdict/confidence unchanged after merge

## Testing

```bash
npm test
```

Focused: `src/__tests__/ai.explanation.layer.test.js`, `hybrid.explanation.test.js`
