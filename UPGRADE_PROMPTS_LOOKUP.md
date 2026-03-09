# Upgrade Prompts for Premium Lookup Features

## Overview
Respectful, value-based upgrade prompts that trigger when free users attempt premium lookup features (brand-level lookup, additive breakdown). Basic ingredient lookup is never blocked.

---

## Trigger Logic

### 1. Brand-Level Lookup Trigger

**When:** Free user searches for a brand (e.g., "Ben's Original Basmati Rice")

**Logic:**
```javascript
const isBrand = isBrandSearch(searchValue);
const isPremium = isPremiumUser();

if (isBrand && !isPremium) {
  // 1. Still perform generic ingredient lookup (NEVER BLOCK)
  const genericResult = evaluateItem(productName);
  
  // 2. Add upgrade prompt flag to result
  result.showBrandUpgradePrompt = true;
  result.brandSearchAttempted = true;
  result.premiumFeature = "brandVerification";
  
  // 3. Display generic result + upgrade prompt
}
```

**Key Rules:**
- ✅ Always show generic ingredient lookup result
- ✅ Never block basic lookup functionality
- ✅ Show upgrade prompt as additional information
- ✅ User can dismiss prompt and continue with generic lookup

---

### 2. Additive Breakdown Trigger

**When:** Free user clicks "Show Additive Breakdown" button

**Logic:**
```javascript
// Button only visible if ingredient has additives
if (isPremiumUser()) {
  // Show additive breakdown
  const additives = detectAdditives(ingredientList);
  const breakdown = formatAdditiveBreakdown(additives);
} else {
  // Trigger upgrade modal
  setUpgradeTriggerFeature('additiveBreakdown');
  setShowUpgradeModal(true);
}
```

**Key Rules:**
- ✅ Button is visible to all users (labeled "Premium" for free users)
- ✅ Clicking triggers upgrade modal
- ✅ No blocking - user can continue with basic lookup
- ✅ Button only appears if ingredient likely has additives

---

## Upgrade Modal Copy

### Brand Verification Copy

```javascript
{
  title: "Brand-Level Verification",
  message: "Brand-level verification helps you check if specific brands are halal-certified. See certifying body, certification number, and last verified date. Upgrade to Premium to access this feature.",
  cta: "Upgrade to Premium",
  valueProp: "Know exactly what you're buying with brand-specific halal certification data.",
  dismiss: "Continue with Generic Lookup"
}
```

### Additive Breakdown Copy

```javascript
{
  title: "Additive & E-Number Breakdown",
  message: "Get detailed breakdown of additives and E-numbers in ingredients. See which additives are halal, conditional, or haram with simplified explanations.",
  cta: "Upgrade to See Additive Breakdown",
  valueProp: "Make informed decisions with detailed additive analysis and halal status explanations.",
  dismiss: "Continue Free"
}
```

---

## UX Flow

### Flow 1: Brand Search (Free User)

```
User searches: "Ben's Original Basmati Rice"
    ↓
1. Detect brand search
    ↓
2. Check premium status → Free user
    ↓
3. Perform generic lookup (NEVER BLOCK)
    ├─ Extract product: "basmati rice"
    └─ Evaluate: halal, high confidence
    ↓
4. Display generic result
    ├─ Status: Halal
    ├─ Explanation: "Basmati rice is a natural, plant-based ingredient..."
    └─ Confidence: High
    ↓
5. Show upgrade prompt card
    ├─ Title: "Brand-Level Verification Available"
    ├─ Message: "You searched for a brand, but brand-specific..."
    ├─ Button: "Upgrade to Premium"
    └─ Button: "Continue with Generic Lookup"
    ↓
6. User can:
    ├─ Click "Upgrade" → Open upgrade modal
    ├─ Click "Continue" → Dismiss prompt, keep result
    └─ Ignore → Result remains visible
```

### Flow 2: Additive Breakdown (Free User)

```
User views ingredient result
    ↓
1. System detects ingredient likely has additives
    ↓
2. Show "Additive Breakdown (Premium)" button
    ↓
3. User clicks button
    ↓
4. Trigger upgrade modal
    ├─ Title: "Additive & E-Number Breakdown"
    ├─ Message: "Get detailed breakdown..."
    ├─ Button: "Upgrade to See Additive Breakdown"
    └─ Button: "Continue Free"
    ↓
5. User can:
    ├─ Click "Upgrade" → Stripe checkout
    └─ Click "Continue Free" → Dismiss modal, return to lookup
```

### Flow 3: Brand Search (Premium User)

```
User searches: "Ben's Original Basmati Rice"
    ↓
1. Detect brand search
    ↓
2. Check premium status → Premium user
    ↓
3. Perform brand lookup
    ├─ Found: Show brand-specific data
    │   ├─ Certifying body: IFANCA
    │   ├─ Certification number: IFANCA-12345
    │   └─ Last verified: 12/15/2024
    └─ Not found: Fall back to generic lookup
    ↓
4. Display brand result or generic fallback
```

---

## UI Examples

### Brand Upgrade Prompt Card

```
┌─────────────────────────────────────────┐
│ ✓ HALAL                                │
│ High Confidence                        │
│                                        │
│ Basmati Rice                           │
│                                        │
│ What this means:                       │
│ Basmati rice is a natural, plant-based │
│ ingredient that is generally halal...  │
│                                        │
│ ┌───────────────────────────────────┐ │
│ │ 🏷️ Brand-Level Verification        │ │
│ │ Available                           │ │
│ │                                     │ │
│ │ You searched for a brand, but       │ │
│ │ brand-specific halal certification  │ │
│ │ data is a Premium feature.         │ │
│ │                                     │ │
│ │ Upgrade to see certifying body,    │ │
│ │ certification number, and last     │ │
│ │ verified date for specific brands. │ │
│ │                                     │ │
│ │ [Upgrade to Premium]                │ │
│ │ [Continue with Generic Lookup]     │ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Additive Breakdown Button (Free User)

```
┌─────────────────────────────────────────┐
│ ✓ HALAL                                │
│ High Confidence                        │
│                                        │
│ Processed Cheese                       │
│                                        │
│ [📊 Additive Breakdown (Premium)]     │
│                                        │
│ (Clicking opens upgrade modal)         │
└─────────────────────────────────────────┘
```

### Additive Breakdown Button (Premium User)

```
┌─────────────────────────────────────────┐
│ ✓ HALAL                                │
│ High Confidence                        │
│                                        │
│ Processed Cheese                       │
│                                        │
│ [📊 Show Additive Breakdown]           │
│                                        │
│ (Clicking shows breakdown)             │
└─────────────────────────────────────────┘
```

---

## Implementation Details

### QuickLookup Component Updates

**State:**
```javascript
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [upgradeTriggerFeature, setUpgradeTriggerFeature] = useState(null);
```

**Brand Lookup Logic:**
```javascript
if (isBrand && !isPremium) {
  // Perform generic lookup (never block)
  const genericResult = evaluateItem(productName);
  
  // Add upgrade prompt flag
  result = {
    ...genericResult,
    showBrandUpgradePrompt: true,
    brandSearchAttempted: true,
    premiumFeature: "brandVerification"
  };
}
```

**Additive Breakdown Logic:**
```javascript
// Button click handler
const handleAdditiveBreakdown = () => {
  if (isPremiumUser()) {
    // Show breakdown
    const additives = detectAdditives(ingredientText);
    const breakdown = formatAdditiveBreakdown(additives);
    setResult({ ...result, additiveBreakdown: breakdown });
  } else {
    // Trigger upgrade modal
    setUpgradeTriggerFeature('additiveBreakdown');
    setShowUpgradeModal(true);
  }
};
```

---

## Copy Guidelines

### Tone
- ✅ Respectful and helpful
- ✅ Value-focused (explain benefit, not restriction)
- ✅ Non-pushy (easy to dismiss)
- ✅ Clear about what user gets

### Structure
1. **Acknowledge** what user tried to do
2. **Explain** what Premium offers
3. **Value prop** (why it's useful)
4. **Clear CTA** (Upgrade button)
5. **Easy dismiss** (Continue Free button)

### Examples

**Good:**
> "You searched for a brand, but brand-specific halal certification data is a Premium feature. Upgrade to see certifying body, certification number, and last verified date for specific brands."

**Bad:**
> "This feature is locked. Pay to unlock."

---

## Files Created/Modified

1. **`frontend/src/lib/upgradeCopy.js`** (Updated)
   - Added `brandVerification` copy
   - Added `additiveBreakdown` copy

2. **`frontend/src/components/QuickLookup.jsx`** (Updated)
   - Added upgrade modal state
   - Added brand lookup upgrade prompt
   - Added additive breakdown button and trigger
   - Integrated PremiumUpgradeModal

3. **`UPGRADE_PROMPTS_LOOKUP.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Triggers only when free users attempt brand-level lookup  
✅ Triggers only when free users attempt additive breakdown  
✅ Uses respectful, value-based copy  
✅ Never blocks basic ingredient lookup  
✅ Clear trigger logic  
✅ Upgrade modal copy provided  
✅ UX flow documented
