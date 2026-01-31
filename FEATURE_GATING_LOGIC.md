# Feature Gating Logic for Premium Users

## Overview
UX-safe feature gating that shows upgrade prompts only at natural friction points, never blocking core functionality.

## Gating Rules

### Core Features (Always Free)
- ✅ Unlimited basic recipe conversions
- ✅ Basic halal verification (ingredient-level)
- ✅ Text export
- ✅ Top 2 substitution alternatives
- ✅ Up to 10 saved recipes
- ✅ Access to all affiliate links

### Premium Features (Require Subscription)
- 🔒 Advanced substitution logic (all alternatives, match scores)
- 🔒 Strict Halal Mode (enhanced verification)
- 🔒 Brand-level halal verification
- 🔒 Unlimited saved recipes + collections
- 🔒 PDF & JSON export
- 🔒 Batch conversion
- 🔒 Conversion history
- 🔒 Meal planning integration

---

## Feature Gating Implementation

### 1. Substitution Limit

**Free Tier**: Top 2 alternatives
**Premium Tier**: All alternatives

**Pseudocode**:
```javascript
async function getSubstitutions(ingredientId) {
  const allAlternatives = await getAllAlternatives(ingredientId);
  
  if (isPremiumUser()) {
    return allAlternatives; // All alternatives
  }
  
  return allAlternatives.slice(0, 2); // Top 2 only
}
```

**Upgrade Trigger**: When user sees "Showing 2 of 5 alternatives"

---

### 2. Advanced Substitution Logic

**Free Tier**: Basic substitution (first match)
**Premium Tier**: Advanced algorithms with match scores

**Pseudocode**:
```javascript
async function getSubstitution(ingredientId) {
  if (await canUseAdvancedSubstitutions()) {
    // Premium: Use advanced algorithm
    return await getAdvancedSubstitution(ingredientId, {
      includeMatchScores: true,
      includeFlavorAnalysis: true,
      includeTextureAnalysis: true
    });
  }
  
  // Free: Basic substitution
  return await getBasicSubstitution(ingredientId);
}
```

**Upgrade Trigger**: When user tries to see match scores or advanced features

---

### 3. Strict Halal Mode

**Free Tier**: Standard verification
**Premium Tier**: Strict Halal Mode (enhanced rules)

**Pseudocode**:
```javascript
async function verifyIngredient(ingredientId, options = {}) {
  // Check if strict mode is requested
  if (options.strictMode && !await canUseStrictHalalMode()) {
    // Show upgrade prompt
    showUpgradePrompt('strictHalalMode');
    return null; // Don't proceed
  }
  
  // Apply strictness
  const strictness = options.strictMode ? 'strict' : 'standard';
  return await evaluateItem(ingredientId, { strictness });
}
```

**Upgrade Trigger**: When user tries to enable Strict Halal Mode

---

### 4. Saved Recipes Limit

**Free Tier**: 10 recipes
**Premium Tier**: Unlimited

**Pseudocode**:
```javascript
async function saveRecipe(recipeData) {
  const currentCount = await getSavedRecipeCount(userId);
  
  if (!await canSaveMoreRecipes(currentCount)) {
    // Show upgrade prompt
    showUpgradePrompt('savedRecipes', {
      currentCount: currentCount,
      limit: 10
    });
    return { error: 'Limit reached' };
  }
  
  // Save recipe
  return await saveRecipeToDatabase(recipeData);
}
```

**Upgrade Trigger**: When user tries to save 11th recipe

---

### 5. Export Formats

**Free Tier**: Text only
**Premium Tier**: PDF, JSON

**Pseudocode**:
```javascript
async function exportRecipe(format) {
  if (!await canExportTo(format)) {
    // Show upgrade prompt
    showUpgradePrompt('pdfExport');
    return { error: 'Premium feature required' };
  }
  
  // Export in requested format
  return await generateExport(recipe, format);
}
```

**Upgrade Trigger**: When user tries to export to PDF/JSON

---

### 6. Brand-Level Verification

**Free Tier**: Ingredient-level only
**Premium Tier**: Brand-level verification

**Pseudocode**:
```javascript
async function verifyBrand(brandName, ingredientId) {
  if (!await canUseBrandVerification()) {
    // Show upgrade prompt
    showUpgradePrompt('brandVerification');
    return { error: 'Premium feature required' };
  }
  
  // Check brand in database
  return await checkBrandHalalStatus(brandName, ingredientId);
}
```

**Upgrade Trigger**: When user tries to check specific brand

---

## UX-Safe Upgrade Trigger Points

### Natural Friction Points (Show Prompts)

1. **Substitution Limit Reached**
   - When: User sees only 2 alternatives, but more exist
   - Message: "Showing 2 of 5 alternatives. Upgrade to see all."
   - Placement: Below alternatives list
   - Non-intrusive: ✅

2. **Saved Recipe Limit Reached**
   - When: User tries to save 11th recipe
   - Message: "You've saved 10 recipes. Upgrade for unlimited saves."
   - Placement: In save confirmation dialog
   - Non-intrusive: ✅

3. **Premium Feature Attempted**
   - When: User tries to use premium feature
   - Message: Feature-specific message
   - Placement: In feature UI
   - Non-intrusive: ✅

### Never Show Prompts For

- ❌ Core conversions (always free)
- ❌ Basic halal verification (always free)
- ❌ Text export (always free)
- ❌ Affiliate links (always available)
- ❌ On every page load
- ❌ In popups or modals (unless feature-specific)

---

## Upgrade Prompt Implementation

### Component Structure

```jsx
<UpgradePrompt
  triggerFeature="substitutions"
  context={{
    currentCount: 2,
    totalCount: 5
  }}
  onClose={() => setShowPrompt(false)}
/>
```

### Prompt Types

1. **Inline Prompt** (in feature UI)
   - Shows within the feature area
   - Dismissible
   - Context-aware

2. **Modal Prompt** (for important features)
   - Shows in upgrade modal
   - Full feature list
   - Clear CTA

3. **Banner Prompt** (subtle, persistent)
   - Shows at top of page
   - Dismissible
   - Non-blocking

---

## Pseudocode for Feature Gating

### Main Gating Function

```javascript
async function checkFeatureAccess(feature, userId) {
  // Get subscription status
  const subscription = await getSubscriptionStatus(userId);
  
  // Check if feature is premium
  const premiumFeatures = [
    'advancedSubstitutions',
    'strictHalalMode',
    'brandVerification',
    'batchConversion',
    'pdfExport',
    'conversionHistory'
  ];
  
  if (premiumFeatures.includes(feature)) {
    if (!subscription.is_active) {
      // Show upgrade prompt
      return {
        allowed: false,
        showUpgrade: true,
        upgradeFeature: feature
      };
    }
  }
  
  return { allowed: true };
}
```

### Substitution Gating

```javascript
async function getSubstitutions(ingredientId, userId) {
  // Get all alternatives
  const allAlternatives = await getAllAlternatives(ingredientId);
  
  // Check subscription
  const isPremium = await isPremiumUser(userId);
  
  if (isPremium) {
    // Premium: All alternatives with match scores
    return {
      alternatives: allAlternatives,
      matchScores: await getMatchScores(allAlternatives),
      showUpgrade: false
    };
  }
  
  // Free: Top 2 alternatives
  const limited = allAlternatives.slice(0, 2);
  
  return {
    alternatives: limited,
    allAlternatives: allAlternatives, // Store for upgrade prompt
    showUpgrade: allAlternatives.length > 2,
    upgradeMessage: `Showing 2 of ${allAlternatives.length} alternatives`
  };
}
```

### Strict Halal Mode Gating

```javascript
async function applyStrictHalalMode(ingredientId, userId, options) {
  // Check if strict mode requested
  if (options.strictMode) {
    const canUse = await canUseStrictHalalMode(userId);
    
    if (!canUse) {
      // Show upgrade prompt
      return {
        error: 'Strict Halal Mode is a Premium feature',
        showUpgrade: true,
        upgradeFeature: 'strictHalalMode'
      };
    }
    
    // Apply strict mode
    return await evaluateWithStrictMode(ingredientId);
  }
  
  // Standard mode (always available)
  return await evaluateStandard(ingredientId);
}
```

### Saved Recipes Gating

```javascript
async function saveRecipe(userId, recipeData) {
  // Get current count
  const currentCount = await getSavedRecipeCount(userId);
  const limit = await getSavedRecipesLimit(userId);
  
  // Check limit
  if (currentCount >= limit) {
    return {
      error: 'Saved recipe limit reached',
      currentCount: currentCount,
      limit: limit,
      showUpgrade: true,
      upgradeFeature: 'savedRecipes'
    };
  }
  
  // Save recipe
  return await saveRecipeToDatabase(userId, recipeData);
}
```

---

## Upgrade Prompt Examples

### Example 1: Substitution Limit

**Trigger**: User sees only 2 alternatives, but 5 exist

**UI**:
```
Alternatives:
1. Agar Agar
2. Pectin

Showing 2 of 5 alternatives.
[Upgrade to see all] [Maybe Later]
```

**Code**:
```jsx
{issue.allAlternatives && 
 issue.allAlternatives.length > issue.alternatives.length && (
  <UpgradePrompt
    triggerFeature="substitutions"
    context={{
      shown: issue.alternatives.length,
      total: issue.allAlternatives.length
    }}
  />
)}
```

---

### Example 2: Saved Recipe Limit

**Trigger**: User tries to save 11th recipe

**UI**:
```
💾 You've saved 10 recipes!

Upgrade to Premium for unlimited saves, recipe collections, and search.

[Upgrade - $2.99/month] [Maybe Later]
```

**Code**:
```jsx
const handleSaveRecipe = async () => {
  const canSave = await canSaveMoreRecipes(savedRecipes.length);
  
  if (!canSave) {
    setShowUpgradeModal(true);
    setUpgradeTriggerFeature('savedRecipes');
    return;
  }
  
  // Save recipe
  await saveRecipe(recipeData);
};
```

---

### Example 3: Strict Halal Mode

**Trigger**: User tries to enable Strict Halal Mode

**UI**:
```
🔒 Strict Halal Mode

Enhanced halal verification with stricter rules. Premium feature.

[Upgrade to Premium] [Use Standard Mode]
```

**Code**:
```jsx
const handleStrictModeToggle = async (enabled) => {
  if (enabled && !await canUseStrictHalalMode()) {
    setShowUpgradeModal(true);
    setUpgradeTriggerFeature('strictHalalMode');
    return;
  }
  
  // Apply strict mode
  setHalalSettings({ ...halalSettings, strictMode: enabled });
};
```

---

### Example 4: PDF Export

**Trigger**: User tries to export to PDF

**UI**:
```
📄 PDF Export

PDF export is a Premium feature. Upgrade for PDF, JSON, and advanced export options.

[Upgrade to Premium] [Export as Text]
```

**Code**:
```jsx
const handleExport = async (format) => {
  if (!await canExportTo(format)) {
    setShowUpgradeModal(true);
    setUpgradeTriggerFeature('pdfExport');
    return;
  }
  
  // Export in requested format
  await exportRecipe(recipe, format);
};
```

---

## Implementation Checklist

### Backend
- [x] Subscription status API
- [x] Feature gating middleware
- [x] Subscription service

### Frontend
- [x] Feature gating utilities
- [x] Upgrade prompt component
- [x] Integration in conversion logic
- [ ] Integration in saved recipes
- [ ] Integration in export functions
- [ ] Integration in strict halal mode

### UX
- [x] Upgrade prompts at friction points
- [x] Non-intrusive messaging
- [x] Clear value proposition
- [x] Easy dismissal

---

## Files Created/Modified

1. **Feature Gating**:
   - `frontend/src/lib/featureGating.js` - Gating logic
   - `frontend/src/components/UpgradePrompt.jsx` - Upgrade prompt component
   - `frontend/src/components/UpgradePrompt.css` - Prompt styles

2. **Integration**:
   - `frontend/src/lib/convertRecipeJson.js` - Apply substitution limits
   - `frontend/src/App.jsx` - Show upgrade prompts in UI

3. **Documentation**:
   - `FEATURE_GATING_LOGIC.md` - This file

---

## Key Principles

1. **Never Block Core Features**: Conversions, basic verification always free
2. **Natural Friction Points**: Only show prompts when user hits limits
3. **Clear Value**: Explain what premium gets you
4. **Easy Dismissal**: Users can always say "Maybe Later"
5. **No Dark Patterns**: No fake urgency, no misleading labels
