import { describe, it } from "node:test";
import assert from "node:assert";
import {
  validateLookupApiEnvelope,
  validateConfidenceConsistency,
  validateShareIngredientPayload,
  validateScanApiEnvelope,
  validateConvertApiEnvelope,
  computeEvaluationFingerprint,
  diffEvaluationFingerprints,
} from "../contractValidators.js";

describe("contractValidators", () => {
  it("validateLookupApiEnvelope accepts canonical shape", () => {
    const errors = validateLookupApiEnvelope({
      contract_version: "1",
      query: "gelatin",
      verdict: "conditional",
      halal_status: "conditional",
      confidence_level: "medium",
      confidence_score: 65,
      explanation: "Source matters.",
      warnings: [],
      substitutes: { best: null, alternatives: [] },
    });
    assert.strictEqual(errors.length, 0);
  });

  it("validateLookupApiEnvelope rejects missing contract_version", () => {
    const errors = validateLookupApiEnvelope({ query: "x", verdict: "unknown" });
    assert.ok(errors.some((e) => e.includes("contract_version")));
  });

  it("validateConfidenceConsistency flags level/score mismatch", () => {
    const errors = validateConfidenceConsistency("high", 30);
    assert.ok(errors.length > 0);
  });

  it("validateShareIngredientPayload requires contract fields", () => {
    const errors = validateShareIngredientPayload({
      type: "ingredient",
      contract_version: "1",
      ingredientName: "Gelatin",
      query: "gelatin",
      verdict: "conditional",
      statusLabel: "Conditional",
      statusClass: "conditional",
      confidenceScore: 65,
    });
    assert.strictEqual(errors.length, 0);
  });

  it("validateScanApiEnvelope accepts canonical scan", () => {
    const errors = validateScanApiEnvelope({
      contract_version: "1",
      summary: { halal: 0, conditional: 1, haram: 0, unknown: 0 },
      ingredients: [
        {
          raw: "gelatin",
          verdict: "conditional",
          halal_status: "conditional",
          confidence: 65,
        },
      ],
    });
    assert.strictEqual(errors.length, 0);
  });

  it("validateConvertApiEnvelope accepts intelligence result", () => {
    const errors = validateConvertApiEnvelope({
      contract_version: "1",
      pipeline: "ingredient_intelligence_v1",
      confidenceScore: 72,
      issues: [],
      convertedText: "halal version",
    });
    assert.strictEqual(errors.length, 0);
  });

  it("computeEvaluationFingerprint detects drift", () => {
    const a = computeEvaluationFingerprint({
      query: "gelatin",
      verdict: "conditional",
      halal_status: "conditional",
      confidence_level: "medium",
      confidence_score: 65,
      modifiers: ["unspecified"],
      baseSlug: "gelatin",
    });
    const b = { ...a, verdict: "haram" };
    const drift = diffEvaluationFingerprints(a, b);
    assert.ok(drift.some((d) => d.startsWith("drift.verdict")));
  });
});
