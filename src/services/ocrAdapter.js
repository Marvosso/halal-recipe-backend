/**
 * OCR adapter for photo scan pipeline.
 * Implementations: stub (no-op for text-only), Tesseract.js, or Google Cloud Vision.
 * Contract: extractText(imageBuffer) → { text, confidence }.
 */

/**
 * Stub adapter: no image support; use when client sends raw text or you use client-side OCR.
 * @param {Buffer} [_imageBuffer]
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function extractTextStub(_imageBuffer) {
  return {
    text: "",
    confidence: 0,
  };
}

/**
 * Resolve OCR implementation. Prefer env OCR_PROVIDER: "tesseract" | "google" | "stub".
 * @returns {{ extractText: (Buffer) => Promise<{ text: string, confidence: number }> }}
 */
export function getOcrAdapter() {
  const provider = (process.env.OCR_PROVIDER || "stub").toLowerCase();

  if (provider === "tesseract") {
    let tesseractPromise = null;
    return {
      async extractText(imageBuffer) {
        try {
          tesseractPromise = tesseractPromise || import("tesseract.js");
          const tesseract = await tesseractPromise;
          const { data } = await tesseract.default.recognize(imageBuffer, "eng", {
            logger: () => {},
          });
          return {
            text: data?.text || "",
            confidence: (data?.confidence || 0) / 100,
          };
        } catch (err) {
          console.warn("[OCR] tesseract failed:", err?.message);
          return extractTextStub(imageBuffer);
        }
      },
    };
  }

  if (provider === "google") {
    // Optional: Google Cloud Vision API
    // const vision = require('@google-cloud/vision');
    // return { async extractText(buf) { ... } };
  }

  return {
    async extractText() {
      return extractTextStub();
    },
  };
}

/**
 * Extract text from image buffer using configured adapter.
 * @param {Buffer} imageBuffer
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function extractTextFromImage(imageBuffer) {
  const adapter = getOcrAdapter();
  return adapter.extractText(imageBuffer);
}
