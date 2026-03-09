/**
 * Additive Detection Logic
 * Detects additives and E-numbers in ingredient lists
 * Premium feature for detailed ingredient breakdown
 */

import { getAdditiveInfo } from './additiveDatabase';

/**
 * E-number pattern (E followed by 3-4 digits, optionally with letter suffix)
 */
const E_NUMBER_PATTERN = /\bE\d{3}[a-z]?\b/gi;

/**
 * Common additive names (case-insensitive)
 */
const ADDITIVE_NAME_PATTERNS = [
  /\bgelatin\b/gi,
  /\brennet\b/gi,
  /\benzymes?\b/gi,
  /\bmono\s*[-]?\s*diglycerides?\b/gi,
  /\blecithin\b/gi,
  /\bcaramel\s*color\b/gi,
  /\bcarmine\b/gi,
  /\bcochineal\b/gi,
  /\bascorbic\s*acid\b/gi,
  /\bmsg\b/gi,
  /\bmonosodium\s*glutamate\b/gi,
  /\bagar\s*[-]?\s*agar\b/gi,
  /\bbeta\s*[-]?\s*carotene\b/gi
];

/**
 * Extract E-numbers from text
 * @param {string} text - Ingredient list or text
 * @returns {Array} Array of E-numbers found (e.g., ["E120", "E471"])
 */
export function extractENumbers(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const matches = text.match(E_NUMBER_PATTERN);
  if (!matches) {
    return [];
  }
  
  // Normalize and deduplicate
  return [...new Set(matches.map(e => e.toUpperCase()))];
}

/**
 * Extract additive names from text
 * @param {string} text - Ingredient list or text
 * @returns {Array} Array of additive names found
 */
export function extractAdditiveNames(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const found = [];
  
  for (const pattern of ADDITIVE_NAME_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches.map(m => m.trim()));
    }
  }
  
  // Deduplicate
  return [...new Set(found.map(name => name.toLowerCase()))];
}

/**
 * Detect all additives in ingredient list
 * @param {string} ingredientList - Full ingredient list text
 * @returns {Array} Array of detected additive objects with halal status
 */
export function detectAdditives(ingredientList) {
  if (!ingredientList || typeof ingredientList !== 'string') {
    return [];
  }
  
  const detected = [];
  const processed = new Set(); // Track processed additives to avoid duplicates
  
  // Extract E-numbers
  const eNumbers = extractENumbers(ingredientList);
  for (const eNumber of eNumbers) {
    const normalized = eNumber.toLowerCase();
    if (processed.has(normalized)) continue;
    
    const additiveInfo = getAdditiveInfo(eNumber);
    if (additiveInfo) {
      detected.push({
        ...additiveInfo,
        found_as: eNumber,
        detection_method: "e_number"
      });
      processed.add(normalized);
    } else {
      // Unknown E-number
      detected.push({
        e_number: eNumber,
        name: `Unknown E-number: ${eNumber}`,
        category: "Unknown",
        halal_status: "questionable",
        source: "unknown",
        explanation: `E-number ${eNumber} was found but we don't have detailed information. Please verify with a qualified Islamic scholar or check for halal certification.`,
        simple_explanation: `E-number ${eNumber} needs verification. Check if the product is halal-certified.`,
        requires_verification: true,
        found_as: eNumber,
        detection_method: "e_number"
      });
      processed.add(normalized);
    }
  }
  
  // Extract additive names
  const additiveNames = extractAdditiveNames(ingredientList);
  for (const name of additiveNames) {
    const normalized = name.toLowerCase();
    if (processed.has(normalized)) continue;
    
    const additiveInfo = getAdditiveInfo(name);
    if (additiveInfo) {
      detected.push({
        ...additiveInfo,
        found_as: name,
        detection_method: "name"
      });
      processed.add(normalized);
    }
  }
  
  return detected;
}

/**
 * Categorize detected additives by halal status
 * @param {Array} additives - Array of detected additive objects
 * @returns {Object} Categorized additives
 */
export function categorizeAdditives(additives) {
  return {
    halal: additives.filter(a => a.halal_status === "halal"),
    conditional: additives.filter(a => a.halal_status === "conditional"),
    haram: additives.filter(a => a.halal_status === "haram"),
    questionable: additives.filter(a => a.halal_status === "questionable" || !a.halal_status),
    requires_verification: additives.filter(a => a.requires_verification === true)
  };
}

/**
 * Get summary of additive breakdown
 * @param {Array} additives - Array of detected additive objects
 * @returns {Object} Summary statistics
 */
export function getAdditiveSummary(additives) {
  const categorized = categorizeAdditives(additives);
  
  return {
    total: additives.length,
    halal_count: categorized.halal.length,
    conditional_count: categorized.conditional.length,
    haram_count: categorized.haram.length,
    questionable_count: categorized.questionable.length,
    requires_verification_count: categorized.requires_verification.length,
    has_haram: categorized.haram.length > 0,
    has_questionable: categorized.conditional.length > 0 || categorized.questionable.length > 0,
    has_verification_required: categorized.requires_verification.length > 0
  };
}
