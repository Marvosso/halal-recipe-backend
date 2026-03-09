# Comprehensive Ingredient Taxonomy for Halal Kitchen

## Overview
A systematic taxonomy for categorizing ingredients with default halal status, confidence levels, and explanation templates.

---

## Data Model

### Taxonomy Entry Structure

```javascript
{
  ingredientId: {
    category: "natural_plant" | "processed_plant" | "animal" | "animal_byproduct" | 
              "alcohol" | "fermentation_derived" | "synthetic",
    status: "halal" | "haram" | "conditional",
    confidence: "certain_halal" | "conditional" | "haram" | "rare_unknown",
    confidenceScore: 0-100,
    note?: "Optional additional note"
  }
}
```

### Category Configuration

Each category has:
- **label**: Human-readable category name
- **description**: Category description
- **defaultStatus**: Default halal status for category
- **defaultConfidence**: Default confidence level
- **defaultConfidenceScore**: Default confidence score (0-100)
- **explanationTemplate**: Template with `{{ingredient}}` placeholder
- **requiresVerification**: Whether verification is typically needed

---

## Taxonomy Categories

### 1. Natural Plant (`natural_plant`)

**Default Status:** `halal`  
**Default Confidence:** `certain_halal` (100%)  
**Requires Verification:** `false`

**Description:** Unprocessed plant-based ingredients (fruits, vegetables, grains, herbs, spices, nuts, seeds)

**Explanation Template:**
> "{{ingredient}} is a natural, plant-based ingredient. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited in Islamic law."

**Examples:**
- Fruits: apple, banana, orange, grape, strawberry
- Vegetables: onion, garlic, tomato, potato, carrot
- Grains: rice, wheat, barley, oats, quinoa
- Legumes: lentil, chickpea, black_bean, kidney_bean
- Nuts & Seeds: almond, walnut, cashew, pistachio
- Herbs & Spices: basil, oregano, thyme, cumin, turmeric

---

### 2. Processed Plant (`processed_plant`)

**Default Status:** `halal`  
**Default Confidence:** `conditional` (75%)  
**Requires Verification:** `true`

**Description:** Processed or manufactured plant-based ingredients (flours, oils, extracts, pastes)

**Explanation Template:**
> "{{ingredient}} is a processed plant-based ingredient. While the base ingredient is halal, processing may introduce additives or cross-contamination. Check the ingredient list for non-halal additives."

**Examples:**
- Flours: rice_flour, wheat_flour, cornstarch
- Oils: olive_oil, coconut_oil, vegetable_oil, canola_oil
- Processed: tomato_paste, tomato_sauce
- Extracts: vanilla_extract (check alcohol), almond_extract (check alcohol)

---

### 3. Animal (`animal`)

**Default Status:** `conditional`  
**Default Confidence:** `conditional` (60%)  
**Requires Verification:** `true`

**Description:** Animal meat and flesh

**Explanation Template:**
> "{{ingredient}} is halal when slaughtered according to Islamic guidelines (zabiha). Ensure the meat comes from a halal-certified source and has been properly slaughtered."

**Examples:**
- Halal (with certification): beef, lamb, chicken, turkey, duck, goat, veal
- Haram: pork

---

### 4. Animal Byproduct (`animal_byproduct`)

**Default Status:** `conditional`  
**Default Confidence:** `conditional` (50%)  
**Requires Verification:** `true`

**Description:** Products derived from animals (milk, eggs, gelatin, lard)

**Explanation Template:**
> "{{ingredient}} is derived from animals and requires halal certification. The source animal must be halal, and the product must be processed according to Islamic guidelines. Check for halal certification."

**Examples:**
- Dairy: milk, cheese (check rennet), butter, yogurt, cream
- Eggs: eggs, egg_whites, egg_yolks
- Other: gelatin (check source), lard (haram), whey, casein

---

### 5. Alcohol (`alcohol`)

**Default Status:** `haram`  
**Default Confidence:** `haram` (0%)  
**Requires Verification:** `false`

**Description:** Alcoholic beverages and alcohol-containing ingredients

**Explanation Template:**
> "{{ingredient}} contains alcohol, which is haram (prohibited) in Islam. The Qur'an explicitly prohibits intoxicants (Qur'an 5:90)."

**Examples:**
- wine, beer, whiskey, rum, vodka, brandy, sherry, port, vermouth, liqueur

---

### 6. Fermentation Derived (`fermentation_derived`)

**Default Status:** `conditional`  
**Default Confidence:** `conditional` (70%)  
**Requires Verification:** `true`

**Description:** Products created through fermentation

**Explanation Template:**
> "{{ingredient}} is produced through fermentation. Most scholars consider fully fermented products (where alcohol has been transformed) to be halal, but some require verification. Check the alcohol content and consult with a scholar if uncertain."

**Examples:**
- vinegars: vinegar, wine_vinegar, apple_cider_vinegar, balsamic_vinegar
- Fermented foods: soy_sauce (check alcohol), miso, tempeh

---

### 7. Synthetic (`synthetic`)

**Default Status:** `conditional`  
**Default Confidence:** `conditional` (65%)  
**Requires Verification:** `true`

**Description:** Artificially created ingredients

**Explanation Template:**
> "{{ingredient}} is a synthetic or artificially created ingredient. Synthetic ingredients are generally halal unless they contain haram substances or are derived from haram sources. Check the ingredient list and source."

**Examples:**
- artificial_vanilla, artificial_flavoring, artificial_coloring (check source)
- preservatives, emulsifier (check source), stabilizer

---

## Example Taxonomy Entries

### Example 1: Natural Plant

```javascript
rice: {
  category: "natural_plant",
  status: "halal",
  confidence: "certain_halal",
  confidenceScore: 100
}
```

**Result:**
- Status: `halal`
- Confidence: `certain_halal` (100%)
- Explanation: "Rice is a natural, plant-based ingredient. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited in Islamic law."

---

### Example 2: Processed Plant

```javascript
rice_flour: {
  category: "processed_plant",
  status: "halal",
  confidence: "conditional",
  confidenceScore: 75
}
```

**Result:**
- Status: `halal`
- Confidence: `conditional` (75%)
- Explanation: "Rice flour is a processed plant-based ingredient. While the base ingredient is halal, processing may introduce additives or cross-contamination. Check the ingredient list for non-halal additives."
- Requires Verification: `true`

---

### Example 3: Animal

```javascript
beef: {
  category: "animal",
  status: "conditional",
  confidence: "conditional",
  confidenceScore: 60
}
```

**Result:**
- Status: `conditional`
- Confidence: `conditional` (60%)
- Explanation: "Beef is halal when slaughtered according to Islamic guidelines (zabiha). Ensure the meat comes from a halal-certified source and has been properly slaughtered."
- Requires Verification: `true`

---

### Example 4: Animal Byproduct

```javascript
gelatin: {
  category: "animal_byproduct",
  status: "conditional",
  confidence: "conditional",
  confidenceScore: 40,
  note: "Check source - must be halal-certified"
}
```

**Result:**
- Status: `conditional`
- Confidence: `conditional` (40%)
- Explanation: "Gelatin is derived from animals and requires halal certification. The source animal must be halal, and the product must be processed according to Islamic guidelines. Check for halal certification. Check source - must be halal-certified."
- Requires Verification: `true`

---

### Example 5: Alcohol

```javascript
wine: {
  category: "alcohol",
  status: "haram",
  confidence: "haram",
  confidenceScore: 0
}
```

**Result:**
- Status: `haram`
- Confidence: `haram` (0%)
- Explanation: "Wine contains alcohol, which is haram (prohibited) in Islam. The Qur'an explicitly prohibits intoxicants (Qur'an 5:90)."
- Requires Verification: `false`

---

### Example 6: Fermentation Derived

```javascript
wine_vinegar: {
  category: "fermentation_derived",
  status: "halal",
  confidence: "conditional",
  confidenceScore: 80,
  note: "Fully fermented - alcohol transformed"
}
```

**Result:**
- Status: `halal`
- Confidence: `conditional` (80%)
- Explanation: "Wine vinegar is produced through fermentation. Most scholars consider fully fermented products (where alcohol has been transformed) to be halal, but some require verification. Check the alcohol content and consult with a scholar if uncertain. Fully fermented - alcohol transformed."
- Requires Verification: `true`

---

### Example 7: Synthetic

```javascript
artificial_vanilla: {
  category: "synthetic",
  status: "halal",
  confidence: "conditional",
  confidenceScore: 70
}
```

**Result:**
- Status: `halal`
- Confidence: `conditional` (70%)
- Explanation: "Artificial vanilla is a synthetic or artificially created ingredient. Synthetic ingredients are generally halal unless they contain haram substances or are derived from haram sources. Check the ingredient list and source."
- Requires Verification: `true`

---

## Lookup Flow

### Step 1: Normalize Ingredient ID
```javascript
const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
```

### Step 2: Check for Modifiers
```javascript
const modifierDetection = detectModifiers(normalized);
if (modifierDetection.hasHaramModifier) {
  return haram; // Haram modifiers override everything
}
```

### Step 3: Extract Base Ingredient
```javascript
const baseIngredientId = extractBaseIngredient(normalized);
```

### Step 4: Check Taxonomy
```javascript
const taxonomyResult = getTaxonomyResult(baseIngredientId);
if (taxonomyResult) {
  // Use taxonomy classification
  return taxonomyResult;
}
```

### Step 5: Check Base Ingredient Override
```javascript
const baseOverride = getBaseIngredientOverride(baseIngredientId);
if (baseOverride) {
  // Use base ingredient override
  return baseOverride;
}
```

### Step 6: Knowledge Base Lookup
```javascript
const rootItem = resolveInheritance(baseIngredientId);
if (rootItem) {
  // Use knowledge base
  return evaluateFromKnowledgeBase(rootItem);
}
```

### Step 7: Default Natural Status
```javascript
const defaultNatural = getDefaultNaturalStatus(baseIngredientId);
if (defaultNatural) {
  // Default to halal for natural plant ingredients
  return defaultNatural;
}
```

### Step 8: Unknown
```javascript
return {
  status: "unknown",
  confidenceLevel: "rare_unknown",
  // ...
};
```

---

## Integration with Halal Engine

The taxonomy is checked **after modifier detection** but **before knowledge base lookup**:

```javascript
export function evaluateItem(itemId, options = {}) {
  // 1. Normalize
  // 2. Detect modifiers (haram modifiers override)
  // 3. Extract base ingredient
  // 4. Check taxonomy ← NEW
  // 5. Check base ingredient override
  // 6. Knowledge base lookup
  // 7. Default natural status
  // 8. Unknown
}
```

---

## Taxonomy Statistics

Current taxonomy includes:
- **Total Ingredients:** 150+
- **Natural Plant:** 80+ ingredients
- **Processed Plant:** 15+ ingredients
- **Animal:** 8 ingredients
- **Animal Byproduct:** 12+ ingredients
- **Alcohol:** 10+ ingredients
- **Fermentation Derived:** 8+ ingredients
- **Synthetic:** 6+ ingredients

---

## Benefits

1. **Systematic Classification:** Consistent categorization across all ingredients
2. **Default Status:** Clear default halal status for each category
3. **Confidence Levels:** Standardized confidence scoring
4. **Explanation Templates:** Consistent, informative explanations
5. **Natural Plant Default:** Natural plant ingredients default to halal with high confidence
6. **Extensible:** Easy to add new ingredients to taxonomy

---

## Files Created/Modified

1. **`frontend/src/lib/ingredientTaxonomy.js`** (New)
   - Taxonomy database
   - Category configurations
   - Lookup functions
   - Statistics functions

2. **`frontend/src/lib/halalEngine.js`** (Updated)
   - Integrated taxonomy lookup
   - Taxonomy checked before knowledge base

3. **`INGREDIENT_TAXONOMY.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Comprehensive taxonomy with 7 categories  
✅ Each ingredient includes default status, confidence level, explanation template  
✅ Natural plant ingredients default to halal with high confidence  
✅ Clear lookup flow  
✅ Example entries for all categories  
✅ Integrated with halal engine
