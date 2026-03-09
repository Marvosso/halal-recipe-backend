/**
 * Brand Lookup Response Formatter
 * Formats brand lookup results into standardized API response
 */

import { formatQuickLookupResponse } from './quickLookupResponseFormatter';

/**
 * Format brand lookup result for API response
 * @param {Object} brandLookupResult - Result from performBrandLookup()
 * @returns {Object} Formatted API response
 */
export function formatBrandLookupResponse(brandLookupResult) {
  // If premium required
  if (brandLookupResult.requiresPremium) {
    return {
      halal_status: null,
      confidence_level: null,
      short_explanation: brandLookupResult.message,
      warnings: [
        {
          type: "verification_required",
          severity: "medium",
          message: "Brand-level verification is a premium feature. Upgrade to access brand-specific halal certification data."
        }
      ],
      requires_premium: true,
      premium_feature: "brand_verification"
    };
  }
  
  // If brand found
  if (brandLookupResult.isBrandLookup && brandLookupResult.halal_certified !== undefined) {
    return formatBrandFoundResponse(brandLookupResult);
  }
  
  // If brand not found, use generic fallback
  if (brandLookupResult.generic_fallback) {
    const genericResponse = formatQuickLookupResponse(brandLookupResult.generic_fallback);
    
    return {
      ...genericResponse,
      is_brand_lookup: false,
      brand_not_found: true,
      message: brandLookupResult.message || `Brand-specific data not available. Showing generic ingredient information.`,
      searched_brand: brandLookupResult.searched_brand,
      searched_product: brandLookupResult.searched_product
    };
  }
  
  // Fallback error response
  return {
    halal_status: "unknown",
    confidence_level: "low",
    short_explanation: "We couldn't find information about this brand or ingredient. Please try a different search term or consult with a qualified Islamic scholar.",
    warnings: [
      {
        type: "verification_required",
        severity: "high",
        message: "Insufficient data available. Please verify with a qualified Islamic scholar."
      }
    ]
  };
}

/**
 * Format response when brand is found
 */
function formatBrandFoundResponse(brandData) {
  const {
    brand_name,
    product_name,
    display_name,
    halal_status,
    halal_certified,
    certifying_body,
    certification_number,
    last_verified_date,
    verification_source,
    notes,
    confidence_level,
    confidence_score
  } = brandData;
  
  // Build short explanation
  let short_explanation = `${display_name || product_name} from ${brand_name}`;
  
  if (halal_certified) {
    short_explanation += ` is halal-certified by ${certifying_body || 'a certifying body'}. `;
    if (certification_number) {
      short_explanation += `Certification number: ${certification_number}. `;
    }
    if (last_verified_date) {
      const date = new Date(last_verified_date);
      short_explanation += `Last verified: ${date.toLocaleDateString()}. `;
    }
    short_explanation += notes || "This product is halal and safe to consume.";
  } else {
    short_explanation += ` does not have halal certification. `;
    short_explanation += notes || "Please verify with the manufacturer or look for halal-certified alternatives.";
  }
  
  // Build warnings
  const warnings = [];
  
  if (!halal_certified) {
    warnings.push({
      type: "verification_required",
      severity: "high",
      message: "This brand does not have halal certification. Please verify with the manufacturer or look for halal-certified alternatives."
    });
  }
  
  if (last_verified_date) {
    const verificationDate = new Date(last_verified_date);
    const daysSinceVerification = Math.floor((Date.now() - verificationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceVerification > 365) {
      warnings.push({
        type: "verification_required",
        severity: "medium",
        message: `Certification information is over 1 year old. Please verify current certification status.`
      });
    }
  }
  
  return {
    halal_status: halal_status || (halal_certified ? "halal" : "conditional"),
    confidence_level: confidence_level || (halal_certified ? "high" : "medium"),
    confidence_score: confidence_score,
    short_explanation: short_explanation,
    warnings: warnings,
    is_brand_lookup: true,
    brand_name: brand_name,
    product_name: product_name,
    display_name: display_name,
    halal_certified: halal_certified,
    certifying_body: certifying_body,
    certification_number: certification_number,
    last_verified_date: last_verified_date,
    verification_source: verification_source,
    notes: notes
  };
}
