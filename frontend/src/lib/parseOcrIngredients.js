/**
 * Parse raw OCR text from an ingredient label into a list of ingredient tokens.
 * Handles commas, newlines, numbers, "and", parentheticals, and common label noise.
 */

const INGREDIENT_SPLIT_REGEX = /[\n,;]|\s+and\s+|\s+&\s+/gi;
const LEADING_NUMBER_BULLET = /^\s*[\d.]+\s*[.)]\s*/;
const PAREN_CONTENT = /\s*\([^)]*\)\s*/g;
const MIN_INGREDIENT_LENGTH = 2;
const MAX_INGREDIENT_LENGTH = 120;

/**
 * Normalize a single token for deduplication and lookup.
 * @param {string} raw
 * @returns {string}
 */
function normalizeToken(raw) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*\.\s*$/, "")
    .replace(/^\s*[-*•]\s*/, "");
}

/**
 * Strip common label noise (percentages, "contains", etc.) and trim.
 * @param {string} token
 * @returns {string}
 */
function cleanToken(token) {
  let s = token.trim();
  // Remove leading numbers/bullets: "1. Sugar" -> "Sugar"
  s = s.replace(LEADING_NUMBER_BULLET, "");
  // Optionally strip parenthetical content (e.g. "wheat (gluten)") - keep for context, just trim
  s = s.replace(PAREN_CONTENT, " ").replace(/\s+/g, " ").trim();
  // Remove trailing asterisk or footnote markers
  s = s.replace(/\s*[*†‡§]\s*$/, "").trim();
  return s;
}

/**
 * Check if token looks like an ingredient (not a section header or noise).
 * @param {string} token
 * @returns {boolean}
 */
function looksLikeIngredient(token) {
  if (!token || token.length < MIN_INGREDIENT_LENGTH) return false;
  if (token.length > MAX_INGREDIENT_LENGTH) return false;
  // Skip lines that are mostly numbers (e.g. nutrition facts)
  const digits = (token.match(/\d/g) || []).length;
  if (digits > token.length / 2) return false;
  // Skip common label headers
  const lower = token.toLowerCase();
  const skipStarts = [
    "ingredients:",
    "contains:",
    "allergen",
    "nutrition",
    "serving",
    "calories",
    "product of",
    "manufactured",
    "distributed by",
    "best before",
    "exp ",
    "©",
    "™",
    "®",
  ];
  if (skipStarts.some((p) => lower.startsWith(p))) return false;
  return true;
}

/**
 * Parse OCR text into a list of unique, cleaned ingredient strings.
 * @param {string} ocrText - Raw text from OCR (e.g. Tesseract)
 * @returns {string[]} Array of ingredient strings, order preserved, duplicates removed by normalized form
 */
export function parseOcrIngredients(ocrText) {
  if (!ocrText || typeof ocrText !== "string") return [];

  const rawParts = ocrText
    .split(INGREDIENT_SPLIT_REGEX)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set();
  const result = [];

  for (const part of rawParts) {
    const cleaned = cleanToken(part);
    if (!cleaned) continue;
    if (!looksLikeIngredient(cleaned)) continue;

    const normalized = normalizeToken(cleaned);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    result.push(cleaned);
  }

  return result;
}
