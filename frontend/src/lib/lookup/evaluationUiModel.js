/**
 * UI view model derived from IngredientEvaluationV1 (display-only fields).
 * Keeps components stable while API contract is canonical.
 */

import { formatIngredientName } from "../ingredientDisplay.js";
import { getVerdictDisplay } from "./verdictDisplay.js";
import { clampConfidenceScore } from "../../contracts/confidenceV1.js";
import { apiEnvelopeToIngredientEvaluationV1 } from "../../contracts/ingredientEvaluationV1.js";

function legacyStatusFromVerdict(verdict, halalStatus) {
  if (halalStatus === "halal" || halalStatus === "haram" || halalStatus === "unknown") {
    if (verdict === "conditional" || verdict === "usually_halal" || verdict === "usually_haram") {
      return verdict === "usually_haram"
        ? "haram"
        : verdict === "usually_halal"
          ? "halal"
          : "conditional";
    }
    return halalStatus;
  }
  if (verdict === "usually_halal") return "halal";
  if (verdict === "usually_haram") return "haram";
  if (verdict === "conditional") return "conditional";
  return verdict;
}

function substitutesWithAll(substitutes) {
  const best = substitutes.best
    ? {
        slug: substitutes.best.slug || null,
        name: substitutes.best.name,
        reason: substitutes.best.reason || "",
        notes: substitutes.best.notes || "",
        score: substitutes.best.score,
      }
    : null;
  const alternatives = (substitutes.alternatives || []).map((s) => ({
    slug: s.slug || null,
    name: s.name,
    reason: s.reason || "",
    notes: s.notes || "",
    score: s.score,
  }));
  return { best, alternatives, all: [best, ...alternatives].filter(Boolean) };
}

/**
 * @param {import("../../contracts/ingredientEvaluationV1.js").IngredientEvaluationV1} v1
 * @param {{ source?: string }} [options]
 */
export function ingredientEvaluationV1ToUiModel(v1, options = {}) {
  const display = getVerdictDisplay(v1.verdict, v1.halal_status);
  const baseName =
    v1.base_ingredient?.display_name ||
    formatIngredientName(v1.ingredient) ||
    v1.query;

  const modifierDetails = (v1.modifier_details || []).map((m) => ({
    slug: m.slug || m,
    displayName:
      m.display_name ||
      (typeof m === "string" ? formatIngredientName(m) : String(m.slug || "").replace(/_/g, " ")),
    effect: m.effect || "context",
    matchedText: m.matched_text,
  }));

  const substitutes = substitutesWithAll(v1.substitutes);

  return {
    contractVersion: v1.contract_version,
    source: options.source || v1.meta?.source || "server",
    query: v1.query,
    displayName: formatIngredientName(baseName),
    baseIngredient: v1.base_ingredient?.slug || null,
    category: v1.base_ingredient?.category || null,
    verdict: v1.verdict,
    status: legacyStatusFromVerdict(v1.verdict, v1.halal_status),
    statusLabel: display.label,
    statusSummary: display.summary,
    statusClass: display.className,
    ariaLabel: display.ariaLabel,
    confidenceLevel: v1.confidence.level,
    confidenceScore: clampConfidenceScore(v1.confidence.score),
    modifiers: v1.modifiers,
    modifierDetails,
    warnings: v1.warnings,
    explanation: v1.explanation,
    substitutes,
    references: v1.references || [],
    meta: v1.meta || {},
    /** Canonical evaluation attached for share/SEO adapters */
    evaluation: v1,
  };
}

/**
 * POST /api/lookup envelope → UI model.
 * @param {object} api
 * @param {string} [queryOverride]
 */
export function apiEnvelopeToUiModel(api, queryOverride) {
  const v1 = apiEnvelopeToIngredientEvaluationV1(api);
  if (queryOverride) v1.query = queryOverride;
  return ingredientEvaluationV1ToUiModel(v1, {
    source: api.meta?.source === "cache" ? "cache" : "server",
  });
}
