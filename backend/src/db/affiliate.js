/**
 * Affiliate Monetization Database Functions
 * Handles affiliate links, substitutes, and brand sponsorships
 */

import { getPool } from "../database.js";

/**
 * Get all active affiliate links for a substitute ingredient
 * @param {string} substituteNormalizedName - Normalized name of substitute ingredient
 * @param {string} regionCode - Optional region code (e.g., 'US', 'CA')
 * @returns {Promise<Array>} Array of affiliate links
 */
export async function getAffiliateLinksForSubstitute(substituteNormalizedName, regionCode = null) {
  const pool = getPool();
  
  const query = `
    SELECT 
      al.id,
      al.search_query,
      al.custom_url,
      al.affiliate_tag,
      al.product_name,
      al.product_image_url,
      al.price_range,
      al.rating,
      al.review_count,
      al.is_featured,
      ap.name AS platform_name,
      ap.display_name AS platform_display_name,
      ap.base_url_template,
      ap.color_hex AS platform_color,
      r.code AS region_code,
      r.name AS region_name,
      sb.name AS brand_name,
      sb.logo_url AS brand_logo
    FROM affiliate_links al
    JOIN ingredients i ON al.substitute_id = i.id
    JOIN affiliate_platforms ap ON al.platform_id = ap.id
    LEFT JOIN regions r ON al.region_id = r.id
    LEFT JOIN sponsored_brands sb ON al.sponsored_brand_id = sb.id
    WHERE i.normalized_name = $1
      AND al.is_active = true
      AND ap.is_active = true
      AND (al.region_id = (SELECT id FROM regions WHERE code = $2) OR al.region_id IS NULL OR $2 IS NULL)
    ORDER BY 
      al.is_featured DESC,
      CASE WHEN sb.sponsorship_tier = 'featured' THEN 1
           WHEN sb.sponsorship_tier = 'premium' THEN 2
           WHEN sb.sponsorship_tier = 'standard' THEN 3
           ELSE 4 END,
      al.click_count DESC
  `;
  
  const result = await pool.query(query, [substituteNormalizedName, regionCode]);
  return result.rows;
}

/**
 * Get all substitutes for an ingredient with their affiliate links
 * @param {string} ingredientNormalizedName - Normalized name of ingredient
 * @param {string} regionCode - Optional region code
 * @returns {Promise<Array>} Array of substitutes with affiliate links
 */
export async function getSubstitutesWithAffiliateLinks(ingredientNormalizedName, regionCode = null) {
  const pool = getPool();
  
  const query = `
    SELECT 
      s.id AS substitute_id,
      s.name AS substitute_name,
      s.normalized_name AS substitute_normalized_name,
      isub.replacement_ratio,
      isub.culinary_notes,
      isub.best_for,
      isub.flavor_match_score,
      isub.texture_match_score,
      isub.is_primary,
      isub.display_order,
      json_agg(
        json_build_object(
          'id', al.id,
          'platform', ap.name,
          'platform_display', ap.display_name,
          'platform_color', ap.color_hex,
          'base_url_template', ap.base_url_template,
          'search_query', al.search_query,
          'custom_url', al.custom_url,
          'affiliate_tag', al.affiliate_tag,
          'product_name', al.product_name,
          'product_image_url', al.product_image_url,
          'price_range', al.price_range,
          'rating', al.rating,
          'review_count', al.review_count,
          'is_featured', al.is_featured,
          'region_code', r.code,
          'brand_name', sb.name
        ) ORDER BY al.is_featured DESC, al.click_count DESC
      ) FILTER (WHERE al.id IS NOT NULL) AS affiliate_links
    FROM ingredients i
    JOIN ingredient_substitutes isub ON i.id = isub.ingredient_id
    JOIN ingredients s ON isub.substitute_id = s.id
    LEFT JOIN affiliate_links al ON s.id = al.substitute_id 
      AND al.is_active = true
      AND (al.region_id = (SELECT id FROM regions WHERE code = $2) OR al.region_id IS NULL OR $2 IS NULL)
    LEFT JOIN affiliate_platforms ap ON al.platform_id = ap.id AND ap.is_active = true
    LEFT JOIN regions r ON al.region_id = r.id
    LEFT JOIN sponsored_brands sb ON al.sponsored_brand_id = sb.id
    WHERE i.normalized_name = $1
      AND isub.is_active = true
    GROUP BY s.id, s.name, s.normalized_name, isub.replacement_ratio, 
             isub.culinary_notes, isub.best_for, isub.flavor_match_score,
             isub.texture_match_score, isub.is_primary, isub.display_order
    ORDER BY isub.display_order, isub.is_primary DESC
  `;
  
  const result = await pool.query(query, [ingredientNormalizedName, regionCode]);
  return result.rows;
}

/**
 * Track affiliate link click
 * @param {string} affiliateLinkId - UUID of affiliate link
 * @param {string} userId - Optional user ID
 * @param {string} sessionId - Session identifier
 * @param {Object} metadata - Additional metadata (user_agent, referrer, etc.)
 * @returns {Promise<Object>} Created click record
 */
export async function trackAffiliateClick(affiliateLinkId, userId = null, sessionId = null, metadata = {}) {
  const pool = getPool();
  
  const query = `
    INSERT INTO affiliate_link_clicks (
      affiliate_link_id,
      user_id,
      session_id,
      user_agent,
      referrer
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  // Also increment click count on affiliate_links table
  await pool.query(`
    UPDATE affiliate_links 
    SET click_count = click_count + 1,
        updated_at = NOW()
    WHERE id = $1
  `, [affiliateLinkId]);
  
  const result = await pool.query(query, [
    affiliateLinkId,
    userId,
    sessionId,
    metadata.user_agent || null,
    metadata.referrer || null
  ]);
  
  return result.rows[0];
}

/**
 * Record affiliate conversion (purchase)
 * @param {string} clickId - ID of the original click
 * @param {number} conversionValue - Revenue amount
 * @param {number} commissionAmount - Our commission
 * @returns {Promise<Object>} Updated click record
 */
export async function recordAffiliateConversion(clickId, conversionValue, commissionAmount) {
  const pool = getPool();
  
  // Update click record
  const updateClick = await pool.query(`
    UPDATE affiliate_link_clicks
    SET converted_at = NOW(),
        conversion_value = $1,
        commission_amount = $2
    WHERE id = $3
    RETURNING *
  `, [conversionValue, commissionAmount, clickId]);
  
  // Update affiliate link conversion count
  if (updateClick.rows[0]) {
    await pool.query(`
      UPDATE affiliate_links
      SET conversion_count = conversion_count + 1,
          updated_at = NOW()
      WHERE id = $1
    `, [updateClick.rows[0].affiliate_link_id]);
  }
  
  return updateClick.rows[0];
}

/**
 * Get affiliate link by ID
 * @param {string} linkId - UUID of affiliate link
 * @returns {Promise<Object|null>} Affiliate link or null
 */
export async function getAffiliateLinkById(linkId) {
  const pool = getPool();
  
  const query = `
    SELECT 
      al.*,
      ap.name AS platform_name,
      ap.display_name AS platform_display_name,
      ap.base_url_template,
      i.normalized_name AS substitute_normalized_name,
      i.name AS substitute_name
    FROM affiliate_links al
    JOIN affiliate_platforms ap ON al.platform_id = ap.id
    JOIN ingredients i ON al.substitute_id = i.id
    WHERE al.id = $1
      AND al.is_active = true
  `;
  
  const result = await pool.query(query, [linkId]);
  return result.rows[0] || null;
}

/**
 * Build affiliate URL from link data
 * @param {Object} linkData - Affiliate link data
 * @returns {string} Complete affiliate URL
 */
export function buildAffiliateUrl(linkData) {
  if (linkData.custom_url) {
    // Direct product URL with affiliate tag
    const separator = linkData.custom_url.includes('?') ? '&' : '?';
    return `${linkData.custom_url}${separator}tag=${linkData.affiliate_tag}`;
  }
  
  // Build from template
  const searchQuery = encodeURIComponent(linkData.search_query);
  let url = linkData.base_url_template.replace('{query}', searchQuery);
  
  // Add affiliate tag if available
  if (linkData.affiliate_tag) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}tag=${linkData.affiliate_tag}`;
  }
  
  return url;
}

/**
 * Get top-performing affiliate links
 * @param {number} limit - Number of results
 * @param {string} platformName - Optional platform filter
 * @returns {Promise<Array>} Top performing links
 */
export async function getTopAffiliateLinks(limit = 20, platformName = null) {
  const pool = getPool();
  
  let query = `
    SELECT 
      i.name AS substitute_name,
      ap.display_name AS platform,
      r.name AS region,
      al.click_count,
      al.conversion_count,
      CASE 
        WHEN al.conversion_count > 0 THEN ROUND((al.conversion_count::DECIMAL / al.click_count) * 100, 2)
        ELSE 0
      END AS conversion_rate,
      al.commission_amount
    FROM affiliate_links al
    JOIN ingredients i ON al.substitute_id = i.id
    JOIN affiliate_platforms ap ON al.platform_id = ap.id
    LEFT JOIN regions r ON al.region_id = r.id
    WHERE al.is_active = true
      AND al.click_count > 0
  `;
  
  const params = [];
  if (platformName) {
    query += ` AND ap.name = $1`;
    params.push(platformName);
  }
  
  query += ` ORDER BY al.conversion_count DESC, al.click_count DESC LIMIT $${params.length + 1}`;
  params.push(limit);
  
  const result = await pool.query(query, params);
  return result.rows;
}
