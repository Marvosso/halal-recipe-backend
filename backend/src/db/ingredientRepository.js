/**
 * Ingredient intelligence data access — DB with in-code fallback (migration-safe).
 */

import { getPool } from "../database.js";
import { getRule, getBaseSlugs } from "./ingredientRules.js";
import {
  CATEGORY_DEFAULTS,
  INLINE_ALIASES,
  INLINE_RULES,
  UNKNOWN_DEFAULT,
} from "../modules/ingredient-intelligence/constants.js";

let dbUnavailable = false;

function isDbEnabled() {
  return process.env.INGREDIENT_INTELLIGENCE_DB === "1";
}

function safePool() {
  if (!isDbEnabled() || dbUnavailable) {
    return null;
  }
  try {
    return getPool();
  } catch {
    dbUnavailable = true;
    return null;
  }
}

function markDbUnavailable() {
  dbUnavailable = true;
}

let taxonomyCache = null;
let taxonomyCacheTime = 0;
let aliasCache = null;
let aliasCacheTime = 0;
const CACHE_TTL_MS = 60_000;

/**
 * @returns {Promise<Array<{ alias_normalized: string, target_phrase: string }>>}
 */
export async function getLookupAliases() {
  const pool = safePool();
  if (!pool) {
    return INLINE_ALIASES.map((a) => ({
      alias_normalized: a.alias,
      target_phrase: a.target,
    }));
  }

  if (aliasCache && Date.now() - aliasCacheTime < CACHE_TTL_MS) {
    return aliasCache;
  }

  try {
    const result = await pool.query(
      `SELECT alias_normalized, target_phrase FROM ingredient_lookup_aliases ORDER BY LENGTH(alias_normalized) DESC`
    );
    if (result.rows.length > 0) {
      aliasCache = result.rows;
      aliasCacheTime = Date.now();
      return aliasCache;
    }
  } catch (_) {
    markDbUnavailable();
  }

  return INLINE_ALIASES.map((a) => ({
    alias_normalized: a.alias,
    target_phrase: a.target,
  }));
}

/**
 * @returns {Promise<Record<string, { verdict: string, confidence: string }>>}
 */
export async function getTaxonomyDefaults() {
  const pool = safePool();
  if (!pool) return { ...CATEGORY_DEFAULTS };

  if (taxonomyCache && Date.now() - taxonomyCacheTime < CACHE_TTL_MS) {
    return taxonomyCache;
  }

  try {
    const result = await pool.query(
      `SELECT category, default_verdict, default_confidence, notes_template FROM ingredient_taxonomy_defaults`
    );
    if (result.rows.length > 0) {
      taxonomyCache = {};
      for (const row of result.rows) {
        taxonomyCache[row.category] = {
          verdict: row.default_verdict,
          confidence: row.default_confidence,
          notes: row.notes_template || "",
        };
      }
      taxonomyCacheTime = Date.now();
      return taxonomyCache;
    }
  } catch (_) {
    markDbUnavailable();
  }

  return { ...CATEGORY_DEFAULTS };
}

/**
 * @param {string} baseSlug
 * @param {string} modifierSlug
 */
export async function getIngredientRule(baseSlug, modifierSlug = "unspecified") {
  const mod = modifierSlug || "unspecified";
  const dbRule = await getRule(baseSlug, mod);
  if (dbRule) {
    return {
      verdict: mapDbStatusToVerdict(dbRule.halal_status),
      confidence: dbRule.halal_status === "halal" || dbRule.halal_status === "haram" ? "high" : "medium",
      notes: dbRule.notes || "",
      alternatives: dbRule.alternatives || [],
      ruleSource: "override",
    };
  }

  const baseRules = INLINE_RULES[baseSlug];
  if (baseRules) {
    const rule = baseRules[mod] || baseRules.unspecified;
    if (rule) {
      return { ...rule, alternatives: rule.alternatives || [], ruleSource: "override" };
    }
  }

  return null;
}

function mapDbStatusToVerdict(halalStatus) {
  if (halalStatus === "halal") return "halal";
  if (halalStatus === "haram") return "haram";
  if (halalStatus === "conditional") return "conditional";
  return "conditional";
}

/**
 * @returns {Promise<string[]>}
 */
export async function getBaseSlugsForMatching() {
  const slugs = await getBaseSlugs();
  if (slugs.length > 0) return slugs;
  return Object.keys(INLINE_RULES);
}

/**
 * @param {string|null} category
 * @param {Record<string, object>} taxonomyDefaults
 */
export function getCategoryDefault(category, taxonomyDefaults) {
  if (!category) return UNKNOWN_DEFAULT;
  const def = taxonomyDefaults[category] || CATEGORY_DEFAULTS[category];
  return def || UNKNOWN_DEFAULT;
}
