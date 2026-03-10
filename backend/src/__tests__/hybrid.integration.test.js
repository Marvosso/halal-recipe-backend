/**
 * Integration: classification uses rule engine verdict; AI does not override.
 * Verifies classifyIngredient returns halal_status from rules and explanation is text-only.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { classifyIngredient } from "../services/halalClassificationService.js";
import { evaluateIngredient } from "../services/ingredientRuleEngine.js";

describe("Integration: deterministic verdict in classification", () => {
  it("classifyIngredient returns same halal_status as evaluateIngredient for rice", async () => {
    const [ruleResult, classification] = await Promise.all([
      evaluateIngredient("rice", {}),
      classifyIngredient("rice", {}),
    ]);
    assert.strictEqual(classification.halal_status, ruleResult.halal_status);
    assert.strictEqual(typeof classification.explanation, "string");
  });

  it("classifyIngredient returns same halal_status as evaluateIngredient for pork gelatin", async () => {
    const [ruleResult, classification] = await Promise.all([
      evaluateIngredient("pork gelatin", {}),
      classifyIngredient("pork gelatin", {}),
    ]);
    assert.strictEqual(classification.halal_status, ruleResult.halal_status);
    assert.strictEqual(classification.halal_status, "haram");
  });

  it("classification response has normalized_query, base_ingredient, substitutes", async () => {
    const r = await classifyIngredient("bacon", {});
    assert.ok(r.normalized_query !== undefined || r.ingredient !== undefined);
    assert.ok(r.base_ingredient !== undefined);
    assert.ok(r.substitutes !== undefined);
    assert.ok(r.substitutes.best !== undefined || Array.isArray(r.substitutes.alternatives));
  });
});
