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
            replacement: details.alternatives?.[0] || "Halal alternative needed",
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
            references: details.references || []
          });
        }
      }
    }
  });

  return detected;
};

/**
 * Replace haram ingredients with halal alternatives in recipe text
 */
const replaceIngredients = (recipeText, detectedIngredients) => {
  if (!recipeText || typeof recipeText !== "string") {
    return recipeText;
  }

  if (!Array.isArray(detectedIngredients) || detectedIngredients.length === 0) {
    return recipeText;
  }

  let convertedText = recipeText;

  detectedIngredients.forEach((item) => {
    const { ingredient, replacement } = item;

    if (!replacement || replacement.trim() === "") {
      return; // Skip if no replacement available
    }

    // Replace all occurrences with word boundaries
    const regex = new RegExp(
      `\\b${ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    convertedText = convertedText.replace(regex, replacement);
  });

  return convertedText;
};

/**
 * Calculate confidence score based on detected ingredients, replacements, and user preferences
 * - Accounts for inheritance chains and user strictness levels
 */
const calculateConfidenceScore = (detectedIngredients, userPreferences = {}) => {
  // Guard: If no ingredients evaluated, return null (not 100%)
  if (!Array.isArray(detectedIngredients) || detectedIngredients.length === 0) {
    return null; // null indicates no evaluation, not a perfect score
  }

  const strictness = userPreferences.strictnessLevel || userPreferences.strictness || "standard";
  
  const totalDetected = detectedIngredients.length;
  const withReplacement = detectedIngredients.filter(
    (item) => item.replacement && item.replacement !== "Halal alternative needed" && item.replacement.trim() !== ""
  ).length;
  const withoutReplacement = totalDetected - withReplacement;
  const replacementRatio = withReplacement / totalDetected;

  // Base score: start from replacement ratio, but ensure high confidence when all are replaced
  // When all ingredients are replaced (replacementRatio = 1.0), base score should be 95%
  // When none are replaced (replacementRatio = 0.0), base score should be 0%
  let baseScore = replacementRatio * 95; // Scale from 0 to 95 based on replacement ratio

  // Boost for successful full replacement (all items replaced)
  if (replacementRatio === 1.0) {
    // All items successfully replaced - ensure high confidence (95-100%)
    baseScore = 95;
  }

  // Apply penalties for missing replacements (only if not all replaced)
  if (withoutReplacement > 0 && replacementRatio < 1.0) {
    // Missing replacement reduces confidence by 20% per missing item
    baseScore *= Math.pow(0.8, withoutReplacement);
  }

  // Adjust based on inheritance chains (longer chains reduce confidence)
  const withInheritance = detectedIngredients.filter(
    (item) => item.inheritedFrom && item.trace && item.trace.length > 1
  ).length;
  
  if (withInheritance > 0) {
    // Only apply inheritance penalty if it doesn't drop us below 80% for full replacement
    const inheritancePenalty = 0.85;
    const newScore = baseScore * inheritancePenalty;
    // Don't penalize below 80% if all items are replaced
    if (replacementRatio === 1.0 && newScore < 80) {
      baseScore = Math.max(80, newScore);
    } else {
      baseScore = newScore;
    }
  }

  // Adjust based on severity (only for non-replaced items)
  const highSeverityCount = detectedIngredients.filter(
    (item) => (!item.replacement || item.replacement === "Halal alternative needed" || item.replacement.trim() === "") &&
              item.severity && item.severity.toLowerCase() === "high"
  ).length;
  
  if (highSeverityCount > 0 && replacementRatio < 1.0) {
    // Additional penalty for high severity items without replacements
    baseScore -= (highSeverityCount * 5);
  }

  // Adjust for strictness level
  if (strictness === "strict") {
    // Only apply strict penalty if it doesn't drop us below 80% for full replacement
    const strictPenalty = 0.95;
    const newScore = baseScore * strictPenalty;
    if (replacementRatio === 1.0 && newScore < 80) {
      baseScore = Math.max(80, newScore);
    } else {
      baseScore = newScore;
    }
  } else if (strictness === "flexible") {
    baseScore = Math.min(100, baseScore * 1.02); // Slightly increase for flexible (capped at 100)
  }

  // Ensure score reflects successful replacements
  // If all ingredients are replaced, confidence should be high (80-100%)
  if (replacementRatio === 1.0 && baseScore < 80) {
    baseScore = 80; // Minimum 80% when all items are successfully replaced
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));
  return finalScore;
};

/**
 * Main conversion function
 * Converts recipe text by detecting and replacing haram ingredients using JSON knowledge base
 * Supports user preferences for strictness and school of thought
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
    // Step 1: Detect haram/conditional ingredients using JSON knowledge base
    const detectedIngredients = detectHaramIngredients(trimmedText, userPreferences);

    // Step 2: Replace ingredients in text
    const convertedText = replaceIngredients(trimmedText, detectedIngredients);

    // Step 3: Calculate confidence score with user preferences
    const confidenceScore = calculateConfidenceScore(detectedIngredients, userPreferences);

    // Step 4: Format issues for API response (backward compatible with frontend)
    const issues = detectedIngredients.map((item) => {
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
        references: item.references || []
      };
    });

    return {
      originalText: trimmedText,
      convertedText: convertedText,
      issues: issues,
      confidenceScore: confidenceScore,
    };
  } catch (error) {
    console.error("Error in convertRecipe:", error);
    // Return safe fallback on error
    return {
      originalText: trimmedText,
      convertedText: trimmedText,
      issues: [],
      confidenceScore: 0,
    };
  }
};
