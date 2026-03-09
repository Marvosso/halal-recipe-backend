# Modifier and Variant Detection System

## Overview
Comprehensive modifier and variant detection for Halal Kitchen quick lookup. Detects haram modifiers (override base status), conditional modifiers (add verification requirements), and processing modifiers (add conditions).

---

## Modifier Taxonomy

### 1. Haram Modifiers (Override Base Status)

**Behavior:** MUST override base ingredient status, even if base is halal.

**Categories:**
- **Alcohol-based:** wine, alcohol, alcoholic, beer, whiskey, rum, vodka, brandy, sherry, port, vermouth, liqueur, cognac, champagne, ethanol, ethyl_alcohol, grain_alcohol
- **Pork-based:** pork, bacon, lard, ham, prosciutto, pancetta, pepperoni, sausage_pork, pork_fat, rendered_pork, pork_belly
- **Non-halal meat:** non_halal, non_halal_meat, unslaughtered
- **Gelatin:** gelatin, gelatin_pork, pork_gelatin, animal_gelatin (assumed haram unless halal-certified)

**Examples:**
- `wine-braised chicken` → haram (wine modifier overrides halal chicken)
- `pork-flavored beans` → haram (pork modifier overrides halal beans)
- `gelatin dessert` → haram (gelatin modifier)

---

### 2. Conditional Modifiers (Require Verification)

**Behavior:** Add verification requirements and reduce confidence. Don't override status but mark as conditional.

**Modifiers:**
- **enzyme:** May be animal or microbial-derived
- **rennet:** Used in cheese, may be animal or microbial-derived
- **emulsifier:** May be animal or plant-derived
- **flavoring/flavor:** May contain alcohol or animal-derived ingredients
- **natural_flavor:** May be animal or plant-derived
- **artificial_flavor:** Generally halal but may contain alcohol solvents
- **lecithin:** May be soy (halal) or egg-derived (requires certification)
- **mono_glyceride/diglyceride:** May be animal or plant-derived
- **whey:** Derived from milk, requires halal certification
- **casein:** Derived from milk, requires halal certification

**Examples:**
- `cheese with rennet` → conditional (check rennet source)
- `bread with enzyme` → conditional (check enzyme source)
- `ice cream with emulsifier` → conditional (check emulsifier source)

---

### 3. Processing Modifiers (Add Conditions)

**Behavior:** Add conditional notes but keep base status. Reduce confidence slightly.

**Modifiers:**
- **fried:** May use non-halal oils or cross-contamination
- **fermented:** May contain alcohol
- **smoked:** May use non-halal smoking agents
- **flavored:** May contain alcohol-based flavorings
- **marinated:** May contain wine, alcohol, or non-halal ingredients
- **cured:** May contain non-halal curing agents
- **brined:** May contain non-halal brine ingredients
- **glazed:** May contain alcohol or non-halal ingredients
- **seasoned/spiced:** May contain non-halal seasonings
- **braised:** May use wine or alcohol in cooking liquid
- **sauteed:** May use wine or non-halal oils
- **pickled:** May contain alcohol in pickling solution
- **preserved:** May contain non-halal preservatives

**Examples:**
- `fried rice` → conditional (check oil source)
- `fermented soybeans` → conditional (check alcohol content)
- `smoked salmon` → conditional (check smoking method)

---

### 4. Neutral Modifiers (No Effect)

**Behavior:** No effect on halal status.

**Modifiers:**
- fresh, dried, frozen, canned, organic, raw, cooked, boiled, steamed, baked, roasted, grilled
- whole, chopped, sliced, diced, minced, ground, pureed, mashed, crushed
- whole_grain, brown, white, red, green, yellow, black, wild, cultivated

---

## Variant Detection

### Variant Types

**Flour Variants:**
- `rice_flour` → base: `rice`, type: `flour`
- `wheat_flour` → base: `wheat`, type: `flour`

**Oil Variants:**
- `olive_oil` → base: `olive`, type: `oil`
- `coconut_oil` → base: `coconut`, type: `oil`

**Extract Variants:**
- `vanilla_extract` → base: `vanilla`, type: `extract`
- `almond_extract` → base: `almond`, type: `extract`

**Other Variants:**
- `tomato_paste` → base: `tomato`, type: `paste`
- `tomato_sauce` → base: `tomato`, type: `sauce`
- `apple_juice` → base: `apple`, type: `juice`

---

## Detection Logic

### Step 1: Normalize Ingredient ID
```javascript
const normalized = ingredientId.toLowerCase().trim().replace(/\s+/g, "_");
```

### Step 2: Split into Parts
```javascript
const parts = normalized.split(/[_\-\s]+/);
```

### Step 3: Check Each Part
- Check for haram modifiers (exact match or contains)
- Check for conditional modifiers (exact match)
- Check for processing modifiers (exact match)
- Check for neutral modifiers (exact match)

### Step 4: Check Compound Patterns
```javascript
// Haram compound patterns
/wine[_\-\s]+(braised|marinated|glazed|sauce|reduction|infused)/i
/alcohol[_\-\s]+(based|flavored|infused|extract)/i
/pork[_\-\s]+(flavored|seasoned|based|fat|gelatin)/i
/gelatin[_\-\s]+(pork|animal|non_halal)/i

// Conditional compound patterns
/animal[_\-\s]+(enzyme|rennet|gelatin)/i
/pork[_\-\s]+(enzyme|rennet)/i
/microbial[_\-\s]+(enzyme|rennet)/i
/plant[_\-\s]+(enzyme|rennet)/i
```

### Step 5: Apply Modifier Logic
1. **Haram modifier detected** → Return haram immediately (overrides everything)
2. **Conditional modifier detected** → Add conditional note, reduce confidence
3. **Processing modifier detected** → Add conditional note, keep base status
4. **No modifiers** → Return base ingredient result

---

## Example Queries and Outputs

### Example 1: Haram Modifier Override

**Input:** `wine-braised chicken`

**Detection:**
```json
{
  "haramModifiers": ["wine"],
  "hasHaramModifier": true
}
```

**Output:**
```json
{
  "status": "haram",
  "confidenceLevel": "haram",
  "confidenceScore": 0,
  "explanation": "This ingredient contains alcohol (wine), which is haram according to Islamic law. The Qur'an explicitly prohibits intoxicants (Qur'an 5:90).",
  "simpleExplanation": "Contains wine, which is haram.",
  "isHaramModifierOverride": true,
  "haramModifiers": ["wine"],
  "trace": ["Haram modifier detected: wine (overrides base ingredient)"]
}
```

---

### Example 2: Conditional Modifier

**Input:** `cheese with rennet`

**Detection:**
```json
{
  "conditionalModifiers": [{
    "type": "rennet",
    "level": "conditional",
    "explanation": "Rennet is used in cheese making and may be animal-derived (requires halal certification) or microbial (generally halal). Check the rennet source.",
    "requiresVerification": true,
    "confidenceReduction": 20
  }],
  "hasConditionalModifier": true
}
```

**Base Ingredient:** `cheese` (conditional, 50%)

**Output:**
```json
{
  "status": "conditional",
  "confidenceLevel": "conditional",
  "confidenceScore": 30,
  "explanation": "Cheese is derived from animals and requires halal certification. The source animal must be halal, and the product must be processed according to Islamic guidelines. Check for halal certification. However, Rennet is used in cheese making and may be animal-derived (requires halal certification) or microbial (generally halal). Check the rennet source.",
  "simpleExplanation": "Base ingredient is halal, but rennet is used in cheese making and may be animal-derived (requires halal certification) or microbial (generally halal). check the rennet source.",
  "conditionalModifiers": [{
    "type": "rennet",
    "requiresVerification": true
  }],
  "requiresVerification": true
}
```

---

### Example 3: Processing Modifier

**Input:** `fried rice`

**Detection:**
```json
{
  "processingModifiers": [{
    "type": "fried",
    "level": "conditional",
    "explanation": "Fried items may use non-halal oils or cross-contamination. Verify cooking method and oil source.",
    "requiresVerification": true
  }],
  "hasProcessingModifier": true
}
```

**Base Ingredient:** `rice` (halal, certain_halal, 100%)

**Output:**
```json
{
  "status": "conditional",
  "confidenceLevel": "conditional",
  "confidenceScore": 80,
  "explanation": "Rice is a natural, plant-based ingredient. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited in Islamic law. However, Fried items may use non-halal oils or cross-contamination. Verify cooking method and oil source.",
  "simpleExplanation": "Base ingredient is halal, but fried items may use non-halal oils or cross-contamination. verify cooking method and oil source.",
  "processingModifiers": [{
    "type": "fried",
    "requiresVerification": true
  }],
  "requiresVerification": true
}
```

---

### Example 4: Multiple Modifiers (Haram Takes Precedence)

**Input:** `wine-marinated chicken with enzyme`

**Detection:**
```json
{
  "haramModifiers": ["wine"],
  "conditionalModifiers": [{
    "type": "enzyme"
  }],
  "processingModifiers": [{
    "type": "marinated"
  }],
  "hasHaramModifier": true,
  "hasConditionalModifier": true,
  "hasProcessingModifier": true
}
```

**Output:**
```json
{
  "status": "haram",
  "confidenceLevel": "haram",
  "confidenceScore": 0,
  "explanation": "This ingredient contains alcohol (wine), which is haram according to Islamic law. The Qur'an explicitly prohibits intoxicants (Qur'an 5:90).",
  "isHaramModifierOverride": true
}
```
*(Haram modifier overrides everything)*

---

### Example 5: Variant Detection

**Input:** `rice_flour`

**Variant Detection:**
```json
{
  "isVariant": true,
  "baseIngredient": "rice",
  "variantType": "flour",
  "variantModifiers": ["flour"]
}
```

**Base Ingredient:** `rice` (halal, certain_halal, 100%)

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "conditional",
  "confidenceScore": 75,
  "explanation": "Rice flour is a processed plant-based ingredient. While the base ingredient is halal, processing may introduce additives or cross-contamination. Check the ingredient list for non-halal additives.",
  "isVariant": true,
  "baseIngredient": "rice",
  "variantType": "flour"
}
```

---

### Example 6: Gelatin Modifier (Haram)

**Input:** `gelatin dessert`

**Detection:**
```json
{
  "haramModifiers": ["gelatin"],
  "hasHaramModifier": true
}
```

**Output:**
```json
{
  "status": "haram",
  "confidenceLevel": "haram",
  "confidenceScore": 0,
  "explanation": "This ingredient contains gelatin, which is typically derived from pork or non-halal animals. Unless specifically halal-certified, gelatin is considered haram.",
  "simpleExplanation": "Contains gelatin, which is haram.",
  "isHaramModifierOverride": true
}
```

---

### Example 7: Conditional Modifier on Halal Base

**Input:** `bread with enzyme`

**Detection:**
```json
{
  "conditionalModifiers": [{
    "type": "enzyme",
    "level": "conditional",
    "explanation": "Enzymes may be derived from animal or microbial sources. Animal-derived enzymes require halal certification. Check the enzyme source.",
    "requiresVerification": true,
    "confidenceReduction": 15
  }],
  "hasConditionalModifier": true
}
```

**Base Ingredient:** `bread` (halal, conditional, 75%)

**Output:**
```json
{
  "status": "conditional",
  "confidenceLevel": "conditional",
  "confidenceScore": 60,
  "explanation": "Bread is generally halal. However, Enzymes may be derived from animal or microbial sources. Animal-derived enzymes require halal certification. Check the enzyme source.",
  "simpleExplanation": "Base ingredient is halal, but enzymes may be derived from animal or microbial sources. animal-derived enzymes require halal certification. check the enzyme source.",
  "conditionalModifiers": [{
    "type": "enzyme"],
  "requiresVerification": true
}
```

---

## Lookup Flow with Modifiers

```
1. Normalize ingredient ID
   ↓
2. Detect modifiers
   ├─ Haram modifier? → Return haram (OVERRIDES EVERYTHING)
   └─ Continue
   ↓
3. Extract base ingredient
   ↓
4. Check taxonomy
   ↓
5. Check base ingredient override
   ↓
6. Knowledge base lookup
   ↓
7. Apply modifier logic
   ├─ Conditional modifier? → Add conditional note, reduce confidence
   ├─ Processing modifier? → Add conditional note, keep base status
   └─ No modifiers? → Return base result
   ↓
8. Return final result
```

---

## Files Created/Modified

1. **`frontend/src/lib/ingredientModifiers.js`** (Updated)
   - Added conditional modifiers
   - Enhanced haram modifiers (added gelatin)
   - Added variant detection
   - Improved compound pattern matching

2. **`MODIFIER_VARIANT_DETECTION.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Haram modifiers detected and override base halal ingredients  
✅ Conditional modifiers detected and add verification requirements  
✅ Processing modifiers detected and add conditions  
✅ Variant detection implemented  
✅ Comprehensive modifier taxonomy  
✅ Clear detection logic  
✅ Example queries and outputs provided
