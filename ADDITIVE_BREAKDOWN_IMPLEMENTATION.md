# Additive and E-Number Breakdown Implementation

## Overview
Premium feature that detects additives and E-numbers in ingredients, explains their halal status, and highlights haram or questionable additives with simplified explanations.

---

## Additive Database Structure

### Schema

```typescript
interface Additive {
  e_number: string | null;           // E-number (e.g., "E120", "E471")
  name: string;                       // Common name
  category: string;                   // "Colorant", "Emulsifier", "Gelling Agent", etc.
  halal_status: "halal" | "conditional" | "haram" | "questionable";
  source: "plant" | "animal" | "synthetic" | "microbial" | "mineral" | "unknown";
  explanation: string;                 // Detailed explanation
  simple_explanation: string;         // Simplified explanation
  requires_verification: boolean;     // Whether verification is needed
  common_in: string[];                // Common food types containing this additive
}
```

### Database Entries

**Haram Additives:**
- **E120 (Cochineal/Carmine)**: Derived from insects, often processed with alcohol
- **E441 (Gelatin)**: Typically from pork or non-halal animals

**Conditional Additives:**
- **E471 (Mono- and Diglycerides)**: Can be plant or animal-derived
- **E472 (Esters of Mono- and Diglycerides)**: Can be plant or animal-derived
- **E322 (Lecithin)**: Can be soy (halal) or egg-derived (needs certification)
- **Rennet**: Can be animal (needs certification) or microbial (halal)
- **Enzymes**: Can be animal, plant, or microbial-derived

**Halal Additives:**
- **E300 (Ascorbic Acid/Vitamin C)**: Synthetic, halal
- **E406 (Agar-Agar)**: Plant-based, halal
- **E621 (MSG)**: Synthetic, halal
- **E160a (Beta-Carotene)**: Plant-derived, halal

---

## Detection Logic

### E-Number Detection

```javascript
// Pattern: E followed by 3-4 digits, optionally with letter suffix
const E_NUMBER_PATTERN = /\bE\d{3}[a-z]?\b/gi;

// Example matches:
// "E120" → found
// "E471" → found
// "E160a" → found
// "E-120" → found (with hyphen)
```

### Additive Name Detection

```javascript
// Common additive name patterns:
- "gelatin"
- "rennet"
- "enzymes"
- "mono- and diglycerides"
- "lecithin"
- "caramel color"
- "carmine"
- "cochineal"
- "ascorbic acid"
- "MSG" / "monosodium glutamate"
- "agar-agar"
- "beta-carotene"
```

### Detection Flow

```
Ingredient List Text
    ↓
1. Extract E-numbers (regex pattern)
    ↓
2. Extract additive names (pattern matching)
    ↓
3. Lookup each additive in database
    ├─ Found → Get halal status and explanation
    └─ Not Found → Mark as "questionable", requires verification
    ↓
4. Categorize by halal status
    ├─ Halal
    ├─ Conditional
    ├─ Haram
    └─ Questionable
    ↓
5. Generate breakdown and warnings
```

---

## Example Outputs

### Example 1: Ingredient with Haram Additives

**Input:** `"Sugar, E120 (Cochineal), E441 (Gelatin), Natural Flavors"`

**Output:**
```json
{
  "has_additives": true,
  "total_additives": 2,
  "summary": {
    "halal_count": 0,
    "conditional_count": 0,
    "haram_count": 2,
    "questionable_count": 0,
    "requires_verification_count": 2
  },
  "breakdown": {
    "halal": [],
    "conditional": [],
    "haram": [
      {
        "e_number": "E120",
        "name": "Cochineal / Carmine",
        "category": "Colorant",
        "halal_status": "haram",
        "source": "animal",
        "explanation": "E120 (Cochineal/Carmine) is derived from crushed cochineal insects. While some scholars consider insects halal, most consider E120 haram because it's typically processed with alcohol or non-halal methods. Avoid unless halal-certified.",
        "simple_explanation": "E120 is made from insects and often processed with alcohol. It's generally considered haram unless halal-certified.",
        "requires_verification": true,
        "found_as": "E120",
        "common_in": ["candy", "yogurt", "beverages", "cosmetics"]
      },
      {
        "e_number": "E441",
        "name": "Gelatin",
        "category": "Gelling Agent",
        "halal_status": "haram",
        "source": "animal",
        "explanation": "E441 (Gelatin) is typically derived from pork or non-halal animals. Unless specifically halal-certified, gelatin is considered haram. Look for halal-certified gelatin or plant-based alternatives like agar-agar (E406).",
        "simple_explanation": "E441 (Gelatin) usually comes from pork or non-halal animals. It's haram unless halal-certified.",
        "requires_verification": true,
        "found_as": "E441",
        "common_in": ["marshmallows", "gummy candies", "jellies", "yogurts", "desserts"]
      }
    ],
    "questionable": []
  },
  "warnings": [
    {
      "type": "haram_additives",
      "severity": "high",
      "message": "This ingredient contains 2 haram additive(s). Avoid this product.",
      "additives": [
        {
          "e_number": "E120",
          "name": "Cochineal / Carmine",
          "explanation": "E120 is made from insects and often processed with alcohol. It's generally considered haram unless halal-certified."
        },
        {
          "e_number": "E441",
          "name": "Gelatin",
          "explanation": "E441 (Gelatin) usually comes from pork or non-halal animals. It's haram unless halal-certified."
        }
      ]
    }
  ],
  "summary_explanation": "⚠️ This ingredient contains 2 haram additive(s) and should be avoided. Total additives detected: 2.",
  "detailed_breakdown": [...]
}
```

### Example 2: Ingredient with Conditional Additives

**Input:** `"Wheat Flour, E471 (Mono- and Diglycerides), E322 (Lecithin), Salt"`

**Output:**
```json
{
  "has_additives": true,
  "total_additives": 2,
  "summary": {
    "halal_count": 0,
    "conditional_count": 2,
    "haram_count": 0,
    "questionable_count": 0,
    "requires_verification_count": 2
  },
  "breakdown": {
    "halal": [],
    "conditional": [
      {
        "e_number": "E471",
        "name": "Mono- and Diglycerides",
        "halal_status": "conditional",
        "simple_explanation": "E471 can come from plants (halal) or animals (needs halal certification). Check the source.",
        "requires_verification": true
      },
      {
        "e_number": "E322",
        "name": "Lecithin",
        "halal_status": "conditional",
        "simple_explanation": "E322 can come from soy (halal) or eggs (needs halal certification).",
        "requires_verification": true
      }
    ],
    "haram": [],
    "questionable": []
  },
  "warnings": [
    {
      "type": "questionable_additives",
      "severity": "medium",
      "message": "This ingredient contains 2 questionable additive(s) that require verification.",
      "additives": [...]
    },
    {
      "type": "verification_required",
      "severity": "medium",
      "message": "2 additive(s) require verification of source or halal certification.",
      "count": 2
    }
  ],
  "summary_explanation": "⚠️ This ingredient contains 2 questionable additive(s) that require verification. Total additives detected: 2."
}
```

### Example 3: Ingredient with Halal Additives Only

**Input:** `"Sugar, E300 (Ascorbic Acid), E406 (Agar-Agar), Natural Flavors"`

**Output:**
```json
{
  "has_additives": true,
  "total_additives": 2,
  "summary": {
    "halal_count": 2,
    "conditional_count": 0,
    "haram_count": 0,
    "questionable_count": 0,
    "requires_verification_count": 0
  },
  "breakdown": {
    "halal": [
      {
        "e_number": "E300",
        "name": "Ascorbic Acid (Vitamin C)",
        "halal_status": "halal",
        "simple_explanation": "E300 is Vitamin C and is halal."
      },
      {
        "e_number": "E406",
        "name": "Agar-Agar",
        "halal_status": "halal",
        "simple_explanation": "E406 comes from seaweed and is halal. It's a plant-based gelatin alternative."
      }
    ],
    "conditional": [],
    "haram": [],
    "questionable": []
  },
  "warnings": [],
  "summary_explanation": "✓ This ingredient contains 2 halal additive(s). Total additives detected: 2."
}
```

### Example 4: Ingredient with Unknown E-Number

**Input:** `"Sugar, E999, Natural Flavors"`

**Output:**
```json
{
  "has_additives": true,
  "total_additives": 1,
  "summary": {
    "halal_count": 0,
    "conditional_count": 0,
    "haram_count": 0,
    "questionable_count": 1,
    "requires_verification_count": 1
  },
  "breakdown": {
    "halal": [],
    "conditional": [],
    "haram": [],
    "questionable": [
      {
        "e_number": "E999",
        "name": "Unknown E-number: E999",
        "halal_status": "questionable",
        "explanation": "E-number E999 was found but we don't have detailed information. Please verify with a qualified Islamic scholar or check for halal certification.",
        "simple_explanation": "E-number E999 needs verification. Check if the product is halal-certified.",
        "requires_verification": true
      }
    ]
  },
  "warnings": [
    {
      "type": "questionable_additives",
      "severity": "medium",
      "message": "This ingredient contains 1 questionable additive(s) that require verification."
    }
  ],
  "summary_explanation": "⚠️ This ingredient contains 1 questionable additive(s) that require verification. Total additives detected: 1."
}
```

### Example 5: No Additives Detected

**Input:** `"Organic Rice, Water, Salt"`

**Output:**
```json
{
  "has_additives": false,
  "total_additives": 0,
  "message": "No additives detected in this ingredient."
}
```

---

## UI Display Examples

### Haram Additives Detected

```
┌─────────────────────────────────────────┐
│ ⚠️ ADDITIVE BREAKDOWN                   │
│                                          │
│ Total Additives: 2                      │
│                                          │
│ ⚠️ HARAM ADDITIVES (2):                 │
│                                          │
│ E120 - Cochineal / Carmine              │
│ Status: Haram                           │
│ Explanation: E120 is made from insects  │
│ and often processed with alcohol. It's  │
│ generally considered haram unless        │
│ halal-certified.                         │
│                                          │
│ E441 - Gelatin                          │
│ Status: Haram                           │
│ Explanation: E441 (Gelatin) usually    │
│ comes from pork or non-halal animals.   │
│ It's haram unless halal-certified.      │
│                                          │
│ ⚠️ WARNING: This ingredient contains    │
│ haram additives. Avoid this product.    │
└─────────────────────────────────────────┘
```

### Conditional Additives Detected

```
┌─────────────────────────────────────────┐
│ ℹ️ ADDITIVE BREAKDOWN                    │
│                                          │
│ Total Additives: 2                      │
│                                          │
│ ⚠️ CONDITIONAL ADDITIVES (2):           │
│                                          │
│ E471 - Mono- and Diglycerides           │
│ Status: Conditional                     │
│ Explanation: E471 can come from plants  │
│ (halal) or animals (needs halal         │
│ certification). Check the source.       │
│                                          │
│ E322 - Lecithin                         │
│ Status: Conditional                     │
│ Explanation: E322 can come from soy     │
│ (halal) or eggs (needs halal             │
│ certification).                         │
│                                          │
│ ⚠️ VERIFICATION REQUIRED: 2 additive(s) │
│ require verification of source or       │
│ halal certification.                    │
└─────────────────────────────────────────┘
```

### Halal Additives Only

```
┌─────────────────────────────────────────┐
│ ✓ ADDITIVE BREAKDOWN                     │
│                                          │
│ Total Additives: 2                      │
│                                          │
│ ✓ HALAL ADDITIVES (2):                  │
│                                          │
│ E300 - Ascorbic Acid (Vitamin C)        │
│ Status: Halal                           │
│ Explanation: E300 is Vitamin C and is   │
│ halal.                                  │
│                                          │
│ E406 - Agar-Agar                        │
│ Status: Halal                           │
│ Explanation: E406 comes from seaweed    │
│ and is halal. It's a plant-based        │
│ gelatin alternative.                    │
│                                          │
│ ✓ All detected additives are halal.     │
└─────────────────────────────────────────┘
```

---

## Integration Points

### Quick Lookup Integration

```javascript
import { detectAdditives } from './additiveDetection';
import { formatAdditiveBreakdown } from './additiveBreakdownFormatter';
import { isPremiumUser } from './subscription';

// In QuickLookup component
if (isPremiumUser() && ingredientList) {
  const additives = detectAdditives(ingredientList);
  const breakdown = formatAdditiveBreakdown(additives, ingredientName);
  // Display breakdown in UI
}
```

### Recipe Conversion Integration

```javascript
// In recipe conversion results
if (isPremiumUser()) {
  for (const ingredient of detectedIngredients) {
    if (ingredient.ingredientList) {
      const additives = detectAdditives(ingredient.ingredientList);
      ingredient.additiveBreakdown = formatAdditiveBreakdown(additives, ingredient.name);
    }
  }
}
```

---

## Files Created/Modified

1. **`frontend/src/lib/additiveDatabase.js`** (New)
   - Additive database with E-numbers and halal status
   - Lookup functions

2. **`frontend/src/lib/additiveDetection.js`** (New)
   - E-number and additive name detection
   - Categorization and summary functions

3. **`frontend/src/lib/additiveBreakdownFormatter.js`** (New)
   - Formats detection results for API/UI
   - Generates warnings and explanations

4. **`ADDITIVE_BREAKDOWN_IMPLEMENTATION.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Detects additives in ingredients  
✅ Explains halal status of additives  
✅ Highlights haram or questionable additives  
✅ Provides simplified explanations  
✅ Premium feature only  
✅ Clear database structure  
✅ Comprehensive detection logic  
✅ Example outputs provided
