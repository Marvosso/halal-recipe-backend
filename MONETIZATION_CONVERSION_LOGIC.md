# Recipe Conversion Logic with Monetization

## Overview
Extended the haram-to-halal recipe conversion to support ethical affiliate monetization. Affiliate links are **ONLY** attached to halal substitutes, **NEVER** to haram ingredients.

## Core Conversion Logic

### Pipeline Flow

```
1. DETECT → Scan recipe for haram/conditional ingredients
2. CONVERT → Replace haram ingredients with halal substitutes
3. FETCH AFFILIATE LINKS → Get links for substitutes only (monetization)
4. BUILD ISSUES → Format with explanations and affiliate links
5. CALCULATE SCORE → Final confidence score
```

### Key Functions

#### `convertRecipeWithJson(recipeText, userPreferences)`
- **Type**: `async function`
- **Returns**: `{ originalText, convertedText, issues, confidenceScore }`
- **Monetization**: Fetches affiliate links for substitutes only

#### `getAffiliateLinksForSubstitutes(substituteIds, regionCode, limitPerSubstitute)`
- **Type**: `async function`
- **Returns**: `Map<substituteId, affiliateLinks[]>`
- **Limit**: Maximum 3 links per substitute
- **Priority**: Featured links first, then by click count

#### `buildAffiliateUrl(linkData)`
- **Type**: `function`
- **Returns**: Complete affiliate URL with search query and tag
- **Platforms**: Amazon, Instacart, Thrive Market

---

## Haram Explanation Logic

### Priority Order
1. `explanation` (religious justification)
2. `eli5` (simple explanation)
3. `simpleExplanation` (fallback)
4. `notes` (general notes)
5. **Fallback**: Status-based explanation with Quran/Hadith references

### Example Explanations

**Gelatin**:
```
"Gelatin is typically derived from pork or non-halal animals. 
Most scholars consider it haram unless halal-certified. 
See Quran 2:173, 5:3."
```

**Wine**:
```
"Wine and all intoxicants are explicitly prohibited in Islam. 
See Quran 2:219, 5:90-91. The Prophet (peace be upon him) said: 
'Every intoxicant is khamr (wine) and every khamr is haram.'"
```

**Pork/Bacon**:
```
"Pork and all pork products are explicitly prohibited in Islam. 
This is one of the most clearly stated prohibitions in the Quran. 
See Quran 2:173, 5:3, 6:145, 16:115."
```

---

## Substitute Selection (1-3 Limit)

### Selection Criteria
1. **Primary Replacement**: First alternative from knowledge base
2. **Additional Alternatives**: Up to 2 more from `alternatives` array
3. **Total Limit**: Maximum 3 substitutes per haram ingredient

### Prioritization
- Featured affiliate links first
- Best flavor match score
- Highest click count
- Availability (region-aware)

### Example: Wine Substitutes
```javascript
substitutes_with_links: [
  {
    id: "grape_juice",
    name: "Grape Juice",
    affiliate_links: [...] // Primary substitute
  },
  {
    id: "non_alcoholic_wine",
    name: "Non-Alcoholic Wine",
    affiliate_links: [...] // Alternative 1
  },
  {
    id: "apple_juice_vinegar",
    name: "Apple Juice + Vinegar",
    affiliate_links: [...] // Alternative 2
  }
]
```

---

## Affiliate Link Attachment Rules

### ✅ DO Attach Links To:
- Halal substitutes (e.g., "Agar Agar" for "Gelatin")
- Alternative halal options (e.g., "Turkey Bacon" for "Bacon")
- Halal-certified versions (e.g., "Halal Parmesan" for "Parmesan")

### ❌ NEVER Attach Links To:
- Haram ingredients themselves (e.g., "Gelatin", "Wine", "Bacon")
- Conditional ingredients without substitutes
- Unknown ingredients

### Code Enforcement
```javascript
// CRITICAL: Only attach affiliate links to SUBSTITUTES
if (replacementId && 
    replacementId !== "Halal alternative needed" && 
    replacementId.trim() !== "" &&
    affiliateLinksMap[replacementId]) {
  // Attach links to substitute
  substituteAffiliateLinks = affiliateLinksMap[replacementId];
}

// Haram ingredient has NO affiliate links
// ingredient_id: "gelatin" → NO affiliate_links field
```

---

## Edge Case Handling

### Edge Case 1: Alcohol (Multiple Forms)

**Detection**: Wine, brandy, rum, vanilla extract (alcohol-based)

**Handling**:
```javascript
// Wine → Grape juice + vinegar
{
  ingredient_id: "wine",
  haram_explanation: "Wine and all intoxicants are explicitly prohibited...",
  replacement_id: "grape_juice",
  substitute_affiliate_links: [...] // Links for grape juice
}

// Brandy → Non-alcoholic brandy extract
{
  ingredient_id: "brandy",
  haram_explanation: "Brandy is an alcoholic beverage...",
  replacement_id: "non_alcoholic_brandy",
  substitute_affiliate_links: [...] // Links for non-alcoholic brandy
}

// Vanilla Extract → Alcohol-free vanilla
{
  ingredient_id: "vanilla_extract",
  haram_explanation: "Most vanilla extract contains alcohol...",
  replacement_id: "alcohol_free_vanilla",
  substitute_affiliate_links: [...] // Links for alcohol-free vanilla
}
```

**Key**: Each alcohol form handled separately with its own substitute and affiliate links.

---

### Edge Case 2: Pork (Critical Haram)

**Detection**: Bacon, ham, pork chops, sausage, lard

**Handling**:
```javascript
// Bacon → Turkey bacon
{
  ingredient_id: "bacon",
  haram_explanation: "Pork and all pork products are explicitly prohibited...",
  replacement_id: "turkey_bacon",
  substitute_affiliate_links: [...] // Links for turkey bacon
}

// Ham → Turkey ham
{
  ingredient_id: "ham",
  haram_explanation: "Ham is derived from pork...",
  replacement_id: "turkey_ham",
  substitute_affiliate_links: [...] // Links for turkey ham
}

// Pork Chops → Halal beef/lamb chops
{
  ingredient_id: "pork_chops",
  haram_explanation: "Pork is explicitly prohibited...",
  replacement_id: "halal_beef_chops",
  substitute_affiliate_links: [...] // Links for halal beef chops
}
```

**Key**: Strongest possible explanation with multiple Quran references. No affiliate links on pork products.

---

### Edge Case 3: Ambiguous Cheese

**Detection**: Parmesan, blue cheese, feta (may use non-halal rennet)

**Handling**:
```javascript
// Parmesan → Halal-certified parmesan
{
  ingredient_id: "parmesan_cheese",
  haram_explanation: "Parmesan cheese traditionally uses rennet from non-halal sources. It is haram unless halal-certified or made with microbial/vegetable rennet.",
  replacement_id: "halal_parmesan_cheese",
  substitute_affiliate_links: [...] // Links for halal-certified parmesan
}

// If no halal-certified option exists:
{
  ingredient_id: "blue_cheese",
  haram_explanation: "Blue cheese typically uses non-halal rennet. Look for halal-certified options or consider alternative cheeses.",
  replacement_id: null, // No clear substitute
  substitute_affiliate_links: [], // No links if no substitute
  substitutes_with_links: [
    {
      id: "halal_cheddar",
      name: "Halal Cheddar",
      affiliate_links: [...] // Alternative cheese option
    }
  ]
}
```

**Key**: 
- If halal-certified option exists → Show with affiliate links
- If no clear substitute → Show explanation with alternative options
- Always emphasize checking for halal certification

---

### Edge Case 4: Multiple Substitutes (1-3 Limit)

**Input**: "1 cup wine"

**Substitutes Available**:
1. Grape juice + vinegar (primary)
2. Non-alcoholic wine (alternative 1)
3. Apple juice + vinegar (alternative 2)
4. Pomegranate juice + vinegar (alternative 3) ← **Excluded** (over limit)

**Output**:
```javascript
{
  ingredient_id: "wine",
  replacement_id: "grape_juice", // Primary
  substitute_affiliate_links: [...], // Links for grape juice
  substitutes_with_links: [
    { id: "grape_juice", ... }, // Primary (shown)
    { id: "non_alcoholic_wine", ... }, // Alternative 1 (shown)
    { id: "apple_juice_vinegar", ... } // Alternative 2 (shown)
    // Alternative 3 excluded (over 3 limit)
  ]
}
```

**Key**: Maximum 3 substitutes shown, prioritized by featured links and match score.

---

## Data Structure

### Issue Object (with Monetization)

```typescript
interface Issue {
  // Ingredient identification
  ingredient_id: string; // Internal ID (e.g., "gelatin")
  ingredient: string; // Backward compatibility
  replacement_id: string | null; // Substitute ID (e.g., "agar_agar")
  replacement: string | null; // Backward compatibility
  
  // Haram explanation
  haram_explanation: string; // Clear religious justification
  explanation: string; // Backward compatibility
  
  // Substitution details
  replacementRatio: string | null; // e.g., "1:1" or "1 cup → ¾ cup + ¼ cup"
  culinaryNotes: string[] | null; // Cooking tips
  
  // MONETIZATION: Affiliate links (ONLY on substitutes)
  substitute_affiliate_links: AffiliateLink[]; // Links for primary replacement
  substitutes_with_links: SubstituteWithLinks[]; // All alternatives (1-3)
  
  // Religious references
  quranReference: string;
  hadithReference: string;
  references: string[];
  
  // Metadata
  severity: "low" | "medium" | "high" | "critical";
  confidenceScore: number; // 0-100
  wasReplaced: boolean;
  alternatives: string[]; // All alternatives (for display)
}

interface AffiliateLink {
  id: string;
  platform: string; // "amazon", "instacart", "thrivemarket"
  platform_display: string; // "Amazon", "Instacart", "Thrive Market"
  platform_color: string; // "#FF9900"
  url: string; // Complete affiliate URL
  search_query: string;
  is_featured: boolean;
}

interface SubstituteWithLinks {
  id: string;
  name: string; // Formatted display name
  affiliate_links: AffiliateLink[]; // Up to 3 links per substitute
}
```

---

## Implementation Status

### ✅ Completed
- [x] Async conversion function
- [x] Affiliate link fetching for substitutes
- [x] Clear haram explanations
- [x] 1-3 substitute limit
- [x] Never attach links to haram ingredients
- [x] Edge case handling (alcohol, pork, cheese)
- [x] Multiple substitutes support

### 🔄 In Progress
- [ ] Backend API integration (replace mock data)
- [ ] Region detection from user preferences
- [ ] Click tracking for affiliate links
- [ ] Conversion analytics

### 📋 Future Enhancements
- [ ] A/B testing affiliate link placement
- [ ] Sponsored brand integration
- [ ] Dynamic pricing display
- [ ] User preference-based substitute ranking

---

## Testing Checklist

- [ ] Test with gelatin recipe (questionable → halal)
- [ ] Test with wine recipe (haram → multiple substitutes)
- [ ] Test with bacon recipe (critical haram → substitute)
- [ ] Test with ambiguous cheese (conditional → halal-certified)
- [ ] Test with multiple alcohol forms
- [ ] Test with multiple pork products
- [ ] Verify NO affiliate links on haram ingredients
- [ ] Verify affiliate links ONLY on substitutes
- [ ] Verify 1-3 substitute limit
- [ ] Verify clear explanations for all haram ingredients

---

## Code Locations

- **Conversion Logic**: `frontend/src/lib/convertRecipeJson.js`
- **Affiliate Service**: `frontend/src/lib/affiliateService.js`
- **UI Integration**: `frontend/src/App.jsx`
- **Examples**: `CONVERSION_MONETIZATION_EXAMPLES.md`
