import { useCallback, useRef, useState } from "react";
import { scanIngredientLabel } from "../api/scanApi";
import { parseOcrIngredients } from "../lib/parseOcrIngredients";
import { normalizeScanResponse } from "../lib/scan/scanResultModel";
import { FEATURES } from "../lib/featureFlags";

/**
 * Mobile-first label scan: client Tesseract OCR → server deterministic evaluation.
 */
export function useIngredientScan() {
  const [stage, setStage] = useState("choose");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const abortRef = useRef(null);

  const setPreview = useCallback((file) => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    if (!file) {
      setImagePreviewUrl(null);
      return;
    }
    setImagePreviewUrl(URL.createObjectURL(file));
    setStage("preview");
    setError(null);
  }, [imagePreviewUrl]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setStage("choose");
    setOcrProgress(0);
    setResult(null);
    setError(null);
  }, [imagePreviewUrl]);

  const runClientOcr = useCallback(async (imageFile) => {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && m.progress != null) {
          setOcrProgress(Math.round(m.progress * 100));
        }
      },
    });
    try {
      const { data } = await worker.recognize(imageFile);
      const text = data?.text || "";
      const confidence =
        typeof data?.confidence === "number" ? data.confidence / 100 : 0.75;
      return { text, confidence };
    } finally {
      await worker.terminate();
    }
  }, []);

  const evaluateText = useCallback(async (rawText, ocrConfidence = 0.85) => {
    const tokens = parseOcrIngredients(rawText);
    if (tokens.length === 0) {
      const err = new Error(
        "No ingredients detected. Try a clearer photo of the ingredient list."
      );
      err.code = "no_ingredients";
      throw err;
    }

    if (!FEATURES.USE_SERVER_SCAN) {
      const err = new Error(
        "Server scan is required for label evaluation. Check your connection and try again."
      );
      err.code = "server_scan_disabled";
      throw err;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const scanResponse = await scanIngredientLabel(rawText, {
      ocrConfidence,
      signal: controller.signal,
    });
    return normalizeScanResponse(scanResponse);
  }, []);

  const scanFromImage = useCallback(
    async (imageFile) => {
      if (!imageFile) return;
      setStage("extracting");
      setError(null);
      setOcrProgress(0);
      setResult(null);

      try {
        const { text, confidence } = await runClientOcr(imageFile);
        const normalized = await evaluateText(text, confidence);
        setResult(normalized);
        setStage("results");
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(err.message || "Scan failed. Try another photo.");
        setStage(imagePreviewUrl ? "preview" : "choose");
      }
    },
    [evaluateText, imagePreviewUrl, runClientOcr]
  );

  const scanFromText = useCallback(
    async (rawText) => {
      setStage("extracting");
      setError(null);
      setResult(null);
      try {
        const normalized = await evaluateText(rawText, 0.9);
        setResult(normalized);
        setStage("results");
      } catch (err) {
        setError(err.message || "Could not parse ingredients.");
        setStage("choose");
      }
    },
    [evaluateText]
  );

  return {
    stage,
    setStage,
    ocrProgress,
    result,
    error,
    setError,
    imagePreviewUrl,
    setPreview,
    reset,
    scanFromImage,
    scanFromText,
  };
}
