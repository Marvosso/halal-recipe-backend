/**
 * Certification Display Formatter
 * Formats certification data for UI display
 */

import { formatCertificationData, getTrustBadge, generateCertificationExplanation, validateCertification } from './certificationTrustEngine';
import { isPremiumUser } from './subscription';

/**
 * Format certification for API response
 * @param {string} certifierName - Name or abbreviation of certifier
 * @param {string} certificationNumber - Certification number (optional)
 * @param {string} lastVerifiedDate - Last verified date (optional)
 * @returns {Object} Formatted API response
 */
export function formatCertificationResponse(certifierName, certificationNumber = null, lastVerifiedDate = null) {
  const certificationData = formatCertificationData(certifierName, certificationNumber, lastVerifiedDate);
  const trustBadge = getTrustBadge(certificationData.trust_level);
  const explanation = generateCertificationExplanation(certificationData);
  const validation = validateCertification(certifierName, certificationNumber);
  
  return {
    certifier: {
      name: certificationData.certifier_name,
      abbreviation: certificationData.certifier_abbreviation,
      country: certificationData.country,
      trust_level: certificationData.trust_level,
      trust_score: certificationData.trust_score,
      simple_description: certificationData.simple_description
    },
    trust_badge: {
      label: trustBadge.label,
      color: trustBadge.color,
      icon: trustBadge.icon,
      description: trustBadge.description
    },
    certification: {
      number: certificationData.certification_number,
      last_verified_date: certificationData.last_verified_date,
      is_verified: certificationData.is_verified
    },
    explanation: explanation,
    validation: validation,
    premium_data: certificationData.is_premium_data ? {
      recognition: certificationData.recognition,
      verification_standards: certificationData.verification_standards,
      website: certificationData.website,
      description: certificationData.description,
      established_year: certificationData.established_year,
      certifications_per_year: certificationData.certifications_per_year,
      global_recognition: certificationData.global_recognition
    } : null,
    requires_premium: certificationData.requires_premium
  };
}

/**
 * Format certification for brand lookup integration
 * @param {Object} brandData - Brand data with certification info
 * @returns {Object} Formatted certification data
 */
export function formatBrandCertification(brandData) {
  const {
    certifying_body,
    certification_number,
    last_verified_date
  } = brandData;
  
  if (!certifying_body) {
    return {
      has_certification: false,
      message: "No halal certification found for this brand."
    };
  }
  
  return formatCertificationResponse(certifying_body, certification_number, last_verified_date);
}
