# Ingredient Modifier Detection

## Overview
Adds modifier detection to ingredient quick lookup, identifying haram and processing modifiers that affect ingredient status.

---

## Modifier Taxonomy

### 1. Haram Modifiers (Override Base Status)

**Alcohol-based:**
- wine, alcohol, alcoholic, beer, whiskey, rum, vodka, brandy, sherry, port, vermouth, liqueur, cognac, champagne

**Pork-based:**
- pork, bacon, lard, ham, prosciutto, pancetta, pepperoni, sausage_pork, pork_fat, rendered_pork

**Other:**
- non_halal, non_halal_meat, unslaughtered, gelatin_pork, pork_gelatin

**Behavior:** If detected, ingredient is **haram** regardless of base ingredient.

---

### 2. Processing Modifiers (Add Conditions)

**Cooking Methods:**
- fried, braised, sauteed, marinated, glazed, smoked, cured, brined, pickled, preserved

**Flavoring:**
- flavored, seasoned, spiced

**Processing:**
- fermented

**Behavior:** If detected, base ingredient status is maintained but marked as **conditional** with verification required.

---

### 3. Neutral Modifiers (No Effect)

**State:**
- fresh, dried, frozen, canned, organic, raw, cooked, boiled, steamed, baked, roasted, grilled

**Form:**
- whole, chopped, sliced, diced, minced, ground, pureed, mashed, crushed

**Type:**
- whole_grain, brown, white, red, green, yellow, black, wild, cultivated

**Behavior:** No effect on halal status.

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
- Check for processing modifiers (exact match)
- Check for neutral modifiers (exact match)

### Step 4: Check Compound Patterns
```javascript
// Examples: "wine-braised", "pork-flavored", "alcohol-infused"
const compoundHaramPatterns = [
  /wine[_\-\s]+(braised|marinated|glazed|sauce|reduction)/i,
  /alcohol[_\-\s]+(based|flavored|infused)/i,
  /pork[_\-\s]+(flavored|seasoned|based)/i,
  /bacon[_\-\s]+(flavored|seasoned|bits)/i,
  /lard[_\-\s]+(based|rendered)/i
];
```

### Step 5: Apply Modifier Logic
1. **Haram modifier detected** → Return haram immediately
2. **Processing modifier detected** → Add conditional note, keep base status
3. **No modifiers** → Return base ingredient result

---

## Example Queries and Results

### Example 1: Haram Modifier (Wine)

**Input:** `wine-braised chicken`

**Detection:**
```json
{
  "haramModifiers": ["wine"],
  "hasHaramModifier": true
}
```

**Result:**
```json
{
  "status": "haram",
  "confidenceLevel": "haram",
  "confidenceScore": 0,
  "explanation": "This ingredient contains alcohol (wine), which is haram according to Islamic law.",
  "simpleExplanation": "Contains wine, which is haram.",
  "isHaramModifierOverride": true,
  "haramModifiers": ["wine"]
}
```

---

### Example 2: Haram Modifier (Pork)

**Input:** `pork-flavored beans`

**Detection:**
```json
{
  "haramModifiers": ["pork"],
  "hasHaramModifier": true
}
```

**Result:**
```json
{
  "status": "haram",
  "confidenceLevel": "haram",
  "confidenceScore": 0,
  "explanation": "This ingredient contains pork or pork-derived products (pork), which is haram.",
  "simpleExplanation": "Contains pork, which is haram.",
  "isHaramModifierOverride": true,
  "haramModifiers": ["pork"]
}
```

---

### Example 3: Processing Modifier (Fried)

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

**Base Ingredient:** `rice` (halal, certain_halal)

**Result:**
```json
{
  "status": "conditional",
  "confidenceLevel": "conditional",
  "confidenceScore": 80,
  "explanation": "Plain grain is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited. However, Fried items may use non-halal oils or cross-contamination. Verify cooking method and oil source.",
  "simpleExplanation": "Base ingredient is halal, but fried items may use non-halal oils or cross-contamination. verify cooking method and oil source.",
  "processingModifiers": [{
    "type": "fried",
    "requiresVerification": true
  }],
  "requiresVerification": true
}
```

---

### Example 4: Processing Modifier (Flavored)

**Input:** `flavored rice`

**Detection:**
```json
{
  "processingModifiers": [{
    "type": "flavored",
    "level": "conditional",
    "explanation": "Flavored items may contain alcohol-based flavorings or non-halal additives. Check ingredient list.",
    "requiresVerification": true
  }],
  "hasProcessingModifier": true
}
```

**Base Ingredient:** `rice` (halal, certain_halal)

**Result:**
```json
{
  "status": "conditional",
  "confidenceLevel": "conditional",
  "confidenceScore": 80,
  "explanation": "Plain grain is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited. However, Flavored items may contain alcohol-based flavorings or non-halal additives. Check ingredient list.",
  "simpleExplanation": "Base ingredient is halal, but flavored items may contain alcohol-based flavorings or non-halal additives. check ingredient list.",
  "processingModifiers": [{
    "type": "flavored",
    "requiresVerification": true
  }],
  "requiresVerification": true
}
```

---

### Example 5: Processing Modifier (Fermented)

**Input:** `fermented soybeans`

**Detection:**
```json
{
  "processingModifiers": [{
    "type": "fermented",
    "level": "conditional",
    "explanation": "Fermented items may contain alcohol. Verify fermentation process and alcohol content.",
    "requiresVerification": true
  }],
  "hasProcessingModifier": true
}
```

**Base Ingredient:** `soybean` (halal, certain_halal)

**Result:**
```json
{
  "status": "conditional",
  "confidenceLevel": "conditional",
  "confidenceScore": 80,
  "explanation": "Plain legume is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited. However, Fermented items may contain alcohol. Verify fermentation process and alcohol content.",
  "simpleExplanation": "Base ingredient is halal, but fermented items may contain alcohol. verify fermentation process and alcohol content.",
  "processingModifiers": [{
    "type": "fermented",
    "requiresVerification": true
  }],
  "requiresVerification": true
}
```

---

### Example 6: Neutral Modifier (No Effect)

**Input:** `fresh tomatoes`

**Detection:**
```json
{
  "neutralModifiers": ["fresh"],
  "hasNeutralModifier": true
}
```

**Base Ingredient:** `tomato` (halal, certain_halal)

**Result:**
```json
{
  "status": "halal",
  "confidenceLevel": "certain_halal",
  "confidenceScore": 100,
  "explanation": "Plain vegetable is halal. Plant-based ingredients in their natural, unprocessed form are generally halal unless specifically prohibited.",
  "simpleExplanation": "Plain vegetable is halal."
}
```
*(No change from base ingredient result)*

---

### Example 7: Multiple Modifiers (Haram Takes Precedence)

**Input:** `wine-marinated chicken`

**Detection:**
```json
{
  "haramModifiers": ["wine"],
  "processingModifiers": [{
    "type": "marinated"
  }],
  "hasHaramModifier": true,
  "hasProcessingModifier": true
}
```

**Result:**
```json
{
  "status": "haram",
  "confidenceLevel": "haram",
  "confidenceScore": 0,
  "explanation": "This ingredient contains alcohol (wine), which is haram according to Islamic law.",
  "isHaramModifierOverride": true
}
```
*(Haram modifier overrides everything)*

---

### Example 8: Base Ingredient with Processing Modifier

**Input:** `smoked salmon`

**Detection:**
```json
{
  "processingModifiers": [{
    "type": "smoked",
    "level": "conditional",
    "explanation": "Smoked items may use non-halal smoking agents. Verify smoking method.",
    "requiresVerification": true
  }],
  "hasProcessingModifier": true
}
```

**Base Ingredient:** `salmon` (halal, conditional - requires halal certification)

**Result:**
```json
{
  "status": "conditional",
  "confidenceLevel": "conditional",
  "confidenceScore": 70,
  "explanation": "Salmon is halal when slaughtered according to Islamic guidelines. However, Smoked items may use non-halal smoking agents. Verify smoking method.",
  "simpleExplanation": "Base ingredient is halal, but smoked items may use non-halal smoking agents. verify smoking method.",
  "processingModifiers": [{
    "type": "smoked",
    "requiresVerification": true
  }],
  "requiresVerification": true
}
```

---

## Logic Flow

```
1. Normalize ingredient ID
   ↓
2. Detect modifiers
   ↓
3. Haram modifier detected?
   ├─ YES → Return haram immediately (bypasses everything)
   └─ NO → Continue
   ↓
4. Extract base ingredient (remove modifiers)
   ↓
5. Evaluate base ingredient
   ├─ Base ingredient override? → Apply override
   └─ Normal evaluation → Knowledge base lookup
   ↓
6. Processing modifier detected?
   ├─ YES → Add conditional note, reduce confidence
   └─ NO → Return base result
   ↓
7. Return final result
```

---

## Files Created/Modified

1. **`frontend/src/lib/ingredientModifiers.js`** (New)
   - Modifier taxonomy
   - Detection logic
   - Modifier application logic

2. **`frontend/src/lib/halalEngine.js`** (Updated)
   - Integrated modifier detection at start of evaluation
   - Haram modifiers override everything
   - Processing modifiers add conditions

3. **`INGREDIENT_MODIFIER_DETECTION.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Haram modifiers detected and override base status  
✅ Processing modifiers detected and add conditions  
✅ Base ingredient determines status unless overridden  
✅ Comprehensive modifier taxonomy  
✅ Clear detection logic  
✅ Example queries and results provided
