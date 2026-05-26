/**
 * IngredientEvaluationV1 — canonical shared response contract.
 * Used by: POST /api/lookup, scan rows, classify-ingredient (legacy envelope), share/SEO adapters.
 *
 * Deterministic fields (verdict, halal_status, confidence) MUST originate from ingredient-intelligence.
 */

import {
  normalizeConfidence,
  clampConfidenceScore,
  displayConfidencePercent,
  confidenceLevelFromScore,
} from "./confidenceV1.js";

export {
  normalizeConfidence,
  clampConfidenceScore,
  displayConfidencePercent,
  confidenceLevelFromScore,
};

export const INGREDIENT_EVALUATION_CONTRACT_VERSION = "1";

export const VERDICTS = Object.freeze([
  "halal",
  "usually_halal",
  "conditional",
  "usually_haram",
  "haram",
  "unknown",
]);

export const HALAL_STATUSES = Object.freeze(["halal", "conditional", "haram", "unknown"]);

/**
 * @typedef {object} WarningV1
 * @property {string} message
 * @property {'low'|'medium'|'high'} [severity]
 * @property {string} [type]
 */

/**
 * @typedef {object} ConfidenceV1
 * @property {'high'|'medium'|'low'} level
 * @property {number} score - 0–100
 * @property {number} [value] - 0–1 optional
 */

/**
 * @typedef {object} SubstituteV1
 * @property {string} [slug]
 * @property {string} name
 * @property {string} [reason]
 * @property {string} [notes]
 * @property {number} [score]
 */

/**
 * @typedef {object} SubstitutesV1
 * @property {SubstituteV1|null} best
 * @property {SubstituteV1[]} alternatives
 */

/**
 * @typedef {object} BaseIngredientV1
 * @property {string} slug
 * @property {string} display_name
 * @property {string} [category]
 */

/**
 * @typedef {object} IngredientEvaluationV1
 * @property {"1"} contract_version
 * @property {string} ingredient
 * @property {string} query
 * @property {string} [resolved_query]
 * @property {BaseIngredientV1|null} base_ingredient
 * @property {string[]} modifiers
 * @property {object[]} [modifier_details]
 * @property {string} verdict
 * @property {string} halal_status
 * @property {ConfidenceV1} confidence
 * @property {WarningV1[]} warnings
 * @property {string} explanation
 * @property {string} [explanation_source]
 * @property {object[]} references
 * @property {SubstitutesV1} substitutes
 * @property {object} [meta]
 */

/**
 * @param {unknown} w
 * @returns {WarningV1}
 */
export function normalizeWarning(w) {
  if (typeof w === "string") {
    return { message: w, severity: "medium" };
  }
  if (w && typeof w === "object") {
    return {
      message: w.message || String(w),
      severity: w.severity || "medium",
      type: w.type,
    };
  }
  return { message: String(w), severity: "medium" };
}

/**
 * @param {unknown} warnings
 * @returns {WarningV1[]}
 */
export function normalizeWarnings(warnings) {
  if (!Array.isArray(warnings)) return [];
  return warnings.map(normalizeWarning);
}

/**
 * @param {unknown} sub
 * @returns {SubstituteV1|null}
 */
export function normalizeSubstitute(sub) {
  if (!sub || typeof sub !== "object") return null;
  const slug = sub.slug || null;
  const name =
    sub.name ||
    (slug ? String(slug).replace(/_/g, " ") : "") ||
    "";
  if (!name && !slug) return null;
  return {
    slug: slug || undefined,
    name: name || String(slug).replace(/_/g, " "),
    reason: sub.reason || "",
    notes: sub.notes || "",
    score: typeof sub.score === "number" ? sub.score : undefined,
  };
}

/**
 * @param {unknown} substitutes
 * @returns {SubstitutesV1}
 */
export function normalizeSubstitutes(substitutes) {
  if (!substitutes || typeof substitutes !== "object") {
    return { best: null, alternatives: [] };
  }
  const best = substitutes.best ? normalizeSubstitute(substitutes.best) : null;
  const alternatives = (substitutes.alternatives || [])
    .map(normalizeSubstitute)
    .filter(Boolean);
  return { best, alternatives };
}

/**
 * @param {unknown} base
 * @param {string} [fallbackSlug]
 * @returns {BaseIngredientV1|null}
 */
export function normalizeBaseIngredient(base, fallbackSlug = null) {
  if (base && typeof base === "object" && (base.slug || base.display_name)) {
    return {
      slug: base.slug || fallbackSlug || "",
      display_name:
        base.display_name ||
        (base.slug ? String(base.slug).replace(/_/g, " ") : ""),
      category: base.category,
    };
  }
  if (typeof base === "string" && base.trim()) {
    const slug = fallbackSlug || base.trim().toLowerCase().replace(/\s+/g, "_");
    return {
      slug,
      display_name: base.trim(),
    };
  }
  if (fallbackSlug) {
    return {
      slug: fallbackSlug,
      display_name: fallbackSlug.replace(/_/g, " "),
    };
  }
  return null;
}

/**
 * @param {unknown} modifiers
 * @param {unknown} modifierDetails
 * @returns {{ slugs: string[], details: object[] }}
 */
export function normalizeModifiers(modifiers, modifierDetails) {
  const details = Array.isArray(modifierDetails)
    ? modifierDetails.map((m) => {
        if (typeof m === "string") {
          return {
            slug: m,
            display_name: m.replace(/_/g, " "),
            effect: "context",
          };
        }
        return {
          slug: m.slug || m,
          display_name: m.display_name || (m.slug || "").replace(/_/g, " "),
          effect: m.effect || "context",
          matched_text: m.matched_text,
        };
      })
    : [];

  const slugs = Array.isArray(modifiers) && modifiers.length
    ? modifiers.map((m) => (typeof m === "string" ? m : m.slug)).filter(Boolean)
    : details.map((d) => d.slug).filter(Boolean);

  return { slugs, details };
}

/**
 * Build V1 from intelligence engine evaluation object.
 * @param {object} evaluation
 * @param {{ source?: string, locale?: string }} [options]
 * @returns {IngredientEvaluationV1}
 */
export function evaluationToIngredientEvaluationV1(evaluation, options = {}) {
  const baseRaw = evaluation.base_ingredient;
  const base = normalizeBaseIngredient(
    baseRaw,
    evaluation.baseSlug || evaluation.base_slug || null
  );

  const { slugs, details } = normalizeModifiers(
    evaluation.modifiers,
    evaluation.modifiers
  );

  const verdict = evaluation.verdict || evaluation.halal_status || "unknown";
  const halal_status = evaluation.halal_status || verdictToHalalStatus(verdict);

  return {
    contract_version: INGREDIENT_EVALUATION_CONTRACT_VERSION,
    ingredient:
      evaluation.normalized_query ||
      evaluation.resolved_query ||
      evaluation.query ||
      "",
    query: evaluation.query || "",
    resolved_query: evaluation.resolved_query || evaluation.normalized_query,
    base_ingredient: base,
    modifiers: slugs,
    modifier_details: details,
    verdict,
    halal_status,
    confidence: normalizeConfidence(
      evaluation.confidence_level,
      evaluation.confidence_score,
      evaluation.confidence
    ),
    warnings: normalizeWarnings(evaluation.warnings),
    explanation: evaluation.explanation || "",
    explanation_source: evaluation.explanation_source || "template",
    references: Array.isArray(evaluation.references) ? evaluation.references : [],
    substitutes: normalizeSubstitutes(evaluation.substitutes),
    meta: {
      ...(evaluation.meta || {}),
      source: options.source || evaluation.meta?.source || "typed",
      locale: options.locale || evaluation.meta?.locale || "en",
    },
  };
}

/**
 * Normalize current POST /api/lookup envelope (legacy fields + V1) into strict V1.
 * @param {object} api
 * @returns {IngredientEvaluationV1}
 */
export function apiEnvelopeToIngredientEvaluationV1(api) {
  if (
    api?.contract_version === INGREDIENT_EVALUATION_CONTRACT_VERSION &&
    api.confidence?.level != null
  ) {
    return coerceIngredientEvaluationV1(api);
  }

  const base = normalizeBaseIngredient(
    api.base_ingredient_detail || api.base_ingredient,
    typeof api.base_ingredient === "string"
      ? api.base_ingredient.trim().toLowerCase().replace(/\s+/g, "_")
      : api.base_ingredient_detail?.slug
  );

  const { slugs, details } = normalizeModifiers(
    api.modifiers,
    api.modifier_details
  );

  const verdict = api.verdict || api.halal_status || "unknown";

  return {
    contract_version: INGREDIENT_EVALUATION_CONTRACT_VERSION,
    ingredient: api.ingredient || api.normalized_query || api.query || "",
    query: api.query || "",
    resolved_query: api.resolved_query || api.normalized_query,
    base_ingredient: base,
    modifiers: slugs,
    modifier_details: details,
    verdict,
    halal_status: api.halal_status || verdictToHalalStatus(verdict),
    confidence: normalizeConfidence(
      api.confidence_level,
      api.confidence_score,
      api.confidence
    ),
    warnings: normalizeWarnings(api.warnings),
    explanation: api.explanation || "",
    explanation_source: api.explanation_source || "template",
    references: Array.isArray(api.references) ? api.references : [],
    substitutes: normalizeSubstitutes(api.substitutes),
    meta: api.meta || {},
  };
}

/**
 * Emit API JSON for POST /api/lookup (legacy fields + contract_version for forward compat).
 * @param {IngredientEvaluationV1} v1
 * @returns {object}
 */
export function ingredientEvaluationV1ToApiEnvelope(v1) {
  const base = v1.base_ingredient;
  return {
    contract_version: INGREDIENT_EVALUATION_CONTRACT_VERSION,
    query: v1.query,
    normalized_query: v1.ingredient,
    resolved_query: v1.resolved_query || v1.ingredient,
    ingredient: v1.ingredient,
    base_ingredient: base?.display_name || null,
    base_ingredient_detail: base,
    modifiers: v1.modifiers,
    modifier_details: v1.modifier_details || [],
    verdict: v1.verdict,
    halal_status: v1.halal_status,
    confidence_level: v1.confidence.level,
    confidence_score: v1.confidence.score,
    confidence: v1.confidence.value,
    warnings: v1.warnings,
    explanation: v1.explanation,
    explanation_source: v1.explanation_source,
    references: v1.references,
    substitutes: v1.substitutes,
    meta: v1.meta || {},
  };
}

/**
 * OCR / scan row → V1.
 * @param {object} row
 * @returns {IngredientEvaluationV1}
 */
export function scanRowToIngredientEvaluationV1(row) {
  const base = normalizeBaseIngredient(
    row.base_ingredient_detail ||
      (row.base_slug
        ? { slug: row.base_slug, display_name: row.base_ingredient || row.base_slug }
        : row.base_ingredient),
    row.base_slug
  );

  const verdict = row.verdict || row.halal_status || "unknown";

  return {
    contract_version: INGREDIENT_EVALUATION_CONTRACT_VERSION,
    ingredient: row.resolved_query || row.query || row.raw || "",
    query: row.query || row.raw || "",
    resolved_query: row.resolved_query || row.query,
    base_ingredient: base,
    modifiers: Array.isArray(row.modifiers) ? row.modifiers : [],
    verdict,
    halal_status: row.halal_status || verdictToHalalStatus(verdict),
    confidence: normalizeConfidence(
      row.confidence_level,
      row.confidence_score,
      row.confidence
    ),
    warnings: normalizeWarnings(row.warnings),
    explanation: row.explanation || "",
    explanation_source: row.explanation_source || "template",
    references: [],
    substitutes: { best: null, alternatives: [] },
    meta: {
      ocr_uncertain: Boolean(row.ocr_uncertain),
      alias_applied: Boolean(row.alias_applied),
      raw: row.raw,
      cleaned: row.cleaned,
    },
  };
}

/**
 * @param {object} raw
 * @returns {IngredientEvaluationV1}
 */
export function coerceIngredientEvaluationV1(raw) {
  const substitutes = normalizeSubstitutes(raw.substitutes);
  return {
    contract_version: INGREDIENT_EVALUATION_CONTRACT_VERSION,
    ingredient: raw.ingredient || "",
    query: raw.query || "",
    resolved_query: raw.resolved_query,
    base_ingredient: raw.base_ingredient ?? null,
    modifiers: Array.isArray(raw.modifiers) ? raw.modifiers : [],
    modifier_details: raw.modifier_details || [],
    verdict: raw.verdict || raw.halal_status || "unknown",
    halal_status: raw.halal_status || verdictToHalalStatus(raw.verdict),
    confidence:
      raw.confidence?.level != null
        ? normalizeConfidence(raw.confidence.level, raw.confidence.score, raw.confidence.value)
        : normalizeConfidence(raw.confidence_level, raw.confidence_score, raw.confidence),
    warnings: normalizeWarnings(raw.warnings),
    explanation: raw.explanation || "",
    explanation_source: raw.explanation_source,
    references: Array.isArray(raw.references) ? raw.references : [],
    substitutes,
    meta: raw.meta || {},
  };
}

/**
 * @param {string} verdict
 * @returns {string}
 */
export function verdictToHalalStatus(verdict) {
  if (verdict === "usually_halal") return "halal";
  if (verdict === "usually_haram") return "haram";
  if (HALAL_STATUSES.includes(verdict)) return verdict;
  return "unknown";
}

/**
 * Soft validation for tests and guards.
 * @param {object} obj
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateIngredientEvaluationV1(obj) {
  const required = [
    "contract_version",
    "ingredient",
    "query",
    "modifiers",
    "halal_status",
    "confidence",
    "warnings",
    "explanation",
    "references",
    "substitutes",
  ];
  const missing = required.filter((k) => obj?.[k] === undefined);
  if (obj?.base_ingredient === undefined) missing.push("base_ingredient");
  if (obj?.contract_version !== INGREDIENT_EVALUATION_CONTRACT_VERSION) {
    missing.push("contract_version");
  }
  return { valid: missing.length === 0, missing };
}
