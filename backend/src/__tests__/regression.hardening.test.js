/**
 * Halal Kitchen — regression hardening suite (backend).
 * Covers: lookup, modifiers, conversion, OCR, contract shape, confidence, drift.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  CRITICAL_INGREDIENTS,
  CRITICAL_MODIFIER_CASES,
  CRITICAL_OCR_SNIPPETS,
  CRITICAL_CONVERSION_RECIPES,
  CONTROL_HALAL,
} from "../../../shared/regression/criticalIngredients.js";
import {
  validateLookupApiEnvelope,
  validateIngredientEvaluationV1,
  computeEvaluationFingerprint,
  diffEvaluationFingerprints,
  assertCriticalIngredientExpectations,
} from "../../../shared/regression/contractValidators.js";
import {
  apiEnvelopeToIngredientEvaluationV1,
} from "../contracts/ingredientEvaluationV1.js";
import { lookupIngredient, lookupIngredientForRecipe } from "../services/lookupService.js";
import { evaluateIngredientIntelligence } from "../modules/ingredient-intelligence/engine.js";
import { parseIngredientPhrase } from "../modules/ingredient-intelligence/modifiers/index.js";
import { convertRecipeWithIntelligence } from "../modules/recipe-conversion/index.js";
import { runIngredientLabelScan } from "../modules/ocr-scan/index.js";

describe("Regression — control halal baseline", () => {
  it("rice remains halal across API and engine", async () => {
    const api = await lookupIngredient(CONTROL_HALAL.query, { useAiExplanation: false });
    const engine = await evaluateIngredientIntelligence(CONTROL_HALAL.query);
    assert.strictEqual(api.verdict, CONTROL_HALAL.expectVerdict);
    assert.strictEqual(engine.verdict, CONTROL_HALAL.expectVerdict);
    assert.strictEqual(api.verdict, engine.verdict);
  });
});

describe("Regression — critical ingredient lookup", () => {
  for (const fixture of CRITICAL_INGREDIENTS) {
    it(`lookup + engine aligned: ${fixture.query}`, async () => {
      const api = await lookupIngredient(fixture.query, {
        source: "typed",
        useAiExplanation: false,
      });
      const engine = await evaluateIngredientIntelligence(fixture.query, {
        source: "typed",
      });

      assert.strictEqual(api.verdict, engine.verdict, "API verdict must match engine");
      assert.strictEqual(api.halal_status, engine.halal_status);

      const envelopeErrors = validateLookupApiEnvelope(api);
      assert.strictEqual(
        envelopeErrors.length,
        0,
        `envelope: ${envelopeErrors.join("; ")}`
      );

      const v1 = apiEnvelopeToIngredientEvaluationV1(api);
      const v1Errors = validateIngredientEvaluationV1(v1);
      assert.strictEqual(v1Errors.length, 0, `v1: ${v1Errors.join("; ")}`);

      const expectErrors = assertCriticalIngredientExpectations(fixture, api);
      assert.strictEqual(
        expectErrors.length,
        0,
        expectErrors.join("; ")
      );
    });
  }
});

describe("Regression — deterministic drift (double evaluation)", () => {
  for (const fixture of CRITICAL_INGREDIENTS) {
    it(`idempotent fingerprint: ${fixture.query}`, async () => {
      const a = await evaluateIngredientIntelligence(fixture.query);
      const b = await evaluateIngredientIntelligence(fixture.query);
      const fa = computeEvaluationFingerprint(a);
      const fb = computeEvaluationFingerprint(b);
      const drift = diffEvaluationFingerprints(fa, fb);
      assert.strictEqual(drift.length, 0, drift.join("; "));
    });
  }
});

describe("Regression — modifier parsing (critical)", () => {
  for (const c of CRITICAL_MODIFIER_CASES) {
    it(`parse: ${c.phrase}`, () => {
      const p = parseIngredientPhrase(c.phrase);
      for (const mod of c.expectModifierIncludes || []) {
        assert.ok(
          p.modifierSlugs.includes(mod),
          `expected modifier ${mod} in ${p.modifierSlugs.join(", ")}`
        );
      }
      if (c.expectBaseIncludes) {
        assert.ok(
          p.basePhrase.includes(c.expectBaseIncludes),
          `base phrase ${p.basePhrase} should include ${c.expectBaseIncludes}`
        );
      }
    });

    if (c.expectVerdict || c.expectVerdictOneOf) {
      it(`evaluate: ${c.phrase}`, async () => {
        const r = await evaluateIngredientIntelligence(c.phrase);
        if (c.expectVerdict) {
          assert.strictEqual(r.verdict, c.expectVerdict);
        }
        if (c.expectVerdictOneOf) {
          assert.ok(
            c.expectVerdictOneOf.includes(r.verdict),
            `expected one of ${c.expectVerdictOneOf.join(", ")}, got ${r.verdict}`
          );
        }
      });
    }
  }
});

describe("Regression — OCR / scan pipeline", () => {
  for (const snippet of CRITICAL_OCR_SNIPPETS) {
    it(`scan: ${snippet.id}`, async () => {
      const result = await runIngredientLabelScan(snippet.rawText);
      assert.ok(result.summary, "summary required");
      assert.ok(Array.isArray(result.ingredients), "ingredients array required");

      for (const row of result.ingredients) {
        assert.ok(row.halal_status || row.verdict, "row must have status");
        assert.ok(
          typeof row.confidence === "number" || row.confidence_score != null,
          "row must have confidence"
        );
      }

      if (snippet.expectVerdictFor) {
        for (const [token, expectedStatus] of Object.entries(snippet.expectVerdictFor)) {
          const row = result.ingredients.find((i) =>
            (i.query || i.raw || "").toLowerCase().includes(token.toLowerCase())
          );
          assert.ok(row, `expected token row: ${token}`);
          const status = row.halal_status || row.verdict;
          if (expectedStatus === "haram") {
            assert.ok(
              status === "haram" || row.verdict === "haram",
              `${token} expected haram, got ${status}`
            );
          } else {
            assert.ok(status, `${token} must have status`);
          }
        }
      }
    });
  }
});

describe("Regression — recipe conversion (intelligence pipeline)", () => {
  for (const recipe of CRITICAL_CONVERSION_RECIPES) {
    it(`convert: ${recipe.id}`, async () => {
      const result = await convertRecipeWithIntelligence(recipe.text, {});
      assert.strictEqual(result.contract_version, "1");
      assert.ok(typeof result.convertedText === "string");
      assert.equal(typeof result.confidenceScore, "number");
      assert.ok(result.confidenceScore >= 0 && result.confidenceScore <= 100);

      for (const q of recipe.expectIssueQueries || []) {
        const found = result.issues.some(
          (i) =>
            (i.matchedTerm || i.ingredient || "").toLowerCase().includes(q) ||
            (i.ingredient_id || "").replace(/_/g, " ").includes(q)
        );
        assert.ok(found, `expected issue mentioning: ${q}`);
      }
    });
  }
});

describe("Regression — conversion aligns with lookupService", () => {
  it("each conversion issue verdict matches lookupIngredientForRecipe", async () => {
    const recipe = "1 tbsp gelatin and 2 tbsp soy sauce";
    const result = await convertRecipeWithIntelligence(recipe, {});

    assert.ok(result.issues.length >= 1, "expected at least one issue");

    for (const issue of result.issues) {
      const query = (issue.matchedTerm || issue.ingredient || "").trim();
      assert.ok(query, "issue must have query text");

      const evalDirect = await lookupIngredientForRecipe(query);
      const api = await lookupIngredient(query, {
        source: "recipe",
        useAiExplanation: false,
      });

      assert.strictEqual(issue.verdict, evalDirect.verdict, `${query} verdict`);
      assert.strictEqual(issue.status, evalDirect.halal_status, `${query} status`);
      assert.strictEqual(api.verdict, evalDirect.verdict, `${query} api vs eval`);
      assert.strictEqual(api.halal_status, evalDirect.halal_status);
    }
  });
});

describe("Regression — AI must not change verdict", () => {
  for (const fixture of CRITICAL_INGREDIENTS.slice(0, 3)) {
    it(`AI explanation stable verdict: ${fixture.query}`, async () => {
      const base = await lookupIngredient(fixture.query, { useAiExplanation: false });
      const withAi = await lookupIngredient(fixture.query, { useAiExplanation: true });
      assert.strictEqual(withAi.verdict, base.verdict);
      assert.strictEqual(withAi.halal_status, base.halal_status);
      assert.strictEqual(withAi.confidence_level, base.confidence_level);
      assert.strictEqual(withAi.confidence_score, base.confidence_score);
    });
  }
});
