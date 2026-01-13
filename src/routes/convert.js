import express from "express";
import { convertService } from "../services/convertService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { recipe } = req.body;
  
  // Validate that recipe is provided
  if (!recipe || (typeof recipe === "string" && recipe.trim() === "")) {
    return res.status(400).json({ error: "Please provide a recipe to convert." });
  }
  
  try {
    const result = await convertService(recipe);
    res.json(result);
  } catch (err) {
    console.error("Error in /convert endpoint:", err);
    res.status(500).json({ error: "Conversion failed. Please try again later." });
  }
});

export default router;
