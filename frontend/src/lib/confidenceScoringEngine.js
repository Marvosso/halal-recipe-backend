/**
 * Confidence Scoring Engine for Ingredient Halal Status
 * 
 * Outputs confidence levels: high, medium, low
 * 
 * Rules:
 * - Natural plant foods default to high confidence halal
 * - Processed foods reduce confidence unless certified
 * - Unknown should be used only if data is truly missing
 */

/**
 * Confidence Level Thresholds
 */
const CONFIDENCE_THRESHOLDS = {
  high: 80,    // 80-100: High confidence
  medium: 50,  // 50-79: Medium confidence
  low: 0       // 0-49: Low confidence
};

/**
 * Base Confidence Scores by Ingredient Type
 */
const BASE_CONFIDENCE_BY_TYPE = {
  natural_plant: {
    halal: 95,      // High confidence for natural plant halal
    conditional: 70, // Medium-high for conditional natural
    haram: 0,       // Haram is always 0
    unknown: 90     // Default to high confidence halal for unknown natural
  },
  processed_plant: {
    halal: 70,      // Medium-high (reduced from natural)
    conditional: 60, // Medium for conditional processed
    haram: 0,
    unknown: 50     // Medium for unknown processed
  },
  animal: {
    halal: 60,      // Medium (requires certification)
    conditional: 50, // Medium-low for conditional animal
    haram: 0,
    unknown: 50     // Medium (requires verification)
  },
  animal_byproduct: {
    halal: 50,      // Medium (requires certification)
    conditional: 40, // Medium-low for conditional byproduct
    haram: 0,
    unknown: 40     // Medium-low (requires verification)
  },
  alcohol: {
    halal: 0,       // Always haram
    conditional: 0,
    haram: 0,
    unknown: 0
  },
  fermentation_derived: {
    halal: 75,      // Medium-high (fully fermented)
    conditional: 65, // Medium for conditional fermented
    haram: 0,
    unknown: 60     // Medium for unknown fermented
  },
  synthetic: {
    halal: 65,      // Medium (check source)
    conditional: 55, // Medium for conditional synthetic
    haram: 0,
    unknown: 50     // Medium for unknown synthetic
  }
};

/**
 * Confidence Reduction Factors
 */
const CONFIDENCE_REDUCTIONS = {
  // Processing factors
  processed: -15,           // Processed reduces confidence
  uncertified: -20,          // No halal certification
  has_additives: -10,        // Contains additives
  cross_contamination_risk: -15, // Risk of cross-contamination
  
  // Modifier factors
  conditional_modifier: -15, // Conditional modifier detected
  processing_modifier: -10,  // Processing modifier detected
  
  // Source factors
  unknown_source: -25,       // Unknown source
  non_halal_source: -100,   // Non-halal source (makes haram)
  
  // Inheritance factors
  inherited_from_haram: -30, // Inherited from haram ingredient
  
  // Certification factors
  halal_certified: +10,      // Halal certification boosts confidence
  verified_source: +5        // Verified source boosts confidence
};

/**
 * Calculate confidence score based on ingredient characteristics
 * @param {Object} params - Ingredient evaluation parameters
 * @param {string} params.ingredientType - Type: natural_plant, processed_plant, animal, etc.
 * @param {string} params.status - Status: halal, haram, conditional, unknown
 * @param {number} params.baseScore - Base confidence score (0-100)
 * @param {boolean} params.isProcessed - Whether ingredient is processed
 * @param {boolean} params.isCertified - Whether ingredient is halal-certified
 * @param {boolean} params.hasAdditives - Whether ingredient has additives
 * @param {boolean} params.hasInheritance - Whether ingredient inherits from haram
 * @param {boolean} params.hasConditionalModifier - Whether conditional modifier detected
 * @param {boolean} params.hasProcessingModifier - Whether processing modifier detected
 * @param {string} params.source - Source information
 * @returns {number} Confidence score (0-100)
 */
export function calculateConfidenceScore(params) {
  const {
    ingredientType = 'processed_plant',
    status = 'unknown',
    baseScore = null,
    isProcessed = false,
    isCertified = false,
    hasAdditives = false,
    hasInheritance = false,
    hasConditionalModifier = false,
    hasProcessingModifier = false,
    source = null
  } = params;
  
  // Start with base score from type and status
  let score = baseScore !== null 
    ? baseScore 
    : (BASE_CONFIDENCE_BY_TYPE[ingredientType]?.[status] || 50);
  
  // Apply reductions
  if (isProcessed && ingredientType === 'natural_plant') {
    score += CONFIDENCE_REDUCTIONS.processed;
  }
  
  if (!isCertified && (ingredientType === 'animal' || ingredientType === 'animal_byproduct')) {
    score += CONFIDENCE_REDUCTIONS.uncertified;
  }
  
  if (hasAdditives) {
    score += CONFIDENCE_REDUCTIONS.has_additives;
  }
  
  if (hasInheritance) {
    score += CONFIDENCE_REDUCTIONS.inherited_from_haram;
  }
  
  if (hasConditionalModifier) {
    score += CONFIDENCE_REDUCTIONS.conditional_modifier;
  }
  
  if (hasProcessingModifier) {
    score += CONFIDENCE_REDUCTIONS.processing_modifier;
  }
  
  if (source === 'unknown') {
    score += CONFIDENCE_REDUCTIONS.unknown_source;
  }
  
  if (source === 'non_halal') {
    score += CONFIDENCE_REDUCTIONS.non_halal_source;
  }
  
  // Apply boosts
  if (isCertified) {
    score += CONFIDENCE_REDUCTIONS.halal_certified;
  }
  
  if (source === 'verified') {
    score += CONFIDENCE_REDUCTIONS.verified_source;
  }
  
  // Ensure score is within bounds
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Map confidence score to confidence level (high, medium, low)
 * @param {number} score - Confidence score (0-100)
 * @returns {string} Confidence level: 'high', 'medium', 'low'
 */
export function mapScoreToLevel(score) {
  if (score >= CONFIDENCE_THRESHOLDS.high) {
    return 'high';
  } else if (score >= CONFIDENCE_THRESHOLDS.medium) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Determine if ingredient should be marked as unknown
 * Only use unknown if data is truly missing
 * @param {Object} params - Ingredient evaluation parameters
 * @returns {boolean} True if should be marked as unknown
 */
export function shouldMarkAsUnknown(params) {
  const {
    ingredientType,
    status,
    hasTaxonomyData = false,
    hasKnowledgeBaseData = false,
    hasBaseOverride = false,
    isNaturalPlant = false
  } = params;
  
  // Never mark as unknown if:
  // 1. Natural plant (defaults to halal)
  if (isNaturalPlant) {
    return false;
  }
  
  // 2. Has taxonomy data
  if (hasTaxonomyData) {
    return false;
  }
  
  // 3. Has knowledge base data
  if (hasKnowledgeBaseData) {
    return false;
  }
  
  // 4. Has base override
  if (hasBaseOverride) {
    return false;
  }
  
  // 5. Status is explicitly haram (not unknown)
  if (status === 'haram') {
    return false;
  }
  
  // Only mark as unknown if truly no data available
  return !hasTaxonomyData && !hasKnowledgeBaseData && !hasBaseOverride && !isNaturalPlant;
}

/**
 * Get confidence level with detailed information
 * @param {Object} params - Ingredient evaluation parameters
 * @returns {Object} Confidence level information
 */
export function getConfidenceLevel(params) {
  const score = calculateConfidenceScore(params);
  const level = mapScoreToLevel(score);
  const isUnknown = shouldMarkAsUnknown(params);
  
  return {
    score: score,
    level: level,
    isUnknown: isUnknown,
    label: getConfidenceLabel(level),
    description: getConfidenceDescription(level, score),
    color: getConfidenceColor(level)
  };
}

/**
 * Get confidence label
 * @param {string} level - Confidence level: 'high', 'medium', 'low'
 * @returns {string} Human-readable label
 */
function getConfidenceLabel(level) {
  const labels = {
    high: 'High Confidence',
    medium: 'Medium Confidence',
    low: 'Low Confidence'
  };
  return labels[level] || labels.medium;
}

/**
 * Get confidence description
 * @param {string} level - Confidence level
 * @param {number} score - Confidence score
 * @returns {string} Description
 */
function getConfidenceDescription(level, score) {
  const descriptions = {
    high: `High confidence (${score}%) - This determination is based on clear Islamic guidelines and reliable sources.`,
    medium: `Medium confidence (${score}%) - This ingredient may be halal but requires verification of source or preparation method.`,
    low: `Low confidence (${score}%) - Insufficient data or significant uncertainty. Please verify with a qualified Islamic scholar.`
  };
  return descriptions[level] || descriptions.medium;
}

/**
 * Get confidence color
 * @param {string} level - Confidence level
 * @returns {string} Color hex code
 */
function getConfidenceColor(level) {
  const colors = {
    high: '#0A9D58',    // Green
    medium: '#F59E0B',  // Orange/Amber
    low: '#EF4444'      // Red
  };
  return colors[level] || colors.medium;
}

/**
 * Apply confidence scoring to evaluation result
 * @param {Object} evaluationResult - Result from evaluateItem()
 * @param {Object} additionalParams - Additional parameters for scoring
 * @returns {Object} Enhanced result with confidence level
 */
export function applyConfidenceScoring(evaluationResult, additionalParams = {}) {
  const {
    status,
    ingredientType,
    confidenceScore: existingScore,
    isProcessed,
    isCertified,
    hasAdditives,
    hasInheritance,
    hasConditionalModifier,
    hasProcessingModifier,
    source,
    isTaxonomyBased,
    isBaseIngredientOverride,
    isNaturalPlant
  } = {
    ...evaluationResult,
    ...additionalParams
  };
  
  // Determine if natural plant
  const isNatural = isNaturalPlant || 
                   ingredientType === 'natural' || 
                   ingredientType === 'natural_plant' ||
                   isBaseIngredientOverride;
  
  // Map ingredient type to taxonomy category
  const taxonomyType = ingredientType === 'natural' ? 'natural_plant' :
                      ingredientType === 'processed' ? 'processed_plant' :
                      ingredientType === 'animal' ? 'animal' :
                      ingredientType === 'alcohol-derived' ? 'alcohol' :
                      'processed_plant';
  
  // Calculate confidence score
  const confidenceInfo = getConfidenceLevel({
    ingredientType: taxonomyType,
    status: status,
    baseScore: existingScore,
    isProcessed: isProcessed || ingredientType === 'processed',
    isCertified: isCertified,
    hasAdditives: hasAdditives,
    hasInheritance: hasInheritance || !!evaluationResult.inheritedFrom,
    hasConditionalModifier: hasConditionalModifier || !!evaluationResult.conditionalModifiers,
    hasProcessingModifier: hasProcessingModifier || !!evaluationResult.processingModifiers,
    source: source,
    hasTaxonomyData: isTaxonomyBased,
    hasKnowledgeBaseData: !isTaxonomyBased && !isBaseIngredientOverride,
    hasBaseOverride: isBaseIngredientOverride,
    isNaturalPlant: isNatural
  });
  
  return {
    ...evaluationResult,
    confidenceScore: confidenceInfo.score,
    confidenceLevel: confidenceInfo.level, // high, medium, low
    confidenceLabel: confidenceInfo.label,
    confidenceDescription: confidenceInfo.description,
    confidenceColor: confidenceInfo.color,
    isUnknown: confidenceInfo.isUnknown && status === 'unknown'
  };
}
