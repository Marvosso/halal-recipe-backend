# Ingredient Classification Enhancement

## Overview
Enhanced the ingredient quick lookup system with comprehensive classification by type and confidence levels, with intelligent defaults for plant-based natural ingredients.

---

## Data Model Updates

### Ingredient Type Classification

**Types:**
- `natural`: Plant-based, unprocessed ingredients (fruits, vegetables, grains, herbs, spices)
- `processed`: Manufactured or processed ingredients (may contain additives)
- `animal`: Derived from animals (meat, dairy, eggs, gelatin)
- `alcohol-derived`: Contains or derived from alcohol (wine, vanilla extract with alcohol)

### Confidence Levels

**Levels:**
- `certain_halal`: Explicitly halal with high confidence (100%)
- `conditional`: Halal under certain conditions (slaughter method, source verification)
- `haram`: Explicitly prohibited (pork, alcohol)
- `rare_unknown`: Very rare ingredient with insufficient data (use as last resort)

---

## Classification Logic

### 1. Type Classification

```javascript
classifyIngredientType(ingredientId, ingredientData)
```

**Logic:**
1. Check explicit `category` from knowledge base
2. Check alcohol-derived patterns
3. Check animal-derived patterns
4. Check processed indicators
5. Check plant-based natural list
6. Default to `processed` if unknown

**Examples:**
- `apple` → `natural`
- `bacon` → `animal`
- `wine` → `alcohol-derived`
- `vanilla_extract` → `processed` (may contain alcohol)

---

### 2. Confidence Level Determination

```javascript
determineConfidenceLevel(ingredientType, status, ingredientData)
```

**Rules:**
- **Natural + Halal/Unknown** → `certain_halal` (default halal)
- **Animal + Halal/Unknown** → `conditional` (requires certification)
- **Alcohol-derived** → `haram`
- **Processed + Halal/Unknown** → `conditional` (may contain additives)
- **Explicit Haram** → `haram`
- **Conditional/Questionable** → `conditional`
- **Truly Unknown** → `rare_unknown` (last resort)

---

### 3. Default Halal for Natural Ingredients

**Plant-Based Natural Ingredients Default to Halal:**

```javascript
getDefaultNaturalStatus(ingredientId)
```

**Categories:**
- Fruits: apple, banana, orange, grape, etc.
- Vegetables: onion, garlic, tomato, potato, etc.
- Grains & Legumes: rice, wheat, lentils, chickpeas, etc.
- Nuts & Seeds: almond, walnut, cashew, etc.
- Herbs & Spices: basil, oregano, cumin, turmeric, etc.
- Plant Oils: olive oil, coconut oil, etc.
- Natural Sweeteners: honey, maple syrup, etc.

**Behavior:**
- If ingredient is in natural list and status is `unknown` → defaults to `halal` with `certain_halal` confidence
- Explanation: "Plant-based natural ingredients are generally halal unless specifically prohibited."

---

## Example Outputs

### Example 1: Natural Plant-Based (Default Halal)

**Input:** `apple`

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "certain_halal",
  "ingredientType": "natural",
  "explanation": "Plant-based natural ingredients are generally halal unless specifically prohibited.",
  "isDefaultHalal": true,
  "confidenceScore": 100
}
```

---

### Example 2: Animal-Derived (Conditional)

**Input:** `beef`

**Output:**
```json
{
  "status": "halal",
  "confidenceLevel": "conditional",
  "ingredientType": "animal",
  "explanation": "Beef is halal when slaughtered according to Islamic guidelines.",
  "isDefaultHalal": false,
  "confidenceScore": 85
}
```

---

### Example 3: Alcohol-Derived (Haram)

**Input:** `wine`

**Output:**
```json
{
  "status": "haram",
  "confidenceLevel": "haram",
  "ingredientType": "alcohol-derived",
  "explanation": "Alcoholic beverages are prohibited in Islam.",
  "isDefaultHalal": false,
  "confidenceScore": 0,
  "references": ["Qur'an 5:90"]
}
```

---

### Example 4: Processed (Conditional)

**Input:** `vanilla_extract`

**Output:**
```json
{
  "status": "questionable",
  "confidenceLevel": "conditional",
  "ingredientType": "processed",
  "explanation": "Some vanilla extracts contain alcohol. Look for alcohol-free versions.",
  "isDefaultHalal": false,
  "confidenceScore": 60,
  "alternatives": ["vanilla_powder", "alcohol_free_vanilla_extract"]
}
```

---

### Example 5: Rare Unknown (Last Resort)

**Input:** `obscure_ingredient_xyz`

**Output:**
```json
{
  "status": "unknown",
  "confidenceLevel": "rare_unknown",
  "ingredientType": "processed",
  "explanation": "Insufficient data — please verify with a qualified Islamic scholar",
  "isDefaultHalal": false,
  "confidenceScore": 40
}
```

---

## UI Enhancements

### QuickLookup Component

**New Display Elements:**
1. **Ingredient Type Badge**
   - Natural (Leaf icon, green)
   - Processed (Package icon, gray)
   - Animal-Derived (Meat icon, orange)
   - Alcohol-Derived (Alert icon, red)

2. **Confidence Level Badge**
   - Certain Halal (CheckCircle, green)
   - Conditional (AlertCircle, yellow)
   - Haram (XCircle, red)
   - Rare/Unknown (HelpCircle, gray)

**Visual Hierarchy:**
```
[Status Icon] Halal
[Type Badge] Natural
[Confidence Badge] Certain Halal
[Explanation]
[Alternatives]
```

---

## Classification Rules Summary

### Natural Ingredients
- **Default:** Halal (`certain_halal`)
- **Exception:** Only if explicitly marked haram in knowledge base
- **Examples:** Fruits, vegetables, grains, herbs, spices

### Animal-Derived Ingredients
- **Default:** Conditional (requires halal certification)
- **Exception:** Explicitly haram (pork, non-halal meat)
- **Examples:** Beef, chicken, milk, eggs, gelatin

### Alcohol-Derived Ingredients
- **Default:** Haram
- **Exception:** None (always haram)
- **Examples:** Wine, beer, vanilla extract with alcohol

### Processed Ingredients
- **Default:** Conditional (requires verification)
- **Exception:** Explicitly haram or halal in knowledge base
- **Examples:** Extracts, flavorings, additives

### Unknown Ingredients
- **First Check:** Is it natural? → Default to halal
- **Second Check:** Is it animal-derived? → Conditional
- **Third Check:** Is it processed? → Conditional
- **Last Resort:** Rare/Unknown (only if truly no classification possible)

---

## Files Created/Modified

1. **`frontend/src/lib/ingredientClassification.js`** (New)
   - Type classification logic
   - Confidence level determination
   - Default halal for natural ingredients
   - Display information helpers

2. **`frontend/src/lib/halalEngine.js`** (Updated)
   - Integrated classification system
   - Applied default halal for natural ingredients
   - Added `confidenceLevel` and `ingredientType` to results

3. **`frontend/src/components/QuickLookup.jsx`** (Updated)
   - Added type and confidence level badges
   - Enhanced UI to display classification information

4. **`frontend/src/components/QuickLookup.css`** (Updated)
   - Added styles for classification badges

5. **`INGREDIENT_CLASSIFICATION_ENHANCEMENT.md`** (This file)
   - Complete documentation

---

## Benefits

1. **Intelligent Defaults:** Plant-based natural ingredients default to halal
2. **Clear Classification:** Users understand ingredient type and confidence
3. **Reduced Unknowns:** Only truly rare ingredients marked as unknown
4. **Better UX:** Visual badges make classification clear at a glance
5. **Trust Building:** Transparent confidence levels build user trust

---

## Example Classification Flow

**Input:** `quinoa`

1. **Type Classification:**
   - Check knowledge base → Not found
   - Check natural list → Found in grains
   - **Result:** `natural`

2. **Status Evaluation:**
   - Knowledge base lookup → `unknown`
   - Apply default halal for natural → `halal`

3. **Confidence Level:**
   - Type: `natural`
   - Status: `halal`
   - **Result:** `certain_halal`

4. **Final Output:**
   ```json
   {
     "status": "halal",
     "confidenceLevel": "certain_halal",
     "ingredientType": "natural",
     "isDefaultHalal": true
   }
   ```

---

## Testing Examples

### Test Case 1: Natural Ingredient (Default Halal)
- **Input:** `basil`
- **Expected:** `halal`, `certain_halal`, `natural`

### Test Case 2: Animal Ingredient (Conditional)
- **Input:** `chicken`
- **Expected:** `halal`, `conditional`, `animal`

### Test Case 3: Alcohol-Derived (Haram)
- **Input:** `white_wine`
- **Expected:** `haram`, `haram`, `alcohol-derived`

### Test Case 4: Processed (Conditional)
- **Input:** `artificial_vanilla_flavoring`
- **Expected:** `questionable`, `conditional`, `processed`

### Test Case 5: Rare Unknown
- **Input:** `xyz_obscure_ingredient_123`
- **Expected:** `unknown`, `rare_unknown`, `processed`

---

## Success Criteria

✅ Ingredients classified by type (natural, processed, animal, alcohol-derived)  
✅ Confidence levels assigned (certain_halal, conditional, haram, rare_unknown)  
✅ Plant-based natural ingredients default to halal  
✅ Unknown used only as last resort  
✅ UI displays type and confidence badges  
✅ Classification logic integrated into halal engine  
✅ Examples provided for all classification types
