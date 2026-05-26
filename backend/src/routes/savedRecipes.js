/**
 * Saved Halal Recipes API — converter saves only (private conversions).
 *
 * GET    /api/saved-recipes       — list current user's saves
 * POST   /api/saved-recipes       — save a conversion
 * GET    /api/saved-recipes/:id   — get one save
 * DELETE /api/saved-recipes/:id   — delete save
 */

import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  saveHalalRecipe,
  listSavedHalalRecipes,
  getSavedHalalRecipe,
  removeSavedHalalRecipe,
} from "../services/savedRecipesService.js";
import { sanitizeSavedRecipePayload } from "../services/savedRecipeValidation.js";

const router = express.Router();

router.use(authenticateToken);

/**
 * GET /api/saved-recipes
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const recipes = await listSavedHalalRecipes(userId);
    res.json({ recipes, count: recipes.length });
  } catch (error) {
    console.error("[saved-recipes] list error:", error);
    res.status(500).json({ error: "Failed to load saved recipes" });
  }
});

/**
 * POST /api/saved-recipes
 * Body: { title, originalRecipe, convertedRecipe, confidenceScore?, substitutionsUsed?, issues? }
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { title, originalRecipe, convertedRecipe, confidenceScore, substitutionsUsed, issues } =
      req.body || {};

    if (!originalRecipe?.trim() || !convertedRecipe?.trim()) {
      return res.status(400).json({
        error: "invalid_payload",
        message: "originalRecipe and convertedRecipe are required",
      });
    }

    const derivedTitle =
      (title && String(title).trim()) ||
      originalRecipe.split(/\n/)[0]?.trim()?.slice(0, 80) ||
      "Saved conversion";

    const sanitized = sanitizeSavedRecipePayload({
      title: derivedTitle,
      originalRecipe,
      convertedRecipe,
      confidenceScore,
      substitutionsUsed,
      issues,
    });

    const recipe = await saveHalalRecipe(sanitized, userId);

    res.status(201).json({
      message: "Halal version saved",
      recipe,
    });
  } catch (error) {
    console.error("[saved-recipes] save error:", error);
    res.status(500).json({ error: "Failed to save recipe" });
  }
});

/**
 * GET /api/saved-recipes/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const recipe = await getSavedHalalRecipe(req.params.id, userId);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json({ recipe });
  } catch (error) {
    console.error("[saved-recipes] get error:", error);
    res.status(500).json({ error: "Failed to load recipe" });
  }
});

/**
 * DELETE /api/saved-recipes/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const deleted = await removeSavedHalalRecipe(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json({ message: "Saved recipe deleted" });
  } catch (error) {
    console.error("[saved-recipes] delete error:", error);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

export default router;
