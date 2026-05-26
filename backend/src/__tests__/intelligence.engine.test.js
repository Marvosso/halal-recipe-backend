/**
 * Phase 1: Deterministic Ingredient Intelligence Engine tests.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { evaluateIngredientIntelligence } from "../modules/ingredient-intelligence/engine.js";
import { normalizeIngredientText, stripQuantityPrefix } from "../modules/ingredient-intelligence/normalize.js";
import { resolveAliases } from "../modules/ingredient-intelligence/aliasResolver.js";
import { verdictToLegacyStatus } from "../modules/ingredient-intelligence/verdictMapper.js";
import { lookupIngredient } from "../services/lookupService.js";
import { VERDICTS, CONFIDENCE_LEVELS } from "../modules/ingredient-intelligence/constants.js";

describe("Ingredient Intelligence Engine", () => {
  it("exports full verdict hierarchy", () => {
    assert.ok(VERDICTS.includes("usually_halal"));
    assert.ok(VERDICTS.includes("usually_haram"));
    assert.ok(CONFIDENCE_LEVELS.includes("high"));
  });

  it("normalizeIngredientText lowercases and collapses spaces", () => {
    assert.strictEqual(normalizeIngredientText("  White   Wine  "), "white wine");
  });

  it("stripQuantityPrefix removes leading amounts", () => {
    assert.strictEqual(stripQuantityPrefix("2 tbsp soy sauce"), "soy sauce");
  });

  it("resolveAliases fixes soy sause misspelling", () => {
    const { resolved, aliasApplied } = resolveAliases("soy sause");
    assert.strictEqual(aliasApplied, true);
    assert.ok(resolved.includes("soy sauce"));
  });

  it("rice → halal + high confidence", async () => {
    const r = await evaluateIngredientIntelligence("rice");
    assert.strictEqual(r.verdict, "halal");
    assert.strictEqual(r.confidence_level, "high");
    assert.strictEqual(r.halal_status, "halal");
    assert.strictEqual(r.baseSlug, "rice");
  });

  it("pork gelatin → haram via hard override", async () => {
    const r = await evaluateIngredientIntelligence("pork gelatin");
    assert.strictEqual(r.verdict, "haram");
    assert.ok(r.modifier_slugs.includes("pork"));
    assert.strictEqual(verdictToLegacyStatus(r.verdict), "haram");
  });

  it("gelatin unspecified → conditional", async () => {
    const r = await evaluateIngredientIntelligence("gelatin");
    assert.strictEqual(r.verdict, "conditional");
    assert.strictEqual(r.halal_status, "conditional");
  });

  it("plant gelatin → halal", async () => {
    const r = await evaluateIngredientIntelligence("plant based gelatin");
    assert.strictEqual(r.verdict, "halal");
  });

  it("empty input → unknown + low", async () => {
    const r = await evaluateIngredientIntelligence("   ");
    assert.strictEqual(r.verdict, "unknown");
    assert.strictEqual(r.confidence_level, "low");
  });

  it("structured response includes meta and substitutes shape", async () => {
    const r = await evaluateIngredientIntelligence("gelatin");
    assert.ok(r.meta.engine_version);
    assert.ok(r.substitutes);
    assert.ok("best" in r.substitutes);
    assert.ok(Array.isArray(r.warnings));
    assert.strictEqual(r.explanation_source, "template");
  });

  it("same input is idempotent", async () => {
    const a = await evaluateIngredientIntelligence("soy sauce");
    const b = await evaluateIngredientIntelligence("soy sauce");
    assert.strictEqual(a.verdict, b.verdict);
    assert.strictEqual(a.confidence_level, b.confidence_level);
  });

  it("lookupService returns API contract fields", async () => {
    const api = await lookupIngredient("beef gelatin");
    assert.strictEqual(typeof api.query, "string");
    assert.ok(api.verdict);
    assert.ok(api.confidence_level);
    assert.ok(api.meta);
    assert.strictEqual(typeof api.explanation, "string");
    assert.ok(Array.isArray(api.modifiers));
  });
});
