/**
 * Phase 1 — canonical lookup pipeline regression tests.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { lookupIngredient, toLegacyClassifyShape } from "../services/lookupService.js";
import { evaluateIngredientIntelligence } from "../modules/ingredient-intelligence/engine.js";
import { isLegacyHybridClassifyEnabled } from "../config/consolidationFlags.js";

const CRITICAL = [
  { query: "rice", expectVerdict: "halal" },
  { query: "pork gelatin", expectVerdict: "haram" },
  { query: "gelatin", expectVerdict: "conditional" },
  { query: "bacon", expectVerdict: "haram" },
  { query: "soy sauce", expectVerdict: "conditional" },
  { query: "vanilla extract", expectHalal: ["conditional", "usually_haram", "haram"] },
];

describe("Phase 1 — POST /api/lookup authority (lookupService)", () => {
  it("legacy hybrid classify flag is off by default in test env", () => {
    assert.strictEqual(isLegacyHybridClassifyEnabled(), false);
  });

  for (const { query, expectVerdict, expectHalal } of CRITICAL) {
    it(`lookupIngredient("${query}") verdict stable`, async () => {
      const api = await lookupIngredient(query, { source: "typed", useAiExplanation: false });
      const engine = await evaluateIngredientIntelligence(query, { source: "typed" });

      assert.strictEqual(api.verdict, engine.verdict, "API must match engine verdict");
      assert.strictEqual(api.halal_status, engine.halal_status, "halal_status must match engine");

      if (expectVerdict) {
        assert.strictEqual(api.verdict, expectVerdict);
      }
      if (expectHalal) {
        assert.ok(
          expectHalal.includes(api.halal_status) || expectHalal.includes(api.verdict),
          `expected one of ${expectHalal.join(", ")}, got ${api.verdict}/${api.halal_status}`
        );
      }

      assert.ok(api.confidence_level, "confidence_level required");
      assert.equal(typeof api.confidence_score, "number");
      assert.ok(api.explanation, "explanation required");
    });
  }

  it("toLegacyClassifyShape preserves verdict from canonical API", async () => {
    const api = await lookupIngredient("marshmallows", { useAiExplanation: false });
    const legacy = toLegacyClassifyShape(api);
    assert.strictEqual(legacy.verdict, api.verdict);
    assert.strictEqual(legacy.halal_status, api.halal_status);
    assert.strictEqual(legacy.confidence_level, api.confidence_level);
  });

  it("OCR source uses intelligence engine (same as typed for simple token)", async () => {
    const typed = await lookupIngredient("gelatin", { source: "typed", useAiExplanation: false });
    const ocr = await lookupIngredient("gelatin", { source: "ocr", useAiExplanation: false });
    assert.strictEqual(ocr.verdict, typed.verdict);
    assert.strictEqual(ocr.halal_status, typed.halal_status);
  });

  it("AI explanation layer does not change verdict", async () => {
    const base = await lookupIngredient("cheese", { useAiExplanation: false });
    const withAi = await lookupIngredient("cheese", { useAiExplanation: true });
    assert.strictEqual(withAi.verdict, base.verdict);
    assert.strictEqual(withAi.halal_status, base.halal_status);
    assert.strictEqual(withAi.confidence_level, base.confidence_level);
  });
});
