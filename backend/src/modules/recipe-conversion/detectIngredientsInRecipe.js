/**
 * Detect ingredient phrases in recipe text using DB bases + aliases (longest match first).
 */

import { getBaseSlugsForMatching, getLookupAliases } from "../../db/ingredientRepository.js";
import {
  BASE_KEYWORDS,
  INLINE_RULES,
  RECIPE_DETECTION_PHRASES,
} from "../ingredient-intelligence/constants.js";

const MAX_DETECTIONS = 40;

/**
 * @returns {Promise<Array<{ term: string, baseSlug: string }>>}
 */
async function buildSearchTerms() {
  const terms = new Map();
  const add = (term, baseSlug) => {
    const t = (term || "").trim().toLowerCase();
    if (!t || t.length < 2) return;
    const key = t.replace(/\s+/g, " ");
    if (!terms.has(key)) terms.set(key, baseSlug || key.replace(/\s+/g, "_"));
  };

  const slugs = await getBaseSlugsForMatching();
  for (const slug of slugs) {
    add(slug.replace(/_/g, " "), slug);
    add(slug, slug);
  }

  for (const slug of Object.keys(INLINE_RULES)) {
    add(slug.replace(/_/g, " "), slug);
  }

  for (const { slug } of BASE_KEYWORDS) {
    add(slug.replace(/_/g, " "), slug);
  }

  for (const { term, baseSlug } of RECIPE_DETECTION_PHRASES) {
    add(term, baseSlug);
  }

  const aliases = await getLookupAliases();
  for (const row of aliases) {
    add(row.alias_normalized, row.target_phrase.replace(/\s+/g, "_"));
    add(row.target_phrase, row.target_phrase.replace(/\s+/g, "_"));
  }

  return [...terms.entries()]
    .map(([term, baseSlug]) => ({ term, baseSlug }))
    .sort((a, b) => b.term.length - a.term.length);
}

/**
 * @param {string} recipeText
 * @returns {Promise<Array<{ matchedTerm: string, baseSlug: string, start: number, end: number }>>}
 */
export async function detectIngredientPhrasesInRecipe(recipeText) {
  if (!recipeText || typeof recipeText !== "string") return [];

  const searchTerms = await buildSearchTerms();
  const matches = [];
  const usedRanges = [];

  const overlaps = (start, end) =>
    usedRanges.some(([s, e]) => !(end <= s || start >= e));

  for (const { term, baseSlug } of searchTerms) {
    if (matches.length >= MAX_DETECTIONS) break;

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    let m;
    while ((m = regex.exec(recipeText)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (overlaps(start, end)) continue;
      usedRanges.push([start, end]);
      matches.push({
        matchedTerm: m[0],
        baseSlug,
        start,
        end,
      });
      break;
    }
  }

  return matches;
}
