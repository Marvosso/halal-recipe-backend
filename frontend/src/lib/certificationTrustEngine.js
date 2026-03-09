/**
 * Halal Certification Trust Engine
 * Provides trust scoring and certification data display
 * Premium feature for detailed certification information
 */

import { getCertificationBody, getTrustLevel, calculateTrustScore } from './certificationDatabase';
import { isPremiumUser } from './subscription';

/**
 * Format certification data for display
 * @param {string} certifierName - Name or abbreviation of certifier
 * @param {string} certificationNumber - Certification number (optional)
 * @param {string} lastVerifiedDate - Last verified date (optional)
 * @returns {Object} Formatted certification data
 */
export function formatCertificationData(certifierName, certificationNumber = null, lastVerifiedDate = null) {
  const certifier = getCertificationBody(certifierName);
  const isPremium = isPremiumUser();
  
  // Base certification data (available to all users)
  const baseData = {
    certifier_name: certifier.name,
    certifier_abbreviation: certifier.abbreviation,
    trust_level: certifier.trust_level,
    trust_score: certifier.trust_score,
    country: certifier.country,
    simple_description: certifier.simple_description
  };
  
  // Premium-only detailed data
  const premiumData = isPremium ? {
    recognition: certifier.recognition,
    verification_standards: certifier.verification_standards,
    website: certifier.website,
    description: certifier.description,
    established_year: certifier.established_year,
    certifications_per_year: certifier.certifications_per_year,
    global_recognition: certifier.global_recognition
  } : {};
  
  // Certification details (if provided)
  const certificationDetails = {
    certification_number: certificationNumber,
    last_verified_date: lastVerifiedDate,
    is_verified: !!certificationNumber
  };
  
  return {
    ...baseData,
    ...premiumData,
    ...certificationDetails,
    is_premium_data: isPremium,
    requires_premium: !isPremium && Object.keys(premiumData).length > 0
  };
}

/**
 * Get trust badge information
 * @param {string} trustLevel - Trust level: "high" | "medium" | "low" | "unknown"
 * @returns {Object} Trust badge data
 */
export function getTrustBadge(trustLevel) {
  const badges = {
    high: {
      label: "High Trust",
      color: "#0A9D58", // Green
      icon: "check-circle",
      description: "This certifier is highly trusted and recognized internationally."
    },
    medium: {
      label: "Medium Trust",
      color: "#F59E0B", // Orange
      icon: "alert-circle",
      description: "This certifier is recognized but may have limited international recognition."
    },
    low: {
      label: "Low Trust",
      color: "#EF4444", // Red
      icon: "x-circle",
      description: "This certifier has limited recognition. Please verify their credentials."
    },
    unknown: {
      label: "Unknown Trust",
      color: "#6B7280", // Gray
      icon: "help-circle",
      description: "This certifier is not recognized. Please verify their credentials with a qualified Islamic scholar."
    }
  };
  
  return badges[trustLevel] || badges.unknown;
}

/**
 * Generate certification explanation
 * @param {Object} certificationData - Formatted certification data
 * @returns {string} Explanation text
 */
export function generateCertificationExplanation(certificationData) {
  const { certifier_name, trust_level, trust_score, simple_description, is_premium_data } = certificationData;
  
  let explanation = `${certifier_name} is a ${trust_level} trust certifier (trust score: ${trust_score}/100). `;
  explanation += simple_description;
  
  if (is_premium_data && certificationData.description) {
    explanation += ` ${certificationData.description}`;
  }
  
  if (certificationData.certification_number) {
    explanation += ` Certification number: ${certificationData.certification_number}.`;
  }
  
  if (certificationData.last_verified_date) {
    const date = new Date(certificationData.last_verified_date);
    explanation += ` Last verified: ${date.toLocaleDateString()}.`;
  }
  
  return explanation;
}

/**
 * Validate certification
 * @param {string} certifierName - Name or abbreviation of certifier
 * @param {string} certificationNumber - Certification number (optional)
 * @returns {Object} Validation result
 */
export function validateCertification(certifierName, certificationNumber = null) {
  const certifier = getCertificationBody(certifierName);
  
  if (certifier.id === "unknown") {
    return {
      is_valid: false,
      trust_level: "unknown",
      message: "This certifier is not recognized in our database. Please verify their credentials.",
      recommendation: "Consult with a qualified Islamic scholar before relying on this certification."
    };
  }
  
  if (certifier.trust_level === "low" || certifier.trust_level === "unknown") {
    return {
      is_valid: true,
      trust_level: certifier.trust_level,
      message: `This certifier has ${certifier.trust_level} trust level. Please verify their credentials.`,
      recommendation: "Consider looking for products certified by high-trust certifiers like IFANCA, JAKIM, or MUIS."
    };
  }
  
  return {
    is_valid: true,
    trust_level: certifier.trust_level,
    message: `This certifier has ${certifier.trust_level} trust level and is recognized.`,
    recommendation: null
  };
}

/**
 * Compare certifications
 * @param {Array} certifications - Array of certification objects
 * @returns {Object} Comparison result
 */
export function compareCertifications(certifications) {
  if (!certifications || certifications.length === 0) {
    return {
      best_certifier: null,
      comparison: []
    };
  }
  
  // Sort by trust score (descending)
  const sorted = certifications
    .map(cert => ({
      ...cert,
      certifier_data: getCertificationBody(cert.certifier_name)
    }))
    .sort((a, b) => (b.certifier_data.trust_score || 0) - (a.certifier_data.trust_score || 0));
  
  return {
    best_certifier: sorted[0],
    comparison: sorted.map(cert => ({
      certifier_name: cert.certifier_name,
      trust_level: cert.certifier_data.trust_level,
      trust_score: cert.certifier_data.trust_score,
      country: cert.certifier_data.country
    }))
  };
}
