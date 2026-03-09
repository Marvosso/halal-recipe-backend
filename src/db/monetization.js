/**
 * Monetization layer: affiliate_providers + ingredient_substitute_links.
 * Provider-agnostic; supports enable/disable by config, priority by category, future direct halal sponsors.
 * Fallback: when provider unavailable (disabled or not in region) exclude from results; when no links, return [].
 */

import { getPool } from "../database.js";

/** Single-provider (Amazon) until more affiliate programs are approved; then increase to 3. */
const MAX_LINKS_PER_INGREDIENT = 1;

function safeGetPool() {
  try {
    return getPool();
  } catch {
    return null;
  }
}

/**
 * Get active providers available in region (enabled + in regions list).
 * @param {string} [regionCode] - e.g. 'US', 'CA'. If null/empty, returns all active providers.
 * @returns {Promise<Array<{id: string, name: string, display_name: string, url_template: string, color_hex: string, product_fit: string[], sort_order: number, regions: string[], affiliate_param_key: string|null, affiliate_param_value: string|null, sponsorship_type: string}>>}
 */
export async function getActiveProviders(regionCode = null) {
  const pool = safeGetPool();
  if (!pool) return [];

  try {
    let query = `
      SELECT id, name, display_name, url_template, color_hex,
             COALESCE(product_fit, '{}') AS product_fit,
             sort_order, COALESCE(regions, '{}') AS regions,
             affiliate_param_key, affiliate_param_value, sponsorship_type
      FROM affiliate_providers
      WHERE is_active = true
    `;
    const params = [];
    if (regionCode && regionCode.trim()) {
      query += ` AND (array_length(regions, 1) IS NULL OR $1 = ANY(regions))`;
      params.push(regionCode.trim().toUpperCase());
    }
    query += ` ORDER BY sort_order ASC, name ASC`;

    const result = await pool.query(query, params);
    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      url_template: r.url_template,
      color_hex: r.color_hex || null,
      product_fit: Array.isArray(r.product_fit) ? r.product_fit : [],
      sort_order: r.sort_order ?? 99,
      regions: Array.isArray(r.regions) ? r.regions : [],
      affiliate_param_key: r.affiliate_param_key ?? null,
      affiliate_param_value: r.affiliate_param_value ?? null,
      sponsorship_type: r.sponsorship_type || "standard",
    }));
  } catch (err) {
    console.error("[monetization] getActiveProviders error:", err.message);
    return [];
  }
}

/**
 * Categorize substitute for product-fit ranking (pantry / grocery / specialty).
 * @param {string} substituteSlug
 * @returns {string}
 */
function categorizeProductFit(substituteSlug) {
  if (!substituteSlug) return "unknown";
  const s = substituteSlug.toLowerCase();
  const pantry = ["agar_agar", "grape_juice", "vanilla", "vinegar", "flour", "sugar", "oil", "spices", "canned", "dried", "white_wine_vinegar_halal", "halal_vanilla_extract"];
  const grocery = ["turkey_bacon", "halal_beef_bacon", "beef_bacon", "halal_beef", "halal_chicken", "halal_lamb", "fresh_herbs", "dairy", "eggs"];
  const specialty = ["halal_gelatin", "halal_cheese", "halal_parmesan"];
  if (pantry.some((p) => s.includes(p))) return "pantry";
  if (grocery.some((g) => s.includes(g))) return "grocery";
  if (specialty.some((sp) => s.includes(sp))) return "specialty";
  return "unknown";
}

/**
 * Get ranked affiliate links for a substitute. Only returns links for active, in-region providers.
 * Ranking: product_fit match > provider sort_order > link is_featured > display_order.
 * @param {string} substituteSlug - Normalized id e.g. agar_agar, halal_beef_bacon
 * @param {string} [regionCode] - e.g. 'US'. Omit for all regions.
 * @param {number} [limit=3]
 * @returns {Promise<Array<{id: string, substitute_slug: string, provider: object, search_query: string, custom_url: string|null, is_featured: boolean, url: string}>>}
 */
export async function getLinksForSubstitute(substituteSlug, regionCode = null, limit = MAX_LINKS_PER_INGREDIENT) {
  const pool = safeGetPool();
  if (!pool || !substituteSlug || typeof substituteSlug !== "string") return [];

  const slug = substituteSlug.trim().toLowerCase().replace(/\s+/g, "_");
  if (!slug) return [];

  try {
    const productFit = categorizeProductFit(slug);
    const providers = await getActiveProviders(regionCode || undefined);
    const providerIds = new Set(providers.map((p) => p.id));
    if (providerIds.size === 0) return [];

    const linkQuery = `
      SELECT isl.id, isl.substitute_slug, isl.provider_id, isl.search_query, isl.custom_url,
             isl.affiliate_param_key AS link_affiliate_key, isl.affiliate_param_value AS link_affiliate_value,
             isl.is_featured, isl.display_order,
             ap.name AS provider_name, ap.display_name AS provider_display_name, ap.url_template,
             ap.color_hex, ap.affiliate_param_key AS provider_affiliate_key, ap.affiliate_param_value AS provider_affiliate_value
      FROM ingredient_substitute_links isl
      JOIN affiliate_providers ap ON isl.provider_id = ap.id
      WHERE isl.substitute_slug = $1
        AND isl.is_active = true
        AND ap.is_active = true
    `;
    const linkResult = await pool.query(linkQuery, [slug]);
    const rows = linkResult.rows || [];

    const byProviderId = new Map(providers.map((p) => [p.id, p]));
    const links = rows
      .filter((r) => byProviderId.has(r.provider_id))
      .map((r) => {
        const provider = byProviderId.get(r.provider_id);
        const paramKey = r.link_affiliate_key ?? r.provider_affiliate_key ?? provider?.affiliate_param_key;
        const paramValue = r.link_affiliate_value ?? r.provider_affiliate_value ?? provider?.affiliate_param_value;
        const url = buildUrl(
          r.custom_url,
          r.search_query,
          r.url_template || provider?.url_template,
          paramKey,
          paramValue
        );
        const productFitMatch = (provider?.product_fit || []).includes(productFit) ? 1 : 0;
        return {
          id: r.id,
          substitute_slug: r.substitute_slug,
          provider: {
            id: provider?.id,
            name: provider?.name ?? r.provider_name,
            display_name: provider?.display_name ?? r.provider_display_name,
            color_hex: provider?.color_hex ?? r.color_hex,
          },
          search_query: r.search_query,
          custom_url: r.custom_url || null,
          is_featured: !!r.is_featured,
          display_order: r.display_order ?? 0,
          url,
          _product_fit_match: productFitMatch,
          _sort_order: provider?.sort_order ?? 99,
        };
      });

    links.sort((a, b) => {
      if (a._product_fit_match !== b._product_fit_match) return b._product_fit_match - a._product_fit_match;
      if (a._sort_order !== b._sort_order) return a._sort_order - b._sort_order;
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return a.display_order - b.display_order;
    });

    return links.slice(0, limit).map(({ _product_fit_match, _sort_order, ...rest }) => rest);
  } catch (err) {
    console.error("[monetization] getLinksForSubstitute error:", err.message);
    return [];
  }
}

/**
 * Build affiliate URL from link and provider data.
 */
function buildUrl(customUrl, searchQuery, urlTemplate, paramKey, paramValue) {
  if (customUrl && (paramKey && paramValue)) {
    const sep = customUrl.includes("?") ? "&" : "?";
    return `${customUrl}${sep}${encodeURIComponent(paramKey)}=${encodeURIComponent(paramValue)}`;
  }
  if (customUrl) return customUrl;
  if (!urlTemplate || !searchQuery) return "";
  const encoded = encodeURIComponent(searchQuery);
  let url = urlTemplate.replace(/\{query\}/g, encoded);
  if (paramKey && paramValue) {
    const sep = url.includes("?") ? "&" : "?";
    url += `${sep}${encodeURIComponent(paramKey)}=${encodeURIComponent(paramValue)}`;
  }
  return url;
}

/**
 * Get affiliate links for multiple substitutes (batch). Fallback: missing substitute => [].
 * @param {string[]} substituteSlugs
 * @param {string} [regionCode]
 * @param {number} [limitPerSubstitute=3]
 * @returns {Promise<Record<string, Array>>} Map of substitute_slug -> normalized link objects for frontend
 */
export async function getLinksForSubstitutes(substituteSlugs, regionCode = null, limitPerSubstitute = MAX_LINKS_PER_INGREDIENT) {
  const slugs = Array.isArray(substituteSlugs) ? substituteSlugs.filter((s) => s && typeof s === "string") : [];
  const result = {};
  await Promise.all(
    slugs.map(async (slug) => {
      const links = await getLinksForSubstitute(slug, regionCode, limitPerSubstitute);
      if (links.length) result[slug] = normalizeLinksForFrontend(links);
    })
  );
  return result;
}

/**
 * Normalize link rows to frontend contract: id, platform (id, name, display_name, color_hex), search_query, url, is_featured.
 */
function normalizeLinksForFrontend(links) {
  return links.map((link) => ({
    id: link.id,
    platform: link.provider?.name ?? link.provider?.id,
    platform_display: link.provider?.display_name ?? link.provider?.name,
    platform_color: link.provider?.color_hex ?? null,
    search_query: link.search_query,
    url: link.url,
    is_featured: link.is_featured,
  }));
}
