/**
 * Hybrid architecture: explanation generation.
 * Verifies that explanation is text-only and never changes halal_status; template fallback works.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  buildExplanationInput,
  templateFallbackExplanation,
  generateExplanation,
} from "../services/aiExplanationService.js";

describe("Explanation generation", () => {
  it("buildExplanationInput does not mutate ruleResult", () => {
    const ruleResult = { halal_status: "conditional", ingredient_name: "gelatin", modifiers: [] };
    buildExplanationInput(ruleResult);
    assert.strictEqual(ruleResult.halal_status, "conditional");
  });

  it("templateFallbackExplanation returns non-empty string and reflects status", () => {
    const input = {
      ingredient_name: "Gelatin",
      halal_status: "conditional",
      modifiers: [],
      notes: "Source unknown.",
      references: [],
    };
    const text = templateFallbackExplanation(input);
    assert.strictEqual(typeof text, "string");
    assert.ok(text.length > 0);
    assert.ok(
      text.toLowerCase().includes("conditional") || text.toLowerCase().includes("depends"),
      "template should mention conditional/depends"
    );
  });

  it("template fallback for haram includes negative wording", () => {
    const input = {
      ingredient_name: "Pork gelatin",
      halal_status: "haram",
      modifiers: ["pork"],
      notes: "",
      references: [],
    };
    const text = templateFallbackExplanation(input);
    assert.ok(text.length > 0);
    assert.ok(
      text.toLowerCase().includes("not permissible") || text.toLowerCase().includes("haram") || text.toLowerCase().includes("prohibited"),
      "haram explanation should indicate not permissible"
    );
  });

  it("generateExplanation with useLLM false returns template and does not change status", async () => {
    const ruleResult = {
      halal_status: "halal",
      verdict: "halal",
      base_slug: "rice",
      normalizedInput: "rice",
      modifiers: [],
      notes: "",
    };
    const explanation = await generateExplanation(ruleResult, { useLLM: false });
    assert.strictEqual(typeof explanation, "string");
    assert.ok(explanation.length > 0);
    assert.strictEqual(ruleResult.halal_status, "halal");
  });
});
