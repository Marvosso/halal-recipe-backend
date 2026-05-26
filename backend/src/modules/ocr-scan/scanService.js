/**
 * OCR ingredient scan MVP — tokenize → normalize → deterministic intelligence engine.
 * Verdicts are authoritative from evaluateIngredientIntelligence only.
 */

import { tokenizeIngredientList } from "./tokenize.js";
import { normalizeOcrToken } from "./ocrNormalize.js";
import { lookupIngredientEvaluation } from "../../services/lookupService.js";

export const SCAN_PIPELINE_VERSION = "1.0.0";
const DEFAULT_OCR_CONFIDENCE = 0.7;
const OCR_UNCERTAIN_THRESHOLD = 0.5;

/**
 * @param {object} evaluation
 * @param {object} tokenMeta
 * @returns {object}
 */
function toScanIngredientRow(evaluation, tokenMeta) {
  const base = evaluation.base_ingredient;
  return {
    raw: tokenMeta.raw,
    cleaned: tokenMeta.cleaned !== tokenMeta.raw ? tokenMeta.cleaned : undefined,
    query: evaluation.query,
    resolved_query: evaluation.resolved_query || evaluation.normalized_query,
    alias_applied: tokenMeta.alias_applied,
    base_ingredient: base?.display_name || null,
    base_slug: evaluation.baseSlug || base?.slug || null,
    modifiers: (evaluation.modifiers || []).map((m) =>
      typeof m === "string" ? m : m.slug
    ),
    verdict: evaluation.verdict,
    halal_status: evaluation.halal_status,
    confidence_level: evaluation.confidence_level,
    confidence: evaluation.confidence,
    confidence_score: evaluation.confidence_score,
    warnings: evaluation.warnings || [],
    explanation: evaluation.explanation || "",
    explanation_source: evaluation.explanation_source || "template",
    ocr_uncertain: tokenMeta.ocr_uncertain,
  };
}

function summarizeIngredients(rows) {
  const summary = {
    halal: 0,
    usually_halal: 0,
    conditional: 0,
    usually_haram: 0,
    haram: 0,
    unknown: 0,
  };
  for (const row of rows) {
    const s = row.halal_status || row.verdict || "unknown";
    if (summary[s] !== undefined) summary[s]++;
    else summary.unknown++;
  }
  return summary;
}

/**
 * Run label scan pipeline on raw OCR text.
 * @param {string} rawOcrText
 * @param {object} [options]
 * @param {number} [options.ocrConfidence]
 * @param {string} [options.locale]
 * @param {boolean} [options.useAiExplanation] - default false for scan MVP
 * @returns {Promise<object>}
 */
export async function runIngredientLabelScan(rawOcrText, options = {}) {
  const { ocrConfidence = DEFAULT_OCR_CONFIDENCE, locale = "en" } = options;

  const tokens = tokenizeIngredientList(rawOcrText);
  const ocrUncertain = ocrConfidence < OCR_UNCERTAIN_THRESHOLD;

  const ingredients = [];
  for (const raw of tokens) {
    const tokenMeta = normalizeOcrToken(raw);
    if (!tokenMeta.query) continue;

    const evaluation = await lookupIngredientEvaluation(tokenMeta.query, {
      source: "ocr",
      locale,
      useAiExplanation: options.useAiExplanation === true,
    });

    ingredients.push(
      toScanIngredientRow(evaluation, {
        ...tokenMeta,
        ocr_uncertain: ocrUncertain,
      })
    );
  }

  return {
    contract_version: "1",
    pipeline_version: SCAN_PIPELINE_VERSION,
    summary: summarizeIngredients(ingredients),
    ingredients,
    parsed_count: tokens.length,
    evaluated_count: ingredients.length,
    ocr_confidence: ocrConfidence,
    meta: {
      locale,
      deterministic: true,
    },
  };
}
