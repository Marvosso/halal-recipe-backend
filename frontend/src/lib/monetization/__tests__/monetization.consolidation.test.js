import { describe, it } from "node:test";
import assert from "node:assert";
import {
  collectSubstituteSlugsFromIssues,
  extractConversionRecommendations,
  toSubstituteSlug,
  shouldShowLookupRecommendations,
  extractLookupRecommendations,
} from "../recommendations.js";
import { pickAffiliateLinksForSlug, normalizeAffiliateLink } from "../affiliateLinkModel.js";

// applyAffiliateLinksToIssues tested in isolation (no affiliateService fetch)
import { applyAffiliateLinksToIssues } from "../issueAffiliateApply.js";

describe("monetization recommendations", () => {
  it("toSubstituteSlug normalizes display names", () => {
    assert.strictEqual(toSubstituteSlug("Agar Agar"), "agar_agar");
    assert.strictEqual(toSubstituteSlug("turkey_bacon"), "turkey_bacon");
  });

  it("collectSubstituteSlugsFromIssues dedupes slugs", () => {
    const slugs = collectSubstituteSlugsFromIssues([
      { replacement_id: "turkey_bacon", ranked_substitutes: [{ id: "turkey_bacon" }] },
      { replacement: "Halal alternative needed" },
    ]);
    assert.deepStrictEqual(slugs, ["turkey_bacon"]);
  });

  it("shouldShowLookupRecommendations hides halal-only results", () => {
    assert.strictEqual(
      shouldShowLookupRecommendations({
        statusClass: "halal",
        verdict: "halal",
        substitutes: { all: [{ name: "x", slug: "x" }] },
      }),
      false
    );
  });

  it("extractConversionRecommendations does not embed affiliate links", () => {
    const recs = extractConversionRecommendations([
      {
        ingredient_id: "bacon",
        replacement_id: "turkey_bacon",
        substitute_affiliate_links: [{ id: 1, url: "https://example.com" }],
      },
    ]);
    assert.strictEqual(recs.length, 1);
    assert.strictEqual(recs[0].affiliateLinks, undefined);
  });

  it("extractLookupRecommendations caps items", () => {
    const items = extractLookupRecommendations(
      {
        statusClass: "conditional",
        verdict: "conditional",
        displayName: "Gelatin",
        baseIngredient: "gelatin",
        substitutes: {
          all: [
            { name: "Agar agar", slug: "agar_agar", reason: "Plant-based" },
            { name: "Pectin", slug: "pectin", reason: "Fruit" },
          ],
        },
      },
      { maxItems: 1 }
    );
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].slug, "agar_agar");
  });
});

describe("applyAffiliateLinksToIssues", () => {
  it("maps gateway links onto issues by slug", () => {
    const linksBySlug = {
      turkey_bacon: [
        normalizeAffiliateLink({
          id: "1",
          platform: { name: "amazon", display_name: "Amazon" },
          search_query: "halal turkey bacon",
          url: "https://amazon.example/turkey",
          is_featured: true,
        }),
      ],
    };
    const out = applyAffiliateLinksToIssues(
      [{ ingredient_id: "bacon", replacement_id: "turkey_bacon" }],
      linksBySlug
    );
    assert.strictEqual(out[0].substitute_affiliate_links.length, 1);
    assert.strictEqual(out[0].substitute_affiliate_links[0].platform, "amazon");
  });
});

describe("affiliateGateway helpers", () => {
  it("pickAffiliateLinksForSlug respects limit", () => {
    const map = {
      agar_agar: [
        { id: 1, platform: "a", platform_display: "A", url: "u1" },
        { id: 2, platform: "b", platform_display: "B", url: "u2" },
      ],
    };
    assert.strictEqual(pickAffiliateLinksForSlug(map, "agar_agar", 1).length, 1);
  });
});
