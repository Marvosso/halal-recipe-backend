# Quick Ingredient Lookup API and UI Output Contract

## Overview
This document defines the contract for quick ingredient lookup responses, ensuring consistent, readable, and reassuring output across all implementations.

---

## API Response Schema

### Required Fields (Always Present)

```typescript
interface QuickLookupResponse {
  // Core Status
  halal_status: "halal" | "haram" | "conditional" | "unknown";
  
  // Confidence Level (high/medium/low)
  confidence_level: "high" | "medium" | "low";
  
  // Short Explanation (2-3 sentences, never one word)
  short_explanation: string;
  
  // Warnings (array, empty if none)
  warnings: Warning[];
  
  // Optional but Recommended Fields
  confidence_score?: number;        // 0-100
  ingredient_type?: string;          // natural, processed, animal, etc.
  alternatives?: string[];           // Halal alternatives
  references?: string[];             // Quran/Hadith references
  requires_verification?: boolean;   // Whether user should verify
  display_name?: string;             // Formatted ingredient name
}
```

### Warning Object Schema

```typescript
interface Warning {
  type: "verification_required" | "source_uncertain" | "processing_concern" | "cross_contamination" | "additive_concern";
  severity: "low" | "medium" | "high";
  message: string;  // Human-readable warning message
}
```

---

## Response Examples

### Example 1: Natural Plant (Halal, High Confidence)

```json
{
  "halal_status": "halal",
  "confidence_level": "high",
  "confidence_score": 95,
  "short_explanation": "Rice is a natural, plant-based ingredient that is generally halal. Plant-based ingredients in their natural, unprocessed form are considered halal unless specifically prohibited in Islamic law. You can use this ingredient with confidence.",
  "warnings": [],
  "ingredient_type": "natural_plant",
  "alternatives": [],
  "requires_verification": false,
  "display_name": "Rice"
}
```

### Example 2: Processed Plant (Halal, Medium Confidence)

```json
{
  "halal_status": "halal",
  "confidence_level": "medium",
  "confidence_score": 55,
  "short_explanation": "Rice flour is a processed form of rice. While the base ingredient is halal, processing may introduce additives or cross-contamination risks. Check the ingredient list for non-halal additives or processing agents.",
  "warnings": [
    {
      "type": "processing_concern",
      "severity": "low",
      "message": "This processed ingredient may contain additives. Please check the ingredient list."
    }
  ],
  "ingredient_type": "processed_plant",
  "alternatives": [],
  "requires_verification": true,
  "display_name": "Rice Flour"
}
```

### Example 3: Haram Ingredient (Haram, Low Confidence)

```json
{
  "halal_status": "haram",
  "confidence_level": "low",
  "confidence_score": 0,
  "short_explanation": "Wine contains alcohol, which is explicitly prohibited in Islam. The Qur'an states that intoxicants are haram (Qur'an 5:90). This ingredient should not be consumed.",
  "warnings": [
    {
      "type": "verification_required",
      "severity": "high",
      "message": "This ingredient is haram and should be avoided."
    }
  ],
  "ingredient_type": "alcohol",
  "alternatives": [
    "Grape juice",
    "Non-alcoholic wine",
    "Chicken or vegetable stock"
  ],
  "requires_verification": false,
  "display_name": "Wine",
  "references": ["Qur'an 5:90"]
}
```

### Example 4: Animal Product (Conditional, Medium Confidence)

```json
{
  "halal_status": "conditional",
  "confidence_level": "medium",
  "confidence_score": 40,
  "short_explanation": "Beef is halal when the animal has been slaughtered according to Islamic guidelines (zabiha). However, without halal certification, we cannot confirm that proper Islamic slaughtering practices were followed. Please verify the source and look for halal certification.",
  "warnings": [
    {
      "type": "verification_required",
      "severity": "high",
      "message": "This ingredient requires halal certification. Please verify the source and look for halal certification."
    },
    {
      "type": "source_uncertain",
      "severity": "medium",
      "message": "Without halal certification, the source cannot be confirmed."
    }
  ],
  "ingredient_type": "animal",
  "alternatives": [],
  "requires_verification": true,
  "display_name": "Beef",
  "references": ["Qur'an 2:173"]
}
```

### Example 5: Unknown Ingredient (Unknown, Low Confidence)

```json
{
  "halal_status": "unknown",
  "confidence_level": "low",
  "confidence_score": 25,
  "short_explanation": "We don't have sufficient information about this ingredient in our knowledge base. This appears to be a rare or uncommon ingredient. We recommend consulting with a qualified Islamic scholar to determine its halal status.",
  "warnings": [
    {
      "type": "verification_required",
      "severity": "high",
      "message": "Insufficient data available. Please consult with a qualified Islamic scholar."
    }
  ],
  "ingredient_type": "processed",
  "alternatives": [],
  "requires_verification": true,
  "display_name": "Obscure Ingredient XYZ"
}
```

### Example 6: Conditional with Modifier (Conditional, Medium Confidence)

```json
{
  "halal_status": "conditional",
  "confidence_level": "medium",
  "confidence_score": 60,
  "short_explanation": "Cheese is generally halal when made from halal-certified milk. However, this cheese contains rennet, which may be derived from animal or microbial sources. Animal-derived rennet requires halal certification. Please check the rennet source or look for halal-certified cheese.",
  "warnings": [
    {
      "type": "additive_concern",
      "severity": "medium",
      "message": "This ingredient contains rennet. Check the rennet source (animal-derived requires halal certification)."
    }
  ],
  "ingredient_type": "animal_byproduct",
  "alternatives": [
    "Halal-certified cheese",
    "Vegetarian cheese (microbial rennet)",
    "Plant-based cheese alternatives"
  ],
  "requires_verification": true,
  "display_name": "Cheese with Rennet"
}
```

---

## UI Card Examples

### Card 1: Halal, High Confidence (Natural Plant)

```
┌─────────────────────────────────────────┐
│ ✓ HALAL                                  │
│ High Confidence                          │
│                                          │
│ What this means:                        │
│ Rice is a natural, plant-based          │
│ ingredient that is generally halal.      │
│ Plant-based ingredients in their         │
│ natural, unprocessed form are            │
│ considered halal unless specifically     │
│ prohibited in Islamic law. You can      │
│ use this ingredient with confidence.    │
│                                          │
│ [No warnings]                            │
└─────────────────────────────────────────┘
```

### Card 2: Conditional, Medium Confidence (Animal Product)

```
┌─────────────────────────────────────────┐
│ ⚠ CONDITIONAL                            │
│ Medium Confidence                        │
│                                          │
│ What this means:                        │
│ Beef is halal when the animal has       │
│ been slaughtered according to Islamic   │
│ guidelines (zabiha). However, without   │
│ halal certification, we cannot confirm   │
│ that proper Islamic slaughtering        │
│ practices were followed. Please verify  │
│ the source and look for halal          │
│ certification.                           │
│                                          │
│ ⚠ Warnings:                              │
│ • Verification Required: This ingredient │
│   requires halal certification.        │
│ • Source Uncertain: Without halal        │
│   certification, the source cannot be   │
│   confirmed.                            │
└─────────────────────────────────────────┘
```

### Card 3: Haram, Low Confidence (Alcohol)

```
┌─────────────────────────────────────────┐
│ ✗ HARAM                                  │
│ Low Confidence                           │
│                                          │
│ What this means:                        │
│ Wine contains alcohol, which is         │
│ explicitly prohibited in Islam. The      │
│ Qur'an states that intoxicants are      │
│ haram (Qur'an 5:90). This ingredient    │
│ should not be consumed.                  │
│                                          │
│ ⚠ Warning:                               │
│ • This ingredient is haram and should   │
│   be avoided.                           │
│                                          │
│ Halal Alternatives:                     │
│ • Grape juice                           │
│ • Non-alcoholic wine                    │
│ • Chicken or vegetable stock            │
└─────────────────────────────────────────┘
```

### Card 4: Conditional, Medium Confidence (Processed with Modifier)

```
┌─────────────────────────────────────────┐
│ ⚠ CONDITIONAL                            │
│ Medium Confidence                        │
│                                          │
│ What this means:                        │
│ Cheese is generally halal when made from  │
│ halal-certified milk. However, this     │
│ cheese contains rennet, which may be    │
│ derived from animal or microbial         │
│ sources. Animal-derived rennet          │
│ requires halal certification. Please    │
│ check the rennet source or look for     │
│ halal-certified cheese.                  │
│                                          │
│ ⚠ Warning:                               │
│ • Additive Concern: This ingredient      │
│   contains rennet. Check the rennet     │
│   source (animal-derived requires       │
│   halal certification).                 │
│                                          │
│ Halal Alternatives:                     │
│ • Halal-certified cheese                │
│ • Vegetarian cheese (microbial rennet)  │
│ • Plant-based cheese alternatives       │
└─────────────────────────────────────────┘
```

---

## Copy Guidelines

### 1. Short Explanation Rules

**DO:**
- Use 2-3 sentences (minimum 15 words)
- Start with the ingredient name and status
- Explain why (religious/Islamic basis)
- Provide actionable guidance
- Use reassuring, respectful language

**DON'T:**
- Use one-word responses ("Haram", "Halal", "Unknown")
- Use technical jargon without explanation
- Be dismissive or judgmental
- Leave users without guidance

**Examples:**

✅ **Good:**
> "Rice is a natural, plant-based ingredient that is generally halal. Plant-based ingredients in their natural, unprocessed form are considered halal unless specifically prohibited in Islamic law. You can use this ingredient with confidence."

❌ **Bad:**
> "Halal."

✅ **Good:**
> "Beef is halal when the animal has been slaughtered according to Islamic guidelines (zabiha). However, without halal certification, we cannot confirm that proper Islamic slaughtering practices were followed. Please verify the source and look for halal certification."

❌ **Bad:**
> "Conditional."

### 2. Warning Messages

**DO:**
- Be specific about the concern
- Provide actionable guidance
- Use clear, non-alarmist language
- Explain severity appropriately

**DON'T:**
- Use vague warnings ("May be haram")
- Create unnecessary alarm
- Use technical terms without explanation
- Leave users without next steps

**Examples:**

✅ **Good:**
> "This ingredient contains rennet. Check the rennet source (animal-derived requires halal certification)."

❌ **Bad:**
> "Warning: Rennet."

✅ **Good:**
> "This processed ingredient may contain additives. Please check the ingredient list."

❌ **Bad:**
> "Warning: Processed."

### 3. Reassuring Language

**Always include:**
- Acknowledgment of user's concern
- Clear guidance on next steps
- Respectful, non-judgmental tone
- Reference to Islamic sources when applicable

**Examples:**

✅ **Reassuring:**
> "You can use this ingredient with confidence."
> "This ingredient is likely halal, but please verify the source."
> "We recommend consulting with a qualified Islamic scholar for this ingredient."

❌ **Not Reassuring:**
> "Unknown."
> "May be haram."
> "Check yourself."

### 4. Status-Specific Copy Patterns

**Halal (High Confidence):**
- Start with ingredient name and status
- Explain why it's halal (natural, plant-based, certified, etc.)
- Reassure user they can use it
- No warnings unless there are processing concerns

**Halal (Medium Confidence):**
- Start with ingredient name and status
- Explain why it's likely halal
- Add verification requirement
- Include warnings if applicable

**Haram:**
- Start with ingredient name and status
- Explain why it's haram (religious basis)
- Reference Islamic sources (Qur'an/Hadith)
- Provide halal alternatives
- Clear warning about avoiding it

**Conditional:**
- Start with ingredient name and conditional status
- Explain what makes it conditional
- Provide verification requirements
- Include specific warnings
- Suggest alternatives if available

**Unknown:**
- Acknowledge lack of data
- Explain why data is missing
- Recommend consulting scholar
- Provide alternative (full recipe converter)
- Include warning about verification

---

## Implementation Checklist

### API Response
- [ ] Always include `halal_status`
- [ ] Always include `confidence_level` (high/medium/low)
- [ ] Always include `short_explanation` (minimum 15 words)
- [ ] Always include `warnings` array (empty if none)
- [ ] Include `confidence_score` (0-100) when available
- [ ] Include `ingredient_type` when available
- [ ] Include `alternatives` when haram or conditional
- [ ] Include `references` when applicable
- [ ] Set `requires_verification` appropriately

### UI Display
- [ ] Display status prominently with icon
- [ ] Show confidence level badge
- [ ] Display full short explanation (never truncate)
- [ ] Show warnings section (only if warnings exist)
- [ ] Display alternatives (if available)
- [ ] Show references (if available)
- [ ] Use appropriate colors (green/yellow/red)
- [ ] Ensure mobile responsiveness

### Copy Quality
- [ ] No one-word responses
- [ ] Minimum 15 words in explanation
- [ ] Reassuring, respectful tone
- [ ] Actionable guidance provided
- [ ] Islamic sources referenced when applicable
- [ ] Clear next steps for user

---

## Error Handling

### Invalid Ingredient
```json
{
  "halal_status": "unknown",
  "confidence_level": "low",
  "short_explanation": "We couldn't process this ingredient name. Please check the spelling and try again, or use our full recipe converter for more detailed analysis.",
  "warnings": [
    {
      "type": "verification_required",
      "severity": "medium",
      "message": "Please verify the ingredient name and try again."
    }
  ],
  "warnings": []
}
```

### Network Error
```json
{
  "error": "network_error",
  "message": "We couldn't connect to our knowledge base. Please check your internet connection and try again.",
  "retry_available": true
}
```

---

## Files Created/Modified

1. **`QUICK_LOOKUP_API_CONTRACT.md`** (This file)
   - Complete API and UI contract
   - Response schema
   - UI card examples
   - Copy guidelines

---

## Success Criteria

✅ Always returns halal_status  
✅ Always returns confidence_level (high/medium/low)  
✅ Always returns short_explanation (minimum 15 words)  
✅ Always returns warnings array (empty if none)  
✅ Avoids one-word responses  
✅ Output is readable and reassuring  
✅ Clear API response schema  
✅ UI card examples provided  
✅ Copy guidelines documented
