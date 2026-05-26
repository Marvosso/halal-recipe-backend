import { getAPIURL } from "../utils/apiConfig";

/**
 * @typedef {object} LookupApiResponse
 */

/**
 * Deterministic ingredient lookup via backend intelligence engine.
 * @param {string} query
 * @param {{ source?: string, locale?: string, signal?: AbortSignal }} [options]
 * @returns {Promise<LookupApiResponse>}
 */
export async function lookupIngredient(query, options = {}) {
  const url = await getAPIURL("/api/lookup");
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: query.trim(),
      source: options.source || "typed",
      locale: options.locale || "en",
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const err = new Error(body.message || `Lookup failed (${response.status})`);
    err.status = response.status;
    err.code = body.error || "lookup_failed";
    throw err;
  }

  return response.json();
}
