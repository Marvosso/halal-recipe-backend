/**
 * Last-good server lookup cache (sessionStorage).
 * Offline-safe: replay authoritative server verdicts only — never client engine results.
 */

const CACHE_KEY = "hk_lookup_cache_v1";
const MAX_ENTRIES = 40;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function readStore() {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

function normalizeKey(query) {
  return (query || "").trim().toLowerCase();
}

/**
 * @param {string} query
 * @param {object} apiResponse - raw POST /api/lookup body
 */
export function cacheLookupResponse(query, apiResponse) {
  const key = normalizeKey(query);
  if (!key || !apiResponse) return;

  const store = readStore();
  store[key] = {
    api: apiResponse,
    cached_at: Date.now(),
  };

  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => (store[a].cached_at || 0) - (store[b].cached_at || 0))
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((k) => delete store[k]);
  }

  writeStore(store);
}

/**
 * @param {string} query
 * @returns {{ api: object, cached_at: number } | null}
 */
export function getCachedLookupResponse(query) {
  const key = normalizeKey(query);
  if (!key) return null;

  const entry = readStore()[key];
  if (!entry?.api) return null;
  if (Date.now() - (entry.cached_at || 0) > TTL_MS) return null;
  return entry;
}

export function clearLookupCache() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
