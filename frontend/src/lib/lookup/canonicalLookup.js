/**
 * Canonical ingredient lookup — POST /api/lookup only (Phase 1).
 * @module lib/lookup/canonicalLookup
 */

import { lookupIngredient } from "../../api/lookupApi.js";
import { FEATURES } from "../featureFlags.js";
import { cacheLookupResponse, getCachedLookupResponse } from "./lookupCache.js";
import { mapApiToLookupResult } from "./lookupResultModel.js";
import { resolveLookupSource } from "./lookupSources.js";

export { resolveLookupSource };

/**
 * Perform authoritative ingredient lookup.
 * @param {string} query
 * @param {{ source?: LookupSource, signal?: AbortSignal }} [options]
 * @returns {Promise<{
 *   result: object,
 *   error: { code: string, message: string } | null,
 *   fromCache: boolean,
 * }>}
 */
export async function performCanonicalLookup(query, options = {}) {
  const trimmed = (query || "").trim();
  if (!trimmed) {
    return { result: null, error: null, fromCache: false };
  }

  const source = resolveLookupSource(options.source);

  if (!FEATURES.USE_SERVER_LOOKUP) {
    return {
      result: null,
      error: {
        code: "server_disabled",
        message: "Server lookup is required. Enable USE_SERVER_LOOKUP or try again later.",
      },
      fromCache: false,
    };
  }

  try {
    const api = await lookupIngredient(trimmed, {
      source,
      signal: options.signal,
    });
    cacheLookupResponse(trimmed, api);
    return {
      result: mapApiToLookupResult(api, trimmed),
      error: null,
      fromCache: false,
    };
  } catch (err) {
    if (err.name === "AbortError") {
      throw err;
    }

    const cached = getCachedLookupResponse(trimmed);
    if (cached?.api) {
      const mapped = mapApiToLookupResult(cached.api, trimmed);
      mapped.source = "cache";
      mapped.meta = {
        ...mapped.meta,
        cached_at: cached.cached_at,
        cache_note: "Last result from Halal Kitchen servers",
      };
      return {
        result: mapped,
        error: {
          code: "cached_result",
          message:
            "You're offline or the server is unavailable. Showing your last saved result for this ingredient — connect to refresh.",
        },
        fromCache: true,
      };
    }

    return {
      result: null,
      error: {
        code: err.code || "lookup_failed",
        message:
          err.message ||
          "We could not look up this ingredient. Check your connection and try again.",
      },
      fromCache: false,
    };
  }
}
