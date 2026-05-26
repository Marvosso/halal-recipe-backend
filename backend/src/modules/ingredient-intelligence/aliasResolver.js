/**
 * Alias resolution: misspellings and shorthand → canonical phrase.
 */

import { INLINE_ALIASES } from "./constants.js";

/**
 * @param {string} normalizedText
 * @param {Array<{ alias_normalized: string, target_phrase: string }>} [dbAliases]
 * @returns {{ resolved: string, aliasApplied: boolean, matchQuality: "exact"|"alias"|"none" }}
 */
export function resolveAliases(normalizedText, dbAliases = []) {
  const text = (normalizedText || "").trim();
  if (!text) {
    return { resolved: "", aliasApplied: false, matchQuality: "none" };
  }

  const entries = [
    ...dbAliases.map((r) => ({
      alias: r.alias_normalized,
      target: r.target_phrase,
    })),
    ...INLINE_ALIASES.map((a) => ({ alias: a.alias, target: a.target })),
  ].sort((a, b) => b.alias.length - a.alias.length);

  const lower = text.toLowerCase();
  for (const { alias, target } of entries) {
    const a = alias.toLowerCase();
    if (lower === a) {
      return { resolved: target.toLowerCase(), aliasApplied: true, matchQuality: "alias" };
    }
    if (lower.includes(a)) {
      return {
        resolved: lower.replace(a, target.toLowerCase()).replace(/\s+/g, " ").trim(),
        aliasApplied: true,
        matchQuality: "alias",
      };
    }
  }

  return { resolved: text, aliasApplied: false, matchQuality: "exact" };
}
