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
import { classifyIngredient, getDefaultNaturalStatus } from "./ingredientClassification";
import { getBaseIngredientOverride } from "./baseIngredientOverrides";
import { detectModifiers, applyModifierLogic, extractBaseIngredient, parseIngredientWithModifiers, getModifierOverrideStatus } from "./ingredientModifiers";
import { getTaxonomyResult, isInTaxonomy } from "./ingredientTaxonomy";
import { applyConfidenceScoring } from "./confidenceScoringEngine";

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

  // Parse into base ingredient + status-override modifiers (halal-certified, plant-based, bovine, pork, alcohol)
  const parsed = parseIngredientWithModifiers(normalizedId);
  const overrideStatus = getModifierOverrideStatus(parsed.statusModifiers);

  // If status-override modifier is haram (pork, alcohol), return haram with detected modifiers
  if (overrideStatus && overrideStatus.status === "haram") {
    const normalizedDisplayName = formatIngredientName(normalizedId);
    const haramResult = {
      status: "haram",
      confidenceScore: 0,
      confidence: 0,
      confidencePercentage: 0,
      confidenceLevel: "haram",
      ingredientType: "processed",
      trace: [`Status modifier override: ${parsed.statusModifiers.join(", ")} → haram`],
      eli5: overrideStatus.explanation || "Contains a non-permissible source.",
      simpleExplanation: overrideStatus.explanation || "Contains a non-permissible source.",
      explanation: overrideStatus.explanation || "This ingredient is derived from or contains a source that is not permissible in Islam.",
      alternatives: [],
      notes: overrideStatus.explanation,
      references: ["Qur'an 5:90", "Qur'an 2:173"],
      tags: ["haram", "modified"],
      displayName: normalizedDisplayName,
      confidenceImpact: -100,
      detectedModifiers: parsed.statusModifiers,
      baseIngredient: parsed.base,
      bypassAI: true,
    };
    return applyConfidenceScoring(haramResult, {
      isProcessed: true,
      isCertified: false,
      hasAdditives: false,
      hasInheritance: false,
      hasConditionalModifier: false,
      hasProcessingModifier: false,
      isTaxonomyBased: false,
      isBaseIngredientOverride: false,
      isNaturalPlant: false,
    });
  }

  // Detect legacy modifiers (processing/conditional); haram list no longer includes "gelatin" alone
  const modifierDetection = detectModifiers(normalizedId);

  // If haram modifier detected (e.g. pork, alcohol in legacy list), return haram immediately
  if (modifierDetection.hasHaramModifier) {
    const haramModifier = modifierDetection.haramModifiers[0];
    let explanation = `This ingredient contains ${haramModifier.replace(/_/g, ' ')}, which is haram.`;
    
    // Specific explanations for common haram modifiers
    if (haramModifier.includes('wine') || haramModifier.includes('alcohol')) {
      explanation = `This ingredient contains alcohol (${haramModifier.replace(/_/g, ' ')}), which is haram according to Islamic law.`;
    } else if (haramModifier.includes('pork') || haramModifier.includes('bacon') || haramModifier.includes('lard')) {
      explanation = `This ingredient contains pork or pork-derived products (${haramModifier.replace(/_/g, ' ')}), which is haram.`;
    }
    
    const normalizedDisplayName = formatIngredientName(normalizedId);
    
    const haramResult = {
      status: "haram",
      confidenceScore: 0,
      confidence: 0,
      confidencePercentage: 0,
      confidenceLevel: "haram",
      ingredientType: "processed", // Modified ingredients are processed
      trace: [`Haram modifier detected: ${haramModifier}`],
      eli5: `Contains ${haramModifier.replace(/_/g, ' ')}, which is haram.`,
      simpleExplanation: `Contains ${haramModifier.replace(/_/g, ' ')}, which is haram.`,
      explanation: explanation,
      alternatives: [],
      notes: explanation,
      references: ["Qur'an 5:90", "Qur'an 2:173"],
      tags: ["haram", "modified"],
      displayName: normalizedDisplayName,
      confidenceImpact: -100,
      isHaramModifierOverride: true,
      haramModifiers: modifierDetection.haramModifiers,
      bypassAI: true
    };
    
    // Apply confidence scoring engine (haram = low confidence)
    return applyConfidenceScoring(haramResult, {
      isProcessed: true,
      isCertified: false,
      hasAdditives: false,
      hasInheritance: false,
      hasConditionalModifier: false,
      hasProcessingModifier: false,
      isTaxonomyBased: false,
      isBaseIngredientOverride: false,
      isNaturalPlant: false
    });
  }

  // Base for evaluation: use parsed base when we have status modifiers, else extract from full id
  const baseIngredientId = parsed.statusModifiers.length > 0 ? parsed.base : extractBaseIngredient(normalizedId);

  // Check taxonomy FIRST (before base ingredient override)
  // Taxonomy provides systematic classification with default status and confidence
  const taxonomyResult = getTaxonomyResult(baseIngredientId || normalizedId, null);
  if (taxonomyResult) {
    const normalizedDisplayName = formatIngredientName(normalizedId);
    const taxonomyConfidenceScore = calculateConfidenceScore(
      taxonomyResult.confidenceScore / 100,
      0,
      strictness,
      false
    );
    
    // Build base result from taxonomy
    const taxonomyBaseResult = {
      status: taxonomyResult.status,
      confidenceScore: taxonomyConfidenceScore,
      confidence: taxonomyConfidenceScore / 100,
      confidencePercentage: taxonomyConfidenceScore,
      confidenceLevel: taxonomyResult.confidenceLevel,
      ingredientType: taxonomyResult.category === "natural_plant" ? "natural" :
                     taxonomyResult.category === "processed_plant" ? "processed" :
                     taxonomyResult.category === "animal" ? "animal" :
                     taxonomyResult.category === "alcohol" ? "alcohol-derived" :
                     "processed",
      trace: [`Taxonomy classification: ${taxonomyResult.categoryLabel}`],
      eli5: taxonomyResult.explanation,
      simpleExplanation: taxonomyResult.explanation,
      explanation: taxonomyResult.explanation,
      alternatives: [],
      notes: taxonomyResult.explanation,
      references: [],
      tags: [taxonomyResult.category, taxonomyResult.categoryLabel.toLowerCase()],
      displayName: normalizedDisplayName,
      confidenceImpact: 0,
      isTaxonomyBased: true,
      taxonomyCategory: taxonomyResult.category,
      requiresVerification: taxonomyResult.requiresVerification
    };
    
    // Apply modifier logic (processing modifiers may add conditions)
    let result = applyModifierLogic(normalizedId, taxonomyBaseResult, modifierDetection);
    if (overrideStatus && (overrideStatus.status === "halal" || overrideStatus.status === "conditional")) {
      result = {
        ...result,
        status: overrideStatus.status,
        confidenceLevel: overrideStatus.status === "halal" ? "certain_halal" : "conditional",
        confidenceScore: overrideStatus.status === "halal" ? 95 : Math.min(75, result.confidenceScore || 75),
        confidence: overrideStatus.status === "halal" ? 0.95 : Math.min(0.75, (result.confidenceScore || 75) / 100),
        confidencePercentage: overrideStatus.status === "halal" ? 95 : Math.min(75, result.confidencePercentage || 75),
        explanation: overrideStatus.explanation || result.explanation,
        simpleExplanation: overrideStatus.explanation || result.simpleExplanation,
        eli5: overrideStatus.explanation || result.eli5,
        detectedModifiers: parsed.statusModifiers,
        baseIngredient: parsed.base,
      };
    } else if (parsed.statusModifiers.length > 0) {
      result = { ...result, detectedModifiers: parsed.statusModifiers, baseIngredient: parsed.base };
    }
    return applyConfidenceScoring(result, {
      isProcessed: taxonomyResult.category === 'processed_plant',
      isCertified: false,
      hasAdditives: taxonomyResult.category === 'processed_plant',
      hasInheritance: false,
      hasConditionalModifier: modifierDetection.hasConditionalModifier,
      hasProcessingModifier: modifierDetection.hasProcessingModifier,
      isTaxonomyBased: true,
      isBaseIngredientOverride: false,
      isNaturalPlant: taxonomyResult.category === 'natural_plant'
    });
  }
  
  // Check for base ingredient override on BASE ingredient (not modified version)
  // Plain plant-based ingredients (rice, wheat, vegetables, legumes, fruits) always return halal
  const baseOverride = getBaseIngredientOverride(baseIngredientId);
  if (baseOverride) {
    const normalizedDisplayName = formatIngredientName(normalizedId);
    const halalConfidenceScore = calculateConfidenceScore(STATUS_SCORE.halal, 0, strictness, false);
    
    const baseResult = {
      status: "halal",
      confidenceScore: halalConfidenceScore,
      confidence: halalConfidenceScore / 100,
      confidencePercentage: halalConfidenceScore,
      confidenceLevel: baseOverride.confidenceLevel,
      ingredientType: baseOverride.ingredientType,
      trace: [`Base ingredient override: ${baseIngredientId} (plain plant-based, always halal)`],
      eli5: baseOverride.simpleExplanation,
      simpleExplanation: baseOverride.simpleExplanation,
      explanation: baseOverride.explanation,
      alternatives: [],
      notes: baseOverride.explanation,
      references: [],
      tags: ["natural", "plant-based", "base-ingredient"],
      displayName: normalizedDisplayName,
      confidenceImpact: 0,
      isBaseIngredientOverride: true,
      bypassAI: true
    };
    
    let result = applyModifierLogic(normalizedId, baseResult, modifierDetection);
    if (overrideStatus && (overrideStatus.status === "halal" || overrideStatus.status === "conditional")) {
      result = {
        ...result,
        status: overrideStatus.status,
        confidenceLevel: overrideStatus.status === "halal" ? "certain_halal" : "conditional",
        confidenceScore: overrideStatus.status === "halal" ? 95 : Math.min(75, result.confidenceScore || 75),
        confidence: overrideStatus.status === "halal" ? 0.95 : Math.min(0.75, (result.confidenceScore || 75) / 100),
        confidencePercentage: overrideStatus.status === "halal" ? 95 : Math.min(75, result.confidencePercentage || 75),
        explanation: overrideStatus.explanation || result.explanation,
        simpleExplanation: overrideStatus.explanation || result.simpleExplanation,
        eli5: overrideStatus.explanation || result.eli5,
        detectedModifiers: parsed.statusModifiers,
        baseIngredient: parsed.base,
      };
    } else if (parsed.statusModifiers.length > 0) {
      result = { ...result, detectedModifiers: parsed.statusModifiers, baseIngredient: parsed.base };
    }
    return applyConfidenceScoring(result, {
      isProcessed: false,
      isCertified: false,
      hasAdditives: false,
      hasInheritance: false,
      hasConditionalModifier: modifierDetection.hasConditionalModifier,
      hasProcessingModifier: modifierDetection.hasProcessingModifier,
      isTaxonomyBased: false,
      isBaseIngredientOverride: true,
      isNaturalPlant: true
    });
  }

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

  // Resolve inheritance chain (use base when we parsed modifiers, e.g. bovine_gelatin → lookup gelatin)
  const rootItem = resolveInheritance(baseIngredientId || normalizedId);

  if (!rootItem) {
    // Unknown ingredient - check if it's a natural plant-based ingredient (default to halal)
    const defaultNatural = getDefaultNaturalStatus(normalizedId);
    
    if (defaultNatural) {
      // Natural plant-based ingredient - default to halal
      const normalizedDisplayName = formatIngredientName(normalizedId);
      const halalConfidenceScore = calculateConfidenceScore(STATUS_SCORE.halal, 0, strictness, false);
      
      const defaultResult = {
        status: "halal",
        confidenceScore: halalConfidenceScore,
        confidence: halalConfidenceScore / 100,
        confidencePercentage: halalConfidenceScore,
        confidenceLevel: "certain_halal",
        ingredientType: "natural",
        trace: [`Natural plant-based ingredient: ${normalizedId} (default halal)`],
        eli5: defaultNatural.explanation,
        simpleExplanation: defaultNatural.explanation,
        explanation: defaultNatural.explanation,
        alternatives: [],
        notes: defaultNatural.explanation,
        references: [],
        tags: ["natural", "plant-based"],
        displayName: normalizedDisplayName,
        confidenceImpact: 0,
        isDefaultHalal: true
      };
      
      // Apply modifier logic first
      const result = applyModifierLogic(normalizedId, defaultResult, modifierDetection);
      
      // Apply confidence scoring engine
      return applyConfidenceScoring(result, {
        isProcessed: false,
        isCertified: false,
        hasAdditives: false,
        hasInheritance: false,
        hasConditionalModifier: modifierDetection.hasConditionalModifier,
        hasProcessingModifier: modifierDetection.hasProcessingModifier,
        isTaxonomyBased: false,
        isBaseIngredientOverride: false,
        isNaturalPlant: true
      });
    }
    
    // Truly unknown ingredient (not natural) - use rare_unknown
    const normalizedDisplayName = formatIngredientName(normalizedId);
    const unknownConfidenceScore = calculateConfidenceScore(STATUS_SCORE.unknown, 0, strictness, false);
    
    return {
      status: "unknown",
      confidenceScore: unknownConfidenceScore,
      confidence: unknownConfidenceScore / 100,
      confidencePercentage: unknownConfidenceScore,
      confidenceLevel: "rare_unknown",
      ingredientType: "processed", // Default to processed for unknown
      trace: [`Unknown item: ${normalizedId} (rare/unknown)`],
      eli5: "Insufficient data — please verify with a qualified Islamic scholar",
      simpleExplanation: "Insufficient data — please verify with a qualified Islamic scholar",
      explanation: "Insufficient data — please verify with a qualified Islamic scholar",
      alternatives: [],
      notes: "Insufficient data — please verify with a qualified Islamic scholar",
      references: [],
      tags: [],
      displayName: normalizedDisplayName,
      confidenceImpact: 0,
      isUnknown: true
    };
  }

  // Get final ruling based on school and strictness
  finalRuling = getRuling(rootItem, madhab, strictness);
  
  // Classify ingredient type and confidence level
  const classification = classifyIngredient(normalizedId, rootItem, finalRuling);
  
  // Apply default halal for natural plant-based if status is unknown
  if (classification.isDefaultHalal && finalRuling === "unknown") {
    finalRuling = "halal";
    const defaultNatural = getDefaultNaturalStatus(normalizedId);
    if (defaultNatural) {
      eli5 = defaultNatural.explanation;
      notes = defaultNatural.explanation;
      if (!tags.includes("natural")) {
        tags.push("natural", "plant-based");
      }
    }
  }
  
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

  const baseResult = {
    status: finalRuling,
    confidenceScore: confidenceScore, // PRIMARY: 0-100 format (required, never undefined)
    confidence: confidenceScore / 100, // Backward compatibility: 0-1 format
    confidencePercentage: confidenceScore, // Alias for confidenceScore
    confidenceLevel: classification.confidenceLevel, // NEW: certain_halal, conditional, haram, rare_unknown
    ingredientType: classification.type, // NEW: natural, processed, animal, alcohol-derived
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
    inheritanceChain: inheritanceChain.length > 0 ? inheritanceChain : undefined,
    isDefaultHalal: classification.isDefaultHalal || false // Flag for default halal natural ingredients
  };
  
  let result = applyModifierLogic(normalizedId, baseResult, modifierDetection);

  if (overrideStatus && (overrideStatus.status === "halal" || overrideStatus.status === "conditional")) {
    result = {
      ...result,
      status: overrideStatus.status,
      confidenceLevel: overrideStatus.status === "halal" ? "certain_halal" : "conditional",
      confidenceScore: overrideStatus.status === "halal" ? 95 : Math.min(75, result.confidenceScore || 75),
      confidence: overrideStatus.status === "halal" ? 0.95 : Math.min(0.75, (result.confidenceScore || 75) / 100),
      confidencePercentage: overrideStatus.status === "halal" ? 95 : Math.min(75, result.confidencePercentage || 75),
      explanation: overrideStatus.explanation || result.explanation,
      simpleExplanation: overrideStatus.explanation || result.simpleExplanation,
      eli5: overrideStatus.explanation || result.eli5,
      detectedModifiers: parsed.statusModifiers,
      baseIngredient: parsed.base,
    };
  } else if (parsed.statusModifiers.length > 0) {
    result = { ...result, detectedModifiers: parsed.statusModifiers, baseIngredient: parsed.base };
  }

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
  
  // Apply confidence scoring engine (maps to high/medium/low)
  const finalResult = applyConfidenceScoring(result, {
    isProcessed: classification.type === 'processed',
    isCertified: false, // TODO: Add certification detection
    hasAdditives: classification.type === 'processed',
    hasInheritance: !!inheritedFrom,
    hasConditionalModifier: modifierDetection.hasConditionalModifier,
    hasProcessingModifier: modifierDetection.hasProcessingModifier,
    isTaxonomyBased: false,
    isBaseIngredientOverride: false,
    isNaturalPlant: classification.type === 'natural'
  });
  
  return finalResult;
}
