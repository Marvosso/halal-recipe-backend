/**
 * Parse ingredient phrase into base text + modifiers (deterministic).
 */

import { MODIFIER_TAXONOMY, MODIFIER_MATCH_ORDER, MODIFIER_SLUG_ALIAS } from "./taxonomy.js";
import { normalizeForMatching } from "../normalize.js";

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

function matchExact(text, pattern) {
  if (typeof pattern === "string") {
    const idx = text.indexOf(pattern.toLowerCase());
    return idx >= 0 ? pattern : null;
  }
  const m = text.match(pattern);
  return m ? m[0] : null;
}

/**
 * Detect modifiers with full attribution.
 * @param {string} inputText
 * @param {{ fuzzy?: boolean, normalize?: boolean }} [options]
 */
export function detectModifierMatches(inputText, options = {}) {
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

      for (const pattern of Array.isArray(rule.exact) ? rule.exact : [rule.exact]) {
        const m = matchExact(normalizedText, pattern);
        if (m) {
          matchedText = m;
          matchType = "exact";
          break;
        }
      }

      if (!matchedText && fuzzy && rule.fuzzy) {
        for (const fuzzyVariant of rule.fuzzy) {
          const { matched, matchedText: ft } = fuzzySubstringMatch(
            normalizedText,
            fuzzyVariant.toLowerCase()
          );
          if (matched) {
            matchedText = ft || fuzzyVariant;
            matchType = "fuzzy";
            break;
          }
        }
      }

      if (matchedText) {
        modifiers.push({
          slug,
          displayName: entry.displayName,
          effect: entry.effect,
          ruleId: rule.id,
          matchedText,
          matchType,
        });
        seenSlug.add(slug);
        break;
      }
    }
  }

  return { normalizedText, modifiers };
}

/**
 * Remove matched modifier phrases to isolate base ingredient text.
 * @param {string} normalizedText
 * @param {Array<{ matchedText: string }>} modifiers
 */
export function extractBasePhrase(normalizedText, modifiers) {
  let remaining = normalizedText;
  const sorted = [...modifiers].sort(
    (a, b) => (b.matchedText?.length || 0) - (a.matchedText?.length || 0)
  );
  for (const { matchedText } of sorted) {
    if (!matchedText) continue;
    const escaped = matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    remaining = remaining.replace(new RegExp(escaped, "gi"), " ");
  }
  return remaining.replace(/\s+/g, " ").trim();
}

/**
 * Full phrase parse: modifiers + base phrase + canonical slugs.
 * @param {string} inputText
 * @param {object} [options]
 */
export function parseIngredientPhrase(inputText, options = {}) {
  const { normalizedText, modifiers } = detectModifierMatches(inputText, options);
  const basePhrase = extractBasePhrase(normalizedText, modifiers) || normalizedText;

  const slugs = modifiers.map((m) => MODIFIER_SLUG_ALIAS[m.slug] || m.slug);
  const uniqueSlugs = slugs.length ? [...new Set(slugs)] : ["unspecified"];

  return {
    normalizedText,
    basePhrase,
    modifiers,
    modifierSlugs: uniqueSlugs,
  };
}
