/**
 * Deterministic halal rule engine.
 * Evaluation order: 1) normalize 2) identify base 3) detect modifiers
 * 4) apply hard overrides 5) apply category defaults 6) return verdict + confidence.
 */

import { getRule, getBaseSlugs } from "../db/ingredientRules.js";
import { getIngredientDetails } from "../utils/halalEngine.js";
import {
  BASE_CATEGORIES,
  BASE_KEYWORDS,
  CATEGORY_DEFAULTS,
  HARD_OVERRIDES,
  UNKNOWN_DEFAULT,
} from "./halalRuleEngineConstants.js";
import { parseModifiers, normalizeForMatching } from "./modifierParser.js";
import { MODIFIER_SLUG_ALIAS } from "./modifierTaxonomy.js";

// In-memory cache of base slugs from DB
let baseSlugsCache = [];
let baseSlugsCacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function getCachedBaseSlugs() {
  if (Date.now() - baseSlugsCacheTime < CACHE_TTL_MS && baseSlugsCache.length > 0) {
    return baseSlugsCache;
  }
  baseSlugsCache = await getBaseSlugs();
  baseSlugsCacheTime = Date.now();
  return baseSlugsCache;
}

// --- 1. Normalize input ---

/**
 * Normalize ingredient text for matching (deterministic, no AI).
 * @param {string} raw
 * @returns {string}
 */
export function normalizeIngredientText(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, " ");
}

// --- 2. Identify base ingredient ---

/**
 * Identify base ingredient slug and category. Uses DB bases first, then in-code BASE_KEYWORDS.
 * @param {string} normalizedText
 * @returns {Promise<{ baseSlug: string|null, category: string|null }>}
 */
export async function identifyBaseIngredient(normalizedText) {
  const t = normalizedText.replace(/\s+/g, " ").trim();
  if (!t) return { baseSlug: null, category: null };

  // DB bases first (e.g. gelatin, soy_sauce, vanilla_extract)
  const dbBases = await getCachedBaseSlugs();
  for (const base of dbBases) {
    const baseNorm = base.replace(/_/g, " ");
    const tCompact = t.replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
    const baseCompact = base.replace(/_/g, "");
    if (t.includes(baseNorm) || tCompact.includes(baseCompact)) {
      const category = BASE_CATEGORIES[base] ?? "animal_byproduct";
      return { baseSlug: base, category };
    }
  }

  // In-code keywords (e.g. rice, gelatin, vanilla)
  for (const { slug, pattern, category } of BASE_KEYWORDS) {
    if (pattern.test(normalizedText)) return { baseSlug: slug, category };
  }

  return { baseSlug: null, category: null };
}

// --- 3. Detect modifiers ---

/**
 * Detect all applicable modifiers from normalized text using taxonomy + parser.
 * Returns slugs (with alias applied for engine) and full modifier details (which rule triggered).
 * @param {string} normalizedText
 * @param {string|null} baseSlug
 * @param {object} [options] - { fuzzy: boolean }
 * @returns {{ slugs: string[], modifierDetails: Array<{ slug: string, displayName: string, ruleId: string, matchedText: string, matchType: string }> }}
 */
export function detectModifiers(normalizedText, baseSlug, options = {}) {
  const { normalizedText: norm, modifiers } = parseModifiers(normalizedText, { normalize: false, ...options });
  const slugs = modifiers.map((m) => (MODIFIER_SLUG_ALIAS && MODIFIER_SLUG_ALIAS[m.slug]) || m.slug);
  // Vanilla-specific: "powder" or "bean paste" -> plant (alcohol-free)
  const lower = (normalizedText || norm).toLowerCase();
  if (baseSlug === "vanilla_extract" && /\b(powder|bean\s*paste)\b/i.test(lower)) {
    if (!slugs.includes("plant")) slugs.push("plant");
    if (!modifiers.some((m) => (MODIFIER_SLUG_ALIAS && MODIFIER_SLUG_ALIAS[m.slug]) === "plant")) {
      modifiers.push({
        slug: "plant_based",
        displayName: "Plant-based",
        ruleId: "vanilla_powder_bean",
        matchedText: lower.match(/\b(powder|bean\s*paste)\b/i)?.[0] || "powder",
        matchType: "exact",
      });
    }
  }
  return {
    slugs: slugs.length ? slugs : ["unspecified"],
    modifierDetails: modifiers,
  };
}

// --- 4. Hard overrides ---

/**
 * Apply hard overrides. First match wins. Returns null if no override matches.
 * @param {string[]} modifiers
 * @param {string|null} category
 * @returns {{ verdict: string, confidence: string, reason: string } | null}
 */
export function applyHardOverrides(modifiers, category) {
  for (const override of HARD_OVERRIDES) {
    if (override.when(modifiers, category)) {
      return {
        verdict: override.verdict,
        confidence: override.confidence,
        reason: override.reason,
      };
    }
  }
  return null;
}

// --- 5. Category defaults ---

/**
 * Get verdict and confidence from category default.
 * @param {string|null} category
 * @returns {{ verdict: string, confidence: string }}
 */
export function applyCategoryDefaults(category) {
  if (!category) return UNKNOWN_DEFAULT;
  const def = CATEGORY_DEFAULTS[category];
  return def || UNKNOWN_DEFAULT;
}

// --- 6. DB rule lookup (specific base+modifier) ---

/**
 * Map DB halal_status to engine verdict. DB may only have halal|conditional|haram.
 */
function dbStatusToVerdict(dbStatus) {
  if (dbStatus === "halal") return "halal";
  if (dbStatus === "haram") return "haram";
  if (dbStatus === "conditional") return "conditional";
  return "conditional";
}

/**
 * Get draft verdict from DB rule if available (before hard overrides).
 * @param {string} baseSlug
 * @param {string} primaryModifier - first modifier or 'unspecified'
 * @returns {Promise<{ verdict: string, confidence: string, notes: string, alternatives: string[] } | null>}
 */
async function getDraftFromDb(baseSlug, primaryModifier) {
  const rule = await getRule(baseSlug, primaryModifier);
  if (!rule) return null;
  const verdict = dbStatusToVerdict(rule.halal_status);
  const confidence = verdict === "halal" || verdict === "haram" ? "high" : "medium";
  return {
    verdict,
    confidence,
    notes: rule.notes || "",
    alternatives: rule.alternatives || [],
  };
}

// --- Main evaluation pipeline ---

/**
 * Run the full deterministic pipeline and return final verdict + confidence level.
 * Evaluation order: normalize -> identify base -> detect modifiers -> apply hard overrides -> apply category defaults -> return.
 *
 * @param {string} ingredientPhrase - raw ingredient text
 * @param {object} [userPreferences] - for fallback JSON engine when base unknown
 * @returns {Promise<{
 *   normalizedInput: string,
 *   baseSlug: string|null,
 *   category: string|null,
 *   modifiers: string[],
 *   verdict: string,
 *   confidence_level: string,
 *   notes: string,
 *   alternatives: string[],
 *   source: 'rule_engine'|'fallback',
 *   halal_status: string,
 *   confidence: number
 * }>}
 */
export async function evaluateIngredient(ingredientPhrase, userPreferences = {}) {
  // 1. Normalize input
  const normalizedInput = normalizeIngredientText(ingredientPhrase);
  if (!normalizedInput) {
    return buildResult(normalizedInput, null, null, [], [], "unknown", "low", "", [], "fallback");
  }

  // 2. Identify base ingredient
  const { baseSlug, category } = await identifyBaseIngredient(normalizedInput);

  // If no base identified, try JSON fallback then unknown
  if (!baseSlug && !category) {
    const fallback = fallbackToJson(ingredientPhrase, userPreferences);
    if (fallback) return fallback;
    return buildResult(normalizedInput, null, null, ["unspecified"], [], "unknown", "low", "", [], "fallback");
  }

  // 3. Detect modifiers
  const { slugs, modifierDetails } = detectModifiers(normalizedInput, baseSlug);
  const primaryModifier = slugs[0] === "unspecified" ? "unspecified" : slugs[0];

  // 4. Apply hard overrides (take precedence)
  const override = applyHardOverrides(slugs, category);
  if (override) {
    return buildResult(
      normalizedInput,
      baseSlug,
      category,
      slugs,
      modifierDetails,
      override.verdict,
      override.confidence,
      override.reason,
      getAlternativesForVerdict(override.verdict, baseSlug),
      "rule_engine"
    );
  }

  // 5a. Try DB rule for (base, primaryModifier)
  if (baseSlug) {
    const draft = await getDraftFromDb(baseSlug, primaryModifier);
    if (draft) {
      return buildResult(
        normalizedInput,
        baseSlug,
        category,
        slugs,
        modifierDetails,
        draft.verdict,
        draft.confidence,
        draft.notes,
        draft.alternatives,
        "rule_engine"
      );
    }
  }

  // 5b. Apply category defaults
  const defaultResult = applyCategoryDefaults(category);
  const notes =
    category === "animal_byproduct"
      ? "Source unknown; must be halal-certified if animal-derived."
      : category === "flavoring_extract"
        ? "Often alcohol-based; check label or use alcohol-free."
        : "";
  const alternatives = getAlternativesForVerdict(defaultResult.verdict, baseSlug);

  return buildResult(
    normalizedInput,
    baseSlug,
    category,
    slugs,
    modifierDetails,
    defaultResult.verdict,
    defaultResult.confidence,
    notes,
    alternatives,
    "rule_engine"
  );
}

/**
 * Build alternatives for a verdict (for category default path when no DB rule).
 */
function getAlternativesForVerdict(verdict, baseSlug) {
  if (verdict === "halal") return [];
  const byBase = {
    gelatin: ["agar_agar", "halal_beef_gelatin", "pectin"],
    vanilla_extract: ["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"],
    soy_sauce: ["halal_certified_soy_sauce", "tamari_alcohol_free"],
  };
  return byBase[baseSlug] || [];
}

/**
 * Build unified result shape (verdict + confidence_level + modifier details + legacy fields).
 */
function buildResult(
  normalizedInput,
  baseSlug,
  category,
  modifiers,
  modifierDetails,
  verdict,
  confidenceLevel,
  notes,
  alternatives,
  source
) {
  // Legacy: halal_status (map usually_halal -> halal, usually_haram -> haram for backward compat)
  const halal_status =
    verdict === "usually_halal" ? "halal" : verdict === "usually_haram" ? "haram" : verdict;
  const confidence =
    confidenceLevel === "high" ? 1.0 : confidenceLevel === "medium" ? 0.6 : 0.3;

  return {
    normalizedInput,
    baseSlug,
    category,
    modifiers,
    modifierDetails: modifierDetails || [],
    verdict,
    confidence_level: confidenceLevel,
    notes,
    alternatives,
    source,
    // Legacy shape for existing consumers
    base_slug: baseSlug,
    modifier_slug: modifiers[0] || "unspecified",
    halal_status,
    confidence,
  };
}

/**
 * Fallback when base is unknown: use existing halal knowledge (JSON).
 */
function fallbackToJson(ingredientPhrase, userPreferences) {
  const details = getIngredientDetails(ingredientPhrase, userPreferences);
  if (!details) return null;
  const status = details.status || "unknown";
  const verdict = status === "haram" ? "haram" : status === "halal" ? "halal" : "conditional";
  const confidenceLevel = status === "haram" || status === "halal" ? "high" : "medium";
  return buildResult(
    normalizeIngredientText(ingredientPhrase),
    details.name || null,
    null,
    ["unspecified"],
    [],
    verdict,
    confidenceLevel,
    details.notes || "",
    details.alternatives || [],
    "fallback"
  );
}
