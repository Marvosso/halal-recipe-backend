# Base Ingredient Overrides Implementation

## Overview
Implements base ingredient overrides for Halal Kitchen quick lookup. Plain plant-based ingredients (rice, wheat, vegetables, legumes, fruits) always return halal, bypassing AI uncertainty and knowledge base lookups.

---

## Rules

1. **Plain plant-based ingredients** → Always return halal
2. **Overrides bypass AI uncertainty** → Applied before any AI or knowledge base evaluation
3. **Processed variants** → Evaluated normally (not overridden)

---

## Override List Structure

### Base Plant Ingredients (Always Halal)

**Grains (plain):**
- rice, wheat, barley, oats, quinoa, millet, buckwheat, rye, corn, sorghum, amaranth, teff, spelt, farro, freekeh

**Legumes (plain):**
- lentil, chickpea, black_bean, kidney_bean, pinto_bean, navy_bean, lima_bean, soybean, mung_bean, fava_bean, split_pea, black_eyed_pea, adzuki_bean, cannellini_bean, garbanzo_bean, edamame

**Vegetables (plain):**
- onion, garlic, tomato, potato, carrot, celery, bell_pepper, cucumber, lettuce, spinach, kale, broccoli, cauliflower, cabbage, zucchini, eggplant, mushroom, corn, peas, green_beans, asparagus, artichoke, beet, radish, turnip, sweet_potato, yam, pumpkin, squash, okra, brussels_sprouts, bok_choy, chard, collard_greens, arugula, watercress, endive, fennel, leek, shallot, scallion, chive

**Fruits (plain):**
- apple, banana, orange, lemon, lime, grape, strawberry, blueberry, raspberry, blackberry, cherry, peach, pear, plum, apricot, mango, pineapple, coconut, date, fig, pomegranate, watermelon, cantaloupe, honeydew, kiwi, papaya, guava, passion_fruit, dragon_fruit, cranberry, gooseberry, currant, elderberry, mulberry, persimmon

**Nuts & Seeds (plain):**
- almond, walnut, cashew, pistachio, hazelnut, pecan, macadamia, brazil_nut, pine_nut, peanut, sunflower_seed, pumpkin_seed, sesame_seed, chia_seed, flax_seed, hemp_seed, poppy_seed

**Herbs (plain):**
- basil, oregano, thyme, rosemary, sage, parsley, cilantro, dill, mint, chive, tarragon, marjoram, bay_leaf, lemongrass, curry_leaf

**Spices (plain, whole):**
- cumin, coriander, turmeric, ginger, paprika, cayenne, black_pepper, white_pepper, cardamom, cinnamon, nutmeg, clove, allspice, star_anise, fennel, caraway, mustard_seed, fenugreek, sumac, zaatar, saffron, vanilla_bean, vanilla_pod

**Plant-based Oils (plain):**
- olive_oil, coconut_oil, vegetable_oil, canola_oil, sunflower_oil, safflower_oil, sesame_oil, avocado_oil, grapeseed_oil, peanut_oil

**Natural Sweeteners (plain):**
- honey, maple_syrup, agave, date_syrup, molasses, coconut_sugar

**Salt & Minerals (plain):**
- salt, sea_salt, himalayan_salt, black_salt

**Water & Natural Beverages (plain):**
- water, coconut_water

---

## Processed Indicators

If an ingredient contains these indicators, it's considered processed and evaluated normally (not overridden):

- `_flour`, `_starch`, `_meal`, `_paste`, `_sauce`, `_juice`, `_extract`
- `_powder`, `_flakes`, `_chips`, `_crisps`, `_canned`, `_frozen`, `_dried`
- `_dehydrated`, `_fermented`, `_pickled`, `_preserved`, `_smoked`, `_cured`
- `_processed`, `_refined`, `_enriched`, `_fortified`, `_hydrogenated`
- `_modified`, `_artificial`, `_synthetic`, `_flavoring`, `_essence`
- `_emulsifier`, `_stabilizer`, `_preservative`, `_additive`, `_thickener`

---

## Lookup Logic

### Step 1: Normalize Ingredient ID
```javascript
const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
```

### Step 2: Check for Processed Indicators
```javascript
const hasProcessedIndicator = PROCESSED_INDICATORS.some(indicator => 
  normalized.includes(indicator)
);

if (hasProcessedIndicator) {
  return null; // Processed variant, evaluate normally
}
```

### Step 3: Check for Base Ingredient Match
```javascript
const baseMatch = Array.from(BASE_PLANT_INGREDIENTS).find(base => {
  // Exact match
  if (normalized === base) return true;
  
  // Starts with base ingredient (e.g., "rice_grain" → "rice")
  if (normalized.startsWith(base + "_")) return true;
  
  // Plural form (e.g., "tomatoes" → "tomato")
  if (normalized === base + "s" || normalized === base + "es") return true;
  
  // Base ingredient with common suffix
  const commonSuffixes = ['_grain', '_berry', '_seed', '_bean', '_pea', '_nut'];
  for (const suffix of commonSuffixes) {
    if (normalized === base + suffix) return true;
  }
  
  return false;
});
```

### Step 4: Return Override Result
```javascript
if (baseMatch) {
  return {
    status: "halal",
    confidenceLevel: "certain_halal",
    ingredientType: "natural",
    explanation: `Plain ${category} is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited.`,
    isBaseIngredientOverride: true,
    bypassAI: true
  };
}
```

---

## Fallback Behavior

1. **If ingredient is plain base** → Override applied, returns halal immediately
2. **If ingredient is processed** → Normal evaluation (knowledge base, AI, classification)
3. **If ingredient is not in base list** → Normal evaluation
4. **If ingredient matches base but has processed indicator** → Normal evaluation

---

## Integration with Halal Engine

The override is checked **FIRST** in `evaluateItem()`, before any AI or knowledge base lookup:

```javascript
export function evaluateItem(itemId, options = {}) {
  // ... setup code ...
  
  // Check for base ingredient override FIRST
  const baseOverride = getBaseIngredientOverride(normalizedId);
  if (baseOverride) {
    return {
      status: "halal",
      confidenceLevel: "certain_halal",
      // ... override result ...
    };
  }
  
  // Continue with normal evaluation if no override
  // ... rest of evaluation logic ...
}
```

---

## Example Outputs

### Example 1: Plain Base Ingredient (Override Applied)

**Input:** `rice`

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "certain_halal",
  "ingredientType": "natural",
  "explanation": "Plain grain is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited.",
  "simpleExplanation": "Plain grain is halal.",
  "isBaseIngredientOverride": true,
  "bypassAI": true,
  "confidenceScore": 100
}
```

---

### Example 2: Processed Variant (Normal Evaluation)

**Input:** `rice_flour`

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "conditional",
  "ingredientType": "processed",
  "explanation": "Rice flour is halal, but check for additives.",
  "isBaseIngredientOverride": false,
  "bypassAI": false
}
```
*(Note: This goes through normal evaluation, not override)*

---

### Example 3: Plain Vegetable (Override Applied)

**Input:** `tomato`

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "certain_halal",
  "ingredientType": "natural",
  "explanation": "Plain vegetable is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited.",
  "simpleExplanation": "Plain vegetable is halal.",
  "isBaseIngredientOverride": true,
  "bypassAI": true,
  "confidenceScore": 100
}
```

---

### Example 4: Processed Vegetable (Normal Evaluation)

**Input:** `tomato_paste`

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "conditional",
  "ingredientType": "processed",
  "explanation": "Tomato paste is halal, but check for preservatives and additives.",
  "isBaseIngredientOverride": false,
  "bypassAI": false
}
```

---

### Example 5: Plain Legume (Override Applied)

**Input:** `lentil`

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "certain_halal",
  "ingredientType": "natural",
  "explanation": "Plain legume is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited.",
  "simpleExplanation": "Plain legume is halal.",
  "isBaseIngredientOverride": true,
  "bypassAI": true,
  "confidenceScore": 100
}
```

---

## Testing Examples

### Test Case 1: Plain Base Ingredient
- **Input:** `wheat`
- **Expected:** Override applied, `halal`, `certain_halal`, `isBaseIngredientOverride: true`

### Test Case 2: Processed Variant
- **Input:** `wheat_flour`
- **Expected:** No override, normal evaluation

### Test Case 3: Plain Vegetable
- **Input:** `carrot`
- **Expected:** Override applied, `halal`, `certain_halal`

### Test Case 4: Processed Vegetable
- **Input:** `carrot_juice`
- **Expected:** No override, normal evaluation

### Test Case 5: Plain Fruit
- **Input:** `apple`
- **Expected:** Override applied, `halal`, `certain_halal`

### Test Case 6: Processed Fruit
- **Input:** `apple_juice`
- **Expected:** No override, normal evaluation

### Test Case 7: Plural Form
- **Input:** `tomatoes`
- **Expected:** Override applied (matches "tomato")

### Test Case 8: With Suffix
- **Input:** `rice_grain`
- **Expected:** Override applied (matches "rice")

---

## Benefits

1. **Immediate Halal Status:** Plain plant-based ingredients return halal instantly
2. **Bypasses AI Uncertainty:** No need to wait for AI or knowledge base lookup
3. **Clear Distinction:** Plain vs. processed variants handled correctly
4. **Performance:** Faster lookup for common ingredients
5. **Trust:** Users get immediate, confident answers for base ingredients

---

## Files Created/Modified

1. **`frontend/src/lib/baseIngredientOverrides.js`** (New)
   - Base ingredient list
   - Override logic
   - Processed indicator detection

2. **`frontend/src/lib/halalEngine.js`** (Updated)
   - Integrated override check at start of `evaluateItem()`
   - Override applied before any AI or knowledge base lookup

3. **`BASE_INGREDIENT_OVERRIDES.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Plain plant-based ingredients always return halal  
✅ Overrides bypass AI uncertainty  
✅ Processed variants evaluated normally  
✅ Comprehensive base ingredient list  
✅ Clear lookup logic  
✅ Proper fallback behavior
