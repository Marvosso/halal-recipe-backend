/**
 * Generate halal_knowledge_flat.json from nested_ingredients.json
 * Flattens the nested structure for fast lookups while preserving inheritance chains
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nestedPath = path.resolve(__dirname, "../src/data/nested_ingredients.json");
const flatPath = path.resolve(__dirname, "../src/data/halal_knowledge_flat.json");

console.log("Reading nested_ingredients.json...");
const nestedIngredients = JSON.parse(fs.readFileSync(nestedPath, "utf8"));

/**
 * Recursively resolve inheritance chain to get final ruling
 */
function resolveInheritanceChain(ingredientId, visited = new Set()) {
  if (visited.has(ingredientId)) {
    return null; // Circular reference
  }
  visited.add(ingredientId);

  const ingredient = nestedIngredients[ingredientId];
  if (!ingredient) {
    return null;
  }

  // If this ingredient has parents, resolve them first
  if (ingredient.derivedFrom && ingredient.derivedFrom.length > 0) {
    const parentRulings = {};
    let inheritedHaramSource = null;
    
    // Check all parents
    for (const parentId of ingredient.derivedFrom) {
      const parentResolved = resolveInheritanceChain(parentId, new Set(visited));
      if (parentResolved) {
        // Merge parent rulings (haram > questionable > conditional > halal)
        for (const [madhab, ruling] of Object.entries(parentResolved.finalRulings)) {
          const currentRuling = parentRulings[madhab] || ingredient.rulings?.[madhab] || ingredient.rulings?.default || "unknown";
          // Priority: haram > questionable > conditional > halal > unknown
          if (ruling === "haram" || currentRuling === "haram") {
            parentRulings[madhab] = "haram";
            if (!inheritedHaramSource) {
              inheritedHaramSource = parentId;
            }
          } else if (ruling === "questionable" || currentRuling === "questionable") {
            if (parentRulings[madhab] !== "haram") {
              parentRulings[madhab] = "questionable";
            }
          } else if (ruling === "conditional" || currentRuling === "conditional") {
            if (parentRulings[madhab] !== "haram" && parentRulings[madhab] !== "questionable") {
              parentRulings[madhab] = "conditional";
            }
          }
        }
      }
    }

    // Use parent rulings if they override ingredient's own ruling
    const finalRulings = {};
    for (const madhab of ["default", "hanafi", "shafii", "maliki", "hanbali"]) {
      if (parentRulings[madhab] && parentRulings[madhab] === "haram") {
        finalRulings[madhab] = "haram"; // Parent haram overrides
      } else {
        finalRulings[madhab] = ingredient.rulings?.[madhab] || ingredient.rulings?.default || "unknown";
      }
    }

    return {
      ...ingredient,
      finalRulings,
      inheritedHaramSource
    };
  }

  // No parents, use own rulings
  return {
    ...ingredient,
    finalRulings: ingredient.rulings || { default: "unknown" },
    inheritedHaramSource: null
  };
}

/**
 * Generate flat structure from nested
 */
function generateFlatStructure() {
  const flat = {};

  for (const [ingredientId, ingredient] of Object.entries(nestedIngredients)) {
    const resolved = resolveInheritanceChain(ingredientId);
    
    if (!resolved) continue;

    // Build inheritance chain
    const inheritanceChain = [];
    function buildChain(id, visited = new Set()) {
      if (visited.has(id)) return;
      visited.add(id);
      
      const ing = nestedIngredients[id];
      if (ing?.derivedFrom && ing.derivedFrom.length > 0) {
        for (const parentId of ing.derivedFrom) {
          inheritanceChain.push(parentId);
          buildChain(parentId, visited);
        }
      }
    }
    buildChain(ingredientId);

    // Determine base status (use default ruling)
    const baseStatus = resolved.finalRulings.default || "unknown";
    
    // Map to legacy status format
    let status;
    if (baseStatus === "haram") {
      status = "haram";
    } else if (baseStatus === "questionable") {
      status = "conditional"; // Map questionable to conditional for backward compatibility
    } else if (baseStatus === "conditional") {
      status = "conditional";
    } else if (baseStatus === "halal") {
      status = "halal";
    } else {
      status = "unknown";
    }

    // Calculate confidence score base from confidenceImpact
    let confidence_score_base = 1.0;
    if (resolved.confidenceImpact < 0) {
      confidence_score_base = Math.max(0.1, 1.0 + (resolved.confidenceImpact / 100));
    }

    // Create flat entry
    flat[ingredientId] = {
      status,
      inheritance: inheritanceChain,
      alternatives: resolved.alternatives || [],
      notes: resolved.notes || "",
      references: resolved.references || [],
      aliases: resolved.aliases || [],
      confidence_score_base,
      eli5: resolved.notes || "",
      category: resolved.category || "",
      // Store rulings for strictness/madhab evaluation
      rulings: resolved.finalRulings,
      // Store display name
      displayName: resolved.displayName || ingredientId,
      // Store inherited haram source for trace
      inheritedHaramSource: resolved.inheritedHaramSource || null,
      // Store confidence impact for scoring
      confidenceImpact: resolved.confidenceImpact || 0
    };
  }

  return flat;
}

console.log("Generating flat structure...");
const flatStructure = generateFlatStructure();

console.log(`Generated ${Object.keys(flatStructure).length} flat entries`);
console.log("Writing halal_knowledge_flat.json...");
fs.writeFileSync(flatPath, JSON.stringify(flatStructure, null, 2), "utf8");

console.log("✅ Successfully generated halal_knowledge_flat.json");
