/**
 * Deterministic ingredient text normalization (no AI).
 */

const QUANTITY_PREFIX =
  /^[\d\s\/\.\,]+(?:\s*(?:cup|cups|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|liter|litre|pound|ounces?|teaspoon|tablespoon)s?)?\s+/i;

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeIngredientText(raw) {
  if (!raw || typeof raw !== "string") return "";
  let t = raw.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
  t = t.replace(/[''`]/g, "'");
  t = t.replace(/-/g, " ");
  t = t.replace(/[^\w\s]/g, " ");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/**
 * Strip leading quantities/units for matching.
 * @param {string} normalized
 * @returns {string}
 */
export function stripQuantityPrefix(normalized) {
  if (!normalized) return "";
  let t = normalized;
  let prev = "";
  while (t !== prev) {
    prev = t;
    t = t.replace(QUANTITY_PREFIX, "").trim();
  }
  return t;
}

/**
 * Full normalize pipeline stage for engine input.
 * @param {string} raw
 * @returns {{ original: string, normalized: string, stripped: string }}
 */
/**
 * Match-normalize (modifiers/OCR): lowercase, collapse spaces, strip punctuation.
 * @param {string} raw
 */
export function normalizeForMatching(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, " ");
}

export function normalizePipeline(raw) {
  const original = (raw && String(raw)) || "";
  const normalized = normalizeIngredientText(original);
  const stripped = stripQuantityPrefix(normalized);
  return {
    original,
    normalized,
    stripped: stripped || normalized,
  };
}
