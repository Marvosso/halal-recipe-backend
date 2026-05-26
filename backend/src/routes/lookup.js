/**
 * POST /api/lookup — deterministic ingredient intelligence (Phase 1).
 * Public endpoint; no AI/OCR in this phase.
 */

import express from "express";
import { lookupIngredient } from "../services/lookupService.js";
import { assertLookupResponse } from "../middleware/contractGuard.js";

const router = express.Router();

/**
 * POST /api/lookup
 * Body: { query: string, source?: string, locale?: string }
 */
router.post("/", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const query = body.query ?? body.ingredient;
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error: "invalid_query",
        message: "query (or ingredient) string is required",
      });
    }

    const result = await lookupIngredient(query.trim(), {
      source: body.source || "typed",
      locale: body.locale || "en",
    });

    res.json(assertLookupResponse(result));
  } catch (error) {
    if (error.code === "invalid_query") {
      return res.status(400).json({ error: error.code, message: error.message });
    }
    console.error("[lookup] error:", error);
    res.status(500).json({ error: "evaluation_failed", message: "Failed to evaluate ingredient" });
  }
});

export default router;
