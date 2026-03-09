/**
 * Recent ingredient lookups – persisted in localStorage for repeat usage.
 * Max 5 items, deduped by normalized term (lowercase trim), newest first.
 */

const STORAGE_KEY = "halalKitchenRecentLookups";
const MAX_RECENT = 5;

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Get recent lookup terms (newest first), max 5.
 * @returns {string[]}
 */
export function getRecentLookups() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeParse(raw, []).slice(0, MAX_RECENT);
}

/**
 * Add a term to recent lookups: dedupe by normalized key, move to front, keep max 5.
 * @param {string} term - Ingredient search term (will be trimmed)
 */
export function addRecentLookup(term) {
  if (typeof window === "undefined" || !window.localStorage) return;
  const t = (term || "").trim();
  if (!t) return;

  const key = t.toLowerCase();
  const current = safeParse(localStorage.getItem(STORAGE_KEY), []);
  const rest = current.filter((item) => item.toLowerCase() !== key);
  const updated = [t, ...rest].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Clear all recent lookups (e.g. for a "Clear" action).
 */
export function clearRecentLookups() {
  if (typeof window === "undefined" || !window.localStorage) return;
  localStorage.removeItem(STORAGE_KEY);
}
