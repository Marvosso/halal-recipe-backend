/**
 * Architecture hardening — guards, flags, unified pipelines.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  isLegacyHybridClassifyEnabled,
  isServerRecipeConversionEnabled,
  isDevRoutesEnabled,
} from "../config/consolidationFlags.js";
import {
  assertLookupResponse,
  assertScanResponse,
  assertConvertResponse,
  assertClassifyResponse,
} from "../middleware/contractGuard.js";
import { sanitizeSavedRecipePayload } from "../services/savedRecipeValidation.js";
import { lookupIngredient, lookupIngredientForRecipe, toLegacyClassifyShape } from "../services/lookupService.js";
import { runPhotoScanPipeline } from "../services/photoScanPipelineService.js";
import { runIngredientLabelScan } from "../modules/ocr-scan/index.js";
import { convertRecipeWithIntelligence } from "../modules/recipe-conversion/index.js";
import {
  validateScanApiEnvelope,
  validateConvertApiEnvelope,
  validateLegacyClassifyShape,
} from "../../../shared/regression/contractValidators.js";
import {
  CANONICAL_RECIPE_CONFIDENCE_OPTIONS,
  LEGACY_RECIPE_CONFIDENCE_OPTIONS,
} from "../../../shared/contracts/recipeConfidence.js";

describe("Architecture — consolidation flags (test env)", () => {
  it("server recipe conversion enabled by default", () => {
    assert.strictEqual(isServerRecipeConversionEnabled(), true);
  });

  it("legacy hybrid classify disabled by default", () => {
    assert.strictEqual(isLegacyHybridClassifyEnabled(), false);
  });

  it("dev routes enabled outside production", () => {
    if (process.env.NODE_ENV !== "production") {
      assert.strictEqual(isDevRoutesEnabled(), true);
    }
  });
});

describe("Architecture — contract guards accept canonical responses", () => {
  it("lookupIngredientForRecipe matches engine-only recipe evaluation", async () => {
    const query = "gelatin";
    const evalRecipe = await lookupIngredientForRecipe(query);
    const api = await lookupIngredient(query, {
      source: "recipe",
      useAiExplanation: false,
    });
    assert.strictEqual(api.verdict, evalRecipe.verdict);
    assert.strictEqual(api.pipeline, "lookup_v1");
  });

  it("lookup envelope passes guard", async () => {
    const api = await lookupIngredient("gelatin", { useAiExplanation: false });
    assert.strictEqual(api.pipeline, "lookup_v1");
    assert.doesNotThrow(() => assertLookupResponse(api));
  });

  it("classify shape passes guard", async () => {
    const api = await lookupIngredient("white wine", { useAiExplanation: false });
    const shape = toLegacyClassifyShape(api);
    assert.strictEqual(shape.contract_version, "1");
    assert.doesNotThrow(() => assertClassifyResponse(shape));
  });

  it("scan envelope passes guard", async () => {
    const scan = await runIngredientLabelScan("soy sauce, gelatin", {});
    assert.strictEqual(scan.contract_version, "1");
    assert.strictEqual(validateScanApiEnvelope(scan).length, 0);
    assert.doesNotThrow(() => assertScanResponse(scan));
  });

  it("photo scan pipeline matches intelligence engine", async () => {
    const text = "Contains white wine and soy sauce";
    const legacy = await runPhotoScanPipeline(text, {});
    assert.strictEqual(legacy.contract_version, "1");
    assert.strictEqual(legacy.pipeline, "ocr_scan_v1");
    assert.ok(legacy.ingredients.length >= 1);
    assert.strictEqual(validateScanApiEnvelope(legacy).length, 0);
  });

  it("convert response passes guard", async () => {
    const result = await convertRecipeWithIntelligence(
      "1 tbsp gelatin and soy sauce",
      {}
    );
    assert.strictEqual(result.contract_version, "1");
    assert.strictEqual(validateConvertApiEnvelope(result).length, 0);
    assert.doesNotThrow(() => assertConvertResponse(result));
  });
});

describe("Architecture — saved recipe trust boundary", () => {
  it("clamps confidence and caps issues", () => {
    const issues = Array.from({ length: 150 }, (_, i) => ({
      ingredient: `item-${i}`,
      confidence_score: 999,
    }));
    const sanitized = sanitizeSavedRecipePayload({
      title: "Test",
      originalRecipe: "a".repeat(60000),
      convertedRecipe: "b",
      confidenceScore: 500,
      issues,
    });
    assert.strictEqual(sanitized.confidenceScore, 100);
    assert.strictEqual(sanitized.issues.length, 100);
    assert.ok(sanitized.originalRecipe.length <= 50000);
    assert.strictEqual(sanitized.issues[0].confidence_score, 100);
  });
});

describe("Architecture — canonical confidence profiles", () => {
  it("canonical profile disables legacy boost", () => {
    assert.strictEqual(CANONICAL_RECIPE_CONFIDENCE_OPTIONS.allowFullReplacementBoost, false);
    assert.strictEqual(CANONICAL_RECIPE_CONFIDENCE_OPTIONS.emptyScore, 100);
  });

  it("legacy profile documented for rollback", () => {
    assert.strictEqual(LEGACY_RECIPE_CONFIDENCE_OPTIONS.allowFullReplacementBoost, true);
    assert.strictEqual(LEGACY_RECIPE_CONFIDENCE_OPTIONS.emptyScore, null);
  });
});

describe("Architecture — legacy classify shape validator", () => {
  it("rejects missing contract_version", () => {
    const errors = validateLegacyClassifyShape({ verdict: "halal", halal_status: "halal" });
    assert.ok(errors.some((e) => e.includes("contract_version")));
  });
});
