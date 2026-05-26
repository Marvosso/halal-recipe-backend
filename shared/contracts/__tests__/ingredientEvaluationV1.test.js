/**
 * IngredientEvaluationV1 contract tests (shared).
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  apiEnvelopeToIngredientEvaluationV1,
  evaluationToIngredientEvaluationV1,
  ingredientEvaluationV1ToApiEnvelope,
  validateIngredientEvaluationV1,
  scanRowToIngredientEvaluationV1,
  INGREDIENT_EVALUATION_CONTRACT_VERSION,
} from "../ingredientEvaluationV1.js";

describe("IngredientEvaluationV1 contract", () => {
  it("evaluationToIngredientEvaluationV1 includes required canonical fields", async () => {
    const { evaluateIngredientIntelligence } = await import(
      "../../../backend/src/modules/ingredient-intelligence/engine.js"
    );
    const evaluation = await evaluateIngredientIntelligence("gelatin");
    const v1 = evaluationToIngredientEvaluationV1(evaluation, { source: "typed" });

    const { valid, missing } = validateIngredientEvaluationV1(v1);
    assert.strictEqual(v1.contract_version, INGREDIENT_EVALUATION_CONTRACT_VERSION);
    assert.ok(valid, `missing: ${missing.join(", ")}`);
    assert.strictEqual(v1.verdict, evaluation.verdict);
    assert.strictEqual(v1.halal_status, evaluation.halal_status);
    assert.ok(v1.confidence.level);
    assert.equal(typeof v1.confidence.score, "number");
  });

  it("api envelope round-trip preserves verdict", async () => {
    const { evaluateIngredientIntelligence } = await import(
      "../../../backend/src/modules/ingredient-intelligence/engine.js"
    );
    const evaluation = await evaluateIngredientIntelligence("rice");
    const v1 = evaluationToIngredientEvaluationV1(evaluation);
    const envelope = ingredientEvaluationV1ToApiEnvelope(v1);
    assert.strictEqual(envelope.contract_version, "1");

    const parsed = apiEnvelopeToIngredientEvaluationV1(envelope);
    assert.strictEqual(parsed.verdict, v1.verdict);
    assert.strictEqual(parsed.halal_status, v1.halal_status);
    assert.strictEqual(parsed.confidence.level, v1.confidence.level);
    assert.strictEqual(parsed.confidence.score, v1.confidence.score);
  });

  it("scanRowToIngredientEvaluationV1 normalizes row", () => {
    const v1 = scanRowToIngredientEvaluationV1({
      raw: "Gelatin",
      query: "gelatin",
      verdict: "conditional",
      halal_status: "conditional",
      confidence_level: "medium",
      confidence_score: 65,
      modifiers: ["unspecified"],
      warnings: [],
      explanation: "Check source.",
    });
    assert.strictEqual(v1.contract_version, "1");
    assert.strictEqual(v1.halal_status, "conditional");
    assert.ok(v1.meta.ocr_uncertain === false || v1.meta.ocr_uncertain === true || v1.meta.ocr_uncertain === undefined);
  });
});
