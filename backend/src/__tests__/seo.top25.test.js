/**
 * SEO top-25 ↔ engine verdict alignment (MVP Phase 3).
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { lookupIngredient } from "../services/lookupService.js";
import { TOP_25_INGREDIENT_DEFINITIONS } from "../../../frontend/src/data/seo/top25Ingredients.js";
import { auditSeoTop25 } from "../../../shared/regression/seoTop25.js";

describe("SEO top-25 vs lookup engine", () => {
  it("all 25 ingredient pages align with POST /api/lookup verdict band", async () => {
    const rows = await auditSeoTop25(TOP_25_INGREDIENT_DEFINITIONS, async (query) =>
      lookupIngredient(query, { source: "seo", locale: "en", useAiExplanation: false })
    );

    assert.strictEqual(rows.length, 25, "expected 25 SEO definitions");

    const drift = rows.filter((r) => !r.aligned);
    if (drift.length > 0) {
      const detail = drift
        .map((r) => `${r.slug}: seo=${r.seoVerdict} engine=${r.engineVerdict}`)
        .join("; ");
      assert.fail(`SEO/engine drift: ${detail}`);
    }
  });

  it("critical pork derivatives resolve as haram", async () => {
    for (const query of ["lard", "ham", "pepperoni"]) {
      const api = await lookupIngredient(query, { source: "seo" });
      assert.strictEqual(api.verdict, "haram", `${query} should be haram`);
    }
  });

  it("wine vinegar is not classified as wine intoxicant", async () => {
    const api = await lookupIngredient("wine vinegar", { source: "seo" });
    assert.ok(
      ["usually_halal", "conditional"].includes(api.verdict),
      `wine vinegar verdict was ${api.verdict}`
    );
  });
});
