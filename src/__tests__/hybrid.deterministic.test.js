/**
 * Hybrid architecture: deterministic lookup.
 * Verifies that evaluateIngredient returns stable verdicts and correct shape; no AI in verdict.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { evaluateIngredient, normalizeIngredientText, identifyBaseIngredient } from "../services/ingredientRuleEngine.js";

const VALID_STATUSES = new Set(["halal", "conditional", "haram", "unknown"]);

describe("Deterministic lookup", () => {
  it("returns result with required shape (halal_status, confidence, base_slug, modifiers)", async () => {
    const r = await evaluateIngredient("rice", {});
    assert.strictEqual(typeof r.halal_status, "string");
    assert.ok(VALID_STATUSES.has(r.halal_status), `unexpected halal_status: ${r.halal_status}`);
    assert.strictEqual(typeof r.confidence, "number");
    assert.ok(r.confidence >= 0 && r.confidence <= 1);
    assert.ok(Array.isArray(r.modifiers));
    assert.ok(r.normalizedInput !== undefined);
  });

  it("normalizeIngredientText collapses spaces and lowercases", () => {
    assert.strictEqual(normalizeIngredientText("  White   Wine  "), "white wine");
  });

  it("same input produces same verdict (idempotent)", async () => {
    const a = await evaluateIngredient("gelatin", {});
    const b = await evaluateIngredient("gelatin", {});
    assert.strictEqual(a.halal_status, b.halal_status);
    assert.strictEqual(a.confidence, b.confidence);
  });

  it("rice resolves to plain_plant and halal", async () => {
    const r = await evaluateIngredient("rice", {});
    assert.strictEqual(r.halal_status, "halal");
    assert.ok(r.base_slug === "rice" || r.baseSlug === "rice");
  });

  it("empty or whitespace input returns unknown", async () => {
    const r1 = await evaluateIngredient("", {});
    const r2 = await evaluateIngredient("   ", {});
    assert.strictEqual(r1.halal_status, "unknown");
    assert.strictEqual(r2.halal_status, "unknown");
  });
});
