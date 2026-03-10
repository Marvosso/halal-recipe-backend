/**
 * Regression tests: common ingredients.
 * Verifies expected base, modifier, and halal_status for rice, gelatin variants, cheese, soy sauce, vanilla, wine, bacon.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { evaluateIngredient } from "../services/ingredientRuleEngine.js";

const CASES = [
  { ingredient: "rice", expectedStatus: "halal", description: "rice" },
  { ingredient: "gelatin", expectedStatus: "conditional", description: "gelatin" },
  { ingredient: "bovine gelatin", expectedStatus: "conditional", description: "bovine gelatin" },
  { ingredient: "halal-certified gelatin", expectedStatus: "halal", description: "halal-certified gelatin" },
  { ingredient: "pork gelatin", expectedStatus: "haram", description: "pork gelatin" },
  { ingredient: "cheese", expectedStatus: "conditional", description: "cheese" },
  { ingredient: "soy sauce", expectedStatus: "conditional", description: "soy sauce" },
  { ingredient: "vanilla extract", expectedStatus: "conditional", description: "vanilla extract" },
  { ingredient: "white wine", expectedStatus: "haram", description: "white wine" },
  { ingredient: "bacon", expectedStatus: "haram", description: "bacon" },
];

describe("Regression: common ingredients", () => {
  for (const { ingredient, expectedStatus, description } of CASES) {
    it(`${description} → ${expectedStatus}`, async () => {
      const r = await evaluateIngredient(ingredient, {});
      assert.strictEqual(
        r.halal_status,
        expectedStatus,
        `expected ${ingredient} to be ${expectedStatus}, got ${r.halal_status}`
      );
    });
  }

  it("rice has base_slug rice", async () => {
    const r = await evaluateIngredient("rice", {});
    assert.ok(r.base_slug === "rice" || r.baseSlug === "rice");
  });

  it("gelatin has base_slug gelatin", async () => {
    const r = await evaluateIngredient("gelatin", {});
    assert.ok(r.base_slug === "gelatin" || r.baseSlug === "gelatin");
  });

  it("pork gelatin has pork in modifiers", async () => {
    const r = await evaluateIngredient("pork gelatin", {});
    const mods = (r.modifiers || []).map((m) => String(m).toLowerCase());
    assert.ok(mods.some((m) => m.includes("pork")), `expected pork in modifiers: ${mods.join(", ")}`);
  });

  it("white wine has haram and high confidence", async () => {
    const r = await evaluateIngredient("white wine", {});
    assert.strictEqual(r.halal_status, "haram");
    assert.ok(r.confidence >= 0.5);
  });
});
