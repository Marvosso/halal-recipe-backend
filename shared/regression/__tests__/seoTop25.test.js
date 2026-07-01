/**
 * SEO top-25 alignment helpers.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { seoVerdictAlignsWithEngine } from "../seoTop25.js";

describe("seoVerdictAlignsWithEngine", () => {
  it("allows conditional SEO for engine usually_haram (gelatin pattern)", () => {
    assert.strictEqual(seoVerdictAlignsWithEngine("usually_haram", "conditional"), true);
  });

  it("allows conditional SEO for engine unknown", () => {
    assert.strictEqual(seoVerdictAlignsWithEngine("conditional", "unknown"), true);
  });

  it("rejects haram SEO when engine is halal", () => {
    assert.strictEqual(seoVerdictAlignsWithEngine("haram", "halal"), false);
  });
});
