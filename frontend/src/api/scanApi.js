import { getAPIURL } from "../utils/apiConfig";

/**
 * Submit label scan: client OCR text + confidence → server deterministic evaluation.
 * @param {string} rawText
 * @param {{ ocrConfidence?: number, locale?: string, signal?: AbortSignal }} [options]
 */
export async function scanIngredientLabel(rawText, options = {}) {
  const url = await getAPIURL("/api/scan");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawText: rawText.trim(),
      ocrConfidence: options.ocrConfidence ?? 0.85,
      locale: options.locale || "en",
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.message || `Scan failed (${response.status})`);
    err.status = response.status;
    err.code = body.error || "scan_failed";
    throw err;
  }

  return response.json();
}
