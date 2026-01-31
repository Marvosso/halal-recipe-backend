/**
 * Halal Knowledge Engine
 * Single source of truth for ingredient evaluation
 * Used by Quick Lookup, Full Recipe Conversion, and Confidence Score calculation
 * 
 * This is the ONLY function that determines:
 * - halal_status (halal/haram/conditional/questionable/unknown)
 * - confidence_score (0-100)
 * - explanation (ELI5 text)
 * - references (Quran/Hadith)
 */

import halalKnowledgeFlat from "../data/halal_knowledge_flat.json";
import nestedIngredients from "../data/nested_ingredients.json";
import halalKnowledgeLegacy from "../data/halal_knowledge.json"; // Keep for backward compatibility
import { HALAL_RULES } from "./halalRules";
import { formatIngredientName } from "./ingredientDisplay";

// Merge legacy knowledge for backward compatibility
const halalKnowledge = {
  ...halalKnowledgeLegacy,
  ...halalKnowledgeFlat
};

const STATUS_SCORE = {
  halal: 1.0,
  conditional: 0.6,
  questionable: 0.5,
  unknown: 0.4,
  haram: 0.0
};

/**
 * Standardized confidence scoring
 * SINGLE SOURCE OF TRUTH for all confidence calculations
 * Base: 100
 * Deduct based on ingredient confidenceImpact
 * 
 * Used by:
 * - Quick Lookup
 * - Full Recipe Conversion
 * - Recipe confidence score calculation
 */
export function calculateConfidenceScore(baseConfidence, confidenceImpact, strictness = "standard", hasInheritance = false) {
  // Start with base confidence scaled to 0-100
  // baseConfidence is 0-1 (0.0 = haram, 1.0 = halal)
  let score = baseConfidence * 100;
  
  // Apply confidence impact (negative values reduce score)
  if (confidenceImpact < 0) {
    score = Math.max(0, score + confidenceImpact);
  } else if (confidenceImpact > 0) {
    // Positive impacts can boost score (up to 100)
    score = Math.min(100, score + confidenceImpact);
  }
  
  // Adjust for strictness
  if (strictness === "strict") {
    // Strict: additional 5% reduction for questionable/conditional
    if (baseConfidence <= 0.6) {
      score *= 0.95;
    }
  } else if (strictness === "flexible") {
    // Flexible: less penalty for questionable items
    if (baseConfidence === 0.5) { // questionable
      score = Math.min(100, score * 1.1); // Reduce penalty by 10%
    }
  }
  
  // Inheritance chain penalty (if derived from haram ingredient)
  if (hasInheritance) {
    score *= 0.92; // 8% reduction for inheritance
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get ruling based on school of thought and strictness
 */
function getRuling(ingredient, madhab = "no-preference", strictness = "standard") {
  // Get base ruling from ingredient
  const rulings = ingredient.rulings || {};
  let ruling = rulings.default || ingredient.status || "unknown";
  
  // Apply school of thought if specified
  if (madhab !== "no-preference" && rulings[madhab]) {
    ruling = rulings[madhab];
  }
  
  // Apply strictness modifiers
  if (strictness === "strict") {
    // Strict: upgrade questionable/conditional to haram
    if (ruling === "questionable" || ruling === "conditional") {
      ruling = "haram";
    }
  } else if (strictness === "flexible") {
    // Flexible: downgrade questionable to conditional
    if (ruling === "questionable") {
      ruling = "conditional";
    }
    // Flexible: allow alcohol trace in vanilla extract (questionable -> conditional)
    if (ingredient.category === "flavoring" && ingredient.id?.includes("vanilla")) {
      if (ruling === "questionable") {
        ruling = "conditional";
      }
    }
  }
  
  return ruling;
}

export function evaluateItem(itemId, options = {}) {
  const trace = [];
  const visited = new Set();
  let tags = [];
  let preferenceEnforced = false;
  let inheritedFrom = null;
  let alternatives = [];
  let references = [];
  let notes = "";
  let eli5 = "";
  let displayName = null;
  let confidenceImpact = 0;
  let finalRuling = "unknown";

  // Get preferences
  const prefs = options || {};
  const strictness = prefs.strictness || prefs.strictnessLevel || "standard";
  const madhab = prefs.madhab || prefs.schoolOfThought || "no-preference";

  // Normalize item ID
  const normalizedId = itemId.toLowerCase().trim().replace(/\s+/g, "_");

  // Helper to resolve inheritance chain
  function resolveInheritance(id, path = []) {
    if (visited.has(id) || path.includes(id)) {
      return null; // Prevent circular references
    }
    visited.add(id);
    const newPath = [...path, id];

    // Try nested structure first
    let ingredient = nestedIngredients[id];
    
    // Try flat structure
    if (!ingredient) {
      ingredient = halalKnowledgeFlat[id];
    }
    
    // Check aliases
    if (!ingredient) {
      for (const [key, value] of Object.entries(halalKnowledgeFlat)) {
        if (value.aliases && Array.isArray(value.aliases) && value.aliases.includes(id)) {
          ingredient = value;
          break;
        }
      }
    }
    
    // Fallback to legacy knowledge
    if (!ingredient) {
      ingredient = halalKnowledge[id];
      if (ingredient) {
        // Convert legacy format
        ingredient = {
          id,
          displayName: ingredient.name || id.replace(/_/g, " "),
          status: ingredient.status || "unknown",
          derivedFrom: ingredient.inheritance || [],
          rulings: { default: ingredient.status || "unknown" },
          alternatives: ingredient.alternatives || [],
          notes: ingredient.notes || "",
          references: ingredient.references || [],
          aliases: ingredient.aliases || [],
          confidenceImpact: ingredient.confidence_score_base === 0.1 ? -40 : 
                           ingredient.confidence_score_base === 0.5 ? -30 : -15
        };
      }
    }

    if (!ingredient) {
      trace.push(`Unknown item: ${id}`);
      return null;
    }

    // Collect data from ingredient
    if (ingredient.status) {
      trace.push(`${id} is ${ingredient.status}`);
    }

    // Get display name
    if (ingredient.displayName && !displayName) {
      displayName = ingredient.displayName;
    }

    // Collect alternatives, notes, references
    if (ingredient.alternatives) {
      alternatives.push(...ingredient.alternatives);
    }
    if (ingredient.notes) {
      notes = ingredient.notes; // Most specific note wins
    }
    if (ingredient.eli5) {
      eli5 = ingredient.eli5; // Most specific ELI5 wins
    }
    if (ingredient.references) {
      references.push(...ingredient.references);
    }
    if (ingredient.category) {
      tags.push(ingredient.category);
    }

    // Track confidence impact (most severe wins)
    if (ingredient.confidenceImpact && Math.abs(ingredient.confidenceImpact) > Math.abs(confidenceImpact)) {
      confidenceImpact = ingredient.confidenceImpact;
    }

    // Resolve inheritance chain
    const derivedFrom = ingredient.derivedFrom || ingredient.inheritance || [];
    if (derivedFrom.length > 0) {
      for (const parentId of derivedFrom) {
        const normalizedParentId = typeof parentId === "string" 
          ? parentId.toLowerCase().trim().replace(/\s+/g, "_")
          : String(parentId).toLowerCase().trim().replace(/\s+/g, "_");
        
        const parentResolved = resolveInheritance(normalizedParentId, newPath);
        
        // Track inherited haram source
        if (parentResolved) {
          const parentRuling = getRuling(parentResolved, madhab, strictness);
          if (parentRuling === "haram" && !inheritedFrom) {
            inheritedFrom = normalizedParentId;
          }
        }
      }
    }

    return ingredient;
  }

  // Resolve inheritance chain
  const rootItem = resolveInheritance(normalizedId);
  
  if (!rootItem) {
    // Unknown ingredient - explicitly marked with neutral confidence impact
    const normalizedDisplayName = formatIngredientName(normalizedId);
    const unknownConfidenceScore = calculateConfidenceScore(STATUS_SCORE.unknown, 0, strictness, false);
    
    return {
      status: "unknown",
      confidenceScore: unknownConfidenceScore, // PRIMARY: 0-100 format (required)
      confidence: unknownConfidenceScore / 100, // Backward compatibility: 0-1 format
      confidencePercentage: unknownConfidenceScore, // Alias for confidenceScore
      trace: [`Unknown item: ${normalizedId}`],
      eli5: "Insufficient data — please verify",
      simpleExplanation: "Insufficient data — please verify", // ELI5 format
      explanation: "Insufficient data — please verify", // Full explanation
      alternatives: [],
      notes: "Insufficient data — please verify",
      references: [],
      tags: [],
      displayName: normalizedDisplayName,
      confidenceImpact: 0, // Neutral impact for unknown
      isUnknown: true // Explicit flag
    };
  }

  // Get final ruling based on school and strictness
  finalRuling = getRuling(rootItem, madhab, strictness);
  
  // Check if preference was applied (ruling changed from default)
  const defaultRuling = rootItem.rulings?.default || rootItem.status || "unknown";
  if (finalRuling !== defaultRuling && madhab !== "no-preference") {
    preferenceEnforced = true;
  }

  // Calculate confidence score
  const hasInheritance = !!inheritedFrom || (rootItem.derivedFrom && rootItem.derivedFrom.length > 0);
  const finalConfidence = calculateConfidenceScore(
    STATUS_SCORE[finalRuling] || STATUS_SCORE.unknown,
    confidenceImpact,
    strictness,
    hasInheritance
  );

  // Build trace with inheritance chain
  const inheritanceChain = [];
  function buildChain(id, visited = new Set()) {
    if (visited.has(id)) return;
    visited.add(id);
    
    const ing = nestedIngredients[id] || halalKnowledgeFlat[id];
    if (ing?.derivedFrom || ing?.inheritance) {
      const parents = ing.derivedFrom || ing.inheritance || [];
      for (const parentId of parents) {
        inheritanceChain.push(parentId);
        buildChain(parentId, visited);
      }
    }
  }
  buildChain(normalizedId);

  // Build comprehensive trace
  const fullTrace = [...trace];
  if (inheritanceChain.length > 0) {
    fullTrace.push(`Inherited from: ${inheritanceChain.reverse().join(" → ")}`);
  }

  // Remove duplicates
  const uniqueTags = [...new Set(tags)];
  const uniqueAlternatives = [...new Set(alternatives)];
  const uniqueReferences = [...new Set(references)];

  // Normalize display name using shared utility (snake_case → human-readable)
  const finalDisplayName = displayName || rootItem.displayName || formatIngredientName(normalizedId);

  // Build explanations - separate ELI5 from full explanation
  // Explanation should be religious justification (from notes or eli5)
  // Culinary notes are separate and handled below
  const simpleExplanation = eli5 || (notes ? `In simple terms: ${notes}` : "");
  const explanation = notes || eli5 || "";
  
  // Extract replacement ratio and culinary notes from knowledge base
  // Check both rootItem and halalKnowledgeFlat for these fields
  const flatEntry = halalKnowledgeFlat[normalizedId];
  const replacementRatio = rootItem.conversion_ratio || 
                          rootItem.replacementRatio || 
                          flatEntry?.conversion_ratio ||
                          flatEntry?.replacementRatio ||
                          null;
  const culinaryNotes = rootItem.culinaryNotes || 
                        rootItem.cookingNotes || 
                        flatEntry?.culinaryNotes ||
                        flatEntry?.cookingNotes ||
                        null;

  // Ensure confidenceScore is ALWAYS a number 0-100, never undefined or 0 unless truly 0
  const confidenceScore = finalConfidence; // Already 0-100 from calculateConfidenceScore

  const result = {
    status: finalRuling,
    confidenceScore: confidenceScore, // PRIMARY: 0-100 format (required, never undefined)
    confidence: confidenceScore / 100, // Backward compatibility: 0-1 format
    confidencePercentage: confidenceScore, // Alias for confidenceScore
    trace: fullTrace,
    eli5: simpleExplanation, // ELI5 format (simple explanation)
    simpleExplanation: simpleExplanation, // Explicit ELI5 field
    explanation: explanation, // Religious justification (why ingredient is not halal)
    replacementRatio: replacementRatio || undefined, // Replacement ratio (e.g., "1:0.75" or structured)
    culinaryNotes: culinaryNotes || undefined, // Culinary guidance (flavor, texture, cooking tips)
    tags: uniqueTags.length > 0 ? uniqueTags : undefined,
    alternatives: uniqueAlternatives.length > 0 ? uniqueAlternatives : undefined,
    references: uniqueReferences.length > 0 ? uniqueReferences : undefined,
    aliases: rootItem.aliases || undefined,
    displayName: finalDisplayName, // Normalized display name (never snake_case)
    confidenceImpact,
    inheritanceChain: inheritanceChain.length > 0 ? inheritanceChain : undefined
  };

  // Add inheritedFrom if applicable
  if (inheritedFrom) {
    result.inheritedFrom = inheritedFrom;
  }

  // Add preference info if enforced
  if (preferenceEnforced) {
    result.enforcedBy = "user_preferences";
    result.preferences = {
      strictness,
      madhab: madhab !== "no-preference" ? madhab : undefined
    };
  }

  return result;
}
