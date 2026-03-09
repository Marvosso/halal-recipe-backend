/**
 * Ingredient Classification System
 * Classifies ingredients by type and assigns confidence levels
 * 
 * Types:
 * - natural: Plant-based, unprocessed ingredients (fruits, vegetables, grains, herbs)
 * - processed: Manufactured or processed ingredients (may contain additives)
 * - animal: Derived from animals (meat, dairy, eggs, gelatin)
 * - alcohol-derived: Contains or derived from alcohol (wine, vanilla extract with alcohol)
 * 
 * Confidence Levels:
 * - certain_halal: Explicitly halal with high confidence (100%)
 * - conditional: Halal under certain conditions (slaughter method, source verification)
 * - haram: Explicitly prohibited (pork, alcohol)
 * - rare_unknown: Very rare ingredient with insufficient data (use as last resort)
 */

/**
 * Plant-based natural ingredients that default to halal
 * These are common fruits, vegetables, grains, herbs, and spices
 */
const PLANT_BASED_NATURAL = [
  // Fruits
  'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
  'raspberry', 'blackberry', 'cherry', 'peach', 'pear', 'plum', 'apricot', 'mango',
  'pineapple', 'coconut', 'date', 'fig', 'pomegranate', 'watermelon', 'cantaloupe',
  'honeydew', 'kiwi', 'papaya', 'guava', 'passion_fruit', 'dragon_fruit',
  
  // Vegetables
  'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell_pepper', 'cucumber',
  'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'cabbage', 'zucchini',
  'eggplant', 'mushroom', 'corn', 'peas', 'green_beans', 'asparagus', 'artichoke',
  'beet', 'radish', 'turnip', 'sweet_potato', 'yam', 'pumpkin', 'squash',
  
  // Grains & Legumes
  'rice', 'wheat', 'barley', 'oats', 'quinoa', 'millet', 'buckwheat', 'rye',
  'corn', 'lentil', 'chickpea', 'black_bean', 'kidney_bean', 'pinto_bean',
  'navy_bean', 'lima_bean', 'soybean', 'mung_bean', 'fava_bean', 'split_pea',
  
  // Nuts & Seeds
  'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'macadamia',
  'brazil_nut', 'pine_nut', 'peanut', 'sunflower_seed', 'pumpkin_seed', 'sesame_seed',
  'chia_seed', 'flax_seed', 'hemp_seed', 'poppy_seed',
  
  // Herbs & Spices
  'basil', 'oregano', 'thyme', 'rosemary', 'sage', 'parsley', 'cilantro', 'dill',
  'mint', 'chive', 'tarragon', 'marjoram', 'bay_leaf', 'cumin', 'coriander',
  'turmeric', 'ginger', 'garlic', 'onion_powder', 'paprika', 'cayenne', 'black_pepper',
  'white_pepper', 'cardamom', 'cinnamon', 'nutmeg', 'clove', 'allspice', 'star_anise',
  'fennel', 'caraway', 'mustard_seed', 'fenugreek', 'sumac', 'zaatar',
  
  // Oils (plant-based)
  'olive_oil', 'coconut_oil', 'vegetable_oil', 'canola_oil', 'sunflower_oil',
  'safflower_oil', 'sesame_oil', 'avocado_oil', 'grapeseed_oil', 'peanut_oil',
  
  // Natural Sweeteners
  'honey', 'maple_syrup', 'agave', 'date_syrup', 'molasses', 'coconut_sugar',
  
  // Salt & Minerals
  'salt', 'sea_salt', 'himalayan_salt', 'black_salt',
  
  // Water & Natural Beverages
  'water', 'coconut_water', 'fresh_fruit_juice', 'vegetable_juice'
];

/**
 * Animal-derived ingredients (require halal certification)
 */
const ANIMAL_DERIVED = [
  'pork', 'bacon', 'ham', 'sausage', 'pepperoni', 'prosciutto', 'pancetta',
  'beef', 'lamb', 'chicken', 'turkey', 'duck', 'goat', 'veal',
  'milk', 'cheese', 'butter', 'yogurt', 'cream', 'gelatin', 'lard',
  'eggs', 'egg_whites', 'egg_yolks', 'whey', 'casein'
];

/**
 * Alcohol-derived ingredients
 */
const ALCOHOL_DERIVED = [
  'wine', 'beer', 'whiskey', 'rum', 'vodka', 'brandy', 'cognac',
  'sherry', 'port', 'vermouth', 'liqueur', 'vanilla_extract', 'almond_extract',
  'lemon_extract', 'orange_extract'
];

/**
 * Processed ingredients (may contain additives)
 */
const PROCESSED_INDICATORS = [
  'extract', 'essence', 'flavoring', 'artificial', 'synthetic', 'modified',
  'hydrogenated', 'emulsifier', 'stabilizer', 'preservative', 'additive',
  'processed', 'refined', 'enriched', 'fortified'
];

/**
 * Classify ingredient by type
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {Object} ingredientData - Ingredient data from knowledge base
 * @returns {string} Type: 'natural', 'processed', 'animal', 'alcohol-derived'
 */
export function classifyIngredientType(ingredientId, ingredientData = {}) {
  const normalized = ingredientId.toLowerCase().trim();
  
  // Check explicit category from data
  if (ingredientData.category) {
    const cat = ingredientData.category.toLowerCase();
    if (cat === 'meat' || cat === 'dairy' || cat === 'gelatin' || cat === 'fat') {
      return 'animal';
    }
    if (cat === 'alcohol' || cat === 'beverage') {
      return 'alcohol-derived';
    }
  }
  
  // Check alcohol-derived patterns
  if (ALCOHOL_DERIVED.some(alc => normalized.includes(alc))) {
    return 'alcohol-derived';
  }
  
  // Check animal-derived patterns
  if (ANIMAL_DERIVED.some(animal => normalized.includes(animal))) {
    return 'animal';
  }
  
  // Check processed indicators
  if (PROCESSED_INDICATORS.some(indicator => normalized.includes(indicator))) {
    return 'processed';
  }
  
  // Check if plant-based natural
  if (PLANT_BASED_NATURAL.some(plant => normalized.includes(plant))) {
    return 'natural';
  }
  
  // Default to processed if unknown (safer assumption)
  return 'processed';
}

/**
 * Determine confidence level based on ingredient type and status
 * @param {string} ingredientType - Type from classifyIngredientType
 * @param {string} status - Halal status (halal, haram, conditional, questionable, unknown)
 * @param {Object} ingredientData - Ingredient data from knowledge base
 * @returns {string} Confidence level: 'certain_halal', 'conditional', 'haram', 'rare_unknown'
 */
export function determineConfidenceLevel(ingredientType, status, ingredientData = {}) {
  // Explicit haram status → haram confidence
  if (status === 'haram') {
    return 'haram';
  }
  
  // Natural plant-based ingredients default to certain_halal
  if (ingredientType === 'natural' && status === 'halal') {
    return 'certain_halal';
  }
  
  // Natural plant-based with unknown status → certain_halal (default halal)
  if (ingredientType === 'natural' && status === 'unknown') {
    return 'certain_halal';
  }
  
  // Animal-derived with halal status → conditional (requires certification)
  if (ingredientType === 'animal' && status === 'halal') {
    return 'conditional';
  }
  
  // Animal-derived with unknown status → conditional (requires verification)
  if (ingredientType === 'animal' && status === 'unknown') {
    return 'conditional';
  }
  
  // Alcohol-derived → haram
  if (ingredientType === 'alcohol-derived') {
    return 'haram';
  }
  
  // Processed with halal status → conditional (may contain additives)
  if (ingredientType === 'processed' && status === 'halal') {
    return 'conditional';
  }
  
  // Processed with unknown status → conditional (requires verification)
  if (ingredientType === 'processed' && status === 'unknown') {
    return 'conditional';
  }
  
  // Conditional/questionable status → conditional
  if (status === 'conditional' || status === 'questionable') {
    return 'conditional';
  }
  
  // Explicit halal → certain_halal
  if (status === 'halal') {
    return 'certain_halal';
  }
  
  // Truly unknown (very rare) → rare_unknown (last resort)
  if (status === 'unknown') {
    // Only use rare_unknown if we've exhausted all classification attempts
    // Check if ingredient has any data at all
    if (!ingredientData || Object.keys(ingredientData).length === 0) {
      return 'rare_unknown';
    }
    // If we have some data but status is unknown, it's conditional
    return 'conditional';
  }
  
  // Default fallback
  return 'conditional';
}

/**
 * Get default halal status for plant-based natural ingredients
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {Object} Default status object
 */
export function getDefaultNaturalStatus(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim();
  
  // Check if it's a plant-based natural ingredient
  const isNatural = PLANT_BASED_NATURAL.some(plant => normalized.includes(plant));
  
  if (isNatural) {
    return {
      status: 'halal',
      confidenceLevel: 'certain_halal',
      explanation: 'Plant-based natural ingredients are generally halal unless specifically prohibited.',
      type: 'natural'
    };
  }
  
  return null;
}

/**
 * Enhanced ingredient classification
 * Combines type classification with confidence level
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {Object} ingredientData - Ingredient data from knowledge base
 * @param {string} currentStatus - Current halal status from evaluation
 * @returns {Object} Classification result
 */
export function classifyIngredient(ingredientId, ingredientData = {}, currentStatus = 'unknown') {
  const type = classifyIngredientType(ingredientId, ingredientData);
  const confidenceLevel = determineConfidenceLevel(type, currentStatus, ingredientData);
  
  // Apply default halal for natural plant-based ingredients
  if (type === 'natural' && currentStatus === 'unknown') {
    const defaultStatus = getDefaultNaturalStatus(ingredientId);
    if (defaultStatus) {
      return {
        type: 'natural',
        confidenceLevel: 'certain_halal',
        status: 'halal',
        explanation: defaultStatus.explanation,
        isDefaultHalal: true
      };
    }
  }
  
  return {
    type,
    confidenceLevel,
    status: currentStatus,
    isDefaultHalal: false
  };
}

/**
 * Get confidence level display information
 * @param {string} confidenceLevel - Confidence level
 * @returns {Object} Display info (label, color, description)
 */
export function getConfidenceLevelInfo(confidenceLevel) {
  const levels = {
    certain_halal: {
      label: 'Certain Halal',
      color: '#0A9D58',
      description: 'High confidence - explicitly halal',
      icon: 'check-circle'
    },
    conditional: {
      label: 'Conditional',
      color: '#F59E0B',
      description: 'Halal under certain conditions (requires verification)',
      icon: 'alert-circle'
    },
    haram: {
      label: 'Haram',
      color: '#EF4444',
      description: 'Explicitly prohibited',
      icon: 'x-circle'
    },
    rare_unknown: {
      label: 'Rare/Unknown',
      color: '#6B7280',
      description: 'Insufficient data - please verify with a scholar',
      icon: 'help-circle'
    }
  };
  
  return levels[confidenceLevel] || levels.rare_unknown;
}

/**
 * Get ingredient type display information
 * @param {string} type - Ingredient type
 * @returns {Object} Display info (label, description)
 */
export function getIngredientTypeInfo(type) {
  const types = {
    natural: {
      label: 'Natural',
      description: 'Plant-based, unprocessed ingredient',
      icon: 'leaf'
    },
    processed: {
      label: 'Processed',
      description: 'Manufactured or processed ingredient',
      icon: 'package'
    },
    animal: {
      label: 'Animal-Derived',
      description: 'Derived from animals (requires halal certification)',
      icon: 'meat'
    },
    'alcohol-derived': {
      label: 'Alcohol-Derived',
      description: 'Contains or derived from alcohol',
      icon: 'alert-triangle'
    }
  };
  
  return types[type] || types.processed;
}
