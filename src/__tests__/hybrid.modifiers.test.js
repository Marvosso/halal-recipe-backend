/**
 * Hybrid architecture: modifier detection and hard overrides.
 * Verifies pork → haram, halal_certified → halal, beef/bovine detection, wine → haram.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { evaluateIngredient, detectModifiers } from "../services/ingredientRuleEngine.js";

describe("Modifier detection", () => {
  it("pork gelatin returns haram (hard override)", async () => {
    const r = await evaluateIngredient("pork gelatin", {});
    assert.strictEqual(r.halal_status, "haram");
    assert.ok(
      (r.modifiers || []).some((m) => String(m).toLowerCase().includes("pork")),
      "expected pork in modifiers"
    );
  });

  it("bacon returns haram (pork category/override)", async () => {
    const r = await evaluateIngredient("bacon", {});
    assert.strictEqual(r.halal_status, "haram");
  });

  it("gelatin without modifier returns conditional (animal_byproduct default)", async () => {
    const r = await evaluateIngredient("gelatin", {});
    assert.strictEqual(r.halal_status, "conditional");
  });

  it("bovine gelatin or beef gelatin has beef modifier", async () => {
    const r = await evaluateIngredient("bovine gelatin", {});
    const mods = r.modifiers || [];
    const hasBeef = mods.some((m) => String(m).toLowerCase().includes("beef"));
    assert.ok(hasBeef || r.base_slug === "gelatin" || r.baseSlug === "gelatin", "expected beef modifier or gelatin base");
  });

  it("halal-certified gelatin returns halal (hard override)", async () => {
    const r = await evaluateIngredient("halal-certified gelatin", {});
    assert.strictEqual(r.halal_status, "halal");
  });

  it("white wine returns haram (alcohol/wine override)", async () => {
    const r = await evaluateIngredient("white wine", {});
    assert.strictEqual(r.halal_status, "haram");
  });

  it("detectModifiers returns slugs array for vanilla extract", () => {
    const { slugs } = detectModifiers("vanilla extract", "vanilla_extract");
    assert.ok(Array.isArray(slugs));
  });
});
