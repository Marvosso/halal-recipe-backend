/**
 * Saved halal recipe conversions (recipe_kind = 'saved').
 */

import { getPool } from "../database.js";

function parseJsonField(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatRow(row) {
  if (!row) return null;
  return {
    ...row,
    ingredients: parseJsonField(row.ingredients, []),
    substitutions_used: parseJsonField(row.substitutions_used, []),
    conversion_snapshot: parseJsonField(row.conversion_snapshot, {}),
  };
}

/**
 * @param {object} data
 */
export async function createSavedRecipe(data) {
  const {
    userId,
    title,
    originalRecipe,
    convertedRecipe,
    confidenceScore = 0,
    substitutionsUsed = [],
    conversionSnapshot = {},
  } = data;

  if (!userId || !title?.trim()) {
    throw new Error("User ID and title are required");
  }

  const pool = getPool();
  const result = await pool.query(
    `INSERT INTO recipes (
      user_id, title, original_recipe, converted_recipe,
      ingredients, instructions, category, hashtags,
      media_url, confidence_score, visibility, substitutions_used,
      recipe_kind, conversion_snapshot
    )
    VALUES ($1, $2, $3, $4, '[]'::jsonb, NULL, 'Saved Conversion', '{}',
            NULL, $5, 'private', $6, 'saved', $7)
    RETURNING *`,
    [
      userId,
      title.trim(),
      originalRecipe || "",
      convertedRecipe || "",
      confidenceScore || 0,
      JSON.stringify(Array.isArray(substitutionsUsed) ? substitutionsUsed : []),
      JSON.stringify(conversionSnapshot || {}),
    ]
  );

  return formatRow(result.rows[0]);
}

/**
 * @param {string} userId
 */
export async function getSavedRecipesByUserId(userId) {
  if (!userId) return [];

  const pool = getPool();
  const result = await pool.query(
    `SELECT r.*, u.display_name as username
     FROM recipes r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.user_id = $1 AND r.recipe_kind = 'saved'
     ORDER BY r.created_at DESC`,
    [userId]
  );

  return result.rows.map(formatRow);
}

/**
 * @param {string} recipeId
 * @param {string} userId
 */
export async function getSavedRecipeById(recipeId, userId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT r.*, u.display_name as username
     FROM recipes r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.id = $1 AND r.recipe_kind = 'saved'`,
    [recipeId]
  );

  if (result.rows.length === 0) return null;
  const row = formatRow(result.rows[0]);
  if (row.user_id !== userId) return null;
  return row;
}

/**
 * @param {string} recipeId
 * @param {string} userId
 */
export async function deleteSavedRecipe(recipeId, userId) {
  const pool = getPool();
  const result = await pool.query(
    `DELETE FROM recipes
     WHERE id = $1 AND user_id = $2 AND recipe_kind = 'saved'`,
    [recipeId, userId]
  );
  return result.rowCount > 0;
}
