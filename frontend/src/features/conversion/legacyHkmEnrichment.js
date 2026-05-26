/**
 * @internal Legacy client HKM enrichment — only for explicit offline/dev rollback.
 * Must not run when server conversion succeeded (verdict authority stays on server).
 */

import { evaluateItem } from "../../lib/halalEngine";
import { FEATURES } from "../../lib/featureFlags";

/**
 * @param {object[]} issues
 * @param {object} halalSettings
 * @returns {object[]}
 */
export function applyLegacyHkmEnrichment(issues, halalSettings) {
  if (!FEATURES.USE_OFFLINE_CONVERSION_FALLBACK || !FEATURES.HALAL_KNOWLEDGE_ENGINE) {
    return issues;
  }
  if (!Array.isArray(issues) || issues.length === 0) return issues;

  return issues.map((issue) => {
    const existingResult = issue;
    if (!issue?.ingredient) return existingResult;

    const normalizedIngredient = issue.ingredient
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_");
    const engineResult = evaluateItem(normalizedIngredient, {
      madhab: halalSettings?.schoolOfThought || "no-preference",
      strictness: halalSettings?.strictnessLevel || "standard",
    });

    if (FEATURES.HALAL_ENGINE_SAFE_MODE && engineResult.status === "haram") {
      let validationState = "derived_haram";
      if (existingResult.ingredient && issue.ingredient) {
        validationState = "explicit_haram";
      } else if (engineResult.enforcedBy === "user_preferences") {
        validationState = "preference_based";
      }

      return {
        ...existingResult,
        status: "haram",
        reason: engineResult.eli5 || existingResult.notes,
        trace: engineResult.trace || [],
        hkmResult: engineResult,
        validationState,
        preferencesApplied: engineResult.preferences,
        inheritedFrom: engineResult.inheritedFrom || existingResult.inheritedFrom,
        alternatives: engineResult.alternatives || existingResult.alternatives || [],
        notes: engineResult.notes || existingResult.notes,
        eli5: engineResult.eli5 || existingResult.eli5,
        tags: engineResult.tags || existingResult.tags,
        references: engineResult.references || [],
        quranReference:
          existingResult.quranReference ||
          engineResult.references?.find(
            (r) =>
              r.toLowerCase().includes("qur'an") || r.toLowerCase().includes("quran")
          ),
        hadithReference:
          existingResult.hadithReference ||
          engineResult.references
            ?.filter(
              (r) =>
                r.toLowerCase().includes("hadith") ||
                r.toLowerCase().includes("bukhari") ||
                r.toLowerCase().includes("muslim")
            )
            .join("; "),
      };
    }

    if (engineResult.status === "conditional" && engineResult.trace?.length > 1) {
      let validationState = "needs_review";
      if (engineResult.enforcedBy === "user_preferences") {
        validationState = "preference_based";
      }
      return {
        ...existingResult,
        trace: engineResult.trace || [],
        hkmResult: engineResult,
        hasInheritance: true,
        validationState,
        preferencesApplied: engineResult.preferences,
        inheritedFrom: engineResult.inheritedFrom || existingResult.inheritedFrom,
        alternatives: engineResult.alternatives || existingResult.alternatives || [],
        notes: engineResult.notes || existingResult.notes,
        eli5: engineResult.eli5 || existingResult.eli5,
        tags: engineResult.tags || existingResult.tags,
        references: engineResult.references || [],
      };
    }

    let validationState = existingResult.ingredient ? "explicit_haram" : undefined;
    if (engineResult.enforcedBy === "user_preferences") {
      validationState = "preference_based";
    }

    const enriched = {
      ...existingResult,
      trace: engineResult.trace || existingResult.trace || [],
      hkmResult: engineResult.status !== "unknown" ? engineResult : undefined,
      validationState,
      preferencesApplied: engineResult.preferences,
      inheritedFrom: engineResult.inheritedFrom || existingResult.inheritedFrom,
      alternatives: engineResult.alternatives || existingResult.alternatives || [],
      notes: engineResult.notes || existingResult.notes,
      eli5: engineResult.eli5 || existingResult.eli5,
      tags: engineResult.tags || existingResult.tags,
      references: engineResult.references || [],
    };

    if (issue.ingredient && !enriched.hkmResult) {
      enriched.validationState = "explicit_haram";
    }

    return enriched;
  });
}
