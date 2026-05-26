/**
 * Contract validators + drift fingerprints for regression hardening.
 */

import { INGREDIENT_EVALUATION_CONTRACT_VERSION } from "../contracts/ingredientEvaluationV1.js";

const CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);
const SHARE_INGREDIENT_REQUIRED = [
  "type",
  "contract_version",
  "ingredientName",
  "verdict",
  "statusLabel",
  "statusClass",
  "confidenceScore",
];
const SHARE_RECIPE_REQUIRED = ["type", "title"];

/**
 * @param {string} level
 * @param {number} score
 * @returns {string[]}
 */
export function validateConfidenceConsistency(level, score) {
  const errors = [];
  if (!CONFIDENCE_LEVELS.has(level)) {
    errors.push(`invalid confidence level: ${level}`);
  }
  if (typeof score !== "number" || Number.isNaN(score)) {
    errors.push("confidence score must be a number");
    return errors;
  }
  if (score < 0 || score > 100) {
    errors.push(`confidence score out of range: ${score}`);
  }
  if (level === "high" && score < 50) {
    errors.push(`high level with low score (${score})`);
  }
  if (level === "low" && score > 85) {
    errors.push(`low level with high score (${score})`);
  }
  return errors;
}

/**
 * @param {object} api - POST /api/lookup envelope
 * @returns {string[]}
 */
export function validateLookupApiEnvelope(api) {
  const errors = [];
  if (!api || typeof api !== "object") return ["api envelope missing"];
  if (api.contract_version !== INGREDIENT_EVALUATION_CONTRACT_VERSION) {
    errors.push(`contract_version must be "${INGREDIENT_EVALUATION_CONTRACT_VERSION}"`);
  }
  for (const field of ["query", "verdict", "halal_status", "explanation"]) {
    if (!api[field] && api[field] !== "") {
      errors.push(`missing field: ${field}`);
    }
  }
  if (!api.confidence_level) errors.push("missing confidence_level");
  if (typeof api.confidence_score !== "number") {
    errors.push("confidence_score must be number");
  } else {
    errors.push(
      ...validateConfidenceConsistency(api.confidence_level, api.confidence_score)
    );
  }
  if (!Array.isArray(api.warnings)) errors.push("warnings must be array");
  if (!api.substitutes || typeof api.substitutes !== "object") {
    errors.push("substitutes object required");
  }
  return errors;
}

/**
 * @param {object} v1 - strict IngredientEvaluationV1
 * @returns {string[]}
 */
export function validateIngredientEvaluationV1(v1) {
  const errors = [];
  if (!v1?.contract_version) errors.push("missing contract_version");
  if (!v1?.verdict) errors.push("missing verdict");
  if (!v1?.halal_status) errors.push("missing halal_status");
  if (!v1?.confidence?.level) errors.push("missing confidence.level");
  if (typeof v1?.confidence?.score !== "number") {
    errors.push("missing confidence.score");
  } else {
    errors.push(
      ...validateConfidenceConsistency(v1.confidence.level, v1.confidence.score)
    );
  }
  return errors;
}

/**
 * @param {object} payload
 * @returns {string[]}
 */
export function validateShareIngredientPayload(payload) {
  const errors = [];
  if (!payload) return ["payload missing"];
  if (payload.type !== "ingredient") errors.push('type must be "ingredient"');
  for (const key of SHARE_INGREDIENT_REQUIRED) {
    if (payload[key] === undefined || payload[key] === null) {
      errors.push(`missing share field: ${key}`);
    }
  }
  if (typeof payload.confidenceScore !== "number") {
    errors.push("confidenceScore must be number");
  }
  if (payload.contract_version !== "1") {
    errors.push('contract_version must be "1"');
  }
  return errors;
}

/**
 * @param {object} payload
 * @returns {string[]}
 */
export function validateShareRecipePayload(payload) {
  const errors = [];
  if (!payload) return ["payload missing"];
  if (payload.type !== "recipe") errors.push('type must be "recipe"');
  for (const key of SHARE_RECIPE_REQUIRED) {
    if (!payload[key]) errors.push(`missing share field: ${key}`);
  }
  if (payload.haram && !Array.isArray(payload.haram)) {
    errors.push("haram must be array when present");
  }
  if (payload.replacements && !Array.isArray(payload.replacements)) {
    errors.push("replacements must be array when present");
  }
  return errors;
}

/**
 * Normalized affiliate link from monetization gateway.
 * @param {object} link
 * @returns {string[]}
 */
export function validateAffiliateLinkShape(link) {
  const errors = [];
  if (!link) return ["link missing"];
  if (!link.platform_display) errors.push("missing platform_display");
  if (link.url != null && typeof link.url !== "string") {
    errors.push("url must be string when present");
  }
  if (link.is_featured != null && typeof link.is_featured !== "boolean") {
    errors.push("is_featured must be boolean");
  }
  return errors;
}

/**
 * POST /api/scan envelope (MVP + legacy /convert/scan-ingredients shape).
 * @param {object} scan
 * @returns {string[]}
 */
export function validateScanApiEnvelope(scan) {
  const errors = [];
  if (!scan || typeof scan !== "object") return ["scan envelope missing"];
  if (scan.contract_version != null && scan.contract_version !== "1") {
    errors.push('contract_version must be "1" when present');
  }
  if (!scan.summary || typeof scan.summary !== "object") {
    errors.push("summary object required");
  }
  if (!Array.isArray(scan.ingredients)) {
    errors.push("ingredients must be array");
    return errors;
  }
  for (const [i, row] of scan.ingredients.entries()) {
    if (!row.halal_status && !row.verdict) {
      errors.push(`ingredients[${i}] missing halal_status/verdict`);
    }
    const hasConf =
      typeof row.confidence === "number" ||
      typeof row.confidence_score === "number";
    if (!hasConf) {
      errors.push(`ingredients[${i}] missing confidence`);
    }
  }
  return errors;
}

/**
 * POST /convert response (intelligence pipeline).
 * @param {object} result
 * @returns {string[]}
 */
export function validateConvertApiEnvelope(result) {
  const errors = [];
  if (!result || typeof result !== "object") return ["convert envelope missing"];
  if (result.contract_version != null && result.contract_version !== "1") {
    errors.push('contract_version must be "1" when present');
  }
  if (typeof result.confidenceScore !== "number") {
    errors.push("confidenceScore must be number");
  } else if (result.confidenceScore < 0 || result.confidenceScore > 100) {
    errors.push(`confidenceScore out of range: ${result.confidenceScore}`);
  }
  if (!Array.isArray(result.issues)) {
    errors.push("issues must be array");
  }
  if (result.pipeline && typeof result.pipeline !== "string") {
    errors.push("pipeline must be string when present");
  }
  return errors;
}

/**
 * Legacy classify-ingredient shape (canonical via lookupService).
 * @param {object} result
 * @returns {string[]}
 */
export function validateLegacyClassifyShape(result) {
  const errors = [];
  if (!result || typeof result !== "object") return ["classify response missing"];
  if (result.contract_version !== "1") {
    errors.push('contract_version must be "1"');
  }
  for (const field of ["verdict", "halal_status", "explanation"]) {
    if (!result[field] && result[field] !== "") {
      errors.push(`missing field: ${field}`);
    }
  }
  if (typeof result.confidence !== "number" && typeof result.confidence_score !== "number") {
    errors.push("confidence must be number");
  }
  return errors;
}

/**
 * Stable fingerprint for drift detection (verdict-affecting fields only).
 * @param {object} evaluation
 */
export function computeEvaluationFingerprint(evaluation) {
  if (!evaluation) return null;

  const modifiers = [
  ...(evaluation.modifier_slugs || []),
  ...(Array.isArray(evaluation.modifiers)
    ? evaluation.modifiers.map((m) =>
        typeof m === "string" ? m : m.slug || m.modifier_slug
      )
    : []),
  ]
    .filter(Boolean)
    .map(String)
    .sort();

  const base =
    evaluation.baseSlug ||
    evaluation.base_slug ||
    evaluation.base_ingredient?.slug ||
    evaluation.base_ingredient_detail?.slug ||
    null;

  const level =
    evaluation.confidence_level ||
    evaluation.confidence?.level ||
    null;
  const score =
    evaluation.confidence_score ??
    evaluation.confidence?.score ??
    null;

  return {
    query: (evaluation.query || evaluation.normalized_query || "").toLowerCase().trim(),
    verdict: evaluation.verdict || null,
    halal_status: evaluation.halal_status || null,
    base_slug: base,
    modifiers: modifiers.join("|"),
    confidence_level: level,
    confidence_score: typeof score === "number" ? Math.round(score) : null,
  };
}

/**
 * @param {object} a
 * @param {object} b
 * @returns {string[]}
 */
export function diffEvaluationFingerprints(a, b) {
  const errors = [];
  if (!a || !b) return ["fingerprint missing"];
  for (const key of [
    "verdict",
    "halal_status",
    "base_slug",
    "modifiers",
    "confidence_level",
    "confidence_score",
  ]) {
    if (a[key] !== b[key]) {
      errors.push(`drift.${key}: ${a[key]} → ${b[key]}`);
    }
  }
  return errors;
}

/**
 * @param {object} fixture
 * @param {object} evaluation
 * @returns {string[]}
 */
export function assertCriticalIngredientExpectations(fixture, evaluation) {
  const errors = [];
  const verdict = evaluation.verdict;
  const halal = evaluation.halal_status;

  if (fixture.expectVerdict && verdict !== fixture.expectVerdict) {
    errors.push(`verdict: expected ${fixture.expectVerdict}, got ${verdict}`);
  }
  if (fixture.expectVerdictOneOf && !fixture.expectVerdictOneOf.includes(verdict)) {
    errors.push(
      `verdict: expected one of ${fixture.expectVerdictOneOf.join(", ")}, got ${verdict}`
    );
  }
  if (fixture.expectHalalStatus && halal !== fixture.expectHalalStatus) {
    errors.push(`halal_status: expected ${fixture.expectHalalStatus}, got ${halal}`);
  }
  if (
    fixture.expectHalalStatusOneOf &&
    !fixture.expectHalalStatusOneOf.includes(halal)
  ) {
    errors.push(
      `halal_status: expected one of ${fixture.expectHalalStatusOneOf.join(", ")}, got ${halal}`
    );
  }

  const score =
    evaluation.confidence_score ??
    evaluation.confidence?.score ??
    null;
  if (typeof score === "number") {
    if (fixture.minConfidenceScore != null && score < fixture.minConfidenceScore) {
      errors.push(`confidence_score ${score} below min ${fixture.minConfidenceScore}`);
    }
    if (fixture.maxConfidenceScore != null && score > fixture.maxConfidenceScore) {
      errors.push(`confidence_score ${score} above max ${fixture.maxConfidenceScore}`);
    }
  }

  return errors;
}
