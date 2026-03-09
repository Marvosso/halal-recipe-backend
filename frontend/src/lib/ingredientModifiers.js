/**
 * Ingredient Modifier Detection
 * Detects and classifies modifiers in ingredient names
 *
 * Two systems:
 * 1. Status-override modifiers: halal-certified, plant-based, bovine, pork, alcohol
 *    - Parse input into base ingredient + modifiers; rules override or adjust base status.
 *    - e.g. gelatin → usually haram; halal-certified gelatin → halal; bovine gelatin → conditional.
 * 2. Haram/conditional/processing modifiers: legacy list for ingredients that are
 *    inherently haram when present (pork, alcohol, etc.) or add conditions.
 */

// ---------------------------------------------------------------------------
// Status-override modifier rule system (base + modifiers → final status)
// ---------------------------------------------------------------------------

/** Priority: higher = applied first when resolving override. Haram wins over halal when both present. */
const OVERRIDE_PRIORITY = { haram: 3, conditional: 2, halal: 1 };

/**
 * Status-override modifiers: source/type modifiers that override or adjust base status.
 * Used for inputs like "bovine gelatin", "halal-certified gelatin", "plant-based gelatin".
 */
export const STATUS_OVERRIDE_MODIFIERS = {
  halal_certified: {
    status: "halal",
    priority: OVERRIDE_PRIORITY.halal,
    explanation: "Halal-certified product; verified permissible.",
    patterns: ["halal_certified", "halal certified", "certified_halal", "certified halal"],
  },
  plant_based: {
    status: "halal",
    priority: OVERRIDE_PRIORITY.halal,
    explanation: "Plant-based source; no animal-derived ingredient.",
    patterns: ["plant_based", "plant based", "plantbased"],
  },
  bovine: {
    status: "conditional",
    priority: OVERRIDE_PRIORITY.conditional,
    explanation: "Bovine (cattle) source; permissible if from halal-slaughtered cattle. Verify certification.",
    patterns: ["bovine", "beef", "cattle"],
  },
  pork: {
    status: "haram",
    priority: OVERRIDE_PRIORITY.haram,
    explanation: "Pork-derived; not permissible.",
    patterns: ["pork", "pig"],
  },
  alcohol: {
    status: "haram",
    priority: OVERRIDE_PRIORITY.haram,
    explanation: "Contains alcohol; not permissible.",
    patterns: ["alcohol", "alcoholic", "wine", "ethanol", "liqueur", "brandy", "rum", "vodka"],
  },
};

/** Per key: list of token arrays to match (e.g. pork → [["pork"], ["pig"]]) */
const STATUS_OVERRIDE_TOKEN_LISTS = (() => {
  const out = [];
  for (const [key, config] of Object.entries(STATUS_OVERRIDE_MODIFIERS)) {
    const lists = [];
    for (const p of config.patterns) {
      const tokens = p.toLowerCase().replace(/-/g, "_").split("_").filter(Boolean);
      if (tokens.length) lists.push(tokens);
    }
    out.push({ key, lists });
  }
  return out;
})();

/**
 * Parse user input into base ingredient and status-override modifiers.
 * Tokenizes by underscore/hyphen and matches modifier phrases (1–2 tokens); remainder is base.
 * @param {string} ingredientId - Normalized ingredient id (lowercase, spaces → underscores)
 * @returns {{ base: string, statusModifiers: string[], raw: string }}
 */
export function parseIngredientWithModifiers(ingredientId) {
  const raw = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  const tokens = raw.split(/[_\-\s]+/).filter(Boolean);
  const statusModifiers = [];
  const used = new Set();

  for (let i = 0; i < tokens.length; i++) {
    for (const { key, lists } of STATUS_OVERRIDE_TOKEN_LISTS) {
      if (statusModifiers.includes(key)) continue;
      for (const patternTokens of lists) {
        const len = patternTokens.length;
        const slice = tokens.slice(i, i + len);
        if (slice.length !== len) continue;
        const match = patternTokens.every((t, j) => slice[j] === t);
        if (match) {
          statusModifiers.push(key);
          for (let j = 0; j < len; j++) used.add(i + j);
          break;
        }
      }
    }
  }

  const baseTokens = tokens.filter((_, idx) => !used.has(idx));
  const base = baseTokens.length ? baseTokens.join("_") : raw;
  return { base: base || raw, statusModifiers, raw };
}

/**
 * Get override status from list of status-modifier keys. Haram wins over halal.
 * @param {string[]} statusModifiers - Keys from STATUS_OVERRIDE_MODIFIERS
 * @returns {{ status: string, explanation?: string } | null}
 */
export function getModifierOverrideStatus(statusModifiers) {
  if (!statusModifiers || statusModifiers.length === 0) return null;
  let chosen = null;
  for (const key of statusModifiers) {
    const config = STATUS_OVERRIDE_MODIFIERS[key];
    if (!config) continue;
    if (!chosen || config.priority > chosen.priority) {
      chosen = config;
    }
  }
  return chosen ? { status: chosen.status, explanation: chosen.explanation } : null;
}

/**
 * Haram modifiers that override base ingredient status when present as source/type.
 * Does NOT include "gelatin" alone—gelatin is a base ingredient evaluated separately.
 */
const HARAM_MODIFIERS = [
  "wine",
  "alcohol",
  "alcoholic",
  "beer",
  "whiskey",
  "rum",
  "vodka",
  "brandy",
  "sherry",
  "port",
  "vermouth",
  "liqueur",
  "cognac",
  "champagne",
  "ethanol",
  "ethyl_alcohol",
  "grain_alcohol",
  "pork",
  "bacon",
  "lard",
  "ham",
  "prosciutto",
  "pancetta",
  "pepperoni",
  "sausage_pork",
  "pork_fat",
  "rendered_pork",
  "pork_belly",
  "gelatin_pork",
  "pork_gelatin",
  "animal_gelatin",
  "non_halal",
  "non_halal_meat",
  "unslaughtered",
];

/**
 * Conditional modifiers that require verification
 * These don't override status but add conditions and reduce confidence
 */
const CONDITIONAL_MODIFIERS = {
  enzyme: {
    level: 'conditional',
    explanation: 'Enzymes may be derived from animal or microbial sources. Animal-derived enzymes require halal certification. Check the enzyme source.',
    requiresVerification: true,
    confidenceReduction: 15
  },
  rennet: {
    level: 'conditional',
    explanation: 'Rennet is used in cheese making and may be animal-derived (requires halal certification) or microbial (generally halal). Check the rennet source.',
    requiresVerification: true,
    confidenceReduction: 20
  },
  emulsifier: {
    level: 'conditional',
    explanation: 'Emulsifiers may be derived from animal or plant sources. Animal-derived emulsifiers require halal certification. Check the emulsifier source and type.',
    requiresVerification: true,
    confidenceReduction: 15
  },
  flavoring: {
    level: 'conditional',
    explanation: 'Flavorings may contain alcohol-based extracts or animal-derived ingredients. Check the flavoring source and ingredients.',
    requiresVerification: true,
    confidenceReduction: 15
  },
  flavor: {
    level: 'conditional',
    explanation: 'Flavors may contain alcohol-based extracts or animal-derived ingredients. Check the flavor source and ingredients.',
    requiresVerification: true,
    confidenceReduction: 15
  },
  natural_flavor: {
    level: 'conditional',
    explanation: 'Natural flavors may be derived from animal or plant sources. Check the flavor source.',
    requiresVerification: true,
    confidenceReduction: 10
  },
  artificial_flavor: {
    level: 'conditional',
    explanation: 'Artificial flavors are generally halal but may contain alcohol-based solvents. Check the ingredient list.',
    requiresVerification: true,
    confidenceReduction: 10
  },
  lecithin: {
    level: 'conditional',
    explanation: 'Lecithin may be derived from soy (halal) or eggs (requires halal certification). Check the lecithin source.',
    requiresVerification: true,
    confidenceReduction: 10
  },
  mono_glyceride: {
    level: 'conditional',
    explanation: 'Mono- and diglycerides may be derived from animal or plant sources. Check the source.',
    requiresVerification: true,
    confidenceReduction: 15
  },
  diglyceride: {
    level: 'conditional',
    explanation: 'Mono- and diglycerides may be derived from animal or plant sources. Check the source.',
    requiresVerification: true,
    confidenceReduction: 15
  },
  whey: {
    level: 'conditional',
    explanation: 'Whey is derived from milk and requires halal certification. Check that the source milk is halal.',
    requiresVerification: true,
    confidenceReduction: 15
  },
  casein: {
    level: 'conditional',
    explanation: 'Casein is derived from milk and requires halal certification. Check that the source milk is halal.',
    requiresVerification: true,
    confidenceReduction: 15
  }
};

/**
 * Processing modifiers that may affect status but don't override base
 * These indicate processing methods that may require verification
 */
const PROCESSING_MODIFIERS = {
  // Cooking methods
  fried: {
    level: 'conditional',
    explanation: 'Fried items may use non-halal oils or cross-contamination. Verify cooking method and oil source.',
    requiresVerification: true
  },
  flavored: {
    level: 'conditional',
    explanation: 'Flavored items may contain alcohol-based flavorings or non-halal additives. Check ingredient list.',
    requiresVerification: true
  },
  fermented: {
    level: 'conditional',
    explanation: 'Fermented items may contain alcohol. Verify fermentation process and alcohol content.',
    requiresVerification: true
  },
  marinated: {
    level: 'conditional',
    explanation: 'Marinated items may contain wine, alcohol, or non-halal ingredients. Check marinade ingredients.',
    requiresVerification: true
  },
  smoked: {
    level: 'conditional',
    explanation: 'Smoked items may use non-halal smoking agents. Verify smoking method.',
    requiresVerification: true
  },
  cured: {
    level: 'conditional',
    explanation: 'Cured items may contain non-halal curing agents. Check curing ingredients.',
    requiresVerification: true
  },
  brined: {
    level: 'conditional',
    explanation: 'Brined items may contain non-halal brine ingredients. Verify brine composition.',
    requiresVerification: true
  },
  glazed: {
    level: 'conditional',
    explanation: 'Glazed items may contain alcohol or non-halal ingredients. Check glaze ingredients.',
    requiresVerification: true
  },
  seasoned: {
    level: 'conditional',
    explanation: 'Seasoned items may contain non-halal seasonings. Check seasoning blend ingredients.',
    requiresVerification: true
  },
  spiced: {
    level: 'conditional',
    explanation: 'Spiced items may contain non-halal spice blends. Verify spice ingredients.',
    requiresVerification: true
  },
  braised: {
    level: 'conditional',
    explanation: 'Braised items may use wine or alcohol in cooking liquid. Verify braising liquid.',
    requiresVerification: true
  },
  sauteed: {
    level: 'conditional',
    explanation: 'Sautéed items may use wine or non-halal oils. Verify cooking method and ingredients.',
    requiresVerification: true
  },
  pickled: {
    level: 'conditional',
    explanation: 'Pickled items may contain alcohol in pickling solution. Check pickling ingredients.',
    requiresVerification: true
  },
  preserved: {
    level: 'conditional',
    explanation: 'Preserved items may contain non-halal preservatives. Verify preservation method.',
    requiresVerification: true
  }
};

/**
 * Neutral modifiers that don't affect halal status
 * These are descriptive terms that don't change the ingredient's status
 */
const NEUTRAL_MODIFIERS = [
  'fresh', 'dried', 'frozen', 'canned', 'organic', 'raw', 'cooked', 'boiled',
  'steamed', 'baked', 'roasted', 'grilled', 'whole', 'chopped', 'sliced',
  'diced', 'minced', 'ground', 'pureed', 'mashed', 'crushed', 'whole_grain',
  'brown', 'white', 'red', 'green', 'yellow', 'black', 'wild', 'cultivated'
];

/**
 * Extract modifiers from ingredient name
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {Object} Modifier detection result
 */
export function detectModifiers(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  const parts = normalized.split(/[_\-\s]+/);
  
  const detected = {
    haramModifiers: [],
    conditionalModifiers: [],
    processingModifiers: [],
    neutralModifiers: [],
    hasHaramModifier: false,
    hasConditionalModifier: false,
    hasProcessingModifier: false,
    hasNeutralModifier: false
  };
  
  // Check each part for modifiers
  for (const part of parts) {
    // Check for haram modifiers
    const haramMatch = HARAM_MODIFIERS.find(modifier => 
      part.includes(modifier) || modifier.includes(part)
    );
    if (haramMatch && !detected.haramModifiers.includes(haramMatch)) {
      detected.haramModifiers.push(haramMatch);
      detected.hasHaramModifier = true;
    }
    
    // Check for conditional modifiers
    if (CONDITIONAL_MODIFIERS[part]) {
      if (!detected.conditionalModifiers.find(m => m.type === part)) {
        detected.conditionalModifiers.push({
          type: part,
          ...CONDITIONAL_MODIFIERS[part]
        });
        detected.hasConditionalModifier = true;
      }
    }
    
    // Check for processing modifiers
    if (PROCESSING_MODIFIERS[part]) {
      if (!detected.processingModifiers.find(m => m.type === part)) {
        detected.processingModifiers.push({
          type: part,
          ...PROCESSING_MODIFIERS[part]
        });
        detected.hasProcessingModifier = true;
      }
    }
    
    // Check for neutral modifiers
    if (NEUTRAL_MODIFIERS.includes(part)) {
      if (!detected.neutralModifiers.includes(part)) {
        detected.neutralModifiers.push(part);
        detected.hasNeutralModifier = true;
      }
    }
  }
  
  // Also check for compound haram modifiers (e.g., "wine-braised", "pork-flavored")
  const compoundHaramPatterns = [
    /wine[_\-\s]+(braised|marinated|glazed|sauce|reduction|infused)/i,
    /alcohol[_\-\s]+(based|flavored|infused|extract)/i,
    /pork[_\-\s]+(flavored|seasoned|based|fat|gelatin)/i,
    /bacon[_\-\s]+(flavored|seasoned|bits|fat)/i,
    /lard[_\-\s]+(based|rendered)/i,
    /gelatin[_\-\s]+(pork|animal|non_halal)/i
  ];
  
  // Check for compound conditional modifiers
  const compoundConditionalPatterns = [
    /animal[_\-\s]+(enzyme|rennet|gelatin)/i,
    /pork[_\-\s]+(enzyme|rennet)/i,
    /microbial[_\-\s]+(enzyme|rennet)/i,
    /plant[_\-\s]+(enzyme|rennet)/i
  ];
  
  for (const pattern of compoundHaramPatterns) {
    if (pattern.test(normalized)) {
      const match = normalized.match(pattern);
      if (match) {
        const modifier = match[0].replace(/[_\-\s]+/g, '_');
        if (!detected.haramModifiers.includes(modifier)) {
          detected.haramModifiers.push(modifier);
          detected.hasHaramModifier = true;
        }
      }
    }
  }
  
  // Check for compound conditional modifiers
  for (const pattern of compoundConditionalPatterns) {
    if (pattern.test(normalized)) {
      const match = normalized.match(pattern);
      if (match) {
        const modifier = match[0].replace(/[_\-\s]+/g, '_');
        // Determine if it's haram or conditional based on source
        if (modifier.includes('pork') || modifier.includes('animal')) {
          // Animal/pork source = haram
          if (!detected.haramModifiers.includes(modifier)) {
            detected.haramModifiers.push(modifier);
            detected.hasHaramModifier = true;
          }
        } else {
          // Microbial/plant source = conditional
          const baseType = modifier.includes('enzyme') ? 'enzyme' : 'rennet';
          if (!detected.conditionalModifiers.find(m => m.type === baseType)) {
            detected.conditionalModifiers.push({
              type: baseType,
              ...CONDITIONAL_MODIFIERS[baseType],
              source: modifier.includes('microbial') ? 'microbial' : 'plant'
            });
            detected.hasConditionalModifier = true;
          }
        }
      }
    }
  }
  
  return detected;
}

/**
 * Apply modifier logic to ingredient evaluation
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {Object} baseResult - Base ingredient evaluation result
 * @param {Object} modifierDetection - Result from detectModifiers()
 * @returns {Object} Modified evaluation result
 */
export function applyModifierLogic(ingredientId, baseResult, modifierDetection) {
  // If haram modifier detected, override to haram (MUST override even if base is halal)
  if (modifierDetection.hasHaramModifier) {
    const haramModifier = modifierDetection.haramModifiers[0];
    let explanation = `This ingredient contains ${haramModifier.replace(/_/g, ' ')}, which is haram.`;
    
    // Specific explanations for common haram modifiers
    if (haramModifier.includes('wine') || haramModifier.includes('alcohol') || haramModifier.includes('ethanol')) {
      explanation = `This ingredient contains alcohol (${haramModifier.replace(/_/g, ' ')}), which is haram according to Islamic law. The Qur'an explicitly prohibits intoxicants (Qur'an 5:90).`;
    } else if (haramModifier.includes('pork') || haramModifier.includes('bacon') || haramModifier.includes('lard')) {
      explanation = `This ingredient contains pork or pork-derived products (${haramModifier.replace(/_/g, ' ')}), which is haram. Pork is explicitly prohibited in the Qur'an (Qur'an 2:173).`;
    } else if (haramModifier.includes('gelatin')) {
      explanation = `This ingredient contains gelatin, which is typically derived from pork or non-halal animals. Unless specifically halal-certified, gelatin is considered haram.`;
    }
    
    return {
      ...baseResult,
      status: 'haram',
      confidenceLevel: 'haram',
      confidenceScore: 0,
      confidence: 0,
      confidencePercentage: 0,
      explanation: explanation,
      simpleExplanation: `Contains ${haramModifier.replace(/_/g, ' ')}, which is haram.`,
      isHaramModifierOverride: true,
      haramModifiers: modifierDetection.haramModifiers,
      trace: [...(baseResult.trace || []), `Haram modifier detected: ${haramModifier} (overrides base ingredient)`]
    };
  }
  
  // If conditional modifier detected, add conditional note and reduce confidence
  if (modifierDetection.hasConditionalModifier) {
    const conditionalModifier = modifierDetection.conditionalModifiers[0];
    const baseStatus = baseResult.status || 'unknown';
    const confidenceReduction = conditionalModifier.confidenceReduction || 15;
    
    // If base is halal, add conditional note
    if (baseStatus === 'halal') {
      return {
        ...baseResult,
        status: 'conditional',
        confidenceLevel: 'conditional',
        confidenceScore: Math.max(60, (baseResult.confidenceScore || 100) - confidenceReduction),
        confidence: Math.max(0.6, (baseResult.confidence || 1.0) - (confidenceReduction / 100)),
        confidencePercentage: Math.max(60, (baseResult.confidencePercentage || 100) - confidenceReduction),
        explanation: `${baseResult.explanation || 'Base ingredient is halal.'} However, ${conditionalModifier.explanation}`,
        simpleExplanation: `Base ingredient is halal, but ${conditionalModifier.explanation.toLowerCase()}`,
        conditionalModifiers: modifierDetection.conditionalModifiers,
        requiresVerification: true,
        trace: [...(baseResult.trace || []), `Conditional modifier detected: ${conditionalModifier.type}`]
      };
    }
    
    // If base is not halal, keep base status but add conditional note
    return {
      ...baseResult,
      conditionalModifiers: modifierDetection.conditionalModifiers,
      requiresVerification: conditionalModifier.requiresVerification,
      trace: [...(baseResult.trace || []), `Conditional modifier detected: ${conditionalModifier.type}`]
    };
  }
  
  // If processing modifier detected, add conditional note but keep base status
  if (modifierDetection.hasProcessingModifier) {
    const processingModifier = modifierDetection.processingModifiers[0];
    const baseStatus = baseResult.status || 'unknown';
    
    // If base is halal, add conditional note
    if (baseStatus === 'halal') {
      return {
        ...baseResult,
        status: 'conditional',
        confidenceLevel: 'conditional',
        confidenceScore: Math.max(60, (baseResult.confidenceScore || 100) - 20),
        confidence: Math.max(0.6, (baseResult.confidence || 1.0) - 0.2),
        confidencePercentage: Math.max(60, (baseResult.confidencePercentage || 100) - 20),
        explanation: `${baseResult.explanation || 'Base ingredient is halal.'} However, ${processingModifier.explanation}`,
        simpleExplanation: `Base ingredient is halal, but ${processingModifier.explanation.toLowerCase()}`,
        processingModifiers: modifierDetection.processingModifiers,
        requiresVerification: true,
        trace: [...(baseResult.trace || []), `Processing modifier detected: ${processingModifier.type}`]
      };
    }
    
    // If base is not halal, keep base status but add processing note
    return {
      ...baseResult,
      processingModifiers: modifierDetection.processingModifiers,
      requiresVerification: processingModifier.requiresVerification,
      trace: [...(baseResult.trace || []), `Processing modifier detected: ${processingModifier.type}`]
    };
  }
  
  // No modifiers affecting status, return base result
  return baseResult;
}

/**
 * Extract base ingredient from modified ingredient name
 * Removes modifiers to get the core ingredient
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {string} Base ingredient ID
 */
export function extractBaseIngredient(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  let base = normalized;
  
  // Remove haram modifiers
  for (const modifier of HARAM_MODIFIERS) {
    base = base.replace(new RegExp(`[_\-\s]*${modifier}[_\-\s]*`, 'gi'), '');
  }
  
  // Remove processing modifiers
  for (const modifier of Object.keys(PROCESSING_MODIFIERS)) {
    base = base.replace(new RegExp(`[_\-\s]*${modifier}[_\-\s]*`, 'gi'), '');
  }
  
  // Remove neutral modifiers
  for (const modifier of NEUTRAL_MODIFIERS) {
    base = base.replace(new RegExp(`[_\-\s]*${modifier}[_\-\s]*`, 'gi'), '');
  }
  
  // Clean up multiple underscores and dashes
  base = base.replace(/[_\-\s]+/g, '_').replace(/^_+|_+$/g, '');
  
  return base || normalized; // Return original if nothing left
}

/**
 * Detect ingredient variants
 * Identifies common ingredient variants (e.g., "rice_flour" is a variant of "rice")
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {Object} Variant detection result
 */
export function detectVariants(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  const variants = {
    isVariant: false,
    baseIngredient: null,
    variantType: null,
    variantModifiers: []
  };
  
  // Common variant patterns
  const variantPatterns = [
    { pattern: /(.+)_flour$/, type: 'flour', base: (match) => match[1] },
    { pattern: /(.+)_starch$/, type: 'starch', base: (match) => match[1] },
    { pattern: /(.+)_oil$/, type: 'oil', base: (match) => match[1] },
    { pattern: /(.+)_paste$/, type: 'paste', base: (match) => match[1] },
    { pattern: /(.+)_sauce$/, type: 'sauce', base: (match) => match[1] },
    { pattern: /(.+)_juice$/, type: 'juice', base: (match) => match[1] },
    { pattern: /(.+)_extract$/, type: 'extract', base: (match) => match[1] },
    { pattern: /(.+)_powder$/, type: 'powder', base: (match) => match[1] },
    { pattern: /(.+)_meal$/, type: 'meal', base: (match) => match[1] },
    { pattern: /(.+)_flakes$/, type: 'flakes', base: (match) => match[1] }
  ];
  
  for (const variantPattern of variantPatterns) {
    const match = normalized.match(variantPattern.pattern);
    if (match) {
      variants.isVariant = true;
      variants.baseIngredient = variantPattern.base(match);
      variants.variantType = variantPattern.type;
      variants.variantModifiers.push(variantPattern.type);
      break;
    }
  }
  
  return variants;
}

/**
 * Get modifier taxonomy information
 * @returns {Object} Modifier taxonomy
 */
export function getModifierTaxonomy() {
  return {
    haramModifiers: HARAM_MODIFIERS,
    conditionalModifiers: Object.keys(CONDITIONAL_MODIFIERS),
    processingModifiers: Object.keys(PROCESSING_MODIFIERS),
    neutralModifiers: NEUTRAL_MODIFIERS,
    conditionalModifierDetails: CONDITIONAL_MODIFIERS,
    processingModifierDetails: PROCESSING_MODIFIERS
  };
}
