/**
 * AI explanation layer — contracts, cache, fallback, guardrails.
 * Deterministic verdicts must never change.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  buildExplanationInput,
  buildExplanationCacheKey,
  parseExplanationOutput,
  sanitizeExplanationOutput,
} from "../modules/ai-enhancement/contracts/explanationContract.js";
import { fillUserPrompt, SYSTEM_PROMPT } from "../modules/ai-enhancement/prompts/explanationPrompts.js";
import { generateTemplateExplanation } from "../modules/ai-enhancement/templates/explanationTemplates.js";
import {
  generateExplanationForEvaluation,
  enhanceEvaluationWithExplanation,
} from "../modules/ai-enhancement/explanationService.js";
import {
  getCachedExplanation,
  setCachedExplanation,
  clearExplanationMemoryCache,
} from "../modules/ai-enhancement/cache/explanationCache.js";

const sampleEvaluation = {
  query: "bovine gelatin",
  baseSlug: "gelatin",
  base_ingredient: { slug: "gelatin", display_name: "Gelatin", category: "additive" },
  modifier_slugs: ["bovine"],
  verdict: "conditional",
  halal_status: "conditional",
  confidence_level: "medium",
  confidence_score: 55,
  warnings: ["Source or preparation may affect permissibility."],
  notes: "Animal-derived; source matters.",
  references: [],
  explanation: "Template from engine.",
};

describe("AI explanation contracts", () => {
  it("buildExplanationInput maps evaluation without mutating source", () => {
    const copy = { ...sampleEvaluation, modifiers: [...sampleEvaluation.modifier_slugs] };
    const input = buildExplanationInput(copy, { locale: "en" });
    assert.strictEqual(copy.verdict, "conditional");
    assert.strictEqual(input.verdict, "conditional");
    assert.strictEqual(input.halal_status, "conditional");
    assert.strictEqual(input.ingredient_name, "Gelatin");
    assert.deepStrictEqual(input.modifiers, ["bovine"]);
    assert.strictEqual(input.schema_version, "1.0");
  });

  it("buildExplanationCacheKey is stable for same verdict fingerprint", () => {
    const a = buildExplanationInput(sampleEvaluation);
    const b = buildExplanationInput({ ...sampleEvaluation, query: "different query text" });
    assert.strictEqual(buildExplanationCacheKey(a), buildExplanationCacheKey(b));
  });

  it("parseExplanationOutput strips forbidden verdict keys", () => {
    const out = parseExplanationOutput({
      explanation: "Many Muslims check labels for bovine gelatin.",
      tone: "cautious",
      halal_status: "halal",
      verdict: "halal",
      uncertainty_acknowledged: true,
    });
    assert.ok(out);
    assert.ok(!("halal_status" in out));
    assert.ok(!("verdict" in out));
    assert.strictEqual(out.tone, "cautious");
  });

  it("rejects fatwa-like language", () => {
    const out = parseExplanationOutput({
      explanation: "Islam declares this ingredient halal for all Muslims.",
      tone: "neutral",
    });
    assert.strictEqual(out, null);
  });

  it("fillUserPrompt states verdict is fixed", () => {
    const prompt = fillUserPrompt(buildExplanationInput(sampleEvaluation));
    assert.ok(prompt.includes("Verdict (fixed): conditional"));
    assert.ok(prompt.includes("DO NOT CHANGE"));
    assert.ok(SYSTEM_PROMPT.includes("NOT issue fatwas"));
  });
});

describe("AI explanation service", () => {
  beforeEach(() => {
    clearExplanationMemoryCache();
  });

  it("generateExplanationForEvaluation uses template when forceTemplate", async () => {
    const result = await generateExplanationForEvaluation(sampleEvaluation, {
      forceTemplate: true,
    });
    assert.strictEqual(result.explanation_source, "template");
    assert.ok(result.explanation.length > 20);
    assert.strictEqual(result.cached, false);
  });

  it("conditional template acknowledges uncertainty", async () => {
    const input = buildExplanationInput(sampleEvaluation);
    const template = generateTemplateExplanation(input);
    assert.strictEqual(template.uncertainty_acknowledged, true);
    assert.ok(
      /check the product label|consult/i.test(template.explanation),
      "should suggest verification"
    );
  });

  it("enhanceEvaluationWithExplanation does not change verdict fields", async () => {
    const before = { ...sampleEvaluation };
    const after = await enhanceEvaluationWithExplanation(before, { forceTemplate: true });
    assert.strictEqual(after.verdict, before.verdict);
    assert.strictEqual(after.halal_status, before.halal_status);
    assert.strictEqual(after.confidence_level, before.confidence_level);
    assert.notStrictEqual(after.explanation, before.explanation);
    assert.strictEqual(after.explanation_source, "template");
    assert.strictEqual(after.meta.explanation_tone, "cautious");
  });

  it("memory cache returns stored explanation", async () => {
    const input = buildExplanationInput(sampleEvaluation);
    const key = buildExplanationCacheKey(input);
    await setCachedExplanation(key, {
      explanation: "Cached prose for gelatin.",
      source: "template",
      tone: "cautious",
      uncertainty_acknowledged: true,
      locale: "en",
    });
    const hit = await getCachedExplanation(key);
    assert.strictEqual(hit.explanation, "Cached prose for gelatin.");

    const result = await generateExplanationForEvaluation(sampleEvaluation, {
      forceTemplate: true,
      useCache: true,
      intent: "known_page",
    });
    assert.strictEqual(result.cached, true);
    assert.strictEqual(result.explanation, "Cached prose for gelatin.");
  });
});

describe("sanitizeExplanationOutput", () => {
  it("infers uncertainty from prose when flag omitted", () => {
    const out = sanitizeExplanationOutput({
      explanation: "This often depends on the source; verify the label when in doubt.",
      tone: "neutral",
    });
    assert.strictEqual(out.uncertainty_acknowledged, true);
  });
});
