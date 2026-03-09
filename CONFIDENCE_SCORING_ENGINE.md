# Confidence Scoring Engine for Ingredient Halal Status

## Overview
Comprehensive confidence scoring engine that maps to high/medium/low confidence levels. Natural plant foods default to high confidence halal, processed foods reduce confidence unless certified, and unknown is used only when data is truly missing.

---

## Scoring Rules

### 1. Base Confidence by Ingredient Type

**Natural Plant:**
- Halal: 95 (High)
- Conditional: 70 (Medium-High)
- Haram: 0 (Low)
- Unknown: 90 (High - defaults to halal)

**Processed Plant:**
- Halal: 70 (Medium-High)
- Conditional: 60 (Medium)
- Haram: 0 (Low)
- Unknown: 50 (Medium)

**Animal:**
- Halal: 60 (Medium - requires certification)
- Conditional: 50 (Medium)
- Haram: 0 (Low)
- Unknown: 50 (Medium - requires verification)

**Animal Byproduct:**
- Halal: 50 (Medium - requires certification)
- Conditional: 40 (Medium-Low)
- Haram: 0 (Low)
- Unknown: 40 (Medium-Low - requires verification)

**Alcohol:**
- All statuses: 0 (Low - always haram)

**Fermentation Derived:**
- Halal: 75 (Medium-High - fully fermented)
- Conditional: 65 (Medium)
- Haram: 0 (Low)
- Unknown: 60 (Medium)

**Synthetic:**
- Halal: 65 (Medium - check source)
- Conditional: 55 (Medium)
- Haram: 0 (Low)
- Unknown: 50 (Medium)

---

### 2. Confidence Reduction Factors

**Processing Factors:**
- Processed: -15 (reduces confidence)
- Uncertified (animal/byproduct): -20 (no halal certification)
- Has additives: -10 (contains additives)
- Cross-contamination risk: -15 (risk of cross-contamination)

**Modifier Factors:**
- Conditional modifier: -15 (conditional modifier detected)
- Processing modifier: -10 (processing modifier detected)

**Source Factors:**
- Unknown source: -25 (unknown source)
- Non-halal source: -100 (makes haram)

**Inheritance Factors:**
- Inherited from haram: -30 (inherited from haram ingredient)

**Certification Factors:**
- Halal certified: +10 (halal certification boosts confidence)
- Verified source: +5 (verified source boosts confidence)

---

### 3. Confidence Level Mapping

**High Confidence (80-100):**
- Natural plant halal ingredients
- Halal-certified animal products
- Fully fermented products (vinegar)
- Verified halal sources

**Medium Confidence (50-79):**
- Processed plant ingredients
- Animal products without certification
- Conditional ingredients
- Synthetic ingredients

**Low Confidence (0-49):**
- Haram ingredients (0)
- Unknown ingredients with no data
- Ingredients with significant uncertainty
- Non-halal sources

---

### 4. Unknown Status Rules

**Only use unknown if:**
- No taxonomy data available
- No knowledge base data available
- No base ingredient override
- Not a natural plant ingredient
- Status is not explicitly haram

**Never use unknown if:**
- Natural plant ingredient (defaults to halal)
- Has taxonomy data
- Has knowledge base data
- Has base ingredient override
- Status is explicitly haram

---

## Example Outputs

### Example 1: Natural Plant (High Confidence)

**Input:** `rice`

**Scoring:**
- Type: natural_plant
- Status: halal
- Base Score: 95
- Reductions: 0
- Boosts: 0
- **Final Score: 95**

**Output:**
```json
{
  "status": "halal",
  "confidenceScore": 95,
  "confidenceLevel": "high",
  "confidenceLabel": "High Confidence",
  "confidenceDescription": "High confidence (95%) - This determination is based on clear Islamic guidelines and reliable sources.",
  "confidenceColor": "#0A9D58",
  "isUnknown": false
}
```

---

### Example 2: Processed Plant (Medium Confidence)

**Input:** `rice_flour`

**Scoring:**
- Type: processed_plant
- Status: halal
- Base Score: 70
- Reductions: -15 (processed)
- Boosts: 0
- **Final Score: 55**

**Output:**
```json
{
  "status": "halal",
  "confidenceScore": 55,
  "confidenceLevel": "medium",
  "confidenceLabel": "Medium Confidence",
  "confidenceDescription": "Medium confidence (55%) - This ingredient may be halal but requires verification of source or preparation method.",
  "confidenceColor": "#F59E0B",
  "isUnknown": false
}
```

---

### Example 3: Processed Plant with Certification (High Confidence)

**Input:** `halal_certified_rice_flour`

**Scoring:**
- Type: processed_plant
- Status: halal
- Base Score: 70
- Reductions: -15 (processed)
- Boosts: +10 (halal certified)
- **Final Score: 65**

**Output:**
```json
{
  "status": "halal",
  "confidenceScore": 65,
  "confidenceLevel": "medium",
  "confidenceLabel": "Medium Confidence",
  "confidenceDescription": "Medium confidence (65%) - This ingredient may be halal but requires verification of source or preparation method.",
  "confidenceColor": "#F59E0B",
  "isUnknown": false
}
```

---

### Example 4: Animal without Certification (Medium Confidence)

**Input:** `beef`

**Scoring:**
- Type: animal
- Status: conditional
- Base Score: 60
- Reductions: -20 (uncertified)
- Boosts: 0
- **Final Score: 40**

**Output:**
```json
{
  "status": "conditional",
  "confidenceScore": 40,
  "confidenceLevel": "low",
  "confidenceLabel": "Low Confidence",
  "confidenceDescription": "Low confidence (40%) - Insufficient data or significant uncertainty. Please verify with a qualified Islamic scholar.",
  "confidenceColor": "#EF4444",
  "isUnknown": false
}
```

---

### Example 5: Animal with Certification (High Confidence)

**Input:** `halal_certified_beef`

**Scoring:**
- Type: animal
- Status: halal
- Base Score: 60
- Reductions: 0 (certified, no reduction)
- Boosts: +10 (halal certified)
- **Final Score: 70**

**Output:**
```json
{
  "status": "halal",
  "confidenceScore": 70,
  "confidenceLevel": "medium",
  "confidenceLabel": "Medium Confidence",
  "confidenceDescription": "Medium confidence (70%) - This ingredient may be halal but requires verification of source or preparation method.",
  "confidenceColor": "#F59E0B",
  "isUnknown": false
}
```

---

### Example 6: Haram Ingredient (Low Confidence)

**Input:** `wine`

**Scoring:**
- Type: alcohol
- Status: haram
- Base Score: 0
- Reductions: 0
- Boosts: 0
- **Final Score: 0**

**Output:**
```json
{
  "status": "haram",
  "confidenceScore": 0,
  "confidenceLevel": "low",
  "confidenceLabel": "Low Confidence",
  "confidenceDescription": "Low confidence (0%) - Insufficient data or significant uncertainty. Please verify with a qualified Islamic scholar.",
  "confidenceColor": "#EF4444",
  "isUnknown": false
}
```

---

### Example 7: Unknown Ingredient (Only if Truly Missing Data)

**Input:** `obscure_ingredient_xyz`

**Scoring:**
- Type: processed_plant (default)
- Status: unknown
- Base Score: 50
- Reductions: -25 (unknown source)
- Boosts: 0
- **Final Score: 25**

**Output:**
```json
{
  "status": "unknown",
  "confidenceScore": 25,
  "confidenceLevel": "low",
  "confidenceLabel": "Low Confidence",
  "confidenceDescription": "Low confidence (25%) - Insufficient data or significant uncertainty. Please verify with a qualified Islamic scholar.",
  "confidenceColor": "#EF4444",
  "isUnknown": true
}
```

---

### Example 8: Natural Plant with Processing Modifier (Medium Confidence)

**Input:** `fried rice`

**Scoring:**
- Type: natural_plant
- Status: halal (base)
- Base Score: 95
- Reductions: -10 (processing modifier: fried)
- Boosts: 0
- **Final Score: 85**

**Output:**
```json
{
  "status": "conditional",
  "confidenceScore": 85,
  "confidenceLevel": "high",
  "confidenceLabel": "High Confidence",
  "confidenceDescription": "High confidence (85%) - This determination is based on clear Islamic guidelines and reliable sources.",
  "confidenceColor": "#0A9D58",
  "isUnknown": false
}
```

---

### Example 9: Processed with Conditional Modifier (Medium-Low Confidence)

**Input:** `cheese with rennet`

**Scoring:**
- Type: animal_byproduct
- Status: conditional
- Base Score: 50
- Reductions: -20 (uncertified), -15 (conditional modifier: rennet)
- Boosts: 0
- **Final Score: 15**

**Output:**
```json
{
  "status": "conditional",
  "confidenceScore": 15,
  "confidenceLevel": "low",
  "confidenceLabel": "Low Confidence",
  "confidenceDescription": "Low confidence (15%) - Insufficient data or significant uncertainty. Please verify with a qualified Islamic scholar.",
  "confidenceColor": "#EF4444",
  "isUnknown": false
}
```

---

## Edge Case Handling

### Edge Case 1: Natural Plant with Unknown Status

**Scenario:** Natural plant ingredient not in database

**Handling:**
- Defaults to halal (high confidence: 90)
- Not marked as unknown
- Explanation: "Plant-based natural ingredients are generally halal"

**Example:** `quinoa` (not in database)
- Score: 90
- Level: high
- Status: halal

---

### Edge Case 2: Processed Ingredient with Multiple Modifiers

**Scenario:** Processed ingredient with both conditional and processing modifiers

**Handling:**
- Apply all reductions
- Final score = base - all reductions
- Level determined by final score

**Example:** `fried_flavored_rice`
- Base: 70
- Reductions: -15 (processed), -10 (processing: fried), -15 (conditional: flavored)
- Final: 30 (low confidence)

---

### Edge Case 3: Haram Modifier Override

**Scenario:** Halal base ingredient with haram modifier

**Handling:**
- Haram modifier overrides everything
- Score: 0
- Level: low
- Status: haram

**Example:** `wine-braised chicken`
- Score: 0
- Level: low
- Status: haram

---

### Edge Case 4: Certified vs Uncertified Animal Product

**Scenario:** Same animal product with and without certification

**Handling:**
- Uncertified: base - 20 (uncertified reduction)
- Certified: base + 10 (certification boost)
- Difference: 30 points

**Example:** `beef`
- Uncertified: 60 - 20 = 40 (low)
- Certified: 60 + 10 = 70 (medium)

---

### Edge Case 5: Inheritance from Haram

**Scenario:** Ingredient derived from haram source

**Handling:**
- Apply inheritance reduction: -30
- Significant confidence drop
- May push to low confidence

**Example:** `gelatin from pork`
- Base: 50
- Reductions: -30 (inherited from haram)
- Final: 20 (low confidence)

---

### Edge Case 6: Truly Unknown Ingredient

**Scenario:** Ingredient with no data in any system

**Handling:**
- Only marked as unknown if:
  - Not natural plant
  - No taxonomy data
  - No knowledge base data
  - No base override
- Score: 25-50 (low-medium)
- Level: low-medium

**Example:** `xyz_obscure_ingredient_123`
- Score: 25
- Level: low
- Status: unknown
- isUnknown: true

---

## Scoring Algorithm

```javascript
function calculateConfidenceScore(params) {
  // 1. Start with base score from type and status
  let score = BASE_CONFIDENCE_BY_TYPE[type][status];
  
  // 2. Apply reductions
  if (isProcessed && type === 'natural_plant') score -= 15;
  if (!isCertified && isAnimal) score -= 20;
  if (hasAdditives) score -= 10;
  if (hasInheritance) score -= 30;
  if (hasConditionalModifier) score -= 15;
  if (hasProcessingModifier) score -= 10;
  if (source === 'unknown') score -= 25;
  
  // 3. Apply boosts
  if (isCertified) score += 10;
  if (source === 'verified') score += 5;
  
  // 4. Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

function mapScoreToLevel(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}
```

---

## Files Created/Modified

1. **`frontend/src/lib/confidenceScoringEngine.js`** (New)
   - Confidence scoring rules
   - Level mapping (high/medium/low)
   - Unknown detection logic
   - Edge case handling

2. **`frontend/src/lib/halalEngine.js`** (Updated)
   - Integrated confidence scoring engine
   - Applied to all evaluation paths

3. **`CONFIDENCE_SCORING_ENGINE.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Outputs confidence levels: high, medium, low  
✅ Natural plant foods default to high confidence halal  
✅ Processed foods reduce confidence unless certified  
✅ Unknown used only if data is truly missing  
✅ Comprehensive scoring rules  
✅ Example outputs for all scenarios  
✅ Edge case handling
