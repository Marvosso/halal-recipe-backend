/**
 * Quick Lookup Copy Text
 * Provides detailed, reassuring explanations for ingredient status
 * Avoids single-word answers, keeps output readable and helpful
 */

/**
 * Get detailed status explanation based on status and confidence level
 */
export function getStatusExplanation(status, confidenceLevel, explanation, ingredientType) {
  const baseExplanation = explanation || "";
  
  // Status-specific explanations
  const statusExplanations = {
    halal: {
      certain_halal: `This ingredient is halal and safe to consume. ${baseExplanation || "It meets Islamic dietary guidelines and does not contain any prohibited substances."}`,
      conditional: `This ingredient is generally halal, but requires verification. ${baseExplanation || "Please check that it has been prepared according to Islamic guidelines, such as proper halal certification for animal products."}`,
      default: `This ingredient is halal. ${baseExplanation || "It meets Islamic dietary guidelines."}`
    },
    haram: {
      haram: `This ingredient is haram (prohibited) and should not be consumed. ${baseExplanation || "It contains substances that are explicitly forbidden in Islam, such as pork or alcohol."}`,
      default: `This ingredient is haram (prohibited). ${baseExplanation || "It contains substances forbidden in Islam."}`
    },
    questionable: {
      conditional: `This ingredient requires careful consideration. ${baseExplanation || "It may be halal or haram depending on its source, preparation method, or specific ingredients. We recommend verifying with a qualified Islamic scholar or checking for halal certification."}`,
      default: `This ingredient's halal status is uncertain. ${baseExplanation || "Please verify with a qualified Islamic scholar or check for halal certification."}`
    },
    unknown: {
      rare_unknown: `We don't have sufficient information about this ingredient in our knowledge base. ${baseExplanation || "This appears to be a rare or uncommon ingredient. We recommend consulting with a qualified Islamic scholar to determine its halal status."}`,
      default: `We don't have information about this ingredient. ${baseExplanation || "Please consult with a qualified Islamic scholar or use our full recipe converter for more detailed analysis."}`
    }
  };
  
  const statusGroup = statusExplanations[status] || statusExplanations.unknown;
  return statusGroup[confidenceLevel] || statusGroup.default || baseExplanation;
}

/**
 * Get reassuring status message
 */
export function getReassuringMessage(status, confidenceLevel) {
  const messages = {
    halal: {
      certain_halal: "You can use this ingredient with confidence.",
      conditional: "This ingredient is likely halal, but please verify the source and preparation method.",
      default: "This ingredient is halal."
    },
    haram: {
      haram: "We recommend avoiding this ingredient. See halal alternatives below.",
      default: "This ingredient is not halal. See alternatives below."
    },
    questionable: {
      conditional: "Please verify this ingredient's halal status before using it.",
      default: "Please verify this ingredient's halal status."
    },
    unknown: {
      rare_unknown: "We recommend consulting with a qualified Islamic scholar for this ingredient.",
      default: "Please consult with a qualified Islamic scholar or use our full recipe converter."
    }
  };
  
  const statusGroup = messages[status] || messages.unknown;
  return statusGroup[confidenceLevel] || statusGroup.default || "";
}

/**
 * Get confidence level description
 */
export function getConfidenceDescription(confidenceLevel, confidenceScore) {
  const descriptions = {
    certain_halal: {
      text: "High confidence — This determination is based on clear Islamic guidelines.",
      score: confidenceScore >= 95 ? "Very High" : "High"
    },
    conditional: {
      text: "Moderate confidence — This ingredient may be halal depending on source and preparation.",
      score: confidenceScore >= 70 ? "Moderate-High" : "Moderate"
    },
    haram: {
      text: "High confidence — This ingredient is explicitly prohibited in Islam.",
      score: "Very High"
    },
    rare_unknown: {
      text: "Low confidence — Insufficient data available for this ingredient.",
      score: "Low"
    }
  };
  
  return descriptions[confidenceLevel] || descriptions.conditional;
}

/**
 * Get ingredient type description
 */
export function getIngredientTypeDescription(ingredientType) {
  const descriptions = {
    natural: "This is a natural, plant-based ingredient in its unprocessed form.",
    processed: "This is a processed or manufactured ingredient that may contain additives.",
    animal: "This ingredient is derived from animals and requires halal certification.",
    "alcohol-derived": "This ingredient contains or is derived from alcohol."
  };
  
  return descriptions[ingredientType] || descriptions.processed;
}

/**
 * Get status summary text
 */
export function getStatusSummary(status, confidenceLevel) {
  const summaries = {
    halal: {
      certain_halal: "Safe to use",
      conditional: "Likely halal — verify source",
      default: "Halal"
    },
    haram: {
      haram: "Not halal — avoid",
      default: "Haram"
    },
    questionable: {
      conditional: "Verify before use",
      default: "Uncertain"
    },
    unknown: {
      rare_unknown: "Insufficient data",
      default: "Unknown"
    }
  };
  
  const statusGroup = summaries[status] || summaries.unknown;
  return statusGroup[confidenceLevel] || statusGroup.default || "";
}
