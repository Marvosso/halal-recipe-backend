/**
 * Phase 2 — API responses include contract_version and validate as V1.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { lookupIngredient } from "../services/lookupService.js";
import {
  apiEnvelopeToIngredientEvaluationV1,
  validateIngredientEvaluationV1,
  INGREDIENT_EVALUATION_CONTRACT_VERSION,
} from "../contracts/ingredientEvaluationV1.js";

describe("Phase 2 — response contract on /api/lookup shape", () => {
  it("lookupIngredient returns contract_version 1", async () => {
    const api = await lookupIngredient("vanilla extract", {
      useAiExplanation: false,
    });
    assert.strictEqual(api.contract_version, INGREDIENT_EVALUATION_CONTRACT_VERSION);
    assert.ok(api.ingredient);
    assert.ok(api.query);
    assert.ok(api.confidence_level);
    assert.equal(typeof api.confidence_score, "number");
  });

  it("api envelope validates as IngredientEvaluationV1", async () => {
    const api = await lookupIngredient("marshmallows", { useAiExplanation: false });
    const v1 = apiEnvelopeToIngredientEvaluationV1(api);
    const { valid, missing } = validateIngredientEvaluationV1(v1);
    assert.ok(valid, `missing fields: ${missing.join(", ")}`);
    assert.ok(Array.isArray(v1.modifiers));
    assert.ok(v1.substitutes);
    assert.ok(Array.isArray(v1.warnings));
    assert.ok(Array.isArray(v1.references));
  });

  it("canonical fields align between envelope and V1", async () => {
    const api = await lookupIngredient("bacon", { useAiExplanation: false });
    const v1 = apiEnvelopeToIngredientEvaluationV1(api);
    assert.strictEqual(v1.verdict, api.verdict);
    assert.strictEqual(v1.halal_status, api.halal_status);
    assert.strictEqual(v1.confidence.level, api.confidence_level);
    assert.strictEqual(v1.confidence.score, api.confidence_score);
    assert.strictEqual(v1.explanation, api.explanation);
  });
});
