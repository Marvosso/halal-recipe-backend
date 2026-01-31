# Halal Knowledge Model - Refinement Summary

## ✅ Implementation Complete

The Halal Knowledge Model has been refined to fully support:
- Nested ingredient inheritance
- School of thought rulings
- Strictness levels
- Clean ingredient display names
- Consistent confidence scoring across Quick Lookup and Full Conversion

## Files Created/Modified

### 1. `frontend/src/data/nested_ingredients.json` (NEW)
Hierarchical structure with:
- `id`: Internal identifier
- `displayName`: User-facing name (e.g., "Gelatin (Pork-derived)")
- `category`: Ingredient category
- `derivedFrom`: Array of parent ingredients
- `rulings`: Object with `default`, `hanafi`, `shafii`, `maliki`, `hanbali` rulings
- `confidenceImpact`: Numeric impact on confidence score (-40 for haram, -15 for questionable)
- `alternatives`, `notes`, `references`, `aliases`

**Example:**
```json
{
  "lucky_charms": {
    "id": "lucky_charms",
    "displayName": "Lucky Charms Cereal",
    "category": "processed_food",
    "derivedFrom": ["marshmallow"],
    "rulings": {
      "default": "haram",
      "hanafi": "haram",
      "shafii": "haram",
      "maliki": "haram",
      "hanbali": "haram"
    },
    "confidenceImpact": -40,
    "alternatives": ["halal_certified_cereals"],
    "notes": "Lucky Charms contain marshmallows that typically use pork-derived gelatin"
  }
}
```

### 2. `frontend/scripts/generateFlatFromNested.js` (NEW)
Script to auto-generate `halal_knowledge_flat.json` from nested structure:
- Resolves inheritance chains recursively
- Merges parent rulings when haram
- Preserves all metadata (alternatives, notes, references)
- Calculates `inheritedHaramSource` for trace

**Usage:**
```bash
node scripts/generateFlatFromNested.js
```

### 3. `frontend/src/data/halal_knowledge_flat.json` (AUTO-GENERATED)
Flattened lookup table generated from nested structure:
- Fast lookup by ingredient ID
- Contains resolved inheritance chains
- Includes `rulings` object per school
- Includes `displayName` for clean display

### 4. `frontend/src/lib/halalEngine.js` (MAJOR UPDATE)
Enhanced engine with:
- **Nested/flat structure support**: Uses both structures for evaluation
- **School of thought logic**: `getRuling()` function applies madhab-specific rulings
- **Strictness levels**: `strict`, `standard`, `flexible` affect final ruling
- **Standardized confidence scoring**: Base 100, deduct based on `confidenceImpact`
- **Inheritance resolution**: Recursively resolves `derivedFrom` chains
- **Display name support**: Returns `displayName` from nested/flat structure

**Key Functions:**
- `evaluateItem(itemId, options)`: Main evaluation function
- `getRuling(ingredient, madhab, strictness)`: Gets ruling based on preferences
- `calculateConfidenceScore(baseConfidence, confidenceImpact, strictness, hasInheritance)`: Standardized scoring

**Return Format:**
```javascript
{
  status: "haram" | "conditional" | "questionable" | "halal" | "unknown",
  confidence: 0.0-1.0, // Legacy format
  confidencePercentage: 0-100, // New format
  displayName: "Gelatin (Pork-derived)",
  trace: ["pork is haram", "gelatin is conditional", "Inherited from: pork"],
  eli5: "Simple explanation...",
  alternatives: ["agar_agar", "halal_beef_gelatin"],
  inheritedFrom: "pork",
  inheritanceChain: ["pork", "gelatin"],
  rulings: { default: "haram", hanafi: "haram", ... }
}
```

### 5. `frontend/src/lib/ingredientDisplay.js` (UPDATED)
Enhanced display formatter:
- **Priority**: Nested `displayName` > Flat `displayName` > `displayMap` > Formatted ID
- Never shows snake_case to users
- Always shows clean, capitalized names

### 6. `frontend/src/lib/convertRecipeJson.js` (UPDATED)
Standardized confidence scoring:
- Uses same algorithm as `halalEngine.js`
- Base score: 100
- Deducts based on `confidenceImpact` from ingredients
- Applies strictness modifiers
- Returns `confidence_type`: "classification" | "post_conversion"

### 7. `frontend/src/components/QuickLookup.jsx` (UPDATED)
Enhanced to use new engine:
- Uses `confidencePercentage` (0-100) for display
- Shows `displayName` from engine result
- Shows confidence breakdown: "Confidence reduced due to: gelatin (derived from pork)"

## Confidence Scoring Algorithm

### Base Score: 100

### Deductions:
1. **Per Ingredient `confidenceImpact`**:
   - Haram: -40 points
   - Questionable: -15 points
   - Conditional: -30 points

2. **Inheritance Penalty**:
   - 8% reduction per ingredient with inheritance chain (compounds)

3. **Missing Replacement Penalty** (post-conversion only):
   - 25% reduction per ingredient without replacement (compounds)

4. **Strictness Modifiers**:
   - **Strict**: 5% additional reduction for questionable/conditional
   - **Flexible**: 10% penalty reduction for questionable (max 100)

### Example Calculation:
```
Ingredient: lucky_charms
- confidenceImpact: -40 (haram)
- inheritedFrom: marshmallow (has inheritance)
- Base: 100 - 40 = 60
- Inheritance penalty: 60 * 0.92 = 55
Final: 55% confidence
```

## School of Thought Rules

Rulings per madhab (stored in `rulings` object):
- `default`: Default ruling when madhab not specified
- `hanafi`: Hanafi school ruling
- `shafii`: Shafi'i school ruling
- `maliki`: Maliki school ruling
- `hanbali`: Hanbali school ruling

**Example (gelatin):**
```json
"rulings": {
  "default": "conditional",
  "hanafi": "haram",
  "shafii": "haram",
  "maliki": "haram",
  "hanbali": "haram"
}
```

## Strictness Levels

### Strict
- Questionable/conditional → haram
- Cross-contamination warnings reduce confidence

### Standard (Default)
- Only explicit haram reduces confidence
- Questionable items allowed but flagged

### Flexible
- Alcohol-derived flavorings (vanilla extract) downgraded to conditional
- Questionable items reduce confidence slightly

## Inheritance Chain Resolution

### Example: Lucky Charms
```
lucky_charms → marshmallow → gelatin → pork
```

**Resolution Process:**
1. Resolve `lucky_charms` → finds `derivedFrom: ["marshmallow"]`
2. Resolve `marshmallow` → finds `derivedFrom: ["gelatin"]`
3. Resolve `gelatin` → finds `derivedFrom: ["pork"]`
4. Resolve `pork` → no parents (root haram source)
5. Final ruling: **haram** (inherited from pork)
6. `inheritedFrom`: "pork"
7. `inheritanceChain`: ["pork", "gelatin", "marshmallow"]

## Display Name Resolution

**Priority Order:**
1. `nestedIngredients[id].displayName`
2. `halalKnowledgeFlat[id].displayName`
3. `ingredient_display_map.json[id]`
4. Formatted ID (snake_case → Title Case)

**Examples:**
- `halal_chicken` → "Halal Chicken"
- `pork_gelatin` → "Gelatin (Pork-derived)"
- `lucky_charms` → "Lucky Charms Cereal"

## Testing Checklist

### Test Cases:

1. **Lucky Charms**:
   - Expected: Haram
   - Inheritance: lucky_charms → marshmallow → gelatin → pork
   - Confidence: ~55% (100 - 40 - inheritance penalty)

2. **Marshmallows**:
   - Expected: Conditional (default) / Haram (hanafi)
   - Inheritance: marshmallow → gelatin
   - Confidence: ~65% (100 - 30 - inheritance penalty)

3. **Vanilla Extract**:
   - Expected: Questionable (standard) / Conditional (flexible)
   - Confidence: ~85% (100 - 15)

4. **Soy Sauce**:
   - Expected: Questionable
   - Confidence: ~85% (100 - 15)

5. **Waffles** (unknown → ingredient expansion):
   - Expected: Unknown or conditional (if contains questionable ingredients)
   - Confidence: Varies based on detected ingredients

### Verification:

✅ Quick Lookup confidence == Converter confidence for same ingredient
✅ Strictness toggle visibly changes result
✅ School of thought visibly changes result (gelatin: conditional → haram with hanafi)
✅ Display names never show snake_case
✅ Inheritance chains properly resolved
✅ Confidence breakdown shows reduction reasons

## Usage Example

```javascript
import { evaluateItem } from "./lib/halalEngine";
import { formatIngredientName } from "./lib/ingredientDisplay";

// Evaluate ingredient with preferences
const result = evaluateItem("lucky_charms", {
  madhab: "hanafi",
  strictness: "strict"
});

console.log(result.status); // "haram"
console.log(result.confidencePercentage); // 55
console.log(result.displayName); // "Lucky Charms Cereal"
console.log(result.inheritedFrom); // "pork"
console.log(result.inheritanceChain); // ["pork", "gelatin", "marshmallow"]

// Format display name
const displayName = formatIngredientName("pork_gelatin");
console.log(displayName); // "Gelatin (Pork-derived)"
```

## Next Steps

To expand the knowledge base:
1. Add entries to `nested_ingredients.json`
2. Run `node scripts/generateFlatFromNested.js`
3. Flat structure auto-updates
4. Engine automatically uses new entries

---

**Status**: ✅ Production Ready
**Last Updated**: 2024
**Version**: 2.0.0
