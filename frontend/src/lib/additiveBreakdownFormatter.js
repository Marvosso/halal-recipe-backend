/**
 * Additive Breakdown Formatter
 * Formats additive detection results for premium users
 */

import { categorizeAdditives, getAdditiveSummary } from './additiveDetection';

/**
 * Format additive breakdown for API response
 * @param {Array} additives - Array of detected additive objects
 * @param {string} ingredientName - Name of the ingredient being analyzed
 * @returns {Object} Formatted additive breakdown
 */
export function formatAdditiveBreakdown(additives, ingredientName = "") {
  if (!additives || additives.length === 0) {
    return {
      has_additives: false,
      total_additives: 0,
      message: "No additives detected in this ingredient."
    };
  }
  
  const categorized = categorizeAdditives(additives);
  const summary = getAdditiveSummary(additives);
  
  // Build warnings
  const warnings = [];
  
  if (summary.has_haram) {
    warnings.push({
      type: "haram_additives",
      severity: "high",
      message: `This ingredient contains ${categorized.haram.length} haram additive(s). Avoid this product.`,
      additives: categorized.haram.map(a => ({
        e_number: a.e_number,
        name: a.name,
        explanation: a.simple_explanation
      }))
    });
  }
  
  if (summary.has_questionable) {
    warnings.push({
      type: "questionable_additives",
      severity: "medium",
      message: `This ingredient contains ${categorized.conditional.length + categorized.questionable.length} questionable additive(s) that require verification.`,
      additives: [
        ...categorized.conditional,
        ...categorized.questionable
      ].map(a => ({
        e_number: a.e_number,
        name: a.name,
        explanation: a.simple_explanation,
        requires_verification: a.requires_verification
      }))
    });
  }
  
  if (summary.has_verification_required) {
    warnings.push({
      type: "verification_required",
      severity: "medium",
      message: `${summary.requires_verification_count} additive(s) require verification of source or halal certification.`,
      count: summary.requires_verification_count
    });
  }
  
  // Build breakdown sections
  const breakdown = {
    halal: categorized.halal.map(formatAdditiveEntry),
    conditional: categorized.conditional.map(formatAdditiveEntry),
    haram: categorized.haram.map(formatAdditiveEntry),
    questionable: categorized.questionable.map(formatAdditiveEntry)
  };
  
  // Build summary explanation
  let summaryExplanation = "";
  if (summary.has_haram) {
    summaryExplanation = `⚠️ This ingredient contains ${categorized.haram.length} haram additive(s) and should be avoided. `;
  } else if (summary.has_questionable) {
    summaryExplanation = `⚠️ This ingredient contains ${categorized.conditional.length + categorized.questionable.length} questionable additive(s) that require verification. `;
  } else if (summary.halal_count > 0) {
    summaryExplanation = `✓ This ingredient contains ${summary.halal_count} halal additive(s). `;
  }
  
  if (summary.total > 0) {
    summaryExplanation += `Total additives detected: ${summary.total}.`;
  }
  
  return {
    has_additives: true,
    total_additives: summary.total,
    summary: {
      halal_count: summary.halal_count,
      conditional_count: summary.conditional_count,
      haram_count: summary.haram_count,
      questionable_count: summary.questionable_count,
      requires_verification_count: summary.requires_verification_count
    },
    breakdown: breakdown,
    warnings: warnings,
    summary_explanation: summaryExplanation,
    detailed_breakdown: buildDetailedBreakdown(additives)
  };
}

/**
 * Format individual additive entry
 * @param {Object} additive - Additive object
 * @returns {Object} Formatted entry
 */
function formatAdditiveEntry(additive) {
  return {
    e_number: additive.e_number,
    name: additive.name,
    category: additive.category,
    halal_status: additive.halal_status,
    source: additive.source,
    explanation: additive.explanation,
    simple_explanation: additive.simple_explanation,
    requires_verification: additive.requires_verification,
    found_as: additive.found_as,
    common_in: additive.common_in || []
  };
}

/**
 * Build detailed breakdown with all information
 * @param {Array} additives - Array of detected additive objects
 * @returns {Array} Detailed breakdown array
 */
function buildDetailedBreakdown(additives) {
  return additives.map(additive => ({
    e_number: additive.e_number,
    name: additive.name,
    category: additive.category,
    halal_status: additive.halal_status,
    source: additive.source,
    explanation: additive.explanation,
    simple_explanation: additive.simple_explanation,
    requires_verification: additive.requires_verification,
    found_as: additive.found_as,
    detection_method: additive.detection_method,
    common_in: additive.common_in || []
  }));
}

/**
 * Generate simplified explanation for additive breakdown
 * @param {Object} breakdown - Formatted breakdown object
 * @returns {string} Simplified explanation
 */
export function generateAdditiveExplanation(breakdown) {
  if (!breakdown.has_additives) {
    return "No additives detected in this ingredient.";
  }
  
  const { summary, warnings } = breakdown;
  
  let explanation = `This ingredient contains ${breakdown.total_additives} additive(s). `;
  
  if (summary.haram_count > 0) {
    explanation += `⚠️ ${summary.haram_count} haram additive(s) detected - avoid this product. `;
  }
  
  if (summary.conditional_count > 0 || summary.questionable_count > 0) {
    explanation += `⚠️ ${summary.conditional_count + summary.questionable_count} questionable additive(s) require verification. `;
  }
  
  if (summary.halal_count > 0 && summary.haram_count === 0) {
    explanation += `✓ All detected additives are halal.`;
  }
  
  return explanation;
}
