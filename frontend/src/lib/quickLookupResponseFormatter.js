/**
 * Quick Lookup Response Formatter
 * Formats evaluation results into standardized API response contract
 * Ensures all responses include: halal_status, confidence_level, short_explanation, warnings
 */

/**
 * Format evaluation result into quick lookup API response
 * @param {Object} evaluationResult - Result from evaluateItem()
 * @returns {Object} Formatted API response
 */
export function formatQuickLookupResponse(evaluationResult) {
  const {
    status,
    confidenceLevel,
    confidenceScore = 0,
    explanation = "",
    simpleExplanation = "",
    ingredientType = "processed",
    alternatives = [],
    references = [],
    requiresVerification = false,
    displayName = "",
    conditionalModifiers = [],
    processingModifiers = [],
    isHaramModifierOverride = false,
    haramModifiers = []
  } = evaluationResult;

  // Map status to halal_status
  const halal_status = mapStatusToHalalStatus(status);
  
  // Map confidence level to high/medium/low
  const confidence_level = mapConfidenceLevel(confidenceLevel, confidenceScore);
  
  // Generate short explanation (minimum 15 words, never one word)
  const short_explanation = generateShortExplanation(
    status,
    confidenceLevel,
    explanation,
    simpleExplanation,
    ingredientType,
    displayName,
    isHaramModifierOverride,
    haramModifiers
  );
  
  // Generate warnings array
  const warnings = generateWarnings(
    status,
    confidenceLevel,
    requiresVerification,
    conditionalModifiers,
    processingModifiers,
    ingredientType
  );
  
  // Build response
  const response = {
    halal_status: halal_status,
    confidence_level: confidence_level,
    short_explanation: short_explanation,
    warnings: warnings
  };
  
  // Add optional but recommended fields
  if (confidenceScore !== undefined) {
    response.confidence_score = confidenceScore;
  }
  
  if (ingredientType) {
    response.ingredient_type = ingredientType;
  }
  
  if (alternatives && alternatives.length > 0) {
    response.alternatives = alternatives;
  }
  
  if (references && references.length > 0) {
    response.references = references;
  }
  
  if (requiresVerification !== undefined) {
    response.requires_verification = requiresVerification;
  }
  
  if (displayName) {
    response.display_name = displayName;
  }
  
  return response;
}

/**
 * Map evaluation status to halal_status
 */
function mapStatusToHalalStatus(status) {
  const mapping = {
    "halal": "halal",
    "haram": "haram",
    "conditional": "conditional",
    "questionable": "conditional",
    "unknown": "unknown"
  };
  return mapping[status] || "unknown";
}

/**
 * Map confidence level to high/medium/low
 */
function mapConfidenceLevel(confidenceLevel, confidenceScore) {
  // If we have the new confidence level system (high/medium/low)
  if (confidenceLevel === "high" || confidenceLevel === "medium" || confidenceLevel === "low") {
    return confidenceLevel;
  }
  
  // Map from old system
  if (confidenceLevel === "certain_halal" || confidenceLevel === "haram") {
    return confidenceScore >= 80 ? "high" : "medium";
  }
  
  if (confidenceLevel === "conditional") {
    return confidenceScore >= 50 ? "medium" : "low";
  }
  
  // Use score-based mapping as fallback
  if (confidenceScore >= 80) return "high";
  if (confidenceScore >= 50) return "medium";
  return "low";
}

/**
 * Generate short explanation (minimum 15 words, never one word)
 */
function generateShortExplanation(
  status,
  confidenceLevel,
  explanation,
  simpleExplanation,
  ingredientType,
  displayName,
  isHaramModifierOverride,
  haramModifiers
) {
  const ingredientName = displayName || "This ingredient";
  
  // Start with ingredient name and status
  let baseExplanation = "";
  
  if (status === "halal") {
    if (confidenceLevel === "high" || confidenceLevel === "certain_halal") {
      if (ingredientType === "natural" || ingredientType === "natural_plant") {
        baseExplanation = `${ingredientName} is naturally halal. It is a natural, plant-based ingredient in its unprocessed form, which is generally halal unless specifically prohibited in Islamic law.`;
      } else {
        baseExplanation = `${ingredientName} is halal. ${explanation || simpleExplanation || "It meets Islamic dietary guidelines and does not contain any prohibited substances."}`;
      }
    } else {
      baseExplanation = `${ingredientName} is generally halal, but requires verification. ${explanation || simpleExplanation || "Please check that it has been prepared according to Islamic guidelines, such as proper halal certification for animal products."}`;
    }
  } else if (status === "haram") {
    if (isHaramModifierOverride && haramModifiers && haramModifiers.length > 0) {
      const haramModifier = haramModifiers[0].replace(/_/g, " ");
      baseExplanation = `${ingredientName} contains ${haramModifier}, which is explicitly prohibited in Islam. ${explanation || simpleExplanation || "This ingredient should not be consumed."}`;
    } else {
      baseExplanation = `${ingredientName} is haram (prohibited) and should not be consumed. ${explanation || simpleExplanation || "It contains substances that are explicitly forbidden in Islam, such as pork or alcohol."}`;
    }
  } else if (status === "conditional" || status === "questionable") {
    baseExplanation = `${ingredientName} requires careful consideration. ${explanation || simpleExplanation || "It may be halal or haram depending on its source, preparation method, or specific ingredients. We recommend verifying with a qualified Islamic scholar or checking for halal certification."}`;
  } else {
    baseExplanation = `We don't have sufficient information about ${ingredientName} in our knowledge base. ${explanation || simpleExplanation || "This appears to be a rare or uncommon ingredient. We recommend consulting with a qualified Islamic scholar to determine its halal status."}`;
  }
  
  // Ensure minimum 15 words
  const wordCount = baseExplanation.split(/\s+/).length;
  if (wordCount < 15) {
    baseExplanation += " Please verify with a qualified Islamic scholar if you have any concerns.";
  }
  
  return baseExplanation;
}

/**
 * Generate warnings array
 */
function generateWarnings(
  status,
  confidenceLevel,
  requiresVerification,
  conditionalModifiers,
  processingModifiers,
  ingredientType
) {
  const warnings = [];
  
  // Haram status always has a warning
  if (status === "haram") {
    warnings.push({
      type: "verification_required",
      severity: "high",
      message: "This ingredient is haram and should be avoided."
    });
  }
  
  // Conditional status with verification requirement
  if ((status === "conditional" || status === "questionable") && requiresVerification) {
    if (ingredientType === "animal" || ingredientType === "animal_byproduct") {
      warnings.push({
        type: "verification_required",
        severity: "high",
        message: "This ingredient requires halal certification. Please verify the source and look for halal certification."
      });
      warnings.push({
        type: "source_uncertain",
        severity: "medium",
        message: "Without halal certification, the source cannot be confirmed."
      });
    } else {
      warnings.push({
        type: "verification_required",
        severity: "medium",
        message: "This ingredient requires verification. Please check the source and preparation method."
      });
    }
  }
  
  // Conditional modifiers
  if (conditionalModifiers && conditionalModifiers.length > 0) {
    const modifier = conditionalModifiers[0];
    if (modifier.type === "rennet") {
      warnings.push({
        type: "additive_concern",
        severity: "medium",
        message: "This ingredient contains rennet. Check the rennet source (animal-derived requires halal certification)."
      });
    } else if (modifier.type === "enzyme") {
      warnings.push({
        type: "additive_concern",
        severity: "medium",
        message: "This ingredient contains enzymes. Check the enzyme source (animal-derived requires halal certification)."
      });
    } else if (modifier.type === "emulsifier") {
      warnings.push({
        type: "additive_concern",
        severity: "low",
        message: "This ingredient contains emulsifiers. Check the emulsifier source."
      });
    }
  }
  
  // Processing modifiers
  if (processingModifiers && processingModifiers.length > 0) {
    const modifier = processingModifiers[0];
    if (modifier.type === "fried") {
      warnings.push({
        type: "processing_concern",
        severity: "low",
        message: "This processed ingredient may have been fried. Please check the oil source and cooking method."
      });
    } else if (modifier.type === "fermented") {
      warnings.push({
        type: "processing_concern",
        severity: "low",
        message: "This fermented ingredient may contain alcohol. Verify fermentation process and alcohol content."
      });
    } else {
      warnings.push({
        type: "processing_concern",
        severity: "low",
        message: "This processed ingredient may contain additives. Please check the ingredient list."
      });
    }
  }
  
  // Unknown status
  if (status === "unknown") {
    warnings.push({
      type: "verification_required",
      severity: "high",
      message: "Insufficient data available. Please consult with a qualified Islamic scholar."
    });
  }
  
  return warnings;
}
