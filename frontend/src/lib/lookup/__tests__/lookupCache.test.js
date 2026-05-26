/**
 * Phase 1 — lookup cache (offline replay of server verdicts only).
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  cacheLookupResponse,
  getCachedLookupResponse,
  clearLookupCache,
} from "../lookupCache.js";

const mockStore = {};

beforeEach(() => {
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  clearLookupCache();
  global.sessionStorage = {
    getItem: (k) => mockStore[k] ?? null,
    setItem: (k, v) => {
      mockStore[k] = v;
    },
    removeItem: (k) => {
      delete mockStore[k];
    },
  };
});

describe("lookupCache", () => {
  it("stores and retrieves by normalized query key", () => {
    const api = { verdict: "haram", halal_status: "haram", query: "bacon" };
    cacheLookupResponse("  Bacon  ", api);
    const hit = getCachedLookupResponse("bacon");
    assert.ok(hit);
    assert.strictEqual(hit.api.verdict, "haram");
  });

  it("returns null for unknown query", () => {
    assert.strictEqual(getCachedLookupResponse("unknown_xyz"), null);
  });

  it("clearLookupCache removes entries", () => {
    cacheLookupResponse("rice", { verdict: "halal" });
    clearLookupCache();
    assert.strictEqual(getCachedLookupResponse("rice"), null);
  });
});

describe("resolveLookupSource", () => {
  it("maps known_page to seo", async () => {
    const { resolveLookupSource } = await import("../lookupSources.js");
    assert.strictEqual(resolveLookupSource("known_page"), "seo");
    assert.strictEqual(resolveLookupSource("ocr"), "ocr");
  });
});

describe("apiEnvelopeToIngredientEvaluationV1", () => {
  it("parses POST /api/lookup legacy envelope", async () => {
    const { apiEnvelopeToIngredientEvaluationV1, validateIngredientEvaluationV1 } =
      await import("../../../../../shared/contracts/ingredientEvaluationV1.js");

    const api = {
      contract_version: "1",
      query: "gelatin",
      ingredient: "gelatin",
      normalized_query: "gelatin",
      verdict: "conditional",
      halal_status: "conditional",
      confidence_level: "medium",
      confidence_score: 65,
      modifiers: ["unspecified"],
      modifier_details: [],
      warnings: [],
      explanation: "Check source.",
      references: [],
      substitutes: { best: null, alternatives: [] },
      base_ingredient_detail: {
        slug: "gelatin",
        display_name: "gelatin",
        category: "animal_byproduct",
      },
    };

    const v1 = apiEnvelopeToIngredientEvaluationV1(api);
    const { valid } = validateIngredientEvaluationV1(v1);
    assert.ok(valid);
    assert.strictEqual(v1.halal_status, "conditional");
    assert.strictEqual(v1.confidence.score, 65);
  });
});
