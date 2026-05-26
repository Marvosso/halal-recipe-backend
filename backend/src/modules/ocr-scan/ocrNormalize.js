/**
 * Deterministic OCR normalization + alias cleanup before intelligence engine.
 */

import {
  normalizeIngredientText,
  normalizePipeline,
  stripQuantityPrefix,
} from "../ingredient-intelligence/normalize.js";
import { resolveAliases } from "../ingredient-intelligence/aliasResolver.js";

/** Common OCR character confusions (word-boundary safe). */
const OCR_REPLACEMENTS = [
  [/\bfl0ur\b/gi, "flour"],
  [/\bglutcn\b/gi, "gluten"],
  [/\bgelat1n\b/gi, "gelatin"],
  [/\bvanil1a\b/gi, "vanilla"],
  [/\bs0y\b/gi, "soy"],
  [/\bsuger\b/gi, "sugar"],
  [/\bwheal\b/gi, "wheat"],
  [/\bm1lk\b/gi, "milk"],
  [/\b0il\b/gi, "oil"],
  [/\brn\b/g, "m"],
];

/**
 * Fix obvious OCR glitches without changing meaning aggressively.
 * @param {string} raw
 * @returns {string}
 */
export function fixOcrGlitches(raw) {
  if (!raw || typeof raw !== "string") return "";
  let t = raw.trim();
  for (const [pattern, replacement] of OCR_REPLACEMENTS) {
    t = t.replace(pattern, replacement);
  }
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Full deterministic normalize for a single ingredient token.
 * @param {string} rawToken
 * @returns {{ raw: string, cleaned: string, query: string, alias_applied: boolean }}
 */
export function normalizeOcrToken(rawToken) {
  const raw = (rawToken && String(rawToken)) || "";
  const glitchFixed = fixOcrGlitches(raw);
  const { stripped, normalized } = normalizePipeline(glitchFixed);
  const base = stripQuantityPrefix(stripped) || stripped || normalized;
  const aliasResult = resolveAliases(base);
  const query = aliasResult.resolved || base;

  return {
    raw,
    cleaned: glitchFixed,
    query,
    alias_applied: aliasResult.aliasApplied,
  };
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function cleanToken(raw) {
  return normalizeIngredientText(fixOcrGlitches(raw)).replace(/\s+/g, " ");
}
