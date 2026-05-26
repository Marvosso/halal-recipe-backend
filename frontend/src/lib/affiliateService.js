/**
 * Affiliate Service – internal provider layer (API + fallback).
 * @internal Features must import from `lib/monetization` only — not this module.
 */

import { getProviderById, MAX_LINKS_PER_INGREDIENT } from '../config/affiliateProviderConfig.js';
import { autoRouteAffiliateLinks } from './affiliateRouting.js';

/**
 * Fetch affiliate links from backend API (normalized data).
 * @param {string[]} substituteIds
 * @param {string} [regionCode]
 * @param {number} [limitPerSubstitute]
 * @returns {Promise<Record<string, Array>>} linksBySubstitute – each link normalized to { id, platform: { name, display_name, color_hex }, search_query, url, is_featured }
 */
async function fetchAffiliateLinksFromApi(substituteIds, regionCode = 'US', limitPerSubstitute = MAX_LINKS_PER_INGREDIENT) {
  try {
    const { getAPIBaseURL } = await import('../utils/apiConfig');
    const base = await getAPIBaseURL();
    const res = await fetch(`${base}/api/affiliate/links/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        substituteIds: substituteIds || [],
        regionCode: regionCode || null,
        limitPerSubstitute: limitPerSubstitute || MAX_LINKS_PER_INGREDIENT,
      }),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const linksBySubstitute = data.linksBySubstitute || {};
    const out = {};
    for (const [slug, links] of Object.entries(linksBySubstitute)) {
      if (!Array.isArray(links) || links.length === 0) continue;
      out[slug] = links.map((link) => ({
        id: link.id,
        platform: {
          name: link.platform ?? link.platform_display ?? 'unknown',
          display_name: link.platform_display ?? link.platform ?? 'Unknown',
          color_hex: link.platform_color ?? null,
        },
        search_query: link.search_query ?? '',
        url: link.url ?? null,
        is_featured: !!link.is_featured,
      }));
    }
    return out;
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[affiliate] API unavailable, using fallback:', e?.message);
    }
    return {};
  }
}

/** Fallback: client-side mock + routing when API has no data for this substitute. */
async function getAffiliateLinksForSubstituteFallback(substituteId, regionCode, limit) {
  const rawLinks = generateMockAffiliateLinks(substituteId, regionCode || 'US');
  const routed = await autoRouteAffiliateLinks(rawLinks, substituteId);
  return routed.slice(0, limit).map((link) => ({
    ...link,
    url: buildAffiliateUrl(link),
  }));
}

/**
 * Get affiliate links for a substitute (single). Tries API first, then fallback.
 */
export async function getAffiliateLinksForSubstitute(substituteId, regionCode = null, limit = MAX_LINKS_PER_INGREDIENT) {
  try {
    const region = regionCode || 'US';
    const fromApi = await fetchAffiliateLinksFromApi([substituteId], region, limit);
    if (fromApi[substituteId] && fromApi[substituteId].length > 0) {
      return fromApi[substituteId];
    }
    return await getAffiliateLinksForSubstituteFallback(substituteId, region, limit);
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return [];
  }
}

function platformFromProvider(providerId) {
  const p = getProviderById(providerId);
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    display_name: p.display_name,
    color_hex: p.color_hex,
  };
}

function getSubstituteLinkMap() {
  return {
    agar_agar: [
      { platform: 'amazon', search_query: 'agar agar halal certified', is_featured: true },
      { platform: 'walmart', search_query: 'agar agar', is_featured: false },
      { platform: 'thrivemarket', search_query: 'organic agar agar', is_featured: false },
    ],
    turkey_bacon: [
      { platform: 'amazon', search_query: 'halal turkey bacon certified', is_featured: true },
      { platform: 'walmart', search_query: 'halal turkey bacon', is_featured: false },
      { platform: 'target', search_query: 'halal turkey bacon', is_featured: false },
    ],
    halal_beef_bacon: [
      { platform: 'amazon', search_query: 'halal beef bacon certified', is_featured: true },
      { platform: 'walmart', search_query: 'halal beef bacon', is_featured: false },
      { platform: 'target', search_query: 'halal beef bacon', is_featured: false },
    ],
    beef_bacon: [
      { platform: 'amazon', search_query: 'halal beef bacon certified', is_featured: true },
      { platform: 'walmart', search_query: 'halal beef bacon', is_featured: false },
    ],
    grape_juice: [
      { platform: 'amazon', search_query: '100% pure grape juice halal', is_featured: true },
      { platform: 'walmart', search_query: 'pure grape juice', is_featured: false },
      { platform: 'thrivemarket', search_query: 'grape juice', is_featured: false },
    ],
    halal_vanilla_extract: [
      { platform: 'amazon', search_query: 'alcohol free vanilla extract halal', is_featured: true },
      { platform: 'thrivemarket', search_query: 'alcohol free vanilla', is_featured: false },
    ],
    white_wine_vinegar_halal: [
      { platform: 'amazon', search_query: 'halal white wine vinegar', is_featured: true },
      { platform: 'walmart', search_query: 'white wine vinegar', is_featured: false },
    ],
  };
}

function generateMockAffiliateLinks(substituteId, regionCode) {
  const linkMap = getSubstituteLinkMap();
  const entries = linkMap[substituteId] || [];
  const region = regionCode || 'US';

  return entries.map((entry, index) => {
    const platform = platformFromProvider(entry.platform);
    if (!platform) return null;
    return {
      id: `link_${substituteId}_${entry.platform}_${index}`,
      platform,
      search_query: entry.search_query,
      affiliate_tag: entry.platform === 'amazon' ? 'halalkitchen-20' : null,
      is_featured: entry.is_featured || false,
      click_count: 0,
      region_code: region,
    };
  }).filter(Boolean);
}

export function buildAffiliateUrl(linkData) {
  if (!linkData || !linkData.platform) return null;
  if (linkData.url) return linkData.url;
  const provider = getProviderById(linkData.platform.id || linkData.platform.name);
  if (!provider || !provider.url_template) return null;

  const query = encodeURIComponent(linkData.search_query || '');
  let url = provider.url_template.replace('{query}', query);
  if (provider.affiliate_param && provider.affiliate_param.key && provider.affiliate_param.value) {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}${provider.affiliate_param.key}=${encodeURIComponent(provider.affiliate_param.value)}`;
  }
  return url;
}

/**
 * Get affiliate links for multiple substitutes. Prefers API; fallback per substitute when API missing.
 */
export async function getAffiliateLinksForSubstitutes(substituteIds, regionCode = null, limitPerSubstitute = MAX_LINKS_PER_INGREDIENT) {
  const ids = (substituteIds || []).filter((s) => s && typeof s === 'string');
  const region = regionCode || 'US';

  const fromApi = await fetchAffiliateLinksFromApi(ids, region, limitPerSubstitute);
  const linksMap = { ...fromApi };

  for (const id of ids) {
    if (linksMap[id] && linksMap[id].length > 0) continue;
    const fallback = await getAffiliateLinksForSubstituteFallback(id, region, limitPerSubstitute);
    if (fallback.length > 0) linksMap[id] = fallback;
  }

  return linksMap;
}
