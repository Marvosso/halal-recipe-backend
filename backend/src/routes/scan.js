/**
 * POST /api/scan — public ingredient label scan MVP.
 * OCR on client or server → tokenize → alias cleanup → deterministic evaluation.
 */

import express from "express";
import multer from "multer";
import { runIngredientLabelScan } from "../modules/ocr-scan/index.js";
import { extractTextFromImage } from "../services/ocrAdapter.js";
import { assertScanResponse } from "../middleware/contractGuard.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * POST /api/scan
 * JSON: { rawText: string, ocrConfidence?: number, locale?: string }
 * Multipart: field "image" (optional rawText in body fields)
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    let rawText = (body.rawText != null ? String(body.rawText) : "").trim();
    let ocrConfidence = body.ocrConfidence != null ? Number(body.ocrConfidence) : 0.85;

    if (req.file?.buffer) {
      const { text, confidence } = await extractTextFromImage(req.file.buffer);
      if (text?.trim()) rawText = text.trim();
      if (typeof confidence === "number" && !Number.isNaN(confidence)) {
        ocrConfidence = confidence;
      }
    }

    if (!rawText) {
      return res.status(400).json({
        error: "no_text",
        message:
          'Provide rawText (JSON) or upload an image with field "image". For best results on mobile, run OCR in the browser and send rawText.',
      });
    }

    const result = await runIngredientLabelScan(rawText, {
      ocrConfidence,
      locale: body.locale || "en",
      useAiExplanation: body.useAiExplanation === true,
    });

    res.json(assertScanResponse(result));
  } catch (error) {
    console.error("[scan] error:", error);
    res.status(500).json({
      error: "scan_failed",
      message: "Failed to scan ingredient label",
    });
  }
});

export default router;
