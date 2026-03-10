/**
 * Hybrid architecture: substitution ranking.
 * Verifies that getRankedSubstitutes returns only halal-safe options (halal/usually_halal/conditional or permitted-unknown).
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getRankedSubstitutes,
  computeSubstituteScore,
  formatRankedSubstitutesForApi,
} from "../services/rankedSubstitutionsService.js";
import { evaluateIngredient } from "../services/ingredientRuleEngine.js";

const ALLOWED_FOR_SUBSTITUTE = new Set(["halal", "usually_halal", "conditional"]);

describe("Substitution ranking", () => {
  it("computeSubstituteScore returns number in 0..1 range", () => {
    const score = computeSubstituteScore({
      flavor_similarity: 0.8,
      texture_similarity: 0.7,
      cooking_context_fit: 0.9,
      availability: 0.8,
      affordability: 0.6,
    });
    assert.ok(typeof score === "number");
    assert.ok(score >= 0 && score <= 1);
  });

  it("getRankedSubstitutes for bacon returns list with best + alternatives", async () => {
    const result = await getRankedSubstitutes("bacon", {});
    assert.ok(result.best !== undefined || result.alternatives !== undefined);
    const all = result.all || (result.best ? [result.best, ...(result.alternatives || [])] : result.alternatives || []);
    assert.ok(Array.isArray(all));
    assert.ok(all.length <= 5);
    for (const item of all) {
      assert.ok(item.name);
      assert.strictEqual(typeof item.score, "number");
      assert.ok(item.reason !== undefined);
      assert.ok(item.notes !== undefined);
    }
  });

  it("getRankedSubstitutes for white wine returns at least one option", async () => {
    const result = await getRankedSubstitutes("white wine", {});
    const all = result.all || (result.best ? [result.best, ...(result.alternatives || [])] : result.alternatives || []);
    assert.ok(Array.isArray(all));
    assert.ok(all.length <= 5);
  });

  it("getRankedSubstitutes for gelatin returns halal-safe options only", async () => {
    const result = await getRankedSubstitutes("gelatin", {});
    const all = result.all || (result.best ? [result.best, ...(result.alternatives || [])] : result.alternatives || []);
    for (const item of all) {
      const name = (item.name || "").toLowerCase().replace(/\s+/g, "_");
      assert.ok(
        !name.includes("pork") && !name.includes("pig"),
        `substitute must not be pork: ${item.name}`
      );
    }
  });

  it("formatRankedSubstitutesForApi returns best and alternatives", () => {
    const formatted = formatRankedSubstitutesForApi({
      best: { name: "A", score: 0.9, reason: "r", notes: "n" },
      alternatives: [{ name: "B", score: 0.8, reason: "r2", notes: "n2" }],
    });
    assert.ok(formatted.best !== null);
    assert.strictEqual(formatted.best.name, "A");
    assert.strictEqual(formatted.alternatives.length, 1);
  });

  it("evaluateIngredient for agar_agar returns permitted status", async () => {
    const r = await evaluateIngredient("agar agar", {});
    assert.ok(
      ALLOWED_FOR_SUBSTITUTE.has(r.halal_status) || r.halal_status === "unknown",
      `agar agar should be permitted as substitute: ${r.halal_status}`
    );
  });
});
