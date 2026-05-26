/**
 * Phase 3 — recipe conversion UI model mapping
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { mapServerConversionResponse } from "../recipeConversionModel.js";

describe("mapServerConversionResponse", () => {
  it("maps server issues with evaluation envelope", () => {
    const data = {
      originalText: "bacon",
      convertedText: "turkey bacon",
      confidenceScore: 72,
      contract_version: "1",
      pipeline: "ingredient_intelligence_v1",
      issues: [
        {
          ingredient_id: "bacon",
          ingredient: "bacon",
          status: "haram",
          verdict: "haram",
          replacement_id: "turkey_bacon",
          evaluation_api: {
            contract_version: "1",
            ingredient: "bacon",
            query: "bacon",
            verdict: "haram",
            halal_status: "haram",
            confidence: { level: "high", score: 90, value: 0.9 },
            warnings: [],
            explanation: "Pork product.",
            references: [],
            substitutes: { best: null, alternatives: [] },
          },
        },
      ],
    };

    const mapped = mapServerConversionResponse(data);
    assert.strictEqual(mapped.issues.length, 1);
    assert.strictEqual(mapped.issues[0].ingredient_id, "bacon");
    assert.ok(mapped.issues[0].explanation);
    assert.strictEqual(mapped.confidenceScore, 72);
  });
});
