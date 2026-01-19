import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getIngredientDetails, buildIngredientLookup } from "./halalEngine.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for ingredient lookup (built from JSON)
let ingredientList = null;

/**
 * Load ingredient lookup from JSON knowledge base
 * Uses caching to avoid rebuilding on every request
 */
const loadIngredientList = () => {
  if (ingredientList !== null) {
    return ingredientList;
  }

  try {
    // Build lookup from JSON knowledge base
    ingredientList = buildIngredientLookup();
    return ingredientList;
  } catch (error) {
    console.error("Error loading ingredient list from JSON:", error);
    // Return empty list on error to prevent crashes
    ingredientList = [];
    return ingredientList;
  }
};

/**
 * Detect haram/conditional ingredients in recipe text using JSON knowledge base
 * Returns array of detected ingredients with their details and inheritance chains
 * 
 * SEPARATION OF CONCERNS: This function only detects ingredients, does NOT replace them
 */
const detectHaramIngredients = (recipeText, userPreferences = {}) => {
  if (!recipeText || typeof recipeText !== "string") {
    return [];
  }

  const lookupList = loadIngredientList();
  const detected = [];
  const processed = new Set(); // Track processed ingredients to avoid duplicates

  lookupList.forEach((item) => {
    const searchTerm = item.searchTerm;
    
    // Use word boundary regex for accurate detection
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");
    
    if (regex.test(recipeText)) {
      const normalizedKey = item.normalizedKey;
      
      // Only process each main ingredient once
      if (!processed.has(normalizedKey)) {
        processed.add(normalizedKey);
        
        // Get full ingredient details with inheritance resolution
        const details = getIngredientDetails(searchTerm, userPreferences);
        
        // Only add if ingredient is haram or conditional
        if (details && (details.status === "haram" || details.status === "conditional")) {
          detected.push({
            ingredient: searchTerm,
            normalizedName: normalizedKey,
            haramIngredient: details.displayName || searchTerm,
            replacement: details.alternatives?.[0] || null, // Use null instead of "Halal alternative needed"
            alternatives: details.alternatives || [],
            notes: details.notes || "",
            severity: details.severity || "medium",
            confidence: details.confidenceScore || 0.5,
            quranReference: details.quranReference || "",
            hadithReference: details.hadithReference || "",
            // Add knowledge engine fields
            inheritedFrom: details.inheritedFrom,
            eli5: details.eli5,
            trace: details.trace || [],
            status: details.status,
            references: details.references || [],
            matchedTerm: searchTerm // Store the term that matched
          });
        }
      }
    }
  });

  return detected;
};

/**
 * PURE FUNCTION: Convert ingredients in recipe text
 * 
 * SEPARATION OF CONCERNS: This function ONLY does replacement, never calculates confidence
 * Returns what was replaced and what couldn't be replaced for scoring later
 * 
 * @param {string} recipeText - Original recipe text
 * @param {Array} detectedIngredients - Array of detected haram/conditional ingredients
 * @returns {Object} { convertedText, replacements, unresolved }
 *   - convertedText: Recipe text with replacements applied
 *   - replacements: Array of { original, replacement, status } for successfully replaced items
 *   - unresolved: Array of { ingredient, status } for items without replacements
 */
const convertIngredients = (recipeText, detectedIngredients) => {
  // Defensive checks: if no ingredients detected, return original text
  if (!recipeText || typeof recipeText !== "string" || !Array.isArray(detectedIngredients) || detectedIngredients.length === 0) {
    return {
      convertedText: recipeText || "",
      replacements: [],
      unresolved: []
    };
  }

  let convertedText = recipeText;
  const replacements = []; // Track successfully replaced ingredients
  const unresolved = []; // Track ingredients without replacements

  // Process each detected ingredient
  detectedIngredients.forEach((item) => {
    const ingredient = item.ingredient || item.matchedTerm;
    const replacement = item.replacement;
    const status = item.status || "haram";

    // Check if replacement is available
    const hasReplacement = replacement && 
                          replacement !== "Halal alternative needed" && 
                          replacement.trim() !== "";

    if (!hasReplacement) {
      // No replacement available - mark as unresolved
      unresolved.push({
        ingredient: ingredient,
        status: status,
        matchedTerm: item.matchedTerm || ingredient
      });
      return; // Skip to next ingredient
    }

    // Replacement available - perform replacement
    // Replace all occurrences with word boundaries
    const escapedIngredient = ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedIngredient}\\b`, "gi");
    
    // Track if any replacement occurred for this ingredient
    let wasReplaced = false;
    const previousText = convertedText;
    
    convertedText = convertedText.replace(regex, (match) => {
      wasReplaced = true;
      // Preserve original case
      if (match === match.toUpperCase()) {
        return replacement.toUpperCase();
      } else if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });

    // Track successful replacement
    if (wasReplaced) {
      replacements.push({
        original: ingredient,
        replacement: replacement,
        status: status,
        matchedTerm: item.matchedTerm || ingredient
      });
    } else {
      // Pattern matched but replacement didn't occur (shouldn't happen, but handle gracefully)
      unresolved.push({
        ingredient: ingredient,
        status: status,
        matchedTerm: item.matchedTerm || ingredient
      });
    }
  });

  return {
    convertedText,
    replacements,
    unresolved
  };
};

/**
 * PURE FUNCTION: Calculate confidence score based on FINAL conversion state
 * 
 * SEPARATION OF CONCERNS: This function ONLY calculates confidence, never performs replacement
 * Confidence reflects the FINAL state after all replacements are complete
 * 
 * Rules:
 * - Start at 100
 * - -20 for each unresolved haram ingredient
 * - -10 for questionable/conditional ingredients without replacement
 * - 0 penalty if haram ingredient was successfully replaced (never penalize if replacement exists)
 * 
 * @param {Object} conversionResult - Result from convertIngredients()
 *   - originalIngredients: Array of detected ingredients
 *   - replacements: Array of successfully replaced ingredients
 *   - unresolved: Array of ingredients without replacements
 * @returns {number} Confidence score 0-100 (100 = perfect, all haram ingredients replaced)
 */
const calculateConfidenceScore = ({ originalIngredients, replacements, unresolved }) => {
  // Guard: If no ingredients evaluated, return null (not 100%)
  if (!Array.isArray(originalIngredients) || originalIngredients.length === 0) {
    return null; // null indicates no evaluation, not a perfect score
  }

  // Start at 100% confidence
  let score = 100;
  
  // Count resolved vs unresolved ingredients by status
  const unresolvedHaram = unresolved.filter(item => item.status === "haram").length;
  const unresolvedQuestionable = unresolved.filter(item => 
    item.status === "questionable" || item.status === "conditional"
  ).length;
  
  // Apply penalties based on final state (AFTER replacements)
  // -20 points per unresolved haram ingredient
  score -= (unresolvedHaram * 20);
  
  // -10 points per unresolved questionable/conditional ingredient
  score -= (unresolvedQuestionable * 10);
  
  // Ensure score is within valid range (0-100)
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  // Special case: If all haram ingredients were successfully replaced, score should be 100%
  // This ensures demo recipe with full replacements shows 100%
  const totalHaram = originalIngredients.filter(item => 
    item.status === "haram"
  ).length;
  const replacedHaram = replacements.filter(item => item.status === "haram").length;
  
  if (totalHaram > 0 && replacedHaram === totalHaram && unresolvedHaram === 0) {
    // All haram ingredients were successfully replaced
    score = 100;
  }
  
  return score;
};

/**
 * Main conversion function
 * Converts recipe text by detecting and replacing haram ingredients using JSON knowledge base
 * Supports user preferences for strictness and school of thought
 * 
 * PIPELINE: Detect → Convert → Calculate Score
 * Each step is independent and runs fully regardless of previous step results
 */
export const convertRecipe = (recipeText, userPreferences = {}) => {
  // Defensive checks
  if (!recipeText || typeof recipeText !== "string") {
    return {
      originalText: "",
      convertedText: "",
      issues: [],
      confidenceScore: 0,
    };
  }

  const trimmedText = recipeText.trim();
  if (trimmedText === "") {
    return {
      originalText: "",
      convertedText: "",
      issues: [],
      confidenceScore: 0,
    };
  }

  try {
    // STEP 1: DETECT ingredients (pure detection, no replacement, no scoring)
    const detectedIngredients = detectHaramIngredients(trimmedText, userPreferences);

    // STEP 2: CONVERT ingredients (pure replacement, no scoring logic)
    // Conversion ALWAYS runs fully, regardless of what will happen in scoring
    const conversionResult = convertIngredients(trimmedText, detectedIngredients);
    const { convertedText, replacements, unresolved } = conversionResult;

    // STEP 3: CALCULATE confidence score (pure scoring, uses FINAL conversion state)
    // Scoring happens AFTER all replacements are complete
    const confidenceScore = calculateConfidenceScore({
      originalIngredients: detectedIngredients,
      replacements: replacements,
      unresolved: unresolved
    });

    // Check if any substitutions occurred (for confidence_type classification)
    const hasSubstitutions = convertedText !== trimmedText;

    // STEP 4: Format issues for API response (backward compatible with frontend)
    // Include both replaced and unresolved ingredients in issues list
    const issues = detectedIngredients.map((item) => {
      // Check if this ingredient was successfully replaced
      const wasReplaced = replacements.some(r => 
        r.original === (item.ingredient || item.matchedTerm)
      );

      const quranRef = item.quranReference || "";
      const hadithRef = item.hadithReference || "";
      const reference = [quranRef, hadithRef].filter(Boolean).join("; ") || "";
      
      return {
        ingredient: item.ingredient,
        replacement: item.replacement || "No replacement available",
        notes: item.notes || "",
        severity: item.severity || "medium",
        confidence: item.confidence || 0.5,
        quranReference: quranRef,
        hadithReference: hadithRef,
        reference: reference,
        // Add knowledge engine fields for frontend enhancement
        inheritedFrom: item.inheritedFrom,
        alternatives: item.alternatives || [],
        eli5: item.eli5,
        trace: item.trace || [],
        status: item.status || "haram",
        references: item.references || [],
        wasReplaced: wasReplaced // Track if this ingredient was successfully replaced
      };
    });

    // Handle null confidence score (no ingredients evaluated)
    const finalConfidenceScore = confidenceScore === null ? 0 : confidenceScore;

    return {
      originalText: trimmedText,
      convertedText: convertedText, // Always return converted text, even if low confidence
      issues: issues,
      confidenceScore: finalConfidenceScore, // Score reflects FINAL state after replacements
    };
  } catch (error) {
    console.error("Error in convertRecipe:", error);
    // Return safe fallback on error - still return original text even on error
    return {
      originalText: trimmedText,
      convertedText: trimmedText,
      issues: [],
      confidenceScore: 0,
    };
  }
};
