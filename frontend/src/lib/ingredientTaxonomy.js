/**
 * Comprehensive Ingredient Taxonomy for Halal Kitchen
 * 
 * Categories:
 * - natural_plant: Unprocessed plant-based ingredients (fruits, vegetables, grains, herbs)
 * - processed_plant: Processed plant-based ingredients (flours, oils, extracts)
 * - animal: Animal meat and flesh (beef, chicken, lamb)
 * - animal_byproduct: Animal-derived products (milk, eggs, gelatin, lard)
 * - alcohol: Alcoholic beverages and alcohol-containing ingredients
 * - fermentation_derived: Products from fermentation (vinegar, soy sauce, some cheeses)
 * - synthetic: Artificially created ingredients (artificial flavors, preservatives)
 * 
 * Each ingredient includes:
 * - default halal status
 * - confidence level
 * - explanation template
 */

/**
 * Taxonomy Categories Configuration
 */
export const TAXONOMY_CATEGORIES = {
  natural_plant: {
    label: "Natural Plant",
    description: "Unprocessed plant-based ingredients",
    defaultStatus: "halal",
    defaultConfidence: "certain_halal",
    defaultConfidenceScore: 100,
    explanationTemplate: "{{ingredient}} is naturally halal. It is a natural, plant-based ingredient in its unprocessed form, which is generally halal unless specifically prohibited in Islamic law.",
    requiresVerification: false
  },
  processed_plant: {
    label: "Processed Plant",
    description: "Processed or manufactured plant-based ingredients",
    defaultStatus: "halal",
    defaultConfidence: "conditional",
    defaultConfidenceScore: 75,
    explanationTemplate: "{{ingredient}} is a processed plant-based ingredient. While the base ingredient is halal, processing may introduce additives or cross-contamination. Check the ingredient list for non-halal additives.",
    requiresVerification: true
  },
  animal: {
    label: "Animal",
    description: "Animal meat and flesh",
    defaultStatus: "conditional",
    defaultConfidence: "conditional",
    defaultConfidenceScore: 60,
    explanationTemplate: "{{ingredient}} is halal when slaughtered according to Islamic guidelines (zabiha). Ensure the meat comes from a halal-certified source and has been properly slaughtered.",
    requiresVerification: true
  },
  animal_byproduct: {
    label: "Animal Byproduct",
    description: "Products derived from animals",
    defaultStatus: "conditional",
    defaultConfidence: "conditional",
    defaultConfidenceScore: 50,
    explanationTemplate: "{{ingredient}} is derived from animals and requires halal certification. The source animal must be halal, and the product must be processed according to Islamic guidelines. Check for halal certification.",
    requiresVerification: true
  },
  alcohol: {
    label: "Alcohol",
    description: "Alcoholic beverages and alcohol-containing ingredients",
    defaultStatus: "haram",
    defaultConfidence: "haram",
    defaultConfidenceScore: 0,
    explanationTemplate: "{{ingredient}} contains alcohol, which is haram (prohibited) in Islam. The Qur'an explicitly prohibits intoxicants (Qur'an 5:90).",
    requiresVerification: false
  },
  fermentation_derived: {
    label: "Fermentation Derived",
    description: "Products created through fermentation",
    defaultStatus: "conditional",
    defaultConfidence: "conditional",
    defaultConfidenceScore: 70,
    explanationTemplate: "{{ingredient}} is produced through fermentation. Most scholars consider fully fermented products (where alcohol has been transformed) to be halal, but some require verification. Check the alcohol content and consult with a scholar if uncertain.",
    requiresVerification: true
  },
  synthetic: {
    label: "Synthetic",
    description: "Artificially created ingredients",
    defaultStatus: "conditional",
    defaultConfidence: "conditional",
    defaultConfidenceScore: 65,
    explanationTemplate: "{{ingredient}} is a synthetic or artificially created ingredient. Synthetic ingredients are generally halal unless they contain haram substances or are derived from haram sources. Check the ingredient list and source.",
    requiresVerification: true
  }
};

/**
 * Comprehensive Ingredient Taxonomy Database
 * Maps ingredient IDs to their taxonomy classification
 */
export const INGREDIENT_TAXONOMY = {
  // Natural Plant Ingredients
  // Fruits
  apple: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  banana: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  orange: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  lemon: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  lime: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  grape: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  strawberry: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  blueberry: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  raspberry: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  blackberry: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cherry: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  peach: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pear: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  plum: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  apricot: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  mango: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pineapple: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  coconut: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  date: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  fig: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pomegranate: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  watermelon: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  
  // Vegetables
  onion: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  garlic: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  tomato: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  potato: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  carrot: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  celery: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  bell_pepper: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cucumber: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  lettuce: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  spinach: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  kale: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  broccoli: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cauliflower: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cabbage: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  zucchini: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  eggplant: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  mushroom: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  corn: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  peas: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  green_beans: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  asparagus: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  beet: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  radish: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  turnip: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  sweet_potato: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  yam: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pumpkin: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  squash: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  
  // Grains
  rice: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  wheat: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  barley: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  oats: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  quinoa: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  millet: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  buckwheat: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  rye: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  
  // Legumes
  lentil: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  chickpea: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  black_bean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  kidney_bean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pinto_bean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  navy_bean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  lima_bean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  soybean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  mung_bean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  fava_bean: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  split_pea: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  
  // Nuts & Seeds
  almond: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  walnut: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cashew: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pistachio: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  hazelnut: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pecan: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  macadamia: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  brazil_nut: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pine_nut: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  peanut: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  sunflower_seed: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  pumpkin_seed: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  sesame_seed: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  chia_seed: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  flax_seed: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  
  // Herbs & Spices
  basil: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  oregano: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  thyme: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  rosemary: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  sage: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  parsley: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cilantro: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  dill: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  mint: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cumin: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  coriander: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  turmeric: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  ginger: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  paprika: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cayenne: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  black_pepper: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  white_pepper: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cardamom: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  cinnamon: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  nutmeg: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  clove: { category: "natural_plant", status: "halal", confidence: "certain_halal", confidenceScore: 100 },
  
  // Processed Plant Ingredients
  rice_flour: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 75 },
  wheat_flour: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 75 },
  cornstarch: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 75 },
  olive_oil: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 80 },
  coconut_oil: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 80 },
  vegetable_oil: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 70 },
  canola_oil: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 75 },
  sunflower_oil: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 75 },
  sesame_oil: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 75 },
  tomato_paste: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 75 },
  tomato_sauce: { category: "processed_plant", status: "halal", confidence: "conditional", confidenceScore: 70 },
  vanilla_extract: { category: "processed_plant", status: "conditional", confidence: "conditional", confidenceScore: 60, note: "Check for alcohol content" },
  almond_extract: { category: "processed_plant", status: "conditional", confidence: "conditional", confidenceScore: 60, note: "Check for alcohol content" },
  
  // Animal Ingredients
  beef: { category: "animal", status: "conditional", confidence: "conditional", confidenceScore: 60 },
  lamb: { category: "animal", status: "conditional", confidence: "conditional", confidenceScore: 60 },
  chicken: { category: "animal", status: "conditional", confidence: "conditional", confidenceScore: 60 },
  turkey: { category: "animal", status: "conditional", confidence: "conditional", confidenceScore: 60 },
  duck: { category: "animal", status: "conditional", confidence: "conditional", confidenceScore: 60 },
  goat: { category: "animal", status: "conditional", confidence: "conditional", confidenceScore: 60 },
  veal: { category: "animal", status: "conditional", confidence: "conditional", confidenceScore: 60 },
  pork: { category: "animal", status: "haram", confidence: "haram", confidenceScore: 0 },
  
  // Animal Byproducts
  milk: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 70 },
  cheese: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 50, note: "Check for rennet source" },
  butter: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 70 },
  yogurt: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 70 },
  cream: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 70 },
  eggs: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 70 },
  egg_whites: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 70 },
  egg_yolks: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 70 },
  gelatin: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 40, note: "Check source - must be halal-certified" },
  lard: { category: "animal_byproduct", status: "haram", confidence: "haram", confidenceScore: 0 },
  whey: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 50 },
  casein: { category: "animal_byproduct", status: "conditional", confidence: "conditional", confidenceScore: 50 },
  
  // Alcohol
  wine: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  beer: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  whiskey: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  rum: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  vodka: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  brandy: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  sherry: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  port: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  vermouth: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  liqueur: { category: "alcohol", status: "haram", confidence: "haram", confidenceScore: 0 },
  
  // Fermentation Derived
  vinegar: { category: "fermentation_derived", status: "halal", confidence: "conditional", confidenceScore: 85 },
  wine_vinegar: { category: "fermentation_derived", status: "halal", confidence: "conditional", confidenceScore: 80, note: "Fully fermented - alcohol transformed" },
  apple_cider_vinegar: { category: "fermentation_derived", status: "halal", confidence: "conditional", confidenceScore: 85 },
  balsamic_vinegar: { category: "fermentation_derived", status: "halal", confidence: "conditional", confidenceScore: 80 },
  soy_sauce: { category: "fermentation_derived", status: "conditional", confidence: "conditional", confidenceScore: 70, note: "Check alcohol content" },
  miso: { category: "fermentation_derived", status: "halal", confidence: "conditional", confidenceScore: 80 },
  tempeh: { category: "fermentation_derived", status: "halal", confidence: "conditional", confidenceScore: 85 },
  
  // Synthetic
  artificial_vanilla: { category: "synthetic", status: "halal", confidence: "conditional", confidenceScore: 70 },
  artificial_flavoring: { category: "synthetic", status: "conditional", confidence: "conditional", confidenceScore: 65, note: "Check source and ingredients" },
  artificial_coloring: { category: "synthetic", status: "conditional", confidence: "conditional", confidenceScore: 65, note: "Check source - some may be derived from insects" },
  preservatives: { category: "synthetic", status: "conditional", confidence: "conditional", confidenceScore: 60, note: "Check specific preservative type" },
  emulsifier: { category: "synthetic", status: "conditional", confidence: "conditional", confidenceScore: 60, note: "Check source - may be animal-derived" },
  stabilizer: { category: "synthetic", status: "conditional", confidence: "conditional", confidenceScore: 60, note: "Check source" }
};

/**
 * Get taxonomy classification for an ingredient
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {Object|null} Taxonomy classification or null if not found
 */
export function getTaxonomyClassification(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  return INGREDIENT_TAXONOMY[normalized] || null;
}

/**
 * Get category configuration
 * @param {string} category - Category name
 * @returns {Object} Category configuration
 */
export function getCategoryConfig(category) {
  return TAXONOMY_CATEGORIES[category] || TAXONOMY_CATEGORIES.processed_plant;
}

/**
 * Generate explanation from template
 * @param {string} template - Explanation template with {{ingredient}} placeholder
 * @param {string} ingredientName - Human-readable ingredient name
 * @returns {string} Generated explanation
 */
export function generateExplanation(template, ingredientName) {
  return template.replace(/\{\{ingredient\}\}/g, ingredientName);
}

/**
 * Get taxonomy result for ingredient evaluation
 * @param {string} ingredientId - Normalized ingredient ID
 * @param {string} ingredientName - Human-readable ingredient name
 * @returns {Object|null} Taxonomy result or null if not found
 */
export function getTaxonomyResult(ingredientId, ingredientName) {
  const classification = getTaxonomyClassification(ingredientId);
  if (!classification) {
    return null;
  }
  
  const categoryConfig = getCategoryConfig(classification.category);
  const explanation = generateExplanation(
    categoryConfig.explanationTemplate,
    ingredientName || formatIngredientName(ingredientId)
  );
  
  return {
    category: classification.category,
    categoryLabel: categoryConfig.label,
    categoryDescription: categoryConfig.description,
    status: classification.status || categoryConfig.defaultStatus,
    confidenceLevel: classification.confidence || categoryConfig.defaultConfidence,
    confidenceScore: classification.confidenceScore !== undefined 
      ? classification.confidenceScore 
      : categoryConfig.defaultConfidenceScore,
    explanation: classification.note 
      ? `${explanation} ${classification.note}` 
      : explanation,
    requiresVerification: categoryConfig.requiresVerification,
    isTaxonomyBased: true
  };
}

/**
 * Format ingredient name for display (helper function)
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {string} Formatted ingredient name
 */
function formatIngredientName(ingredientId) {
  return ingredientId
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if ingredient is in taxonomy
 * @param {string} ingredientId - Normalized ingredient ID
 * @returns {boolean} True if ingredient is in taxonomy
 */
export function isInTaxonomy(ingredientId) {
  const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
  return normalized in INGREDIENT_TAXONOMY;
}

/**
 * Get all ingredients in a category
 * @param {string} category - Category name
 * @returns {Array} Array of ingredient IDs
 */
export function getIngredientsByCategory(category) {
  return Object.keys(INGREDIENT_TAXONOMY)
    .filter(id => INGREDIENT_TAXONOMY[id].category === category);
}

/**
 * Get taxonomy statistics
 * @returns {Object} Statistics about taxonomy
 */
export function getTaxonomyStats() {
  const stats = {
    total: Object.keys(INGREDIENT_TAXONOMY).length,
    byCategory: {},
    byStatus: {},
    byConfidence: {}
  };
  
  Object.values(INGREDIENT_TAXONOMY).forEach(ing => {
    // Count by category
    stats.byCategory[ing.category] = (stats.byCategory[ing.category] || 0) + 1;
    
    // Count by status
    stats.byStatus[ing.status] = (stats.byStatus[ing.status] || 0) + 1;
    
    // Count by confidence
    stats.byConfidence[ing.confidence] = (stats.byConfidence[ing.confidence] || 0) + 1;
  });
  
  return stats;
}
