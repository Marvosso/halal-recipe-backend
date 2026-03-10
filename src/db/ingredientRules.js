/**
 * Ingredient rules DB layer (hybrid AI architecture).
 * Deterministic rules: base_slug + modifier_slug → halal_status, notes, alternatives.
 */

import { getPool } from "../database.js";

function safeGetPool() {
  try {
    return getPool();
  } catch {
    return null;
  }
}

/**
 * Get a single rule by base and modifier.
 * @param {string} baseSlug - e.g. 'gelatin', 'soy_sauce', 'vanilla_extract'
 * @param {string} modifierSlug - e.g. 'pork', 'unspecified', 'alcohol_free'
 * @returns {Promise<{ halal_status: string, notes: string, alternatives: string[] } | null>}
 */
export async function getRule(baseSlug, modifierSlug = "unspecified") {
  const pool = safeGetPool();
  if (!pool) return null;

  try {
    const normalizedBase = (baseSlug || "").trim().toLowerCase();
    const normalizedMod = (modifierSlug || "unspecified").trim().toLowerCase();
    if (!normalizedBase) return null;

    const result = await pool.query(
      `SELECT halal_status, notes, COALESCE(alternatives, '[]') AS alternatives
       FROM ingredient_rules
       WHERE base_slug = $1 AND modifier_slug = $2`,
      [normalizedBase, normalizedMod]
    );

    if (result.rows.length === 0) {
      // Try unspecified modifier as fallback
      if (normalizedMod !== "unspecified") {
        const fallback = await pool.query(
          `SELECT halal_status, notes, COALESCE(alternatives, '[]') AS alternatives
           FROM ingredient_rules
           WHERE base_slug = $1 AND modifier_slug = 'unspecified'`,
          [normalizedBase]
        );
        if (fallback.rows.length > 0) {
          const r = fallback.rows[0];
          return {
            halal_status: r.halal_status,
            notes: r.notes || "",
            alternatives: Array.isArray(r.alternatives) ? r.alternatives : JSON.parse(r.alternatives || "[]"),
          };
        }
      }
      return null;
    }

    const r = result.rows[0];
    return {
      halal_status: r.halal_status,
      notes: r.notes || "",
      alternatives: Array.isArray(r.alternatives) ? r.alternatives : JSON.parse(r.alternatives || "[]"),
    };
  } catch (err) {
    console.error("[ingredientRules] getRule error:", err.message);
    return null;
  }
}

/**
 * List all base slugs (for matching).
 * @returns {Promise<string[]>}
 */
export async function getBaseSlugs() {
  const pool = safeGetPool();
  if (!pool) return [];

  try {
    const result = await pool.query("SELECT slug FROM ingredient_rule_bases ORDER BY slug");
    return result.rows.map((r) => r.slug);
  } catch (err) {
    console.error("[ingredientRules] getBaseSlugs error:", err.message);
    return [];
  }
}

/**
 * List all modifier slugs (for detection).
 * @returns {Promise<string[]>}
 */
export async function getModifierSlugs() {
  const pool = safeGetPool();
  if (!pool) return [];

  try {
    const result = await pool.query("SELECT slug FROM ingredient_rule_modifiers ORDER BY slug");
    return result.rows.map((r) => r.slug);
  } catch (err) {
    console.error("[ingredientRules] getModifierSlugs error:", err.message);
    return [];
  }
}
