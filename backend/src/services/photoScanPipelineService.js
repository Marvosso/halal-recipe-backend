/**
 * Photo scan pipeline — delegates to modules/ocr-scan (backward-compatible exports).
 * Legacy AI-normalization branch removed; intelligence engine is always authoritative.
 */

import {
  tokenizeIngredientList,
  cleanToken,
  normalizeOcrToken,
  runIngredientLabelScan,
} from "../modules/ocr-scan/index.js";

export { tokenizeIngredientList as parseIngredientList };
export { cleanToken };

const DEFAULT_OCR_CONFIDENCE = 0.7;

/**
 * Legacy pipeline shape for /convert/scan-ingredients.
 * Always uses runIngredientLabelScan (same engine as POST /api/scan).
 *
 * @param {string} rawOcrText
 * @param {object} [options]
 */
export async function runPhotoScanPipeline(rawOcrText, options = {}) {
  const { ocrConfidence = DEFAULT_OCR_CONFIDENCE, locale = "en" } = options;

  const scan = await runIngredientLabelScan(rawOcrText, {
    ocrConfidence,
    locale,
    useAiExplanation: false,
  });

  return {
    contract_version: scan.contract_version,
    summary: {
      halal: scan.summary.halal + (scan.summary.usually_halal || 0),
      conditional: scan.summary.conditional + (scan.summary.usually_haram || 0),
      haram: scan.summary.haram,
      unknown: scan.summary.unknown,
    },
    ingredients: scan.ingredients.map((row) => ({
      raw: row.raw,
      normalized: row.cleaned || row.resolved_query,
      ingredient: row.resolved_query || row.query,
      halal_status: row.halal_status,
      confidence: row.confidence,
      confidence_score: row.confidence_score,
      explanation: row.explanation || null,
      ocr_uncertain: row.ocr_uncertain,
      verdict: row.verdict,
      modifiers: row.modifiers,
      base_ingredient: row.base_ingredient,
    })),
    ocr_confidence: scan.ocr_confidence,
    pipeline_version: scan.pipeline_version,
    pipeline: "ocr_scan_v1",
  };
}
