import express from "express";
import { readRecipes, writeRecipes } from "../utils/dataStorage.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import { 
  createRecipe as createRecipeDB, 
  getRecipeById as getRecipeByIdDB,
  getPublicRecipes as getPublicRecipesDB,
  getRecipesByUserId as getRecipesByUserIdDB,
  updateRecipe as updateRecipeDB,
  deleteRecipe as deleteRecipeDB
} from "../db/recipes.js";
import { getPool } from "../database.js";

const router = express.Router();

// Helper to check if DB is available
const isDbAvailable = () => {
  try {
    return !!getPool();
  } catch {
    return false;
  }
};

// Format DB recipe for frontend (id, userId, title, originalRecipe, convertedRecipe, substitutions_used, created_at, etc.)
function formatDbRecipeForFrontend(r) {
  const subs = r.substitutions_used != null
    ? (Array.isArray(r.substitutions_used) ? r.substitutions_used : [])
    : [];
  return {
    id: r.id,
    user_id: r.user_id,
    userId: r.user_id,
    username: r.username,
    title: r.title,
    original_recipe: r.original_recipe || "",
    originalRecipe: r.original_recipe || "",
    converted_recipe: r.converted_recipe || "",
    convertedRecipe: r.converted_recipe || "",
    original: r.original_recipe || "",
    converted: r.converted_recipe || "",
    description: r.instructions || "",
    ingredients: r.ingredients || [],
    instructions: r.instructions || "",
    category: r.category || "Main Course",
    hashtags: r.hashtags || [],
    media_url: r.media_url,
    mediaUrls: r.media_url ? [r.media_url] : [],
    confidence_score: r.confidence_score || 0,
    confidenceScore: r.confidence_score || 0,
    substitutions_used: subs,
    substitutionsUsed: subs,
    issues: subs,
    is_public: r.visibility === "public",
    isPublic: r.visibility === "public",
    visibility: r.visibility,
    likes: r.likes || 0,
    comments: r.comments || 0,
    shares: r.shares || 0,
    created_at: r.created_at,
    createdAt: r.created_at,
    savedAt: r.created_at,
    updated_at: r.updated_at,
    updatedAt: r.updated_at,
  };
}

/**
 * GET /api/recipes/public
 * Get all public recipes (no authentication required)
 */
router.get("/public", (req, res) => {
  try {
    const recipes = readRecipes();
    const publicRecipes = recipes.filter((r) => r.isPublic === true);
    
    // Sort by createdAt (newest first)
    publicRecipes.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

    res.json({ recipes: publicRecipes });
  } catch (error) {
    console.error("Error fetching public recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

/**
 * GET /api/recipes
 * Get recipes (public recipes for all, private for authenticated user)
 */
router.get("/", optionalAuth, (req, res) => {
  try {
    let recipes = readRecipes();

    // If user is authenticated, show their private recipes + all public
    // If not authenticated, only show public recipes
    if (req.user) {
      recipes = recipes.filter(
        (r) => r.isPublic === true || r.userId === req.user.userId
      );
    } else {
      recipes = recipes.filter((r) => r.isPublic === true);
    }

    // Sort by createdAt (newest first)
    recipes.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));

    res.json({ recipes });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

/**
 * GET /api/recipes/my
 * Get current user's recipes (protected). Uses DB when available.
 */
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    if (isDbAvailable()) {
      try {
        const dbRecipes = await getRecipesByUserIdDB(userId);
        const formatted = dbRecipes.map(formatDbRecipeForFrontend);
        return res.json({ recipes: formatted });
      } catch (dbErr) {
        console.error("DB error in GET /my, falling back to file:", dbErr);
      }
    }
    const recipes = readRecipes();
    const userRecipes = recipes.filter((r) => r.userId === userId);
    userRecipes.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
    res.json({ recipes: userRecipes });
  } catch (error) {
    console.error("Error fetching user recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

/**
 * GET /api/recipes/:id
 * Get single recipe by ID. Uses DB when available.
 */
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (isDbAvailable()) {
      try {
        const dbRecipe = await getRecipeByIdDB(id);
        if (!dbRecipe) {
          return res.status(404).json({ error: "Recipe not found" });
        }
        if (dbRecipe.visibility !== "public" && (!req.user || (req.user.id || req.user.userId) !== dbRecipe.user_id)) {
          return res.status(403).json({ error: "Access denied" });
        }
        return res.json({ recipe: formatDbRecipeForFrontend(dbRecipe) });
      } catch (dbErr) {
        console.error("DB error in GET /:id, falling back to file:", dbErr);
      }
    }
    const recipes = readRecipes();
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    if (!recipe.isPublic && (!req.user || recipe.userId !== req.user.userId)) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json({ recipe });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

/**
 * POST /api/recipes
 * Create new recipe (protected)
 * Uses PostgreSQL if available, falls back to JSON file storage
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      title,
      originalRecipe,
      convertedRecipe,
      ingredients,
      instructions,
      isPublic,
      category,
      hashtags,
      mediaUrls,
      confidenceScore,
      substitutionsUsed,
      substitutions_used,
    } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Normalize media_url (support both single URL and array)
    let media_url = null;
    if (mediaUrls && Array.isArray(mediaUrls) && mediaUrls.length > 0) {
      media_url = mediaUrls[0]; // Use first media URL for now
    } else if (typeof mediaUrls === "string") {
      media_url = mediaUrls;
    }

    const visibility = isPublic === true || isPublic === undefined ? "public" : "private";

    // Try PostgreSQL first
    if (isDbAvailable()) {
      try {
        const subs = Array.isArray(substitutionsUsed) ? substitutionsUsed : (Array.isArray(substitutions_used) ? substitutions_used : []);
        const recipeData = {
          userId: req.user.id || req.user.userId,
          title: title.trim(),
          originalRecipe: originalRecipe || "",
          convertedRecipe: convertedRecipe || "",
          ingredients: ingredients || [],
          instructions: instructions || "",
          category: category || "Main Course",
          hashtags: hashtags || [],
          mediaUrl: media_url,
          confidenceScore: confidenceScore || 0,
          visibility: visibility,
          substitutionsUsed: subs,
        };

        const dbRecipe = await createRecipeDB(recipeData);

        // Format response for frontend compatibility (use shared formatter when available)
        const formattedRecipe = formatDbRecipeForFrontend({
          ...dbRecipe,
          username: req.user.displayName || req.user.username || req.user.email?.split("@")[0],
        });
        formattedRecipe.mediaType = "image";
        formattedRecipe.isLiked = false;
        formattedRecipe.isSaved = false;

        return res.status(201).json({
          message: visibility === "public" ? "Recipe posted successfully" : "Recipe saved successfully",
          recipe: formattedRecipe,
        });
      } catch (dbError) {
        console.error("DB error, falling back to JSON:", dbError);
        // Fall through to JSON fallback
      }
    }

    // Fallback to JSON file storage
    const recipes = readRecipes();

    const newRecipe = {
      id: Date.now().toString(),
      user_id: req.user.id || req.user.userId,
      userId: req.user.id || req.user.userId, // Keep for backward compatibility
      username: req.user.displayName || req.user.username || req.user.email?.split("@")[0],
      title: title.trim(),
      original_recipe: originalRecipe || "",
      originalRecipe: originalRecipe || "", // Keep for backward compatibility
      converted_recipe: convertedRecipe || "",
      convertedRecipe: convertedRecipe || "", // Keep for backward compatibility
      description: instructions || "",
      ingredients: ingredients || [],
      category: category || "Main Course",
      hashtags: hashtags || [],
      media_url: media_url,
      mediaUrls: mediaUrls || [], // Keep for backward compatibility
      mediaType: "image",
      confidence_score: confidenceScore || 0,
      confidenceScore: confidenceScore || 0, // Keep for backward compatibility
      is_public: visibility === "public",
      isPublic: visibility === "public", // Keep for backward compatibility
      visibility: visibility,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(), // Keep for backward compatibility
      updatedAt: new Date().toISOString(),
    };

    recipes.push(newRecipe);
    writeRecipes(recipes);

    res.status(201).json({
      message: visibility === "public" ? "Recipe posted successfully" : "Recipe saved successfully",
      recipe: newRecipe,
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

/**
 * PUT /api/recipes/:id
 * Update recipe (protected, only owner)
 */
router.put("/:id", authenticateToken, (req, res) => {
  try {
    const recipes = readRecipes();
    const recipeIndex = recipes.findIndex((r) => r.id === req.params.id);

    if (recipeIndex === -1) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const recipe = recipes[recipeIndex];

    // Check ownership
    if (recipe.userId !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own recipes" });
    }

    // Update allowed fields (support both new and old field names)
    const {
      title,
      originalRecipe,
      original_recipe,
      convertedRecipe,
      converted_recipe,
      ingredients,
      instructions,
      isPublic,
      is_public,
      category,
      hashtags,
      mediaUrls,
      media_url,
      confidenceScore,
      confidence_score,
    } = req.body;

    if (title !== undefined) {
      recipes[recipeIndex].title = title.trim();
    }
    if (originalRecipe !== undefined || original_recipe !== undefined) {
      const value = originalRecipe || original_recipe;
      recipes[recipeIndex].originalRecipe = value;
      recipes[recipeIndex].original_recipe = value;
    }
    if (convertedRecipe !== undefined || converted_recipe !== undefined) {
      const value = convertedRecipe || converted_recipe;
      recipes[recipeIndex].convertedRecipe = value;
      recipes[recipeIndex].converted_recipe = value;
    }
    if (ingredients !== undefined) recipes[recipeIndex].ingredients = ingredients;
    if (instructions !== undefined) recipes[recipeIndex].description = instructions;
    if (isPublic !== undefined || is_public !== undefined) {
      const value = (isPublic === true || is_public === true);
      recipes[recipeIndex].isPublic = value;
      recipes[recipeIndex].is_public = value;
    }
    if (category !== undefined) recipes[recipeIndex].category = category;
    if (hashtags !== undefined) recipes[recipeIndex].hashtags = hashtags;
    if (mediaUrls !== undefined || media_url !== undefined) {
      const value = mediaUrls || media_url;
      recipes[recipeIndex].mediaUrls = Array.isArray(value) ? value : [value];
      recipes[recipeIndex].media_url = Array.isArray(value) ? value[0] : value;
    }
    if (confidenceScore !== undefined || confidence_score !== undefined) {
      const value = confidenceScore || confidence_score;
      recipes[recipeIndex].confidenceScore = value;
      recipes[recipeIndex].confidence_score = value;
    }

    recipes[recipeIndex].updatedAt = new Date().toISOString();

    writeRecipes(recipes);

    res.json({
      message: "Recipe updated successfully",
      recipe: recipes[recipeIndex],
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

/**
 * DELETE /api/recipes/:id
 * Delete recipe (protected, only owner). Uses DB when available.
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id || req.user.userId;
    if (isDbAvailable()) {
      try {
        const deleted = await deleteRecipeDB(id, userId);
        if (deleted) {
          return res.json({ message: "Recipe deleted successfully" });
        }
        return res.status(404).json({ error: "Recipe not found" });
      } catch (dbErr) {
        if (dbErr.message && dbErr.message.includes("only delete your own")) {
          return res.status(403).json({ error: dbErr.message });
        }
        console.error("DB error in DELETE /:id, falling back to file:", dbErr);
      }
    }
    const recipes = readRecipes();
    const recipeIndex = recipes.findIndex((r) => r.id === id);
    if (recipeIndex === -1) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    const recipe = recipes[recipeIndex];
    if (recipe.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own recipes" });
    }
    recipes.splice(recipeIndex, 1);
    writeRecipes(recipes);
    res.json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

export default router;
