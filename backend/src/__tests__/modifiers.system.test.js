/**
 * Modifier detection system — phrase parsing, priority, overrides, confidence.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  parseIngredientPhrase,
  applyModifierOverrides,
  selectPrimaryModifier,
  adjustConfidenceForModifiers,
  MODIFIER_TAXONOMY,
} from "../modules/ingredient-intelligence/modifiers/index.js";
import { evaluateIngredientIntelligence } from "../modules/ingredient-intelligence/engine.js";

describe("Modifier phrase parsing", () => {
  it("parses pork gelatin into pork modifier + gelatin base phrase", () => {
    const p = parseIngredientPhrase("pork gelatin");
    assert.ok(p.modifierSlugs.includes("pork"));
    assert.ok(p.basePhrase.includes("gelatin"));
  });

  it("parses halal-certified bovine gelatin with both modifiers", () => {
    const p = parseIngredientPhrase("halal-certified bovine gelatin");
    assert.ok(p.modifierSlugs.includes("halal_certified"));
    assert.ok(p.modifierSlugs.includes("bovine"));
    assert.ok(p.basePhrase.includes("gelatin"));
  });

  it("parses plant-based glycerin", () => {
    const p = parseIngredientPhrase("plant-based glycerin");
    assert.ok(
      p.modifierSlugs.includes("plant") || p.modifierSlugs.includes("plant_based")
    );
    assert.ok(p.basePhrase.includes("glycerin"));
  });

  it("detects wine before generic alcohol in white wine", () => {
    const p = parseIngredientPhrase("white wine");
    assert.ok(p.modifierSlugs.includes("wine"));
    assert.ok(!p.modifierSlugs.includes("alcohol") || p.modifierSlugs.includes("wine"));
  });

  it("detects enzyme and rennet on cheese phrase", () => {
    const enzyme = parseIngredientPhrase("microbial enzyme cheese");
    assert.ok(enzyme.modifierSlugs.includes("enzyme"));

    const rennet = parseIngredientPhrase("cheese with rennet");
    assert.ok(rennet.modifierSlugs.includes("rennet"));
  });

  it("required modifier slugs exist in taxonomy", () => {
    const required = [
      "halal_certified",
      "plant_based",
      "bovine",
      "pork",
      "wine",
      "alcohol",
      "enzyme",
      "rennet",
    ];
    for (const slug of required) {
      assert.ok(MODIFIER_TAXONOMY[slug], `missing taxonomy for ${slug}`);
    }
  });
});

describe("Modifier override priority", () => {
  it("pork beats halal_certified when both present (pork wins as haram)", () => {
    const o = applyModifierOverrides(["halal_certified", "pork"], "animal_byproduct");
    assert.strictEqual(o.verdict, "haram");
    assert.strictEqual(o.appliedOverrideId, "pork");
  });

  it("halal_certified overrides bovine conditional default", () => {
    const o = applyModifierOverrides(["halal_certified", "bovine"], "animal_byproduct");
    assert.strictEqual(o.verdict, "halal");
    assert.strictEqual(o.appliedOverrideId, "halal_certified");
  });

  it("plant_based overrides animal_byproduct for glycerin category", () => {
    const o = applyModifierOverrides(["plant", "plant_based"], "animal_byproduct");
    assert.strictEqual(o.verdict, "halal");
    assert.strictEqual(o.appliedOverrideId, "plant_based");
  });

  it("selectPrimaryModifier picks pork over bovine", () => {
    assert.strictEqual(selectPrimaryModifier(["bovine", "pork"]), "pork");
  });

  it("selectPrimaryModifier picks halal_certified over bovine", () => {
    assert.strictEqual(
      selectPrimaryModifier(["bovine", "halal_certified"]),
      "halal_certified"
    );
  });
});

describe("Modifier confidence adjustments", () => {
  it("bovine on conditional lowers high to medium", () => {
    const { confidence_level, adjustments } = adjustConfidenceForModifiers({
      baseConfidence: "high",
      modifierSlugs: ["bovine"],
      verdict: "conditional",
    });
    assert.strictEqual(confidence_level, "medium");
    assert.ok(adjustments.includes("bovine_source_requires_verification"));
  });

  it("rennet weakens conditional confidence", () => {
    const { confidence_level, adjustments } = adjustConfidenceForModifiers({
      baseConfidence: "medium",
      modifierSlugs: ["rennet"],
      modifierDetails: [{ slug: "rennet", effect: "weaken", match_type: "exact" }],
      verdict: "conditional",
    });
    assert.strictEqual(confidence_level, "low");
    assert.ok(adjustments.includes("rennet_weaken"));
  });

  it("halal_certified on halal verdict stays high", () => {
    const { confidence_level } = adjustConfidenceForModifiers({
      baseConfidence: "medium",
      modifierSlugs: ["halal_certified"],
      verdict: "halal",
    });
    assert.strictEqual(confidence_level, "high");
  });
});

describe("End-to-end modifier examples", () => {
  it("pork gelatin → haram", async () => {
    const r = await evaluateIngredientIntelligence("pork gelatin");
    assert.strictEqual(r.verdict, "haram");
    assert.ok(r.modifier_slugs.includes("pork"));
  });

  it("halal-certified bovine gelatin → halal", async () => {
    const r = await evaluateIngredientIntelligence("halal-certified bovine gelatin");
    assert.strictEqual(r.verdict, "halal");
    assert.ok(r.modifier_slugs.includes("halal_certified"));
    assert.ok(r.modifier_slugs.includes("bovine"));
  });

  it("plant-based glycerin → halal", async () => {
    const r = await evaluateIngredientIntelligence("plant-based glycerin");
    assert.strictEqual(r.verdict, "halal");
    assert.ok(
      r.modifier_slugs.includes("plant") || r.modifier_slugs.includes("plant_based")
    );
    assert.strictEqual(r.baseSlug, "glycerin");
  });
});
