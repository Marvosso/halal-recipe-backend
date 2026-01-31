/**
 * Backend Halal Knowledge Engine
 * Evaluates ingredients using JSON knowledge base with inheritance chains
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { HALAL_RULES } from "./halalRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON knowledge base
const jsonFilePath = path.resolve(__dirname, "../data/halal_knowledge.json");

// Cache for parsed JSON data
let halalKnowledge = null;

/**
 * Load JSON knowledge base into memory
 * Uses caching to avoid re-reading file on every request
 */
const loadHalalKnowledge = () => {
  if (halalKnowledge !== null) {
    return halalKnowledge;
  }

  try {
    const fileContent = fs.readFileSync(jsonFilePath, "utf8");
    halalKnowledge = JSON.parse(fileContent);
    return halalKnowledge;
  } catch (error) {
    console.error("Error loading halal knowledge from JSON:", error);
    halalKnowledge = {};
    return halalKnowledge;
  }
};

/**
 * Normalize ingredient name for lookup
 */
function normalizeIngredientName(name) {
  if (!name || typeof name !== "string") return "";
  return name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0_9]/g, "");
}

/**
 * Resolve inheritance chain for an ingredient
 * Returns the final haram source if any, or null if halal
 */
function resolveInheritance(ingredientName, visited = new Set()) {
  const normalized = normalizeIngredientName(ingredientName);
  
  // Prevent circular references
  if (visited.has(normalized)) {
    return null;
  }
  visited.add(normalized);

  const knowledge = loadHalalKnowledge();
  const entry = knowledge[normalized];

  // Check aliases if direct lookup fails
  if (!entry) {
    for (const [key, value] of Object.entries(knowledge)) {
      if (value.aliases && Array.isArray(value.aliases) && value.aliases.includes(normalized)) {
        // Found via alias, use main entry
        const mainEntry = knowledge[key];
        if (mainEntry && mainEntry.status === "haram") {
          return key; // Return main ingredient name
        }
        // Check inheritance of main entry
        if (mainEntry && mainEntry.inheritance && mainEntry.inheritance.length > 0) {
          for (const parent of mainEntry.inheritance) {
            const haramSource = resolveInheritance(parent, new Set(visited));
            if (haramSource) return haramSource;
          }
        }
        return null;
      }
    }
    return null; // Not found
  }

  // If entry is haram, return it as the source
  if (entry.status === "haram") {
    return normalized;
  }

  // Recursively check inheritance chain
  if (entry.inheritance && Array.isArray(entry.inheritance) && entry.inheritance.length > 0) {
    for (const parent of entry.inheritance) {
      const haramSource = resolveInheritance(parent, new Set(visited));
      if (haramSource) return haramSource;
    }
  }

  return null;
}

/**
 * Get ingredient details from knowledge base
 * Returns full entry with inheritance resolved
 */
export function getIngredientDetails(ingredientName, userPreferences = {}) {
  const normalized = normalizeIngredientName(ingredientName);
  const knowledge = loadHalalKnowledge();
  
  // Direct lookup
  let entry = knowledge[normalized];
  let mainKey = normalized;

  // Check aliases if direct lookup fails
  if (!entry) {
    for (const [key, value] of Object.entries(knowledge)) {
      if (value.aliases && Array.isArray(value.aliases) && value.aliases.includes(normalized)) {
        entry = value;
        mainKey = key;
        break;
      }
    }
  }

  if (!entry) {
    return null; // Unknown ingredient
  }

  // Resolve inheritance chain
  const haramSource = resolveInheritance(normalized, new Set());
  
  // Build trace for explainability
  const trace = [];
  if (entry.inheritance && entry.inheritance.length > 0) {
    trace.push(`${normalized} inherits from ${entry.inheritance.join(", ")}`);
    if (haramSource) {
      trace.push(`Ultimate source: ${haramSource} (haram)`);
    }
  } else if (entry.status === "haram") {
    trace.push(`${normalized} is explicitly haram`);
  }

  // Infer tags from entry if not already set
  const tags = entry.tags || [];
  if (!tags || tags.length === 0) {
    // Infer tags based on item properties
    if (entry.category === "animal-derived" || normalized === "gelatin") {
      tags.push("gelatin_unknown");
    }
    if (normalized.includes("vanilla") || normalized.includes("extract")) {
      tags.push("alcohol_trace");
    }
    if (normalized.includes("shellfish") || normalized.includes("shrimp") || normalized.includes("lobster")) {
      tags.push("seafood_shellfish");
    }
  }

  // Apply school of thought and strictness rules using HALAL_RULES
  let adjustedStatus = entry.status;
  const madhab = userPreferences.schoolOfThought || userPreferences.madhab || "no-preference";
  const strictness = userPreferences.strictnessLevel || userPreferences.strictness || "standard";

  // Apply preference-based rules (only if status is conditional/unknown)
  if (adjustedStatus === "conditional" || adjustedStatus === "unknown") {
    // Apply strictness rules
    if (tags.includes("gelatin_unknown") && HALAL_RULES.strictness[strictness]?.gelatin_unknown) {
      const ruleStatus = HALAL_RULES.strictness[strictness].gelatin_unknown;
      if (ruleStatus !== "conditional") {
        adjustedStatus = ruleStatus === "questionable" ? "conditional" : ruleStatus;
        if (ruleStatus === "questionable") adjustedStatus = "conditional";
      }
    }

    if (tags.includes("alcohol_trace") && HALAL_RULES.strictness[strictness]?.alcohol_trace) {
      const ruleStatus = HALAL_RULES.strictness[strictness].alcohol_trace;
      if (ruleStatus !== "conditional") {
        adjustedStatus = ruleStatus === "questionable" ? "conditional" : ruleStatus;
        if (ruleStatus === "questionable") adjustedStatus = "conditional";
      }
    }

    // Apply madhab rules (only if madhab is specified)
    if (madhab !== "no-preference" && tags.includes("seafood_shellfish") && HALAL_RULES.madhab[madhab]?.seafood_shellfish) {
      const ruleStatus = HALAL_RULES.madhab[madhab].seafood_shellfish;
      adjustedStatus = ruleStatus;
    }
  }

  return {
    name: normalized,
    displayName: ingredientName,
    status: adjustedStatus,
    originalStatus: entry.status,
    alternatives: entry.alternatives || [],
    notes: entry.notes || "",
    eli5: entry.eli5 || "",
    references: entry.references || [],
    inheritedFrom: haramSource,
    trace: trace,
    severity: entry.confidence_score_base === 0.1 ? "high" :
             entry.confidence_score_base === 0.5 ? "medium" : "low",
    confidenceScore: entry.confidence_score_base || 0.5,
    quranReference: entry.references?.find(r => r.toLowerCase().includes("qur'an") || r.toLowerCase().includes("quran")) || "",
    hadithReference: entry.references?.find(r => r.toLowerCase().includes("hadith") || r.toLowerCase().includes("bukhari") || r.toLowerCase().includes("muslim")) || ""
  };
}

/**
 * Build all ingredient names and aliases for detection
 */
export function buildIngredientLookup() {
  const knowledge = loadHalalKnowledge();
  const lookup = [];

  for (const [key, entry] of Object.entries(knowledge)) {
    const allNames = [key, ...(entry.aliases || [])];
    
    allNames.forEach(name => {
      lookup.push({
        searchTerm: name.toLowerCase().replace(/_/g, " "),
        normalizedKey: key,
        entry: entry
      });
    });
  }

  return lookup;
}
