import { describe, it, expect } from "vitest";
import {
  toSubstituteSlug,
  shouldShowLookupRecommendations,
  extractLookupRecommendations,
} from "../recommendations.js";

describe("monetization recommendations", () => {
  it("toSubstituteSlug normalizes display names", () => {
    expect(toSubstituteSlug("Agar Agar")).toBe("agar_agar");
    expect(toSubstituteSlug("turkey_bacon")).toBe("turkey_bacon");
  });

  it("shouldShowLookupRecommendations hides halal-only results", () => {
    expect(
      shouldShowLookupRecommendations({
        statusClass: "halal",
        verdict: "halal",
        substitutes: { all: [{ name: "x", slug: "x" }] },
      })
    ).toBe(false);
  });

  it("shouldShowLookupRecommendations shows when substitutes exist for haram", () => {
    expect(
      shouldShowLookupRecommendations({
        statusClass: "haram",
        verdict: "haram",
        substitutes: { all: [{ name: "Turkey bacon", slug: "turkey_bacon" }] },
      })
    ).toBe(true);
  });

  it("extractLookupRecommendations caps items and includes slugs", () => {
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
            { name: "Extra", slug: "extra" },
          ],
        },
      },
      { maxItems: 2 }
    );
    expect(items).toHaveLength(2);
    expect(items[0].slug).toBe("agar_agar");
    expect(items[0].isPrimary).toBe(true);
    expect(items[0].originalSlug).toBe("gelatin");
  });
});
