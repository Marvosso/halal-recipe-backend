/**
 * Confidence consolidation regression tests.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { computeConfidence } from "../modules/ingredient-intelligence/confidenceEngine.js";
import { calculateRecipeConfidenceScore } from "../contracts/confidenceV1.js";
import { convertRecipeWithIntelligence } from "../modules/recipe-conversion/index.js";
import { lookupIngredient } from "../services/lookupService.js";
import { clampConfidenceScore } from "../contracts/confidenceV1.js";

describe("Confidence consolidation", () => {
  it("ingredient confidence originates from computeConfidence only", () => {
    const result = computeConfidence({
      baseConfidence: "high",
      matchQuality: "exact",
      modifiers: ["pork"],
      modifierDetails: [{ slug: "pork", effect: "override_haram" }],
      verdict: "haram",
    });
    assert.ok(["high", "medium", "low"].includes(result.confidence_level));
    assert.equal(typeof result.confidence_score, "number");
    assert.ok(result.confidence_score >= 0 && result.confidence_score <= 100);
  });

  it("lookup API confidence_score matches intelligence-derived envelope", async () => {
    const api = await lookupIngredient("gelatin", { useAiExplanation: false });
    assert.equal(typeof api.confidence_score, "number");
    assert.ok(api.confidence_level);
    assert.strictEqual(api.confidence_score, clampConfidenceScore(api.confidence_score));
  });

  it("recipe conversion returns bounded canonical score", async () => {
    const recipe = "2 slices bacon and 1 cup wine";
    const result = await convertRecipeWithIntelligence(recipe, {});
    assert.equal(typeof result.confidenceScore, "number");
    assert.ok(result.confidenceScore >= 0 && result.confidenceScore <= 100);
    assert.strictEqual(
      result.confidenceScore,
      clampConfidenceScore(result.confidenceScore)
    );
  });

  it("shared recipe scorer is deterministic for same input", () => {
    const input = {
      detectedIssues: [
        { status: "haram", confidence_score: 88 },
        { status: "conditional", confidence_score: 55 },
      ],
      replacements: [{ status: "haram" }],
      unresolved: [{ status: "conditional" }],
    };
    const a = calculateRecipeConfidenceScore(input);
    const b = calculateRecipeConfidenceScore(input);
    assert.strictEqual(a, b);
  });
});
