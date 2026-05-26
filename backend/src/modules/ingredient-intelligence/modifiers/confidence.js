/**
 * Confidence adjustments from detected modifiers (deterministic).
 */

import { MODIFIER_EFFECT } from "./taxonomy.js";

const LEVEL_RANK = { low: 0, medium: 1, high: 2 };

function downgrade(level) {
  if (level === "high") return "medium";
  if (level === "medium") return "low";
  return "low";
}

function upgrade(level) {
  if (level === "low") return "medium";
  if (level === "medium") return "high";
  return "high";
}

/**
 * @param {object} params
 * @param {string} params.baseConfidence
 * @param {string[]} params.modifierSlugs
 * @param {Array<{ slug: string, effect?: string, match_type?: string }>} [params.modifierDetails]
 * @param {string} params.verdict
 * @returns {{ confidence_level: string, adjustments: string[] }}
 */
export function adjustConfidenceForModifiers({
  baseConfidence,
  modifierSlugs = [],
  modifierDetails = [],
  verdict = "unknown",
}) {
  let level = baseConfidence || "medium";
  const adjustments = [];
  const mods = modifierSlugs || [];

  if (mods.includes("halal_certified") && verdict === "halal") {
    level = "high";
    adjustments.push("halal_certified_boost");
  }

  if (mods.includes("pork") || mods.includes("wine") || mods.includes("alcohol")) {
    if (verdict === "haram" || verdict === "usually_haram") {
      level = "high";
      adjustments.push("prohibited_source_certain");
    }
  }

  if (mods.includes("bovine") || mods.includes("beef")) {
    if (verdict === "conditional" && level === "high") {
      level = "medium";
      adjustments.push("bovine_source_requires_verification");
    }
  }

  for (const slug of mods) {
    const detail = modifierDetails.find((d) => d.slug === slug);
    const effect = detail?.effect;
    if (effect === MODIFIER_EFFECT.WEAKEN || slug === "rennet" || slug === "enzyme") {
      if (verdict === "conditional") {
        const prev = level;
        level = downgrade(level);
        if (prev !== level) adjustments.push(`${slug}_weaken`);
      }
    }
    if (effect === MODIFIER_EFFECT.STRENGTHEN && slug === "bovine") {
      adjustments.push("bovine_context");
    }
  }

  if (mods.some((m) => modifierDetails.find((d) => d.slug === m && d.match_type === "fuzzy"))) {
    level = downgrade(level);
    adjustments.push("fuzzy_modifier_match");
  }

  if (
    mods.includes("pork") &&
    (mods.includes("halal_certified") || mods.includes("plant") || mods.includes("plant_based"))
  ) {
    level = "medium";
    adjustments.push("conflicting_modifiers");
  }

  if (verdict === "unknown") {
    level = "low";
  }

  return { confidence_level: level, adjustments };
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {string}
 */
export function maxConfidenceLevel(a, b) {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}
