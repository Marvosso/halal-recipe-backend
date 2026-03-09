# Premium Brand-Level Ingredient Lookup Implementation

## Overview
Premium feature that allows users to search specific brands and get halal certification information, including certifying body, certification number, and last verified date.

---

## Data Model

### Brand Ingredient Schema

```typescript
interface BrandIngredient {
  brand_name: string;              // e.g., "Ben's Original"
  product_name: string;             // e.g., "Basmati Rice"
  ingredient_name: string;         // e.g., "basmati_rice" (for generic lookup)
  halal_certified: boolean;         // Whether product is halal-certified
  certifying_body: string | null;   // e.g., "IFANCA", "HFSAA"
  certification_number: string | null; // e.g., "IFANCA-12345"
  last_verified_date: string | null;   // ISO date string, e.g., "2024-12-15"
  verification_source: string;      // "certifying_body", "user_report", "manufacturer"
  notes: string | null;             // Additional notes
  status: "halal" | "conditional" | "haram" | "uncertain";
}
```

### Database Structure (Future)

```sql
CREATE TABLE brand_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  ingredient_name VARCHAR(255) NOT NULL,
  halal_certified BOOLEAN NOT NULL DEFAULT false,
  certifying_body VARCHAR(255),
  certification_number VARCHAR(255),
  last_verified_date DATE,
  verification_source VARCHAR(50) NOT NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand_name, product_name)
);

CREATE INDEX idx_brand_ingredients_brand ON brand_ingredients(brand_name);
CREATE INDEX idx_brand_ingredients_product ON brand_ingredients(product_name);
CREATE INDEX idx_brand_ingredients_ingredient ON brand_ingredients(ingredient_name);
```

---

## Lookup Logic

### Flow Diagram

```
User Search: "Ben's Original Basmati Rice"
    ↓
1. Check Premium Access
    ├─ Not Premium → Return premium required message
    └─ Premium → Continue
    ↓
2. Normalize Search Term
    "bens_original_basmati_rice"
    ↓
3. Brand Lookup
    ├─ Found → Return brand data + generic fallback
    └─ Not Found → Fall back to generic ingredient lookup
    ↓
4. Format Response
    ├─ Brand Found → Brand-specific response
    └─ Brand Not Found → Generic response with note
```

### Lookup Algorithm

```javascript
function performBrandLookup(searchTerm) {
  // 1. Check premium access
  if (!isPremiumUser()) {
    return { requiresPremium: true, ... };
  }
  
  // 2. Normalize search term
  const normalized = normalizeBrandTerm(searchTerm);
  
  // 3. Extract brand and product
  const { brand, product, fullTerm } = extractBrandAndProduct(searchTerm);
  
  // 4. Try direct lookup
  let brandData = BRAND_INGREDIENTS_DB[fullTerm];
  
  // 5. Try partial matches
  if (!brandData) {
    const matches = Object.keys(BRAND_INGREDIENTS_DB)
      .filter(key => key.includes(fullTerm) || fullTerm.includes(key));
    if (matches.length > 0) {
      brandData = BRAND_INGREDIENTS_DB[matches[0]];
    }
  }
  
  // 6. If brand found, get generic fallback
  if (brandData) {
    const genericResult = evaluateItem(brandData.ingredient_name);
    return formatBrandResult(brandData, genericResult);
  }
  
  // 7. Fall back to generic lookup
  const genericResult = evaluateItem(product);
  return {
    isBrandLookup: false,
    brand_not_found: true,
    generic_fallback: genericResult
  };
}
```

---

## Example Premium Responses

### Example 1: Brand Found (Halal Certified)

**Input:** `"Ben's Original Basmati Rice"`

**Response:**
```json
{
  "halal_status": "halal",
  "confidence_level": "high",
  "confidence_score": 95,
  "short_explanation": "Basmati Rice from Ben's Original is halal-certified by IFANCA. Certification number: IFANCA-12345. Last verified: 12/15/2024. This product is halal and safe to consume.",
  "warnings": [],
  "is_brand_lookup": true,
  "brand_name": "Ben's Original",
  "product_name": "Basmati Rice",
  "display_name": "Basmati Rice",
  "halal_certified": true,
  "certifying_body": "IFANCA",
  "certification_number": "IFANCA-12345",
  "last_verified_date": "2024-12-15",
  "verification_source": "certifying_body",
  "notes": "Certified halal by IFANCA. Product is halal."
}
```

### Example 2: Brand Found (Not Certified)

**Input:** `"Generic Brand Cheese"`

**Response:**
```json
{
  "halal_status": "conditional",
  "confidence_level": "medium",
  "confidence_score": 40,
  "short_explanation": "Cheese from Generic Brand does not have halal certification. Please verify with the manufacturer or look for halal-certified alternatives.",
  "warnings": [
    {
      "type": "verification_required",
      "severity": "high",
      "message": "This brand does not have halal certification. Please verify with the manufacturer or look for halal-certified alternatives."
    }
  ],
  "is_brand_lookup": true,
  "brand_name": "Generic Brand",
  "product_name": "Cheese",
  "display_name": "Cheese",
  "halal_certified": false,
  "certifying_body": null,
  "certification_number": null,
  "last_verified_date": null,
  "verification_source": "manufacturer",
  "notes": "No halal certification found. Please verify with manufacturer or look for halal-certified alternatives."
}
```

### Example 3: Brand Not Found (Fallback to Generic)

**Input:** `"Unknown Brand Product"`

**Response:**
```json
{
  "halal_status": "halal",
  "confidence_level": "high",
  "confidence_score": 95,
  "short_explanation": "Product is a natural, plant-based ingredient that is generally halal. Plant-based ingredients in their natural, unprocessed form are considered halal unless specifically prohibited in Islamic law.",
  "warnings": [],
  "is_brand_lookup": false,
  "brand_not_found": true,
  "message": "Brand-specific data not available for \"Unknown Brand Product\". Showing generic ingredient information.",
  "searched_brand": "unknown_brand",
  "searched_product": "product"
}
```

### Example 4: Premium Required

**Input:** `"Ben's Original Basmati Rice"` (Free User)

**Response:**
```json
{
  "halal_status": null,
  "confidence_level": null,
  "short_explanation": "Brand-level verification is a premium feature. Upgrade to access brand-specific halal certification data.",
  "warnings": [
    {
      "type": "verification_required",
      "severity": "medium",
      "message": "Brand-level verification is a premium feature. Upgrade to access brand-specific halal certification data."
    }
  ],
  "requires_premium": true,
  "premium_feature": "brand_verification"
}
```

### Example 5: Brand Found (Stale Certification)

**Input:** `"Old Brand Product"` (Last verified > 1 year ago)

**Response:**
```json
{
  "halal_status": "halal",
  "confidence_level": "high",
  "confidence_score": 95,
  "short_explanation": "Product from Old Brand is halal-certified by IFANCA. Certification number: IFANCA-99999. Last verified: 1/1/2023. This product is halal and safe to consume.",
  "warnings": [
    {
      "type": "verification_required",
      "severity": "medium",
      "message": "Certification information is over 1 year old. Please verify current certification status."
    }
  ],
  "is_brand_lookup": true,
  "brand_name": "Old Brand",
  "product_name": "Product",
  "halal_certified": true,
  "certifying_body": "IFANCA",
  "certification_number": "IFANCA-99999",
  "last_verified_date": "2023-01-01",
  "verification_source": "certifying_body"
}
```

---

## UI Display Examples

### Brand Found (Certified)

```
┌─────────────────────────────────────────┐
│ ✓ HALAL (CERTIFIED)                     │
│ High Confidence                          │
│                                          │
│ Ben's Original - Basmati Rice           │
│                                          │
│ What this means:                        │
│ Basmati Rice from Ben's Original is     │
│ halal-certified by IFANCA.              │
│ Certification number: IFANCA-12345.     │
│ Last verified: 12/15/2024.             │
│ This product is halal and safe to       │
│ consume.                                 │
│                                          │
│ Certification Details:                   │
│ • Certifying Body: IFANCA               │
│ • Certification #: IFANCA-12345         │
│ • Last Verified: 12/15/2024            │
│ • Source: Certifying Body               │
└─────────────────────────────────────────┘
```

### Brand Found (Not Certified)

```
┌─────────────────────────────────────────┐
│ ⚠ CONDITIONAL                            │
│ Medium Confidence                        │
│                                          │
│ Generic Brand - Cheese                   │
│                                          │
│ What this means:                        │
│ Cheese from Generic Brand does not      │
│ have halal certification. Please       │
│ verify with the manufacturer or look    │
│ for halal-certified alternatives.       │
│                                          │
│ ⚠ Warnings:                              │
│ • Verification Required: This brand     │
│   does not have halal certification.   │
│   Please verify with the manufacturer   │
│   or look for halal-certified           │
│   alternatives.                         │
└─────────────────────────────────────────┘
```

### Brand Not Found (Generic Fallback)

```
┌─────────────────────────────────────────┐
│ ✓ HALAL                                  │
│ High Confidence                          │
│                                          │
│ Product                                  │
│                                          │
│ ℹ️ Brand-specific data not available.   │
│ Showing generic ingredient information.  │
│                                          │
│ What this means:                        │
│ Product is a natural, plant-based       │
│ ingredient that is generally halal.     │
│ Plant-based ingredients in their        │
│ natural, unprocessed form are            │
│ considered halal unless specifically    │
│ prohibited in Islamic law.             │
└─────────────────────────────────────────┘
```

---

## Premium Feature Gating

### Frontend Check

```javascript
import { isPremiumUser } from './subscription';
import { performBrandLookup } from './brandLookup';

if (isBrandSearch(searchTerm)) {
  if (isPremiumUser()) {
    // Perform brand lookup
    const result = performBrandLookup(searchTerm);
  } else {
    // Show upgrade prompt
    setShowUpgradeModal(true);
    setUpgradeTriggerFeature('brandVerification');
  }
}
```

### Backend Check (Future)

```javascript
// In backend API route
router.get('/api/ingredients/brand-lookup', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const isPremium = await hasPremiumAccess(userId);
  
  if (!isPremium) {
    return res.status(403).json({
      error: 'Premium feature',
      requires_premium: true,
      premium_feature: 'brand_verification'
    });
  }
  
  // Perform brand lookup
  const result = await performBrandLookup(req.query.term);
  res.json(result);
});
```

---

## Files Created/Modified

1. **`frontend/src/lib/brandLookup.js`** (New)
   - Brand lookup logic
   - Brand database (in-memory, future: database)
   - Premium access check
   - Fallback to generic lookup

2. **`frontend/src/lib/brandLookupResponseFormatter.js`** (New)
   - Formats brand lookup results
   - Handles premium required
   - Formats brand found/not found responses

3. **`frontend/src/components/QuickLookup.jsx`** (Updated)
   - Integrated brand lookup
   - Premium feature gating
   - Brand result display

4. **`BRAND_LOOKUP_IMPLEMENTATION.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Allow users to search specific brands  
✅ Show halal certification status  
✅ Show certifying body  
✅ Show last verified date  
✅ Fall back to generic ingredient lookup if brand data unavailable  
✅ Feature must be premium-only  
✅ Clear data model  
✅ Comprehensive lookup logic  
✅ Example premium responses provided
