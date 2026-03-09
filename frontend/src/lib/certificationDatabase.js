/**
 * Halal Certification Trust Engine
 * Stores certification bodies and assigns trust levels
 * Premium feature for detailed certification data
 */

/**
 * Certification Body Database Structure
 * 
 * Each certifier entry contains:
 * - id: Unique identifier
 * - name: Full name
 * - abbreviation: Short form (e.g., "IFANCA", "HFA")
 * - country: Country of origin
 * - trust_level: "high" | "medium" | "low" | "unknown"
 * - trust_score: 0-100
 * - recognition: Array of countries/regions that recognize this certifier
 * - verification_standards: Array of standards they follow
 * - website: Official website URL
 * - description: Detailed description
 * - simple_description: Simplified description
 */
export const CERTIFICATION_BODIES = {
  // High Trust Certifiers
  "ifanca": {
    id: "ifanca",
    name: "Islamic Food and Nutrition Council of America",
    abbreviation: "IFANCA",
    country: "United States",
    trust_level: "high",
    trust_score: 95,
    recognition: ["United States", "Canada", "International"],
    verification_standards: ["IFANCA Standards", "HACCP", "ISO 22000"],
    website: "https://www.ifanca.org",
    description: "IFANCA is one of the most recognized halal certification bodies in North America. They follow strict Islamic guidelines and are recognized by major Islamic organizations worldwide. IFANCA-certified products are widely trusted by Muslim consumers.",
    simple_description: "IFANCA is a highly trusted halal certifier in North America, recognized internationally.",
    established_year: 1982,
    certifications_per_year: "5000+",
    global_recognition: "high"
  },
  "hfa": {
    id: "hfa",
    name: "Halal Food Authority",
    abbreviation: "HFA",
    country: "United Kingdom",
    trust_level: "high",
    trust_score: 92,
    recognition: ["United Kingdom", "Europe", "International"],
    verification_standards: ["HFA Standards", "HACCP", "ISO 22000"],
    website: "https://www.halalfoodauthority.com",
    description: "HFA is a leading halal certification body in the UK and Europe. They provide comprehensive halal certification services and are recognized by major Islamic organizations. HFA-certified products are trusted by Muslim consumers across Europe.",
    simple_description: "HFA is a trusted halal certifier in the UK and Europe.",
    established_year: 1994,
    certifications_per_year: "3000+",
    global_recognition: "high"
  },
  "jakim": {
    id: "jakim",
    name: "Jabatan Kemajuan Islam Malaysia",
    abbreviation: "JAKIM",
    country: "Malaysia",
    trust_level: "high",
    trust_score: 98,
    recognition: ["Malaysia", "Southeast Asia", "International"],
    verification_standards: ["MS 1500:2019", "HACCP", "ISO 22000"],
    website: "https://www.halal.gov.my",
    description: "JAKIM is the official halal certification body of Malaysia. They follow the Malaysian Standard MS 1500:2019 for halal food production. JAKIM certification is highly trusted and recognized worldwide, especially in Southeast Asia.",
    simple_description: "JAKIM is the official Malaysian halal certifier, highly trusted worldwide.",
    established_year: 1974,
    certifications_per_year: "10000+",
    global_recognition: "very_high"
  },
  "muis": {
    id: "muis",
    name: "Majlis Ugama Islam Singapura",
    abbreviation: "MUIS",
    country: "Singapore",
    trust_level: "high",
    trust_score: 96,
    recognition: ["Singapore", "Southeast Asia", "International"],
    verification_standards: ["MUIS Standards", "HACCP", "ISO 22000"],
    website: "https://www.muis.gov.sg",
    description: "MUIS is the official Islamic religious council of Singapore and provides halal certification. MUIS-certified products are highly trusted and recognized internationally, especially in Southeast Asia.",
    simple_description: "MUIS is Singapore's official halal certifier, highly trusted.",
    established_year: 1968,
    certifications_per_year: "4000+",
    global_recognition: "very_high"
  },
  "halal_turkey": {
    id: "halal_turkey",
    name: "Gıda ve Kontrol Genel Müdürlüğü",
    abbreviation: "GIMDES",
    country: "Turkey",
    trust_level: "high",
    trust_score: 90,
    recognition: ["Turkey", "Europe", "Middle East"],
    verification_standards: ["GIMDES Standards", "HACCP"],
    website: "https://www.gimdes.org",
    description: "GIMDES is a leading halal certification body in Turkey. They provide halal certification services and are recognized in Turkey and across Europe.",
    simple_description: "GIMDES is a trusted halal certifier in Turkey.",
    established_year: 2005,
    certifications_per_year: "2000+",
    global_recognition: "medium"
  },
  
  // Medium Trust Certifiers
  "halal_foundation": {
    id: "halal_foundation",
    name: "Halal Foundation",
    abbreviation: "HF",
    country: "United States",
    trust_level: "medium",
    trust_score: 75,
    recognition: ["United States"],
    verification_standards: ["HF Standards"],
    website: null,
    description: "Halal Foundation provides halal certification services in the United States. They follow Islamic guidelines but have limited international recognition compared to major certifiers.",
    simple_description: "Halal Foundation is a regional halal certifier in the US.",
    established_year: null,
    certifications_per_year: "500+",
    global_recognition: "low"
  },
  "halal_certification_services": {
    id: "halal_certification_services",
    name: "Halal Certification Services",
    abbreviation: "HCS",
    country: "United States",
    trust_level: "medium",
    trust_score: 70,
    recognition: ["United States"],
    verification_standards: ["HCS Standards"],
    website: null,
    description: "Halal Certification Services provides halal certification in the United States. Verify their credentials and recognition before relying on their certification.",
    simple_description: "HCS is a regional halal certifier. Verify their credentials.",
    established_year: null,
    certifications_per_year: "300+",
    global_recognition: "low"
  },
  
  // Low Trust / Unknown Certifiers
  "unknown": {
    id: "unknown",
    name: "Unknown Certifier",
    abbreviation: "Unknown",
    country: "Unknown",
    trust_level: "unknown",
    trust_score: 0,
    recognition: [],
    verification_standards: [],
    website: null,
    description: "This certification body is not recognized in our database. Please verify their credentials and consult with a qualified Islamic scholar before relying on their certification.",
    simple_description: "This certifier is not recognized. Please verify their credentials.",
    established_year: null,
    certifications_per_year: "Unknown",
    global_recognition: "unknown"
  }
};

/**
 * Trust Level Thresholds
 */
export const TRUST_LEVEL_THRESHOLDS = {
  high: 85,      // 85-100: High trust
  medium: 60,    // 60-84: Medium trust
  low: 30,       // 30-59: Low trust
  unknown: 0     // 0-29: Unknown/No trust
};

/**
 * Get certification body by identifier
 * @param {string} identifier - Certifier name, abbreviation, or ID
 * @returns {Object|null} Certification body data or null if not found
 */
export function getCertificationBody(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    return CERTIFICATION_BODIES.unknown;
  }
  
  const normalized = identifier.toLowerCase().trim();
  
  // Try direct lookup by ID
  if (CERTIFICATION_BODIES[normalized]) {
    return CERTIFICATION_BODIES[normalized];
  }
  
  // Try lookup by abbreviation
  for (const key in CERTIFICATION_BODIES) {
    const certifier = CERTIFICATION_BODIES[key];
    if (certifier.abbreviation && certifier.abbreviation.toLowerCase() === normalized) {
      return certifier;
    }
  }
  
  // Try partial name match
  for (const key in CERTIFICATION_BODIES) {
    const certifier = CERTIFICATION_BODIES[key];
    if (certifier.name.toLowerCase().includes(normalized) || 
        normalized.includes(certifier.name.toLowerCase())) {
      return certifier;
    }
  }
  
  // Return unknown if not found
  return CERTIFICATION_BODIES.unknown;
}

/**
 * Get trust level from trust score
 * @param {number} trustScore - Trust score (0-100)
 * @returns {string} Trust level: "high" | "medium" | "low" | "unknown"
 */
export function getTrustLevel(trustScore) {
  if (trustScore >= TRUST_LEVEL_THRESHOLDS.high) {
    return "high";
  } else if (trustScore >= TRUST_LEVEL_THRESHOLDS.medium) {
    return "medium";
  } else if (trustScore >= TRUST_LEVEL_THRESHOLDS.low) {
    return "low";
  } else {
    return "unknown";
  }
}

/**
 * Get all certifiers by trust level
 * @param {string} trustLevel - "high" | "medium" | "low" | "unknown"
 * @returns {Array} Array of certification body objects
 */
export function getCertifiersByTrustLevel(trustLevel) {
  return Object.values(CERTIFICATION_BODIES).filter(certifier => 
    certifier.trust_level === trustLevel
  );
}

/**
 * Get all high trust certifiers
 * @returns {Array} Array of high trust certification bodies
 */
export function getHighTrustCertifiers() {
  return getCertifiersByTrustLevel("high");
}

/**
 * Calculate trust score based on multiple factors
 * @param {Object} factors - Trust factors
 * @returns {number} Trust score (0-100)
 */
export function calculateTrustScore(factors) {
  const {
    recognition_count = 0,
    has_international_recognition = false,
    established_years = 0,
    certifications_per_year = 0,
    has_website = false,
    follows_standards = false,
    is_official = false
  } = factors;
  
  let score = 0;
  
  // Recognition (max 30 points)
  score += Math.min(30, recognition_count * 5);
  if (has_international_recognition) {
    score += 10;
  }
  
  // Established years (max 20 points)
  if (established_years >= 20) {
    score += 20;
  } else if (established_years >= 10) {
    score += 15;
  } else if (established_years >= 5) {
    score += 10;
  } else if (established_years > 0) {
    score += 5;
  }
  
  // Certifications per year (max 15 points)
  if (certifications_per_year >= 5000) {
    score += 15;
  } else if (certifications_per_year >= 2000) {
    score += 12;
  } else if (certifications_per_year >= 1000) {
    score += 8;
  } else if (certifications_per_year >= 500) {
    score += 5;
  }
  
  // Standards and verification (max 15 points)
  if (follows_standards) {
    score += 10;
  }
  if (is_official) {
    score += 5;
  }
  
  // Website and transparency (max 10 points)
  if (has_website) {
    score += 10;
  }
  
  // Global recognition bonus (max 10 points)
  if (factors.global_recognition === "very_high") {
    score += 10;
  } else if (factors.global_recognition === "high") {
    score += 7;
  } else if (factors.global_recognition === "medium") {
    score += 4;
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}
