/**
 * OCR ingredient scan MVP — tokenization, normalization, deterministic evaluation.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  tokenizeIngredientList,
  fixOcrGlitches,
  normalizeOcrToken,
  runIngredientLabelScan,
} from "../modules/ocr-scan/index.js";

describe("OCR scan tokenization", () => {
  it("splits on comma, semicolon, newline, and 'and'", () => {
    const tokens = tokenizeIngredientList("Sugar, Flour; Salt\nOil and honey");
    assert.ok(tokens.length >= 5);
    assert.ok(tokens.some((t) => /sugar/i.test(t)));
    assert.ok(tokens.some((t) => /honey/i.test(t)));
  });

  it("skips label headers and dedupes", () => {
    const tokens = tokenizeIngredientList("Ingredients: water, water, Nutrition Facts");
    assert.deepStrictEqual(tokens, ["water"]);
  });

  it("strips leading numbers and parentheticals", () => {
    const tokens = tokenizeIngredientList("1. Gelatin (beef), 2) Rice");
    assert.ok(tokens.some((t) => /gelatin/i.test(t) && !/\(/.test(t)));
  });
});

describe("OCR scan normalization", () => {
  it("fixOcrGlitches corrects common OCR errors", () => {
    assert.ok(/flour/i.test(fixOcrGlitches("fl0ur")));
    assert.ok(/gelatin/i.test(fixOcrGlitches("gelat1n")));
  });

  it("normalizeOcrToken applies alias cleanup", () => {
    const meta = normalizeOcrToken("soy sause");
    assert.strictEqual(meta.alias_applied, true);
    assert.ok(meta.query.includes("soy sauce"));
  });
});

describe("OCR scan pipeline", () => {
  it("returns structured rows with verdict from intelligence engine", async () => {
    const result = await runIngredientLabelScan("rice, pork gelatin, gelatin");
    assert.strictEqual(result.pipeline_version, "1.0.0");
    assert.ok(result.summary.haram >= 1);
    assert.ok(result.ingredients.length >= 2);
    for (const row of result.ingredients) {
      assert.ok(row.raw);
      assert.ok(["halal", "usually_halal", "conditional", "usually_haram", "haram", "unknown"].includes(row.halal_status));
      assert.ok(typeof row.confidence === "number");
      assert.ok(Array.isArray(row.modifiers));
    }
  });

  it("pork gelatin row is haram with pork modifier", async () => {
    const result = await runIngredientLabelScan("pork gelatin");
    const row = result.ingredients.find((i) => /gelatin/i.test(i.raw));
    assert.ok(row);
    assert.strictEqual(row.halal_status, "haram");
    assert.ok(row.modifiers.includes("pork"));
  });
});
