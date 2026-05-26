/**
 * Saved halal recipes — DB with JSON file fallback.
 */

import { readRecipes, writeRecipes } from "../utils/dataStorage.js";
import { getPool } from "../database.js";
import {
  createSavedRecipe as createSavedRecipeDb,
  getSavedRecipesByUserId as getSavedRecipesByUserIdDb,
  getSavedRecipeById as getSavedRecipeByIdDb,
  deleteSavedRecipe as deleteSavedRecipeDb,
} from "../db/savedRecipes.js";

function isDbAvailable() {
  try {
    return !!getPool();
  } catch {
    return false;
  }
}

/**
 * @param {object} row
 */
export function formatSavedRecipeForApi(row) {
  const snapshot = row.conversion_snapshot || {};
  const subs = row.substitutions_used || [];
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    originalRecipe: row.original_recipe || "",
    convertedRecipe: row.converted_recipe || "",
    original: row.original_recipe || "",
    converted: row.converted_recipe || "",
    confidenceScore: row.confidence_score ?? snapshot.confidenceScore ?? 0,
    issues: subs,
    substitutionsUsed: subs,
    substitutions_used: subs,
    conversionSnapshot: snapshot,
    savedAt: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recipeKind: "saved",
  };
}

function isSavedFileRecipe(r) {
  return r.recipeKind === "saved" || r.recipe_kind === "saved" || r.isSavedConversion === true;
}

/**
 * @param {object} payload
 * @param {string} userId
 */
export async function saveHalalRecipe(payload, userId) {
  const {
    title,
    originalRecipe,
    convertedRecipe,
    confidenceScore = 0,
    substitutionsUsed = [],
    issues,
  } = payload;

  const subs = substitutionsUsed.length ? substitutionsUsed : issues || [];
  const conversionSnapshot = {
    issues: subs,
    confidenceScore,
    savedFrom: "converter",
    savedAt: new Date().toISOString(),
  };

  if (isDbAvailable()) {
    try {
      const row = await createSavedRecipeDb({
        userId,
        title,
        originalRecipe,
        convertedRecipe,
        confidenceScore,
        substitutionsUsed: subs,
        conversionSnapshot,
      });
      return formatSavedRecipeForApi(row);
    } catch (err) {
      console.error("[saved-recipes] DB save failed, using file:", err.message);
    }
  }

  const recipes = readRecipes();
  const newRecipe = {
    id: `saved-${Date.now()}`,
    userId,
    user_id: userId,
    title: title.trim(),
    originalRecipe: originalRecipe || "",
    convertedRecipe: convertedRecipe || "",
    original_recipe: originalRecipe || "",
    converted_recipe: convertedRecipe || "",
    confidence_score: confidenceScore,
    confidenceScore,
    substitutions_used: subs,
    substitutionsUsed: subs,
    issues: subs,
    conversion_snapshot: conversionSnapshot,
    recipeKind: "saved",
    recipe_kind: "saved",
    isSavedConversion: true,
    visibility: "private",
    isPublic: false,
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    savedAt: new Date().toISOString(),
  };
  recipes.push(newRecipe);
  writeRecipes(recipes);
  return formatSavedRecipeForApi(newRecipe);
}

/**
 * @param {string} userId
 */
export async function listSavedHalalRecipes(userId) {
  if (isDbAvailable()) {
    try {
      const rows = await getSavedRecipesByUserIdDb(userId);
      return rows.map(formatSavedRecipeForApi);
    } catch (err) {
      console.error("[saved-recipes] DB list failed, using file:", err.message);
    }
  }

  const recipes = readRecipes();
  return recipes
    .filter((r) => (r.userId === userId || r.user_id === userId) && isSavedFileRecipe(r))
    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
    .map(formatSavedRecipeForApi);
}

/**
 * @param {string} id
 * @param {string} userId
 */
export async function getSavedHalalRecipe(id, userId) {
  if (isDbAvailable()) {
    try {
      const row = await getSavedRecipeByIdDb(id, userId);
      if (row) return formatSavedRecipeForApi(row);
    } catch (err) {
      console.error("[saved-recipes] DB get failed, using file:", err.message);
    }
  }

  const recipes = readRecipes();
  const found = recipes.find(
    (r) => r.id === id && (r.userId === userId || r.user_id === userId) && isSavedFileRecipe(r)
  );
  return found ? formatSavedRecipeForApi(found) : null;
}

/**
 * @param {string} id
 * @param {string} userId
 */
export async function removeSavedHalalRecipe(id, userId) {
  if (isDbAvailable()) {
    try {
      const deleted = await deleteSavedRecipeDb(id, userId);
      if (deleted) return true;
    } catch (err) {
      console.error("[saved-recipes] DB delete failed, using file:", err.message);
    }
  }

  const recipes = readRecipes();
  const index = recipes.findIndex(
    (r) => r.id === id && (r.userId === userId || r.user_id === userId) && isSavedFileRecipe(r)
  );
  if (index === -1) return false;
  recipes.splice(index, 1);
  writeRecipes(recipes);
  return true;
}
