# Halal Certification Trust Engine

## Overview
Trust engine that stores certification bodies, assigns trust levels, and displays certifier information. Premium users see detailed certification data including recognition, standards, and verification history.

---

## Data Model

### Certification Body Schema

```typescript
interface CertificationBody {
  id: string;                    // Unique identifier
  name: string;                  // Full name
  abbreviation: string;          // Short form (e.g., "IFANCA", "HFA")
  country: string;               // Country of origin
  trust_level: "high" | "medium" | "low" | "unknown";
  trust_score: number;           // 0-100
  recognition: string[];         // Countries/regions that recognize this certifier
  verification_standards: string[]; // Standards they follow
  website: string | null;        // Official website URL
  description: string;           // Detailed description
  simple_description: string;    // Simplified description
  established_year: number | null;
  certifications_per_year: string;
  global_recognition: "very_high" | "high" | "medium" | "low" | "unknown";
}
```

### Trust Level Thresholds

- **High Trust**: 85-100 (Highly recognized, international)
- **Medium Trust**: 60-84 (Recognized regionally)
- **Low Trust**: 30-59 (Limited recognition)
- **Unknown**: 0-29 (Not recognized)

---

## Certification Bodies Database

### High Trust Certifiers

**IFANCA (Islamic Food and Nutrition Council of America)**
- Trust Score: 95
- Country: United States
- Recognition: United States, Canada, International
- Established: 1982
- Certifications: 5000+ per year

**JAKIM (Jabatan Kemajuan Islam Malaysia)**
- Trust Score: 98
- Country: Malaysia
- Recognition: Malaysia, Southeast Asia, International
- Established: 1974
- Certifications: 10000+ per year
- Official Malaysian certifier

**MUIS (Majlis Ugama Islam Singapura)**
- Trust Score: 96
- Country: Singapore
- Recognition: Singapore, Southeast Asia, International
- Established: 1968
- Certifications: 4000+ per year
- Official Singapore certifier

**HFA (Halal Food Authority)**
- Trust Score: 92
- Country: United Kingdom
- Recognition: United Kingdom, Europe, International
- Established: 1994
- Certifications: 3000+ per year

**GIMDES (Turkey)**
- Trust Score: 90
- Country: Turkey
- Recognition: Turkey, Europe, Middle East
- Established: 2005
- Certifications: 2000+ per year

### Medium Trust Certifiers

**Halal Foundation (HF)**
- Trust Score: 75
- Country: United States
- Recognition: United States
- Limited international recognition

**Halal Certification Services (HCS)**
- Trust Score: 70
- Country: United States
- Recognition: United States
- Limited international recognition

---

## Trust Scoring Logic

### Scoring Factors

1. **Recognition (max 40 points)**
   - Number of countries/regions: 5 points each (max 30)
   - International recognition: +10 points

2. **Established Years (max 20 points)**
   - 20+ years: 20 points
   - 10-19 years: 15 points
   - 5-9 years: 10 points
   - 1-4 years: 5 points

3. **Certifications Per Year (max 15 points)**
   - 5000+: 15 points
   - 2000-4999: 12 points
   - 1000-1999: 8 points
   - 500-999: 5 points

4. **Standards and Verification (max 15 points)**
   - Follows recognized standards: 10 points
   - Official certifier: +5 points

5. **Website and Transparency (max 10 points)**
   - Has official website: 10 points

6. **Global Recognition Bonus (max 10 points)**
   - Very high: 10 points
   - High: 7 points
   - Medium: 4 points

### Example Calculation

**IFANCA:**
- Recognition: 3 countries + international = 30 + 10 = 40
- Established: 42 years = 20
- Certifications: 5000+ = 15
- Standards: Yes + Official = 10 + 5 = 15
- Website: Yes = 10
- Global Recognition: High = 7
- **Total: 107 → Capped at 95** (high trust)

---

## Example Outputs

### Example 1: High Trust Certifier (All Users)

**Input:** `certifierName: "IFANCA"`

**Response:**
```json
{
  "certifier": {
    "name": "Islamic Food and Nutrition Council of America",
    "abbreviation": "IFANCA",
    "country": "United States",
    "trust_level": "high",
    "trust_score": 95,
    "simple_description": "IFANCA is a highly trusted halal certifier in North America, recognized internationally."
  },
  "trust_badge": {
    "label": "High Trust",
    "color": "#0A9D58",
    "icon": "check-circle",
    "description": "This certifier is highly trusted and recognized internationally."
  },
  "explanation": "Islamic Food and Nutrition Council of America is a high trust certifier (trust score: 95/100). IFANCA is a highly trusted halal certifier in North America, recognized internationally.",
  "validation": {
    "is_valid": true,
    "trust_level": "high",
    "message": "This certifier has high trust level and is recognized.",
    "recommendation": null
  },
  "premium_data": null,
  "requires_premium": false
}
```

### Example 2: High Trust Certifier (Premium User)

**Input:** `certifierName: "JAKIM"`, `certificationNumber: "JAKIM-12345"`, `lastVerifiedDate: "2024-12-15"`

**Response:**
```json
{
  "certifier": {
    "name": "Jabatan Kemajuan Islam Malaysia",
    "abbreviation": "JAKIM",
    "country": "Malaysia",
    "trust_level": "high",
    "trust_score": 98,
    "simple_description": "JAKIM is the official Malaysian halal certifier, highly trusted worldwide."
  },
  "trust_badge": {
    "label": "High Trust",
    "color": "#0A9D58",
    "icon": "check-circle",
    "description": "This certifier is highly trusted and recognized internationally."
  },
  "certification": {
    "number": "JAKIM-12345",
    "last_verified_date": "2024-12-15",
    "is_verified": true
  },
  "explanation": "Jabatan Kemajuan Islam Malaysia is a high trust certifier (trust score: 98/100). JAKIM is the official Malaysian halal certifier, highly trusted worldwide. JAKIM is the official halal certification body of Malaysia. They follow the Malaysian Standard MS 1500:2019 for halal food production. JAKIM certification is highly trusted and recognized worldwide, especially in Southeast Asia. Certification number: JAKIM-12345. Last verified: 12/15/2024.",
  "validation": {
    "is_valid": true,
    "trust_level": "high",
    "message": "This certifier has high trust level and is recognized.",
    "recommendation": null
  },
  "premium_data": {
    "recognition": ["Malaysia", "Southeast Asia", "International"],
    "verification_standards": ["MS 1500:2019", "HACCP", "ISO 22000"],
    "website": "https://www.halal.gov.my",
    "description": "JAKIM is the official halal certification body of Malaysia. They follow the Malaysian Standard MS 1500:2019 for halal food production. JAKIM certification is highly trusted and recognized worldwide, especially in Southeast Asia.",
    "established_year": 1974,
    "certifications_per_year": "10000+",
    "global_recognition": "very_high"
  },
  "requires_premium": false
}
```

### Example 3: Medium Trust Certifier (Free User)

**Input:** `certifierName: "Halal Foundation"`

**Response:**
```json
{
  "certifier": {
    "name": "Halal Foundation",
    "abbreviation": "HF",
    "country": "United States",
    "trust_level": "medium",
    "trust_score": 75,
    "simple_description": "Halal Foundation is a regional halal certifier in the US."
  },
  "trust_badge": {
    "label": "Medium Trust",
    "color": "#F59E0B",
    "icon": "alert-circle",
    "description": "This certifier is recognized but may have limited international recognition."
  },
  "explanation": "Halal Foundation is a medium trust certifier (trust score: 75/100). Halal Foundation is a regional halal certifier in the US.",
  "validation": {
    "is_valid": true,
    "trust_level": "medium",
    "message": "This certifier has medium trust level and is recognized.",
    "recommendation": null
  },
  "premium_data": null,
  "requires_premium": true
}
```

### Example 4: Unknown Certifier

**Input:** `certifierName: "Unknown Certifier XYZ"`

**Response:**
```json
{
  "certifier": {
    "name": "Unknown Certifier",
    "abbreviation": "Unknown",
    "country": "Unknown",
    "trust_level": "unknown",
    "trust_score": 0,
    "simple_description": "This certifier is not recognized. Please verify their credentials."
  },
  "trust_badge": {
    "label": "Unknown Trust",
    "color": "#6B7280",
    "icon": "help-circle",
    "description": "This certifier is not recognized. Please verify their credentials with a qualified Islamic scholar."
  },
  "explanation": "Unknown Certifier is a unknown trust certifier (trust score: 0/100). This certifier is not recognized. Please verify their credentials.",
  "validation": {
    "is_valid": false,
    "trust_level": "unknown",
    "message": "This certifier is not recognized in our database. Please verify their credentials.",
    "recommendation": "Consult with a qualified Islamic scholar before relying on this certification."
  },
  "premium_data": null,
  "requires_premium": false
}
```

---

## UI Display Examples

### High Trust Certifier (All Users)

```
┌─────────────────────────────────────────┐
│ ✓ HIGH TRUST CERTIFIER                   │
│                                          │
│ IFANCA                                   │
│ Islamic Food and Nutrition Council of    │
│ America                                  │
│                                          │
│ Trust Score: 95/100                      │
│ Country: United States                   │
│                                          │
│ IFANCA is a highly trusted halal        │
│ certifier in North America, recognized  │
│ internationally.                         │
└─────────────────────────────────────────┘
```

### High Trust Certifier (Premium User)

```
┌─────────────────────────────────────────┐
│ ✓ HIGH TRUST CERTIFIER                   │
│                                          │
│ JAKIM                                    │
│ Jabatan Kemajuan Islam Malaysia         │
│                                          │
│ Trust Score: 98/100                      │
│ Country: Malaysia                        │
│ Certification: JAKIM-12345              │
│ Last Verified: 12/15/2024               │
│                                          │
│ Recognition:                             │
│ • Malaysia                               │
│ • Southeast Asia                         │
│ • International                          │
│                                          │
│ Standards:                               │
│ • MS 1500:2019                          │
│ • HACCP                                 │
│ • ISO 22000                             │
│                                          │
│ Established: 1974                        │
│ Certifications: 10000+ per year          │
│ Global Recognition: Very High           │
│                                          │
│ Website: halal.gov.my                   │
└─────────────────────────────────────────┘
```

### Medium Trust Certifier (Free User)

```
┌─────────────────────────────────────────┐
│ ⚠ MEDIUM TRUST CERTIFIER                 │
│                                          │
│ Halal Foundation                         │
│                                          │
│ Trust Score: 75/100                      │
│ Country: United States                   │
│                                          │
│ Halal Foundation is a regional halal    │
│ certifier in the US.                    │
│                                          │
│ [Upgrade to Premium] to see detailed      │
│ recognition, standards, and verification │
│ information.                             │
└─────────────────────────────────────────┘
```

### Unknown Certifier

```
┌─────────────────────────────────────────┐
│ ❓ UNKNOWN TRUST CERTIFIER                │
│                                          │
│ Unknown Certifier                        │
│                                          │
│ Trust Score: 0/100                       │
│                                          │
│ ⚠️ WARNING:                              │
│ This certifier is not recognized in our │
│ database. Please verify their            │
│ credentials with a qualified Islamic    │
│ scholar before relying on this           │
│ certification.                           │
└─────────────────────────────────────────┘
```

---

## Integration Points

### Brand Lookup Integration

```javascript
import { formatBrandCertification } from './certificationDisplayFormatter';

// In brand lookup result
const certification = formatBrandCertification(brandData);
// Display certification info with trust level
```

### Quick Lookup Integration

```javascript
import { formatCertificationResponse } from './certificationDisplayFormatter';

// When certification is found
if (ingredient.certifying_body) {
  const certData = formatCertificationResponse(
    ingredient.certifying_body,
    ingredient.certification_number,
    ingredient.last_verified_date
  );
  // Display certifier name and trust level
}
```

---

## Files Created/Modified

1. **`frontend/src/lib/certificationDatabase.js`** (New)
   - Certification bodies database
   - Trust scoring logic
   - Lookup functions

2. **`frontend/src/lib/certificationTrustEngine.js`** (New)
   - Trust engine logic
   - Certification formatting
   - Validation functions

3. **`frontend/src/lib/certificationDisplayFormatter.js`** (New)
   - UI display formatting
   - API response formatting
   - Premium data handling

4. **`CERTIFICATION_TRUST_ENGINE.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Stores certification bodies (IFANCA, HFA, JAKIM, etc.)  
✅ Assigns trust levels to certifiers  
✅ Displays certifier name and trust level to users  
✅ Premium users see detailed certification data  
✅ Clear data model  
✅ Trust scoring logic  
✅ UI examples provided
