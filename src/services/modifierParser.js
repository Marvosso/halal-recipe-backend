/**
 * Modifier parser: parse user queries into base ingredient + modifiers with rule attribution.
 * Supports exact and fuzzy matching; handles OCR-cleaned and normal typed text.
 */

import { MODIFIER_TAXONOMY, MODIFIER_MATCH_ORDER, MODIFIER_SLUG_ALIAS } from "./modifierTaxonomy.js";

/**
 * Normalize text for matching: lowercase, collapse spaces, replace punctuation with space.
 * Safe for both OCR-cleaned and typed input.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeForMatching(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, " ");
}

/**
 * Simple fuzzy match: true if target appears in text or has at most one character difference (substring).
 * Used for OCR/typo variants. Not full Levenshtein; checks if text contains something close to target.
 * @param {string} text - Normalized full text
 * @param {string} target - Normalized fuzzy variant (e.g. "certifled")
 * @returns {{ matched: boolean, matchedText?: string }}
 */
function fuzzySubstringMatch(text, target) {
  if (!target || target.length < 3) return { matched: false };
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word === target) return { matched: true, matchedText: word };
    if (word.length >= target.length - 1 && word.length <= target.length + 1) {
      let diffs = 0;
      for (let i = 0; i < Math.min(word.length, target.length) && diffs <= 1; i++) {
        if (word[i] !== target[i]) diffs++;
      }
      if (diffs <= 1 && Math.abs(word.length - target.length) <= 1) {
        return { matched: true, matchedText: word };
      }
    }
  }
  return { matched: false };
}

/**
 * Test one exact pattern (string or RegExp) against text. Returns matched substring or null.
 * @param {string} text
 * @param {string|RegExp} pattern
 * @returns {string|null}
 */
function matchExact(text, pattern) {
  if (typeof pattern === "string") {
    const idx = text.indexOf(pattern.toLowerCase());
    return idx >= 0 ? pattern : null;
  }
  const m = text.match(pattern);
  return m ? m[0] : null;
}

/**
 * Parse normalized ingredient text into a list of detected modifiers with rule attribution.
 * Strategy: for each modifier slug in MODIFIER_MATCH_ORDER, try exact rules first, then fuzzy.
 * Each modifier can only appear once (first matching rule wins).
 *
 * @param {string} inputText - Raw or pre-normalized ingredient phrase
 * @param {object} [options]
 * @param {boolean} [options.normalize=true] - Run normalizeForMatching on input
 * @param {boolean} [options.fuzzy=true] - Enable fuzzy matching for OCR/typos
 * @returns {{ normalizedText: string, modifiers: Array<{ slug: string, displayName: string, ruleId: string, matchedText: string, matchType: 'exact'|'fuzzy' }> }}
 */
export function parseModifiers(inputText, options = {}) {
  const { normalize = true, fuzzy = true } = options;
  const normalizedText = normalize ? normalizeForMatching(inputText) : (inputText || "").toLowerCase();
  const modifiers = [];
  const seenSlug = new Set();

  for (const slug of MODIFIER_MATCH_ORDER) {
    const entry = MODIFIER_TAXONOMY[slug];
    if (!entry || seenSlug.has(slug)) continue;

    for (const rule of entry.rules) {
      let matchedText = null;
      let matchType = null;

      // Exact
      const exactPatterns = Array.isArray(rule.exact) ? rule.exact : [rule.exact];
      for (const pattern of exactPatterns) {
        const m = matchExact(normalizedText, pattern);
        if (m) {
          matchedText = m;
          matchType = "exact";
          break;
        }
      }
      if (matchedText) {
        modifiers.push({
          slug,
          displayName: entry.displayName,
          ruleId: rule.id,
          matchedText,
          matchType,
        });
        seenSlug.add(slug);
        break;
      }

      // Fuzzy (only if fuzzy enabled and rule has fuzzy list)
      if (fuzzy && rule.fuzzy) {
        for (const fuzzyVariant of rule.fuzzy) {
          const { matched, matchedText: ft } = fuzzySubstringMatch(normalizedText, fuzzyVariant.toLowerCase());
          if (matched) {
            modifiers.push({
              slug,
              displayName: entry.displayName,
              ruleId: rule.id,
              matchedText: ft || fuzzyVariant,
              matchType: "fuzzy",
            });
            seenSlug.add(slug);
            break;
          }
        }
        if (seenSlug.has(slug)) break;
      }
    }
  }

  return { normalizedText, modifiers };
}

/**
 * Get modifier slugs only (for engine compatibility). Uses MODIFIER_SLUG_ALIAS.
 * @param {string} inputText
 * @param {object} [options]
 * @returns {string[]}
 */
export function getModifierSlugs(inputText, options = {}) {
  const { modifiers } = parseModifiers(inputText, options);
  return modifiers.map((m) => (MODIFIER_SLUG_ALIAS && MODIFIER_SLUG_ALIAS[m.slug]) || m.slug);
}
