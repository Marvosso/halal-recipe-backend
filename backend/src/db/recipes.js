/**
 * Recipes Data Access Layer
 * Handles all database operations for recipes table
 */

import { getPool } from "../database.js";

/**
 * Create a new recipe
 * @param {Object} recipeData - Recipe data
 * @returns {Promise<Object>} Created recipe object
 */
export async function createRecipe(recipeData) {
  const {
    userId,
    title,
    originalRecipe,
    convertedRecipe,
    ingredients,
    instructions,
    category,
    hashtags,
    mediaUrl,
    confidenceScore,
    visibility = "public"
  } = recipeData;

  if (!userId || !title) {
    throw new Error("User ID and title are required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO recipes (
        user_id, title, original_recipe, converted_recipe,
        ingredients, instructions, category, hashtags,
        media_url, confidence_score, visibility
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        userId,
        title.trim(),
        originalRecipe || null,
        convertedRecipe || null,
        ingredients ? JSON.stringify(ingredients) : null,
        instructions || null,
        category || "Main Course",
        hashtags || [],
        mediaUrl || null,
        confidenceScore || 0,
        visibility
      ]
    );

    // Parse JSONB ingredients back to object
    const recipe = result.rows[0];
    if (recipe.ingredients) {
      recipe.ingredients = typeof recipe.ingredients === "string" 
        ? JSON.parse(recipe.ingredients)
        : recipe.ingredients;
    }

    return recipe;
  } finally {
    client.release();
  }
}

/**
 * Get recipe by ID
 * @param {string} recipeId - Recipe ID (UUID)
 * @returns {Promise<Object|null>} Recipe object, or null if not found
 */
export async function getRecipeById(recipeId) {
  if (!recipeId) {
    return null;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT r.*, u.display_name as username, u.profile_image_url
       FROM recipes r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [recipeId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const recipe = result.rows[0];
    // Parse JSONB ingredients
    if (recipe.ingredients) {
      recipe.ingredients = typeof recipe.ingredients === "string"
        ? JSON.parse(recipe.ingredients)
        : recipe.ingredients;
    }

    return recipe;
  } finally {
    client.release();
  }
}

/**
 * Get public recipes
 * @param {number} limit - Maximum number of recipes to return
 * @param {number} offset - Number of recipes to skip
 * @returns {Promise<Array>} Array of recipe objects
 */
export async function getPublicRecipes(limit = 50, offset = 0) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT r.*, u.display_name as username, u.profile_image_url
       FROM recipes r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.visibility = 'public'
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Parse JSONB ingredients for all recipes
    return result.rows.map(recipe => {
      if (recipe.ingredients) {
        recipe.ingredients = typeof recipe.ingredients === "string"
          ? JSON.parse(recipe.ingredients)
          : recipe.ingredients;
      }
      return recipe;
    });
  } finally {
    client.release();
  }
}

/**
 * Get recipes by user ID
 * @param {string} userId - User ID (UUID)
 * @param {boolean} includePrivate - Include private recipes (default: true)
 * @returns {Promise<Array>} Array of recipe objects
 */
export async function getRecipesByUserId(userId, includePrivate = true) {
  if (!userId) {
    return [];
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    let query;
    let params;

    if (includePrivate) {
      query = `
        SELECT r.*, u.display_name as username, u.profile_image_url
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT r.*, u.display_name as username, u.profile_image_url
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.user_id = $1 AND r.visibility = 'public'
        ORDER BY r.created_at DESC
      `;
      params = [userId];
    }

    const result = await client.query(query, params);

    // Parse JSONB ingredients for all recipes
    return result.rows.map(recipe => {
      if (recipe.ingredients) {
        recipe.ingredients = typeof recipe.ingredients === "string"
          ? JSON.parse(recipe.ingredients)
          : recipe.ingredients;
      }
      return recipe;
    });
  } finally {
    client.release();
  }
}

/**
 * Update recipe
 * @param {string} recipeId - Recipe ID (UUID)
 * @param {string} userId - User ID (UUID) - for ownership verification
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated recipe object
 */
export async function updateRecipe(recipeId, userId, updateData) {
  if (!recipeId || !userId) {
    throw new Error("Recipe ID and User ID are required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // First verify ownership
    const recipe = await getRecipeById(recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    if (recipe.user_id !== userId) {
      throw new Error("You can only edit your own recipes");
    }

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updateData.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updateData.title.trim());
    }
    if (updateData.originalRecipe !== undefined) {
      fields.push(`original_recipe = $${paramIndex++}`);
      values.push(updateData.originalRecipe);
    }
    if (updateData.convertedRecipe !== undefined) {
      fields.push(`converted_recipe = $${paramIndex++}`);
      values.push(updateData.convertedRecipe);
    }
    if (updateData.ingredients !== undefined) {
      fields.push(`ingredients = $${paramIndex++}`);
      values.push(JSON.stringify(updateData.ingredients));
    }
    if (updateData.instructions !== undefined) {
      fields.push(`instructions = $${paramIndex++}`);
      values.push(updateData.instructions);
    }
    if (updateData.category !== undefined) {
      fields.push(`category = $${paramIndex++}`);
      values.push(updateData.category);
    }
    if (updateData.hashtags !== undefined) {
      fields.push(`hashtags = $${paramIndex++}`);
      values.push(updateData.hashtags);
    }
    if (updateData.mediaUrl !== undefined) {
      fields.push(`media_url = $${paramIndex++}`);
      values.push(updateData.mediaUrl);
    }
    if (updateData.confidenceScore !== undefined) {
      fields.push(`confidence_score = $${paramIndex++}`);
      values.push(updateData.confidenceScore);
    }
    if (updateData.visibility !== undefined) {
      fields.push(`visibility = $${paramIndex++}`);
      values.push(updateData.visibility);
    }

    if (fields.length === 0) {
      return recipe;
    }

    // Always update updated_at
    fields.push(`updated_at = NOW()`);

    values.push(recipeId);
    const result = await client.query(
      `UPDATE recipes
       SET ${fields.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    const updatedRecipe = result.rows[0];
    if (updatedRecipe.ingredients) {
      updatedRecipe.ingredients = typeof updatedRecipe.ingredients === "string"
        ? JSON.parse(updatedRecipe.ingredients)
        : updatedRecipe.ingredients;
    }

    return updatedRecipe;
  } finally {
    client.release();
  }
}

/**
 * Delete recipe
 * @param {string} recipeId - Recipe ID (UUID)
 * @param {string} userId - User ID (UUID) - for ownership verification
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export async function deleteRecipe(recipeId, userId) {
  if (!recipeId || !userId) {
    throw new Error("Recipe ID and User ID are required");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // First verify ownership
    const recipe = await getRecipeById(recipeId);
    if (!recipe) {
      return false;
    }
    if (recipe.user_id !== userId) {
      throw new Error("You can only delete your own recipes");
    }

    const result = await client.query(
      `DELETE FROM recipes WHERE id = $1`,
      [recipeId]
    );

    return result.rowCount > 0;
  } finally {
    client.release();
  }
}
