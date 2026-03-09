# Recipe Conversion Test Analysis

## Input Recipe
```
- Spaghetti
- Bacon
- Eggs
- Parmesan cheese
```

## Expected Output
- **Bacon** → replaced with halal bacon (turkey bacon or beef bacon)
- **Parmesan cheese** → flagged as conditional (requires halal certification)
- **Final recipe** → halal-compliant

---

## Code Flow Analysis

### Step 1: Recipe Text Processing
```
Input: "Spaghetti\nBacon\nEggs\nParmesan cheese"
```

### Step 2: Ingredient Detection
The `convertRecipeWithJson` function will:
1. Parse the recipe text
2. Extract ingredient names
3. Normalize each ingredient (lowercase, spaces → underscores)

### Step 3: Ingredient Evaluation

#### A. Spaghetti
- **Normalized:** "spaghetti"
- **Evaluation:** Likely halal (pasta is generally halal)
- **Status:** halal
- **Action:** No replacement needed

#### B. Bacon
- **Normalized:** "bacon"
- **Modifier Detection:** `detectModifiers("bacon")` → `hasHaramModifier: true` (bacon is in HARAM_MODIFIERS list)
- **Evaluation:** 
  - Haram modifier detected → returns haram immediately
  - Status: "haram"
  - Alternatives: ["smoked_turkey_bacon", "beef_bacon_halal"]
  - Replacement ratio: "1:1"
- **Action:** Replace with halal alternative (turkey bacon or beef bacon)

#### C. Eggs
- **Normalized:** "eggs"
- **Evaluation:** Likely halal (eggs are generally halal)
- **Status:** halal
- **Action:** No replacement needed

#### D. Parmesan cheese
- **Normalized:** "parmesan_cheese" or "parmesan"
- **Knowledge Base Entry:** Marked as "conditional" (can be halal if halal-certified or uses microbial rennet)
- **Evaluation:**
  - Status: "conditional" (requires halal certification)
  - Alternatives: ["vegetarian_parmesan", "halal_certified_parmesan"]
  - Confidence: Medium (0.5 base score)
- **Action:** Flag as conditional, suggest halal alternatives

---

## Expected Conversion Result

### Issues Array
```json
[
  {
    "ingredient": "bacon",
    "ingredient_id": "bacon",
    "status": "haram",
    "confidenceScore": 0,
    "confidenceLevel": "haram",
    "explanation": "Bacon is made from pork, which is explicitly prohibited in the Qur'an (Surah Al-Baqarah 2:173).",
    "alternatives": ["smoked_turkey_bacon", "beef_bacon_halal"],
    "replacement": "smoked_turkey_bacon",
    "replacementRatio": "1:1",
    "culinaryNotes": [
      "Turkey bacon has lower fat content than pork bacon - add a dash of oil when cooking if needed",
      "Cooking time may be slightly shorter - watch for doneness",
      "Beef bacon provides a richer, more similar flavor profile"
    ]
  },
  {
    "ingredient": "parmesan cheese",
    "ingredient_id": "parmesan_cheese",
    "status": "conditional",
    "confidenceScore": 50, // Medium confidence (conditional status)
    "confidenceLevel": "conditional",
    "explanation": "Parmesan cheese often uses animal rennet, which may not be halal. Requires halal certification or use of microbial rennet.",
    "alternatives": ["vegetarian_parmesan", "halal_certified_parmesan"],
    "replacement": "vegetarian_parmesan", // Will be replaced with halal alternative
    "replacementRatio": "1:1",
    "requiresVerification": true // Conditional status requires verification
  }
]
```

### Converted Recipe Text
```
- Spaghetti
- Turkey bacon (or beef bacon)
- Eggs
- Vegetarian parmesan (or halal-certified parmesan)
```

### Final Recipe Status
- **Confidence Score:** ~75-85 (high, bacon replaced, parmesan flagged as conditional)
- **Halal-Compliant:** Yes (after replacements)
- **Issues Count:** 2 (bacon replaced, parmesan cheese flagged and replaced)

---

## Verification Checklist

✅ **Bacon replaced with halal alternative**  
✅ **Parmesan cheese flagged as conditional and replaced with halal alternative**  
✅ **Final recipe is halal-compliant**  
✅ **Spaghetti and eggs remain unchanged (halal)**

---

## Files Involved

- `frontend/src/lib/convertRecipeJson.js` - Main conversion logic
- `frontend/src/lib/halalEngine.js` - Ingredient evaluation
- `frontend/src/lib/ingredientModifiers.js` - Modifier detection (bacon detected as haram)
- `frontend/src/data/halal_knowledge.json` - Knowledge base (bacon alternatives, cheese info)
