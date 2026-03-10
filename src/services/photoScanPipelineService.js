/**
 * Photo scan pipeline for Halal Kitchen ingredient analysis.
 * Flow: raw OCR text → parse into tokens → normalize (AI only for text) → rule engine evaluates each.
 * Halal verdicts come only from the deterministic rule engine; AI is used only for text normalization.
 */

import { evaluateIngredient } from "./ingredientRuleEngine.js";
import { normalizeIngredientOCR } from "./aiReasoningService.js";

/** Default OCR confidence when not provided (treat as medium). */
const DEFAULT_OCR_CONFIDENCE = 0.7;
/** Below this, we set ocr_uncertain: true on all ingredients. */
const OCR_UNCERTAIN_THRESHOLD = 0.5;

/**
 * Split raw OCR text into ingredient tokens.
 * Handles: commas, semicolons, newlines; "and" as separator; trims and drops empty.
 * @param {string} rawText
 * @returns {string[]}
 */
export function parseIngredientList(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  let text = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  // Split on comma, semicolon, or newline (and optionally " and " as separator)
  const parts = text
    .split(/[\n,;]+/)
    .flatMap((p) => p.split(/\s+and\s+/i))
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return [...new Set(parts)]; // dedupe by order
}

/**
 * Clean a single token: collapse spaces, fix common OCR glitches (optional).
 * Does not change meaning; for semantic normalization use normalizeIngredientOCR.
 * @param {string} token
 * @returns {string}
 */
export function cleanToken(token) {
  if (!token || typeof token !== "string") return "";
  return token
    .replace(/\s+/g, " ")
    .replace(/\s*\.\s*/g, " ")
    .trim();
}

/**
 * Normalize a token for rule-engine matching. AI may correct obvious OCR errors;
 * verdict remains from rule engine only.
 * @param {string} token
 * @returns {Promise<{ normalized: string, changed: boolean }>}
 */
export async function normalizeToken(token) {
  const cleaned = cleanToken(token);
  if (!cleaned) return { normalized: "", changed: false };

  const normalized = await normalizeIngredientOCR(cleaned);
  const use = (normalized && normalized.trim()) ? normalized.trim() : cleaned;
  return {
    normalized: use,
    changed: use !== cleaned,
  };
}

/**
 * Run full pipeline: parse → normalize each token → evaluate each with rule engine.
 * @param {string} rawOcrText - Raw text from OCR (or pasted ingredient list)
 * @param {object} [options]
 * @param {object} [options.userPreferences] - For rule engine
 * @param {number} [options.ocrConfidence] - 0–1; when < 0.5, ingredients get ocr_uncertain: true
 * @param {boolean} [options.useAINormalization] - If true, run AI normalization per token (default true)
 * @returns {Promise<PhotoScanResult>}
 */
export async function runPhotoScanPipeline(rawOcrText, options = {}) {
  const {
    userPreferences = {},
    ocrConfidence = DEFAULT_OCR_CONFIDENCE,
    useAINormalization = true,
  } = options;

  const tokens = parseIngredientList(rawOcrText);
  const ocrUncertain = ocrConfidence < OCR_UNCERTAIN_THRESHOLD;

  const ingredients = [];
  for (const raw of tokens) {
    const { normalized, changed } = useAINormalization
      ? await normalizeToken(raw)
      : { normalized: cleanToken(raw), changed: false };

    const displayText = normalized || raw;
    if (!displayText) continue;

    const ruleResult = await evaluateIngredient(displayText, userPreferences);

    ingredients.push({
      raw,
      normalized: changed ? displayText : undefined,
      ingredient: displayText,
      halal_status: ruleResult.halal_status ?? "unknown",
      confidence: ruleResult.confidence != null ? ruleResult.confidence : 0.5,
      explanation: ruleResult.notes || null,
      ocr_uncertain: ocrUncertain || (useAINormalization && changed),
    });
  }

  const summary = summarizeResults(ingredients);

  return {
    summary,
    ingredients,
    ocr_confidence: ocrConfidence,
  };
}

/**
 * @typedef {object} PhotoScanResult
 * @property {{ halal: number, conditional: number, haram: number, unknown: number }} summary
 * @property {Array<{ raw: string, normalized?: string, ingredient: string, halal_status: string, confidence: number, explanation: string|null, ocr_uncertain: boolean }>} ingredients
 * @property {number} ocr_confidence
 */

function summarizeResults(ingredients) {
  const summary = { halal: 0, conditional: 0, haram: 0, unknown: 0 };
  for (const i of ingredients) {
    const s = i.halal_status || "unknown";
    if (summary[s] !== undefined) summary[s]++;
    else summary.unknown++;
  }
  return summary;
}
