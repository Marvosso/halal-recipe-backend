/**
 * Ingredients Display Utilities
 * Uses nested ingredients.json for display/documentation while keeping
 * flat halal_knowledge.json for fast lookups
 */

import ingredientsNested from "../data/ingredients.json";
import halalKnowledgeFlat from "../data/halal_knowledge.json";

/**
 * Normalize ingredient name for lookup
 */
function normalizeIngredientName(name) {
  if (!name || typeof name !== "string") return "";
  return name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0_9]/g, "");
}

/**
 * Find ingredient in nested structure by name
 * Recursively searches through children
 */
function findInNested(ingredientName, rootIngredients = null) {
  const normalized = normalizeIngredientName(ingredientName);
  
  // Get root ingredients if not provided
  if (!rootIngredients) {
    rootIngredients = Object.values(ingredientsNested);
  }
  
  // Search in roots first
  for (const root of rootIngredients) {
    if (normalizeIngredientName(root.name) === normalized) {
      return root;
    }
    
    // Recursively search in children
    if (root.children && root.children.length > 0) {
      const found = findInNested(ingredientName, root.children);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Get full inheritance chain for an ingredient (from nested structure)
 * Returns array showing the path: [root, child1, child2, ...]
 */
export function getInheritanceChain(ingredientName) {
  const normalized = normalizeIngredientName(ingredientName);
  const chain = [];
  
  // Helper to find and build chain
  function buildChain(name, visited = new Set()) {
    if (visited.has(normalizeIngredientName(name))) return null;
    visited.add(normalizeIngredientName(name));
    
    const found = findInNested(name);
    if (!found) return null;
    
    chain.push({
      name: found.name,
      status: found.status,
      notes: found.notes,
      alternatives: found.halal_alternatives
    });
    
    // Check if this ingredient has a parent by searching in all roots
    const allRoots = Object.values(ingredientsNested);
    for (const root of allRoots) {
      if (isChildOf(root, name)) {
        // Recursively build chain up to root
        buildChain(root.name, visited);
        return true;
      }
    }
    
    return true;
  }
  
  // Helper to check if an ingredient is a child (directly or indirectly) of a root
  function isChildOf(parent, childName) {
    if (normalizeIngredientName(parent.name) === normalizeIngredientName(childName)) {
      return false; // Not a child of itself
    }
    
    if (parent.children && parent.children.length > 0) {
      for (const child of parent.children) {
        if (normalizeIngredientName(child.name) === normalizeIngredientName(childName)) {
          return true;
        }
        // Recursively check grandchildren
        if (isChildOf(child, childName)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  buildChain(ingredientName);
  return chain.reverse(); // Reverse to show root -> child order
}

/**
 * Get ingredient display information from nested structure
 * Falls back to flat structure if not found in nested
 */
export function getIngredientDisplayInfo(ingredientName) {
  const normalized = normalizeIngredientName(ingredientName);
  
  // Try nested structure first (better for display)
  let nested = findInNested(ingredientName);
  
  if (nested) {
    return {
      name: nested.name,
      status: nested.status,
      halalAlternatives: nested.halal_alternatives || [],
      flavorRole: nested.flavor_role || "",
      cuisine: nested.cuisine || "",
      notes: nested.notes || "",
      schoolOfThought: nested.school_of_thought || [],
      quranicReference: nested.quranic_reference || "",
      hadithReference: nested.hadith_reference || "",
      children: nested.children || [],
      source: "nested"
    };
  }
  
  // Fallback to flat structure
  const flat = halalKnowledgeFlat[normalized];
  if (flat) {
    const quranRef = flat.references?.find(r => 
      r.toLowerCase().includes("qur'an") || 
      r.toLowerCase().includes("quran") ||
      r.toLowerCase().includes("surah")
    ) || "";
    
    const hadithRef = flat.references?.find(r => 
      r.toLowerCase().includes("hadith") || 
      r.toLowerCase().includes("bukhari") || 
      r.toLowerCase().includes("muslim")
    ) || "";
    
    return {
      name: ingredientName,
      status: flat.status || "unknown",
      halalAlternatives: flat.alternatives || [],
      flavorRole: flat.flavor_role || "",
      cuisine: flat.cuisine || "",
      notes: flat.notes || "",
      schoolOfThought: ["Hanafi", "Shafi'i", "Maliki", "Hanbali"], // Default for flat
      quranicReference: quranRef,
      hadithReference: hadithRef,
      children: [], // Flat structure doesn't have nested children
      source: "flat",
      inheritance: flat.inheritance || []
    };
  }
  
  return null;
}

/**
 * Get all root ingredients (top-level in nested structure)
 * Useful for browsing/documentation
 */
export function getAllRootIngredients() {
  return Object.values(ingredientsNested).map(ing => ({
    name: ing.name,
    status: ing.status,
    childrenCount: ing.children?.length || 0
  }));
}

/**
 * Format inheritance chain for display
 * Returns formatted string like "Pork → Gelatin → Marshmallows → Lucky Charms"
 */
export function formatInheritanceChain(ingredientName) {
  const chain = getInheritanceChain(ingredientName);
  if (chain.length === 0) return ingredientName;
  
  return chain.map(item => item.name).join(" → ");
}

/**
 * Get nested children tree for display
 * Returns formatted tree structure
 */
export function getChildrenTree(ingredientName, maxDepth = 3) {
  const ingredient = findInNested(ingredientName);
  if (!ingredient) return null;
  
  function buildTree(ing, depth = 0) {
    if (depth > maxDepth) return null;
    
    return {
      name: ing.name,
      status: ing.status,
      alternatives: ing.halal_alternatives || [],
      notes: ing.notes || "",
      children: ing.children && ing.children.length > 0
        ? ing.children.map(child => buildTree(child, depth + 1)).filter(Boolean)
        : []
    };
  }
  
  return buildTree(ingredient);
}

/**
 * Check if ingredient is haram by traversing nested structure
 * Checks self and all children recursively
 */
export function isHaramInNested(ingredientName, userPreferences = {}) {
  const ingredient = findInNested(ingredientName);
  if (!ingredient) return null;
  
  // Check current ingredient
  if (ingredient.status === "haram") {
    return {
      isHaram: true,
      reason: ingredient.notes || "Marked as haram",
      source: ingredient.name,
      alternatives: ingredient.halal_alternatives
    };
  }
  
  // Check if any child is haram
  function checkChildren(ing) {
    if (ing.children && ing.children.length > 0) {
      for (const child of ing.children) {
        if (child.status === "haram") {
          return {
            isHaram: true,
            reason: `Contains ${child.name} (${child.status})`,
            source: child.name,
            alternatives: child.halal_alternatives
          };
        }
        
        // Recursively check grandchildren
        const childResult = checkChildren(child);
        if (childResult) return childResult;
      }
    }
    return null;
  }
  
  return checkChildren(ingredient);
}

/**
 * Get comprehensive ingredient info (combines nested + flat)
 * Best of both worlds for display
 */
export function getComprehensiveIngredientInfo(ingredientName, userPreferences = {}) {
  // Get from nested (better structure)
  const nested = getIngredientDisplayInfo(ingredientName);
  
  // Get inheritance chain
  const chain = getInheritanceChain(ingredientName);
  
  // Get flat structure for additional metadata (if available)
  const normalized = normalizeIngredientName(ingredientName);
  const flat = halalKnowledgeFlat[normalized];
  
  return {
    ...nested,
    inheritanceChain: chain,
    aliases: flat?.aliases || [],
    eli5: flat?.eli5 || nested?.notes || "",
    confidenceScore: flat?.confidence_score_base || 0.5,
    trace: chain.map(item => `${item.name} (${item.status})`)
  };
}
