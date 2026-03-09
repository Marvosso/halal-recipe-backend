/**
 * Base Ingredient Overrides
 * Plain plant-based ingredients that must always return halal
 * Bypasses AI uncertainty and knowledge base lookups
 * 
 * Rules:
 * - Plain base ingredients (rice, wheat, vegetables, legumes, fruits) → always halal
 * - Processed variants (rice_flour, wheat_pasta) → evaluate normally
 * - Overrides apply before any AI or knowledge base evaluation
 */

/**
 * Base plant-based ingredients that are always halal
 * These are plain, unprocessed ingredients
 */
const BASE_PLANT_INGREDIENTS = new Set([
  // Grains (plain)
  'rice', 'wheat', 'barley', 'oats', 'quinoa', 'millet', 'buckwheat', 'rye',
  'corn', 'sorghum', 'amaranth', 'teff', 'spelt', 'farro', 'freekeh',
  
  // Legumes (plain)
  'lentil', 'chickpea', 'black_bean', 'kidney_bean', 'pinto_bean', 'navy_bean',
  'lima_bean', 'soybean', 'mung_bean', 'fava_bean', 'split_pea', 'black_eyed_pea',
  'adzuki_bean', 'cannellini_bean', 'garbanzo_bean', 'edamame',
  
  // Vegetables (plain)
  'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell_pepper', 'cucumber',
  'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'cabbage', 'zucchini',
  'eggplant', 'mushroom', 'corn', 'peas', 'green_beans', 'asparagus', 'artichoke',
  'beet', 'radish', 'turnip', 'sweet_potato', 'yam', 'pumpkin', 'squash',
  'okra', 'brussels_sprouts', 'bok_choy', 'chard', 'collard_greens', 'arugula',
  'watercress', 'endive', 'fennel', 'leek', 'shallot', 'scallion', 'chive',
  
  // Fruits (plain)
  'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry',
  'raspberry', 'blackberry', 'cherry', 'peach', 'pear', 'plum', 'apricot', 'mango',
  'pineapple', 'coconut', 'date', 'fig', 'pomegranate', 'watermelon', 'cantaloupe',
  'honeydew', 'kiwi', 'papaya', 'guava', 'passion_fruit', 'dragon_fruit',
  'cranberry', 'gooseberry', 'currant', 'elderberry', 'mulberry', 'persimmon',
  
  // Nuts & Seeds (plain)
  'almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'macadamia',
  'brazil_nut', 'pine_nut', 'peanut', 'sunflower_seed', 'pumpkin_seed', 'sesame_seed',
  'chia_seed', 'flax_seed', 'hemp_seed', 'poppy_seed',
  
  // Herbs (plain)
  'basil', 'oregano', 'thyme', 'rosemary', 'sage', 'parsley', 'cilantro', 'dill',
  'mint', 'chive', 'tarragon', 'marjoram', 'bay_leaf', 'lemongrass', 'curry_leaf',
  
  // Spices (plain, whole)
  'cumin', 'coriander', 'turmeric', 'ginger', 'paprika', 'cayenne', 'black_pepper',
  'white_pepper', 'cardamom', 'cinnamon', 'nutmeg', 'clove', 'allspice', 'star_anise',
  'fennel', 'caraway', 'mustard_seed', 'fenugreek', 'sumac', 'zaatar',
  'saffron', 'vanilla_bean', 'vanilla_pod',
  
  // Plant-based oils (plain)
  'olive_oil', 'coconut_oil', 'vegetable_oil', 'canola_oil', 'sunflower_oil',
  'safflower_oil', 'sesame_oil', 'avocado_oil', 'grapeseed_oil', 'peanut_oil',
  
  // Natural sweeteners (plain)
  'honey', 'maple_syrup', 'agave', 'date_syrup', 'molasses', 'coconut_sugar',
  
  // Salt & Minerals (plain)
  'salt', 'sea_salt', 'himalayan_salt', 'black_salt',
  
  // Water & Natural Beverages (plain)
  'water', 'coconut_water'
]);

/**
 * Processed ingredient indicators
 * If an ingredient contains these, it's processed and should be evaluated normally
 */
const PROCESSED_INDICATORS = [
  '_flour', '_starch', '_meal', '_paste', '_sauce', '_juice', '_extract',
  '_powder', '_flakes', '_chips', '_crisps', '_canned', '_frozen', '_dried',
  '_dehydrated', '_fermented', '_pickled', '_preserved', '_smoked', '_cured',
  '_processed', '_refined', '_enriched', '_fortified', '_hydrogenated',
  '_modified', '_artificial', '_synthetic', '_flavoring', '_essence',
  '_emulsifier', '_stabilizer', '_preservative', '_additive', '_thickener',
  'flour', 'starch', 'meal', 'paste', 'sauce', 'juice', 'extract',
  'powder', 'flakes', 'chips', 'crisps', 'canned', 'frozen', 'dried',
  'dehydrated', 'fermented', 'pickled', 'preserved', 'smoked', 'cured',
  'processed', 'refined', 'enriched', 'fortified', 'hydrogenated',
  'modified', 'artificial', 'synthetic', 'flavoring', 'essence',
  'emulsifier', 'stabilizer', 'preservative', 'additive', 'thickener'
];

/**
 * Check if an ingredient is a plain base plant ingredient
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {boolean} True if it's a plain base ingredient
 */
function isPlainBaseIngredient(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  
  // Check if it contains processed indicators
  const hasProcessedIndicator = PROCESSED_INDICATORS.some(indicator => 
    normalized.includes(indicator)
  );
  
  if (hasProcessedIndicator) {
    return false; // Processed variant, evaluate normally
  }
  
  // Check if it's an exact match or starts with a base ingredient
  // Allow for plural forms and common variations
  const baseMatch = Array.from(BASE_PLANT_INGREDIENTS).find(base => {
    // Exact match
    if (normalized === base) return true;
    
    // Starts with base ingredient (e.g., "rice_grain" → "rice")
    if (normalized.startsWith(base + "_")) return true;
    
    // Plural form (e.g., "tomatoes" → "tomato")
    if (normalized === base + "s" || normalized === base + "es") return true;
    
    // Base ingredient with common suffix (e.g., "rice_grain", "wheat_berry")
    const commonSuffixes = ['_grain', '_berry', '_seed', '_bean', '_pea', '_nut'];
    for (const suffix of commonSuffixes) {
      if (normalized === base + suffix) return true;
    }
    
    return false;
  });
  
  return !!baseMatch;
}

/**
 * Get base ingredient override result
 * Returns halal status for plain plant-based ingredients, bypassing AI uncertainty
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {Object|null} Override result or null if not applicable
 */
export function getBaseIngredientOverride(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  
  // Check if it's a plain base ingredient
  if (!isPlainBaseIngredient(normalized)) {
    return null; // Not a base ingredient, evaluate normally
  }
  
  // Find the matching base ingredient
  const baseMatch = Array.from(BASE_PLANT_INGREDIENTS).find(base => {
    if (normalized === base) return true;
    if (normalized.startsWith(base + "_")) return true;
    if (normalized === base + "s" || normalized === base + "es") return true;
    const commonSuffixes = ['_grain', '_berry', '_seed', '_bean', '_pea', '_nut'];
    for (const suffix of commonSuffixes) {
      if (normalized === base + suffix) return true;
    }
    return false;
  });
  
  if (!baseMatch) {
    return null; // Should not happen, but safety check
  }
  
  // Determine category for better explanation
  let category = "plant-based ingredient";
  if (['rice', 'wheat', 'barley', 'oats', 'quinoa', 'millet', 'buckwheat', 'rye', 'corn', 'sorghum'].includes(baseMatch)) {
    category = "grain";
  } else if (['lentil', 'chickpea', 'black_bean', 'kidney_bean', 'pinto_bean', 'navy_bean', 'lima_bean', 'soybean', 'mung_bean', 'fava_bean', 'split_pea'].includes(baseMatch)) {
    category = "legume";
  } else if (['onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell_pepper', 'cucumber', 'lettuce', 'spinach', 'kale', 'broccoli', 'cauliflower', 'cabbage'].includes(baseMatch)) {
    category = "vegetable";
  } else if (['apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'cherry', 'peach', 'pear', 'plum'].includes(baseMatch)) {
    category = "fruit";
  } else if (['almond', 'walnut', 'cashew', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'brazil_nut', 'pine_nut', 'peanut'].includes(baseMatch)) {
    category = "nut";
  } else if (['basil', 'oregano', 'thyme', 'rosemary', 'sage', 'parsley', 'cilantro', 'dill', 'mint'].includes(baseMatch)) {
    category = "herb";
  } else if (['cumin', 'coriander', 'turmeric', 'ginger', 'paprika', 'cayenne', 'black_pepper', 'cardamom', 'cinnamon', 'nutmeg', 'clove'].includes(baseMatch)) {
    category = "spice";
  }
  
  return {
    status: "halal",
    confidenceLevel: "certain_halal",
    ingredientType: "natural",
    explanation: `Plain ${category} is naturally halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited.`,
    simpleExplanation: `Plain ${category} is naturally halal.`,
    isBaseIngredientOverride: true,
    baseIngredient: baseMatch,
    bypassAI: true // Flag to indicate this bypasses AI uncertainty
  };
}

/**
 * Check if an ingredient should bypass normal evaluation
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {boolean} True if override should be applied
 */
export function shouldBypassEvaluation(ingredientId) {
  return isPlainBaseIngredient(ingredientId);
}

/**
 * Get the base ingredient list (for testing/debugging)
 * @returns {Array} List of base ingredients
 */
export function getBaseIngredientList() {
  return Array.from(BASE_PLANT_INGREDIENTS).sort();
}
