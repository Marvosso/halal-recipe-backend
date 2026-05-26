/**
 * Normalized affiliate link shape (no I/O).
 */

import { MAX_LINKS_PER_INGREDIENT } from "../../config/affiliateProviderConfig.js";

/**
 * @param {object} link - raw link from affiliateService
 */
export function normalizeAffiliateLink(link) {
  if (!link) return null;
  const platform = link.platform || {};
  return {
    id: link.id,
    platform: platform.name || platform.id || "unknown",
    platform_display: platform.display_name || platform.name || "Shop",
    platform_color: platform.color_hex ?? link.platform_color ?? null,
    search_query: link.search_query || "",
    url: link.url || null,
    is_featured: !!link.is_featured,
  };
}

/**
 * @param {Record<string, object[]>} linksBySlug
 * @param {string} slug
 * @param {number} [limit]
 */
export function pickAffiliateLinksForSlug(
  linksBySlug,
  slug,
  limit = MAX_LINKS_PER_INGREDIENT
) {
  if (!linksBySlug || !slug) return [];
  return (linksBySlug[slug] || []).slice(0, limit);
}
