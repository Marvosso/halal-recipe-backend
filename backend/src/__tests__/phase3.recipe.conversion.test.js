/**
 * Phase 3 — server recipe conversion via ingredient-intelligence.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  convertRecipeWithIntelligence,
  RECIPE_CONVERSION_PIPELINE,
} from "../modules/recipe-conversion/index.js";
import { isServerRecipeConversionEnabled } from "../config/consolidationFlags.js";
import convertService from "../services/convertService.js";

describe("Phase 3 — recipe conversion (intelligence pipeline)", () => {
  it("server recipe conversion flag is on by default in test env", () => {
    assert.strictEqual(isServerRecipeConversionEnabled(), true);
  });

  it("convertRecipeWithIntelligence returns contract fields", async () => {
    const recipe = "2 cups rice\n1 tbsp bacon\n1 tsp gelatin";
    const result = await convertRecipeWithIntelligence(recipe, {});

    assert.strictEqual(result.contract_version, "1");
    assert.strictEqual(result.pipeline, RECIPE_CONVERSION_PIPELINE);
    assert.ok(typeof result.convertedText === "string");
    assert.ok(Array.isArray(result.issues));
    assert.equal(typeof result.confidenceScore, "number");

    for (const issue of result.issues) {
      assert.ok(issue.ingredient_id || issue.ingredient, "issue must identify ingredient");
      assert.ok(issue.status || issue.verdict, "issue must have status");
      assert.ok(issue.evaluation?.contract_version === "1" || issue.evaluation_api);
    }
  });

  it("convertService uses intelligence pipeline by default", async () => {
    const result = await convertService("1 lb pork sausage and wine", {});
    assert.ok(result.convertedText);
    assert.ok(Array.isArray(result.issues));
    assert.strictEqual(result.pipeline, RECIPE_CONVERSION_PIPELINE);
  });

  it("detects and replaces bacon in recipe text when substitute exists", async () => {
    const recipe = "Fry 4 slices of bacon until crisp.";
    const result = await convertRecipeWithIntelligence(recipe, {});
    const baconIssue = result.issues.find(
      (i) =>
        (i.ingredient_id || "").includes("bacon") ||
        (i.matchedTerm || "").toLowerCase().includes("bacon")
    );
    if (baconIssue) {
      assert.ok(["haram", "usually_haram", "conditional"].includes(baconIssue.status));
    }
  });
});
