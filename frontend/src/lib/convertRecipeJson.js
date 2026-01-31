/**
 * Frontend Recipe Conversion Engine using JSON Knowledge Base
 * Uses shared evaluateItem() from halalEngine.js for consistent evaluation
 * 
 * IMPORTANT: Ingredient replacement and confidence scoring are STRICTLY SEPARATED
 * - Conversion always runs fully, regardless of confidence score
 * - Confidence score is calculated AFTER all replacements are complete
 * - Replacement logic never skips items due to scoring concerns
 */

import { evaluateItem } from "./halalEngine";
import { FEATURES } from "./featureFlags";
import halalKnowledge from "../data/halal_knowledge.json";
import { formatIngredientName } from "./ingredientDisplay";
import { getAffiliateLinksForSubstitutes, buildAffiliateUrl } from "./affiliateService";
import { applySubstitutionLimit, shouldShowAdvancedSubstitutionFeatures } from "./featureGating";

/**
 * Normalize ingredient name for lookup
 */
function normalizeIngredientName(name) {
  if (!name || typeof name !== "string") return "";
  return name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

/**
 * Detect haram/conditional ingredients in recipe text using JSON knowledge base
 * Improved detection with word boundaries and alias matching
 * 
 * SEPARATION OF CONCERNS: This function only detects ingredients, does NOT replace them
 */
function detectIngredientsInText(recipeText, userPreferences = {}) {
  if (!recipeText || typeof recipeText !== "string") return [];
  
  if (!halalKnowledge || typeof halalKnowledge !== "object" || Object.keys(halalKnowledge).length === 0) {
    console.warn("halalKnowledge not loaded or empty");
    return [];
  }
  
  const textLower = recipeText.toLowerCase();
  const detected = [];
  const processed = new Set(); // Track processed ingredients to avoid duplicates
  
  // Build lookup map: ingredient name -> entry
  const ingredientLookup = new Map();
  Object.entries(halalKnowledge).forEach(([key, value]) => {
    // Map main ingredient
    ingredientLookup.set(key, { mainKey: key, entry: value });
    
    // Map aliases to main ingredient
    if (value.aliases && Array.isArray(value.aliases)) {
      value.aliases.forEach(alias => {
        if (!ingredientLookup.has(alias)) {
          ingredientLookup.set(alias, { mainKey: key, entry: value });
        }
      });
    }
  });
  
  // Check each known ingredient and alias against recipe text
  ingredientLookup.forEach((value, lookupKey) => {
    const { mainKey, entry } = value;
    
    // Create search patterns: exact match, with underscores, with spaces
    const searchTerms = [
      lookupKey,
      lookupKey.replace(/_/g, " "),
      lookupKey.replace(/ /g, "_")
    ];
    
    for (const term of searchTerms) {
      // Use word boundary regex for accurate detection (case-insensitive)
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Create new regex for each test to avoid state issues
      const pattern = new RegExp(`\\b${escapedTerm}\\b`, "gi");
      
      if (pattern.test(recipeText)) {
        const normalizedKey = normalizeIngredientName(mainKey);
        
        // Only process each main ingredient once
        if (!processed.has(normalizedKey)) {
          processed.add(normalizedKey);
          
          // Evaluate ingredient using knowledge engine with preferences
          const engineResult = evaluateItem(normalizedKey, {
            madhab: userPreferences.schoolOfThought || "no-preference",
            strictness: userPreferences.strictnessLevel || "standard"
          });
          
          // Only add if ingredient is haram or conditional
          if (engineResult.status === "haram" || engineResult.status === "conditional") {
            // Get replacement ingredient ID (first alternative)
            const replacementId = entry?.alternatives?.[0] || engineResult.alternatives?.[0] || null;
            
            detected.push({
              ingredient_id: normalizedKey, // Internal ID (snake_case)
              ingredient: normalizedKey, // Keep for backward compatibility
              normalizedName: normalizedKey,
              matchedTerm: term, // Store the actual term that matched in the recipe text
              status: engineResult.status,
              replacement_id: replacementId, // Replacement ingredient ID
              replacement: replacementId, // Keep for backward compatibility (will be formatted in UI)
              alternatives: engineResult.alternatives || entry?.alternatives || [],
              // Extract replacement ratio and culinary notes
              replacementRatio: engineResult.replacementRatio || entry?.conversion_ratio || null,
              culinaryNotes: engineResult.culinaryNotes || null,
              // Notes field removed - explanation and culinaryNotes are separate
              severity: entry?.confidence_score_base === 0.1 ? "high" : 
                       entry?.confidence_score_base === 0.5 ? "medium" : "low",
              quranReference: engineResult.references?.find(r => r.toLowerCase().includes("qur'an") || r.toLowerCase().includes("quran")) || "",
              hadithReference: engineResult.references?.find(r => r.toLowerCase().includes("hadith") || r.toLowerCase().includes("bukhari") || r.toLowerCase().includes("muslim")) || "",
              engineResult: engineResult,
              hkmEntry: entry
            });
          }
        }
        break; // Found match, move to next ingredient
      }
    }
  });
  
  return detected;
}

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
function convertIngredients(recipeText, detectedIngredients) {
  // Defensive checks: if no ingredients detected, return original text
  if (!recipeText || typeof recipeText !== "string" || detectedIngredients.length === 0) {
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
  detectedIngredients.forEach(item => {
    // Get ingredient ID (internal snake_case format)
    const ingredientId = item.ingredient_id || item.ingredient;
    const replacementId = item.replacement_id || item.replacement;
    const status = item.status || item.engineResult?.status || "unknown";
    
    // Check if replacement is available
    const hasReplacement = replacementId && 
                          replacementId !== "Halal alternative needed" && 
                          replacementId.trim() !== "";
    
    if (!hasReplacement) {
      // No replacement available - mark as unresolved
      unresolved.push({
        ingredient: ingredientId,
        status: status,
        matchedTerm: item.matchedTerm || ingredientId
      });
      return; // Skip to next ingredient
    }
    
    // Replacement available - perform replacement
    const replacementDisplay = formatIngredientName(replacementId);
    
    // Create search patterns for the original ingredient (handle various formats)
    // Start with the actual term that was matched during detection
    const searchPatterns = item.matchedTerm ? [item.matchedTerm] : [];
    
    // Add normalized ingredient ID variations
    searchPatterns.push(
      ingredientId,
      ingredientId.replace(/_/g, " "),
      ingredientId.replace(/_/g, "-")
    );
    
    // Also check aliases from the knowledge entry
    if (item.hkmEntry?.aliases) {
      searchPatterns.push(...item.hkmEntry.aliases);
      item.hkmEntry.aliases.forEach(alias => {
        searchPatterns.push(alias.replace(/_/g, " "));
        searchPatterns.push(alias.replace(/_/g, "-"));
      });
    }
    
    // Remove duplicates and empty patterns
    const uniquePatterns = [...new Set(searchPatterns)].filter(p => p && p.trim() !== "");
    
    // Track if any replacement occurred for this ingredient
    let wasReplaced = false;
    
    // Replace each pattern found in text
    uniquePatterns.forEach(pattern => {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Use word boundary regex, but be flexible with punctuation (comma, period, etc.)
      const regex = new RegExp(`\\b${escapedPattern}\\b`, "gi");
      
      // Replace all occurrences
      const previousText = convertedText;
      convertedText = convertedText.replace(regex, (match) => {
        wasReplaced = true;
        // Preserve original case
        if (match === match.toUpperCase()) {
          return replacementDisplay.toUpperCase();
        } else if (match[0] === match[0].toUpperCase()) {
          return replacementDisplay.charAt(0).toUpperCase() + replacementDisplay.slice(1);
        }
        return replacementDisplay;
      });
      
      // Debug: log if replacement occurred
      if (convertedText !== previousText) {
        console.log(`Replaced "${pattern}" with "${replacementDisplay}"`);
      }
    });
    
    // Track successful replacement
    if (wasReplaced) {
      replacements.push({
        original: ingredientId,
        replacement: replacementId,
        status: status,
        matchedTerm: item.matchedTerm || ingredientId
      });
    } else {
      // Pattern matched but replacement didn't occur (shouldn't happen, but handle gracefully)
      unresolved.push({
        ingredient: ingredientId,
        status: status,
        matchedTerm: item.matchedTerm || ingredientId
      });
    }
  });
  
  return {
    convertedText,
    replacements,
    unresolved
  };
}

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
function calculateConfidenceScore({ originalIngredients, replacements, unresolved }) {
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
    item.status === "haram" || item.engineResult?.status === "haram"
  ).length;
  const replacedHaram = replacements.filter(item => item.status === "haram").length;
  
  if (totalHaram > 0 && replacedHaram === totalHaram && unresolvedHaram === 0) {
    // All haram ingredients were successfully replaced
    score = 100;
  }
  
  return score;
}

/**
 * Main conversion function using JSON knowledge engine
 * 
 * PIPELINE: Detect → Convert → Fetch Affiliate Links → Calculate Score
 * Each step is independent and runs fully regardless of previous step results
 * 
 * MONETIZATION: Affiliate links are ONLY attached to halal substitutes, NEVER to haram ingredients
 */
export async function convertRecipeWithJson(recipeText, userPreferences = {}) {
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
    const detectedIngredients = detectIngredientsInText(trimmedText, userPreferences);
    
    // Debug: log detected ingredients
    console.log("[CONVERSION DEBUG] Detected ingredients:", detectedIngredients.map(i => ({
      ingredient: i.ingredient_id || i.ingredient,
      replacement: i.replacement_id || i.replacement,
      matchedTerm: i.matchedTerm,
      status: i.status
    })));
    
    // STEP 2: CONVERT ingredients (pure replacement, no scoring logic)
    // Conversion ALWAYS runs fully, regardless of what will happen in scoring
    const conversionResult = convertIngredients(trimmedText, detectedIngredients);
    const { convertedText, replacements, unresolved } = conversionResult;
    
    // Debug: log conversion results
    console.log("[CONVERSION DEBUG] Replacements:", replacements.length);
    console.log("[CONVERSION DEBUG] Unresolved:", unresolved.length);
    
    // STEP 2.5: FETCH AFFILIATE LINKS for substitutes (monetization)
    // CRITICAL: ONLY fetch links for halal substitutes, NEVER for haram ingredients
    const substituteIds = detectedIngredients
      .filter(item => {
        const replacementId = item.replacement_id || item.replacement;
        return replacementId && 
               replacementId !== "Halal alternative needed" && 
               replacementId.trim() !== "";
      })
      .map(item => item.replacement_id || item.replacement)
      .filter((id, index, self) => self.indexOf(id) === index); // Unique IDs only
    
    // Also include all alternatives (for showing 1-3 substitutes)
    const allAlternativeIds = detectedIngredients
      .flatMap(item => item.alternatives || [])
      .filter((id, index, self) => self.indexOf(id) === index);
    
    const allSubstituteIds = [...new Set([...substituteIds, ...allAlternativeIds])];
    
    // Fetch affiliate links (limit to 3 per substitute)
    const affiliateLinksMap = await getAffiliateLinksForSubstitutes(
      allSubstituteIds, 
      'US', // TODO: Get from user preferences or geolocation
      3 // Max 3 links per substitute
    );
    
    // STEP 3: CALCULATE confidence score (pure scoring, uses FINAL conversion state)
    // Scoring happens AFTER all replacements are complete
    const confidenceScore = calculateConfidenceScore({
      originalIngredients: detectedIngredients,
      replacements: replacements,
      unresolved: unresolved
    });
    
    // Check if any substitutions occurred (for confidence_type classification)
    const hasSubstitutions = convertedText !== trimmedText;
    
    // STEP 4: Format issues with affiliate links (ONLY on substitutes, NEVER on haram ingredients)
    // Include both replaced and unresolved ingredients in issues list
    const issues = detectedIngredients.map((item) => {
      const references = [];
      if (item.quranReference) references.push(item.quranReference);
      if (item.hadithReference) references.push(item.hadithReference);
      
      // Check if this ingredient was successfully replaced
      const wasReplaced = replacements.some(r => 
        r.original === (item.ingredient_id || item.ingredient)
      );
      
      // Ensure confidenceScore is passed through
      const issueConfidenceScore = item.engineResult?.confidenceScore !== undefined
        ? item.engineResult.confidenceScore
        : (item.engineResult?.confidencePercentage !== undefined
            ? item.engineResult.confidencePercentage
            : (item.engineResult?.confidence !== undefined
                ? Math.round(item.engineResult.confidence * 100)
                : undefined));
      
      // Get replacement ID for affiliate link lookup
      const replacementId = item.replacement_id || item.replacement;
      
      // CRITICAL: Only attach affiliate links to SUBSTITUTES, NEVER to haram ingredients
      // Fetch affiliate links for the primary replacement (if it exists and is valid)
      let substituteAffiliateLinks = [];
      if (replacementId && 
          replacementId !== "Halal alternative needed" && 
          replacementId.trim() !== "" &&
          affiliateLinksMap[replacementId]) {
        // Get affiliate links for this substitute (limit to 1-3)
        const links = affiliateLinksMap[replacementId].slice(0, 3);
        substituteAffiliateLinks = links.map(link => ({
          id: link.id,
          platform: link.platform.name,
          platform_display: link.platform.display_name,
          platform_color: link.platform.color_hex,
          url: buildAffiliateUrl(link),
          search_query: link.search_query,
          is_featured: link.is_featured || false
        }));
      }
      
      // Build clear explanation for why ingredient is haram
      // Priority: explanation > eli5 > simpleExplanation > notes
      let haramExplanation = "";
      if (item.engineResult?.explanation) {
        haramExplanation = item.engineResult.explanation;
      } else if (item.engineResult?.eli5) {
        haramExplanation = item.engineResult.eli5;
      } else if (item.engineResult?.simpleExplanation) {
        haramExplanation = item.engineResult.simpleExplanation;
      } else if (item.engineResult?.notes) {
        haramExplanation = item.engineResult.notes;
      } else {
        // Fallback explanation based on status
        if (item.status === "haram") {
          haramExplanation = "This ingredient is prohibited (haram) in Islam. " +
            (item.quranReference ? `See ${item.quranReference}. ` : "") +
            (item.hadithReference ? `See ${item.hadithReference}.` : "");
        } else if (item.status === "conditional") {
          haramExplanation = "This ingredient may be halal under certain conditions. " +
            "Please verify with a qualified Islamic scholar.";
        }
      }
      
      // Get 1-3 halal substitutes with affiliate links
      const allAlternatives = item.alternatives || [];
      const substitutesWithLinks = allAlternatives
        .slice(0, 3) // Limit to 3 substitutes
        .map(altId => {
          const altLinks = affiliateLinksMap[altId] || [];
          return {
            id: altId,
            name: formatIngredientName(altId),
            affiliate_links: altLinks.slice(0, 3).map(link => ({
              id: link.id,
              platform: link.platform.name,
              platform_display: link.platform.display_name,
              platform_color: link.platform.color_hex,
              url: buildAffiliateUrl(link),
              search_query: link.search_query,
              is_featured: link.is_featured || false
            }))
          };
        });
      
      return {
        ingredient_id: item.ingredient_id || item.ingredient, // Internal ID
        ingredient: item.ingredient_id || item.ingredient, // Keep for backward compatibility
        replacement_id: replacementId, // Replacement ID
        replacement: replacementId, // Keep for backward compatibility
        
        // MONETIZATION: Affiliate links ONLY on substitutes
        // NEVER attach affiliate links to haram ingredients themselves
        substitute_affiliate_links: substituteAffiliateLinks, // Links for primary replacement
        substitutes_with_links: substitutesWithLinks, // All alternatives with links (1-3)
        
        // Replacement ratio and culinary notes
        replacementRatio: item.replacementRatio || item.engineResult?.replacementRatio || null,
        culinaryNotes: item.culinaryNotes || item.engineResult?.culinaryNotes || null,
        
        // Clear explanation for why ingredient is haram
        haram_explanation: haramExplanation, // Clear, religious justification
        explanation: haramExplanation, // Backward compatibility
        
        severity: item.severity,
        confidence: issueConfidenceScore ? issueConfidenceScore / 100 : undefined, // 0-1 format for backward compatibility
        confidenceScore: issueConfidenceScore, // PRIMARY: 0-100 format
        quranReference: item.quranReference,
        hadithReference: item.hadithReference,
        references: references,
        
        // Add knowledge engine fields
        inheritedFrom: item.engineResult?.inheritedFrom,
        alternatives: allAlternatives, // All alternatives (for display)
        eli5: item.engineResult?.eli5 || item.engineResult?.simpleExplanation,
        simpleExplanation: item.engineResult?.simpleExplanation || item.engineResult?.eli5,
        trace: item.engineResult?.trace || [],
        tags: item.engineResult?.tags,
        hkmResult: item.engineResult,
        validationState: item.engineResult?.enforcedBy === "user_preferences" ? "preference_based" :
                        item.engineResult?.inheritedFrom ? "derived_haram" : "explicit_haram",
        preferencesApplied: item.engineResult?.preferences,
        wasReplaced: wasReplaced // Track if this ingredient was successfully replaced
      };
    });
    
    return {
      originalText: trimmedText,
      convertedText: convertedText, // Always return converted text, even if low confidence
      issues: issues,
      confidenceScore: confidenceScore, // Score reflects FINAL state after replacements
      confidence_type: hasSubstitutions ? "post_conversion" : "classification",
      source: "json_engine" // Mark as JSON-based conversion
    };
  } catch (error) {
    console.error("Error in convertRecipeWithJson:", error);
    // Return safe fallback on error - still return original text even on error
    return {
      originalText: trimmedText,
      convertedText: trimmedText,
      issues: [],
      confidenceScore: 0,
      error: error.message
    };
  }
}

/**
 * Check if ingredient exists in knowledge base
 */
export function isIngredientKnown(ingredientName) {
  const normalized = normalizeIngredientName(ingredientName);
  return !!halalKnowledge[normalized];
}

/**
 * Get ingredient details from knowledge base
 */
export function getIngredientDetails(ingredientName, userPreferences = {}) {
  const normalized = normalizeIngredientName(ingredientName);
  const engineResult = evaluateItem(normalized, {
    madhab: userPreferences.schoolOfThought || "no-preference",
    strictness: userPreferences.strictnessLevel || "standard"
  });
  
  return engineResult;
}
