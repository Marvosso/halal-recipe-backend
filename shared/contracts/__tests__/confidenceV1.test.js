import { describe, it } from "node:test";
import assert from "node:assert";
import {
  clampConfidenceScore,
  displayConfidencePercent,
  normalizeConfidence,
  confidenceLevelFromScore,
} from "../confidenceV1.js";

describe("ConfidenceV1", () => {
  it("clampConfidenceScore bounds 0-100", () => {
    assert.strictEqual(clampConfidenceScore(150), 100);
    assert.strictEqual(clampConfidenceScore(-5), 0);
    assert.strictEqual(clampConfidenceScore(72.4), 72);
  });

  it("displayConfidencePercent prefers canonical score", () => {
    assert.strictEqual(displayConfidencePercent("high", 91), 91);
    assert.strictEqual(displayConfidencePercent("low", undefined), 40);
  });

  it("normalizeConfidence does not apply UI preference adjustments", () => {
    const c = normalizeConfidence("medium", 65);
    assert.strictEqual(c.level, "medium");
    assert.strictEqual(c.score, 65);
    assert.strictEqual(c.value, 0.65);
  });

  it("confidenceLevelFromScore is deterministic", () => {
    assert.strictEqual(confidenceLevelFromScore(90), "high");
    assert.strictEqual(confidenceLevelFromScore(60), "medium");
    assert.strictEqual(confidenceLevelFromScore(30), "low");
  });
});
