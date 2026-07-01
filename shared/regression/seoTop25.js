/**
 * SEO top-25 ↔ engine verdict alignment helpers.
 * SEO pages use user-friendly verdict bands; engine uses full 5-level hierarchy.
 */

/** @typedef {import('../contracts/ingredientEvaluationV1.js').Verdict} EngineVerdict */

/**
 * Compatible engine verdicts for each SEO page verdict.
 * SEO "usually_haram" often maps to engine "conditional" (source unknown gelatin, etc.).
 */
export const SEO_TO_ENGINE_COMPAT = Object.freeze({
  halal: ["halal", "usually_halal"],
  usually_halal: ["usually_halal", "halal", "conditional"],
  conditional: ["conditional", "unknown", "usually_halal", "usually_haram"],
  usually_haram: ["usually_haram", "conditional", "haram"],
  haram: ["haram", "usually_haram"],
});

/**
 * @param {string} seoVerdict - VERDICT.* value from seoVerdicts.js
 * @param {string} engineVerdict - lookupService verdict
 * @returns {boolean}
 */
export function seoVerdictAlignsWithEngine(seoVerdict, engineVerdict) {
  if (!seoVerdict || !engineVerdict) return false;
  const allowed = SEO_TO_ENGINE_COMPAT[seoVerdict];
  if (!allowed) return seoVerdict === engineVerdict;
  return allowed.includes(engineVerdict);
}

/**
 * Build audit rows for TOP_25 definitions against lookup results.
 * @param {Array<{ slug: string, quickLookupIngredient: string, verdict: string }>} definitions
 * @param {(query: string) => Promise<{ verdict: string }>} lookupFn
 */
export async function auditSeoTop25(definitions, lookupFn) {
  const rows = [];
  for (const def of definitions) {
    const api = await lookupFn(def.quickLookupIngredient);
    const engineVerdict = api.verdict;
    rows.push({
      slug: def.slug,
      query: def.quickLookupIngredient,
      seoVerdict: def.verdict,
      engineVerdict,
      aligned: seoVerdictAlignsWithEngine(def.verdict, engineVerdict),
    });
  }
  return rows;
}
