import { describe, it } from "node:test";
import assert from "node:assert";
import { calculateRecipeConfidenceScore } from "../recipeConfidence.js";

describe("recipeConfidence — canonical aggregate", () => {
  it("returns emptyScore when no issues", () => {
    assert.strictEqual(
      calculateRecipeConfidenceScore({ detectedIssues: [], replacements: [], unresolved: [] }),
      100
    );
    assert.strictEqual(
      calculateRecipeConfidenceScore(
        { originalIngredients: [], replacements: [], unresolved: [] },
        { emptyScore: null }
      ),
      null
    );
  });

  it("penalizes unresolved haram and blends ingredient scores", () => {
    const score = calculateRecipeConfidenceScore({
      detectedIssues: [
        { status: "haram", confidence_score: 40 },
        { status: "conditional", confidence_score: 60 },
      ],
      replacements: [{ status: "haram" }],
      unresolved: [{ status: "haram" }],
    });
    assert.ok(score < 100);
    assert.ok(score >= 0);
  });

  it("legacy full-replacement boost only when opted in", () => {
    const boosted = calculateRecipeConfidenceScore(
      {
        originalIngredients: [{ status: "haram" }],
        replacements: [{ status: "haram" }],
        unresolved: [],
      },
      { allowFullReplacementBoost: true }
    );
    assert.strictEqual(boosted, 100);

    const canonical = calculateRecipeConfidenceScore({
      detectedIssues: [{ status: "haram", confidence_score: 90 }],
      replacements: [{ status: "haram" }],
      unresolved: [],
    });
    assert.ok(canonical < 100);
  });
});
