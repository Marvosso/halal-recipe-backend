/**
 * Frontend regression: SEO metadata, share payloads, affiliate rendering.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  CRITICAL_INGREDIENTS,
} from "../../../../../shared/regression/criticalIngredients.js";
import {
  validateShareIngredientPayload,
  validateShareRecipePayload,
  validateAffiliateLinkShape,
} from "../../../../../shared/regression/contractValidators.js";
import { buildPageMetadata } from "../../seo/metadata.js";
import { buildWebPageSchema, buildFAQSchema } from "../../seo/schema.js";
import { buildRecipeShareData } from "../../shareCards/buildRecipeShareData.js";
import { v1ToShareUrlPayload } from "../../formatters/ingredientEvaluationFormatters.js";
import {
  extractConversionRecommendations,
  applyAffiliateLinksToIssues,
  normalizeAffiliateLink,
} from "../../monetization/index.js";
import {
  encodeSharePayload,
  decodeSharePayload,
} from "../../shareUtils.js";

function mockV1Envelop(query, overrides = {}) {
  return {
    contract_version: "1",
    query,
    ingredient: query,
    verdict: overrides.verdict || "conditional",
    halal_status: overrides.halal_status || "conditional",
    confidence_level: overrides.confidence_level || "medium",
    confidence_score: overrides.confidence_score ?? 65,
    explanation: "Test explanation for regression.",
    warnings: [],
    references: [],
    substitutes: { best: null, alternatives: [] },
    modifiers: [],
  };
}

describe("Regression — SEO rendering (critical slugs)", () => {
  for (const fixture of CRITICAL_INGREDIENTS) {
    if (!fixture.seoSlug) continue;

    it(`metadata valid for SEO slug: ${fixture.seoSlug}`, () => {
      const config = {
        slug: fixture.seoSlug,
        ingredientName: fixture.query.replace(/\b\w/g, (c) => c.toUpperCase()),
        title: `Is ${fixture.query} halal?`,
        rulingSummary: `Regression summary for ${fixture.query}.`,
        faq: [{ question: "Is it halal?", answer: "Depends on source." }],
      };

      const meta = buildPageMetadata(config);
      assert.ok(meta.title.length > 10);
      assert.ok(meta.description.length > 20);
      assert.ok(meta.canonical.includes(fixture.seoSlug) || meta.canonical.includes("halal"));
      assert.strictEqual(meta.robots, "index, follow");

      const schema = buildWebPageSchema(config);
      assert.strictEqual(schema["@type"], "WebPage");
      assert.ok(schema.url);

      const faq = buildFAQSchema(config.faq);
      assert.strictEqual(faq["@type"], "FAQPage");
      assert.strictEqual(faq.mainEntity.length, 1);
    });
  }
});

describe("Regression — share payloads", () => {
  it("ingredient share payload from V1 envelope", () => {
    for (const fixture of CRITICAL_INGREDIENTS) {
      const api = mockV1Envelop(fixture.query, {
        verdict: fixture.expectVerdict || fixture.expectVerdictOneOf?.[0] || "conditional",
        halal_status: fixture.expectHalalStatus || fixture.expectHalalStatusOneOf?.[0] || "conditional",
      });
      const payload = v1ToShareUrlPayload(api);
      const errors = validateShareIngredientPayload(payload);
      assert.strictEqual(
        errors.length,
        0,
        `${fixture.id}: ${errors.join("; ")}`
      );
      assert.strictEqual(payload.query, fixture.query);
    }
  });

  it("recipe share payload round-trip", () => {
    const issues = [
      {
        ingredient_id: "white_wine",
        ingredient: "white wine",
        replacement_id: "grape_juice",
      },
      {
        ingredient_id: "gelatin",
        ingredient: "gelatin",
        replacement_id: "agar_agar",
      },
    ];
    const data = buildRecipeShareData({
      recipe: "Test dessert",
      converted: "Halal version",
      issues,
      confidence: 82,
    });
    const errors = validateShareRecipePayload({
      type: "recipe",
      title: data.title,
      haram: data.haram,
      replacements: data.replacements,
    });
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(data.type, "recipe");
    assert.ok(data.confidenceScore === 82);

    const encoded = encodeSharePayload(data);
    assert.ok(encoded.length > 0);
    const decoded = decodeSharePayload(encoded);
    assert.strictEqual(decoded.type, "recipe");
    assert.strictEqual(decoded.title, data.title);
  });
});

describe("Regression — affiliate rendering", () => {
  it("normalizeAffiliateLink produces valid UI shape", () => {
    const link = normalizeAffiliateLink({
      id: "1",
      platform: { name: "amazon", display_name: "Amazon", color_hex: "#ff9900" },
      search_query: "halal gelatin agar",
      url: "https://example.com/shop",
      is_featured: true,
    });
    const errors = validateAffiliateLinkShape(link);
    assert.strictEqual(errors.length, 0);
    assert.strictEqual(link.platform_display, "Amazon");
  });

  it("applyAffiliateLinksToIssues never attaches links to haram ingredient id", () => {
    const linksBySlug = {
      agar_agar: [
        normalizeAffiliateLink({
          id: "1",
          platform: { name: "amazon", display_name: "Amazon" },
          url: "https://example.com",
          search_query: "agar",
        }),
      ],
    };
    const issues = applyAffiliateLinksToIssues(
      [
        {
          ingredient_id: "gelatin",
          replacement_id: "agar_agar",
          status: "conditional",
        },
      ],
      linksBySlug
    );
    assert.strictEqual(issues[0].substitute_affiliate_links.length, 1);
    assert.strictEqual(issues[0].ingredient_id, "gelatin");
  });

  it("extractConversionRecommendations defers links (trust-first)", () => {
    const recs = extractConversionRecommendations([
      {
        ingredient: "gelatin",
        replacement_id: "agar_agar",
        substitute_affiliate_links: [{ id: 1, url: "x" }],
      },
    ]);
    assert.strictEqual(recs.length, 1);
    assert.strictEqual(recs[0].affiliateLinks, undefined);
    assert.strictEqual(recs[0].slug, "agar_agar");
  });
});
