/**
 * Affiliate gateway — sole entry point for features (lookup, conversion, UI).
 * Implementation delegates to affiliateService (API + fallback); do not import affiliateService elsewhere.
 */

import { getAffiliateLinksForSubstitutes } from "../affiliateService.js";
import { MAX_LINKS_PER_INGREDIENT } from "../../config/affiliateProviderConfig.js";
import { detectUserRegion } from "../regionDetection.js";
import { normalizeAffiliateLink } from "./affiliateLinkModel.js";

export { normalizeAffiliateLink, pickAffiliateLinksForSlug } from "./affiliateLinkModel.js";

/**
 * @param {{ regionCode?: string }} [options]
 * @returns {Promise<string>}
 */
export async function resolveAffiliateRegionCode(options = {}) {
  if (options.regionCode) return options.regionCode;
  try {
    const region = await detectUserRegion();
    return region.countryCode || "US";
  } catch {
    return "US";
  }
}

/**
 * Fetch normalized affiliate links for substitute slugs.
 * @param {string[]} substituteSlugs
 * @param {string|{ regionCode?: string, limitPerSubstitute?: number }} [optionsOrRegion]
 */
export async function fetchAffiliateLinksBySubstitute(
  substituteSlugs,
  optionsOrRegion = {}
) {
  const options =
    typeof optionsOrRegion === "string"
      ? { regionCode: optionsOrRegion }
      : optionsOrRegion || {};

  const ids = [...new Set((substituteSlugs || []).filter(Boolean))];
  if (ids.length === 0) return {};

  const regionCode = await resolveAffiliateRegionCode(options);
  const limit = options.limitPerSubstitute ?? MAX_LINKS_PER_INGREDIENT;

  const raw = await getAffiliateLinksForSubstitutes(ids, regionCode, limit);

  const out = {};
  for (const [slug, links] of Object.entries(raw || {})) {
    const normalized = (links || []).map(normalizeAffiliateLink).filter(Boolean);
    if (normalized.length > 0) out[slug] = normalized;
  }
  return out;
}
