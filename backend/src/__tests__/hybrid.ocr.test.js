/**
 * Hybrid architecture: OCR cleanup and parse quality.
 * Verifies parseIngredientList, cleanToken, and pipeline do not set verdicts; parsing improves structure.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  parseIngredientList,
  cleanToken,
  runPhotoScanPipeline,
} from "../services/photoScanPipelineService.js";

describe("OCR cleanup", () => {
  it("parseIngredientList splits on comma, semicolon, newline", () => {
    const tokens = parseIngredientList("Sugar, Flour; Salt\nOil");
    assert.ok(Array.isArray(tokens));
    assert.ok(tokens.length >= 4);
    assert.ok(tokens.some((t) => t.toLowerCase().includes("sugar")));
    assert.ok(tokens.some((t) => t.toLowerCase().includes("flour")));
  });

  it("parseIngredientList splits on ' and '", () => {
    const tokens = parseIngredientList("milk and honey");
    assert.ok(tokens.length >= 2);
  });

  it("parseIngredientList trims and drops empty", () => {
    const tokens = parseIngredientList("  a  ,  b  ,  ");
    assert.ok(tokens.every((t) => t.length > 0));
  });

  it("cleanToken collapses spaces and optional dots", () => {
    assert.strictEqual(cleanToken("  sugar  .  syrup  "), "sugar syrup");
  });

  it("runPhotoScanPipeline returns summary and ingredients with halal_status from engine", async () => {
    const raw = "Sugar, Gelatin (Beef), Palm Oil";
    const result = await runPhotoScanPipeline(raw, { useAINormalization: false });
    assert.ok(result.summary !== undefined);
    assert.strictEqual(typeof result.summary.halal, "number");
    assert.strictEqual(typeof result.summary.conditional, "number");
    assert.strictEqual(typeof result.summary.haram, "number");
    assert.strictEqual(typeof result.summary.unknown, "number");
    assert.ok(Array.isArray(result.ingredients));
    for (const ing of result.ingredients) {
      assert.ok(
        ["halal", "conditional", "haram", "unknown"].includes(ing.halal_status),
        `each ingredient must have valid halal_status: ${ing.halal_status}`
      );
      assert.ok(typeof ing.confidence === "number");
    }
  });

  it("runPhotoScanPipeline with useAINormalization false still returns valid verdicts", async () => {
    const result = await runPhotoScanPipeline("rice, cheese", { useAINormalization: false });
    assert.ok(Array.isArray(result.ingredients));
    assert.ok(result.ingredients.length >= 2);
  });
});
