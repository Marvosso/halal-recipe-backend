/**
 * Ingredient label tokenization — deterministic parsing of OCR text.
 */

const SPLIT_REGEX = /[\n,;]|\s+and\s+|\s+&\s+/gi;
const LEADING_NUMBER_BULLET = /^\s*[\d.]+\s*[.)]\s*/;
const PAREN_CONTENT = /\s*\([^)]*\)\s*/g;
const MIN_LENGTH = 2;
const MAX_LENGTH = 120;

const SKIP_PREFIXES = [
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

/**
 * @param {string} token
 * @returns {string}
 */
export function cleanIngredientToken(token) {
  if (!token || typeof token !== "string") return "";
  let s = token.trim();
  s = s.replace(LEADING_NUMBER_BULLET, "");
  s = s.replace(PAREN_CONTENT, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/\s*[*†‡§]\s*$/, "").trim();
  s = s.replace(/\s+/g, " ").replace(/\s*\.\s*/g, " ").trim();
  return s;
}

/**
 * @param {string} token
 * @returns {boolean}
 */
export function looksLikeIngredientToken(token) {
  if (!token || token.length < MIN_LENGTH || token.length > MAX_LENGTH) return false;
  const digits = (token.match(/\d/g) || []).length;
  if (digits > token.length / 2) return false;
  const lower = token.toLowerCase();
  if (SKIP_PREFIXES.some((p) => lower.startsWith(p))) return false;
  return true;
}

/**
 * Split raw OCR / label text into ingredient tokens (order preserved, deduped).
 * @param {string} rawText
 * @returns {string[]}
 */
export function tokenizeIngredientList(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const parts = text
    .split(SPLIT_REGEX)
    .map((p) => cleanIngredientToken(p))
    .filter(Boolean);

  const seen = new Set();
  const result = [];
  for (const part of parts) {
    if (!looksLikeIngredientToken(part)) continue;
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(part);
  }
  return result;
}

/** @deprecated Use tokenizeIngredientList */
export function parseIngredientList(rawText) {
  return tokenizeIngredientList(rawText);
}
