/**
 * Group server scan rows for mobile UI (deterministic verdicts only).
 * Rows normalized through IngredientEvaluationV1.
 */

import { scanRowToIngredientEvaluationV1 } from "../../contracts/ingredientEvaluationV1.js";
import { getVerdictDisplay } from "../lookup/verdictDisplay";

const HARAM_STATUSES = new Set(["haram", "usually_haram"]);
const HALAL_STATUSES = new Set(["halal", "usually_halal"]);
const QUESTIONABLE_STATUSES = new Set(["conditional", "unknown"]);

/**
 * @param {import("../../contracts/ingredientEvaluationV1.js").IngredientEvaluationV1} v1
 * @param {object} row - original scan row for OCR meta
 */
function v1ToScanGroupEntry(v1, row) {
  const display = getVerdictDisplay(v1.verdict, v1.halal_status);
  return {
    raw: row.raw || v1.meta?.raw,
    displayName:
      v1.base_ingredient?.display_name ||
      v1.query ||
      v1.ingredient,
    query: v1.resolved_query || v1.ingredient,
    modifiers: v1.modifiers,
    verdict: v1.verdict,
    halal_status: v1.halal_status,
    statusLabel: display.label,
    confidence_level: v1.confidence.level,
    confidence_score: v1.confidence.score,
    explanation: v1.explanation,
    warnings: v1.warnings,
    ocr_uncertain: Boolean(v1.meta?.ocr_uncertain ?? row.ocr_uncertain),
    alias_applied: Boolean(v1.meta?.alias_applied ?? row.alias_applied),
    evaluation: v1,
  };
}

/**
 * @param {import("../../api/scanApi.js").default} scanResponse
 */
export function normalizeScanResponse(scanResponse) {
  if (!scanResponse) {
    return { summary: null, groups: { haram: [], questionable: [], halal: [] }, rawCount: 0 };
  }

  const ingredients = scanResponse.ingredients || [];
  const groups = { haram: [], questionable: [], halal: [] };

  for (const row of ingredients) {
    const v1 = scanRowToIngredientEvaluationV1(row);
    const status = (v1.halal_status || v1.verdict || "unknown").toLowerCase();
    const entry = v1ToScanGroupEntry(v1, row);

    if (HARAM_STATUSES.has(status)) groups.haram.push(entry);
    else if (HALAL_STATUSES.has(status)) groups.halal.push(entry);
    else if (QUESTIONABLE_STATUSES.has(status)) groups.questionable.push(entry);
    else groups.questionable.push(entry);
  }

  return {
    summary: scanResponse.summary,
    groups,
    rawCount: scanResponse.parsed_count ?? ingredients.length,
    evaluatedCount: scanResponse.evaluated_count ?? ingredients.length,
    ocrConfidence: scanResponse.ocr_confidence,
    pipelineVersion: scanResponse.pipeline_version,
    contract_version: "1",
  };
}
