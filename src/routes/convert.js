import express from "express";
import { convertService } from "../services/convertService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const requestStart = Date.now();
  const { recipe, preferences } = req.body;
  
  // Validate that recipe is provided
  if (!recipe || (typeof recipe === "string" && recipe.trim() === "")) {
    return res.status(400).json({ error: "Please provide a recipe to convert." });
  }
  
  // Extract user preferences (strictnessLevel, schoolOfThought)
  const userPreferences = {
    strictnessLevel: preferences?.strictnessLevel || preferences?.strictness || "standard",
    schoolOfThought: preferences?.schoolOfThought || preferences?.madhab || "no-preference"
  };
  
  try {
    const conversionStart = Date.now();
    const result = await convertService(recipe, userPreferences);
    const conversionTime = Date.now() - conversionStart;
    const totalTime = Date.now() - requestStart;
    
    // Lightweight server-side timing logs (console only)
    console.log(`[PERF] /convert - Conversion: ${conversionTime}ms, Total: ${totalTime}ms`);
    
    res.json(result);
  } catch (err) {
    const totalTime = Date.now() - requestStart;
    console.error(`[PERF] /convert - Error after ${totalTime}ms:`, err);
    res.status(500).json({ error: "Conversion failed. Please try again later." });
  }
});

export default router;
