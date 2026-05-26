/**
 * Monetization feature flags — trust-first defaults.
 * Affiliate substitute tips: on by default.
 * Display ads (AdSense): opt-in only via env.
 */

function envFlag(name, defaultOn = false) {
  const v = typeof import.meta !== "undefined" ? import.meta.env?.[name] : undefined;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return defaultOn;
}

/** Contextual halal substitute shop tips (non-blocking, lazy-loaded). */
export function isAffiliateRecommendationsEnabled() {
  return envFlag("VITE_ENABLE_AFFILIATE_RECOMMENDATIONS", true);
}

/** Third-party display ads (AdSense). Off unless explicitly enabled. */
export function isContextualAdsEnabled() {
  return envFlag("VITE_ENABLE_CONTEXTUAL_ADS", false);
}

export function getAdSenseClient() {
  if (!isContextualAdsEnabled()) return "";
  return import.meta.env?.VITE_ADSENSE_CLIENT || "";
}
