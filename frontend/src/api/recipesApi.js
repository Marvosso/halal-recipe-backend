import { getAxiosInstance } from "./axiosConfig";
import { getAuthToken } from "./authApi";
import logger from "../utils/logger";

/**
 * Recipes API service
 * Handles recipe CRUD operations
 */

/**
 * Get all recipes (public or user's own)
 */
export async function getRecipes() {
  try {
    const token = getAuthToken();
    const axios = await getAxiosInstance();

    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};

    const response = await axios.get("/api/recipes", config);
    return response.data.recipes || [];
  } catch (error) {
    logger.error("Get recipes error:", error);
    throw error.response?.data || { error: "Failed to fetch recipes" };
  }
}

/**
 * Get current user's recipes
 */
export async function getMyRecipes() {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const axios = await getAxiosInstance();
    const response = await axios.get("/api/recipes/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.recipes || [];
  } catch (error) {
    logger.error("Get my recipes error:", error);
    throw error.response?.data || { error: "Failed to fetch recipes" };
  }
}

/**
 * Get single recipe by ID
 */
export async function getRecipe(recipeId) {
  try {
    const token = getAuthToken();
    const axios = await getAxiosInstance();

    const config = token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};

    const response = await axios.get(`/api/recipes/${recipeId}`, config);
    return response.data.recipe;
  } catch (error) {
    logger.error("Get recipe error:", error);
    throw error.response?.data || { error: "Failed to fetch recipe" };
  }
}

/**
 * Create new recipe
 */
export async function createRecipe(recipeData) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const axios = await getAxiosInstance();
    const response = await axios.post("/api/recipes", recipeData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.recipe;
  } catch (error) {
    logger.error("Create recipe error:", error);
    throw error.response?.data || { error: "Failed to create recipe" };
  }
}

/**
 * Update recipe
 */
export async function updateRecipe(recipeId, recipeData) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const axios = await getAxiosInstance();
    const response = await axios.put(`/api/recipes/${recipeId}`, recipeData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.recipe;
  } catch (error) {
    logger.error("Update recipe error:", error);
    throw error.response?.data || { error: "Failed to update recipe" };
  }
}

/**
 * Delete recipe
 */
export async function deleteRecipe(recipeId) {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const axios = await getAxiosInstance();
    const response = await axios.delete(`/api/recipes/${recipeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    logger.error("Delete recipe error:", error);
    throw error.response?.data || { error: "Failed to delete recipe" };
  }
}
