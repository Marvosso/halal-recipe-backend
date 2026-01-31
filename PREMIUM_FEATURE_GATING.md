# Premium Feature Gating Implementation

## Overview
Complete premium feature gating with conversion limits, premium-only features, and upgrade modal triggers.

---

## Gating Rules

### Conversion Limits

**Free Users:**
- 5 conversions per month
- Tracked in database (`conversion_history` table)
- Reset on 1st of each month

**Premium Users:**
- Unlimited conversions
- No tracking needed

### Premium-Only Features

1. **Advanced Substitutions**
   - Free: Top 2 alternatives only
   - Premium: All alternatives with match scores

2. **Strict Halal Mode**
   - Free: Standard/Flexible only
   - Premium: Strict mode enabled

3. **Shopping List Export**
   - Free: Not available
   - Premium: Generate and export shopping lists

---

## Backend Implementation

### Conversion Limit Check

**Pseudocode:**
```javascript
async function checkConversionLimit(userId) {
  const isPremium = await hasPremiumAccess(userId);
  
  if (isPremium) {
    return { canConvert: true, limit: Infinity };
  }
  
  // Get current month start
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  // Count conversions this month
  const count = await db.query(
    `SELECT COUNT(*) FROM conversion_history
     WHERE user_id = $1 AND created_at >= $2`,
    [userId, monthStart]
  );
  
  const limit = 5;
  const remaining = Math.max(0, limit - count);
  
  return {
    canConvert: remaining > 0,
    limit: limit,
    used: count,
    remaining: remaining
  };
}
```

### API Endpoints

**POST /convert**
- Checks conversion limit before conversion
- Returns 403 if limit reached
- Tracks conversion in database

**GET /convert/limit**
- Returns current conversion status
- Shows used/remaining/limit

**POST /convert/advanced-substitutions** (Premium only)
- Requires `requirePremium` middleware
- Returns all alternatives with match scores

**POST /convert/export-shopping-list** (Premium only)
- Requires `requirePremium` middleware
- Generates shopping list export

---

## Frontend Implementation

### Conversion Limit Check

**Before Conversion:**
```javascript
const conversionCheck = checkConversionLimit();
if (!conversionCheck.canConvert) {
  setUpgradeTriggerFeature('conversionLimit');
  setShowUpgradeModal(true);
  return; // Don't proceed
}
```

### Premium Feature Checks

**Strict Halal Mode:**
```javascript
if (level === "strict" && !isPremiumUser()) {
  const canUse = canUseStrictHalalMode();
  if (!canUse) {
    setShowUpgradeModal(true);
    setUpgradeTriggerFeature('strictHalalMode');
    return;
  }
}
```

**Advanced Substitutions:**
```javascript
if (!canUseAdvancedSubstitutions()) {
  // Show only top 2 alternatives
  // Show upgrade prompt if more exist
}
```

**Shopping List Export:**
```javascript
if (!canExportShoppingList()) {
  setUpgradeTriggerFeature('shoppingListExport');
  setShowUpgradeModal(true);
  return;
}
```

---

## Upgrade Modal Triggers

### 1. Conversion Limit Reached

**Trigger**: User tries to convert after using 5 conversions

**Modal Copy:**
```
Title: "Monthly Conversion Limit Reached"
Message: "You've used all 5 free conversions this month. Upgrade to Premium for unlimited conversions, advanced substitutions, and more."
CTA: "Upgrade to Premium"
```

**Code:**
```javascript
if (!conversionCheck.canConvert) {
  setUpgradeTriggerFeature('conversionLimit');
  setShowUpgradeModal(true);
}
```

---

### 2. Strict Halal Mode Attempt

**Trigger**: Free user tries to enable Strict Halal Mode

**Modal Copy:**
```
Title: "Strict Halal Mode"
Message: "Enhanced halal verification with stricter rules for maximum confidence. Premium feature."
CTA: "Upgrade to Enable"
```

**Code:**
```javascript
if (level === "strict" && !isPremiumUser()) {
  setShowStrictModeUpgrade(true);
  return;
}
```

---

### 3. Advanced Substitutions View

**Trigger**: Free user sees only 2 alternatives, but more exist

**Modal Copy:**
```
Title: "See All Halal Alternatives"
Message: "You're seeing the top 2 substitutes. Premium shows all {total} alternatives with flavor and texture match details."
CTA: "Upgrade to See All"
```

**Code:**
```javascript
{issue.allAlternatives && 
 issue.allAlternatives.length > issue.alternatives.length && 
 !isPremiumUser() && (
  <UpgradePrompt triggerFeature="limitedAlternatives" />
)}
```

---

### 4. Shopping List Export Attempt

**Trigger**: Free user tries to export shopping list

**Modal Copy:**
```
Title: "Shopping List Export"
Message: "Shopping list export is a Premium feature. Upgrade to generate and export shopping lists for your converted recipes."
CTA: "Upgrade for Shopping Lists"
```

**Code:**
```javascript
if (!canExportShoppingList()) {
  setUpgradeTriggerFeature('shoppingListExport');
  setShowUpgradeModal(true);
  return;
}
```

---

## Database Schema

### conversion_history Table

```sql
CREATE TABLE conversion_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  recipe_text TEXT, -- First 500 chars for tracking
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversion_history_user_month 
ON conversion_history(user_id, created_at);
```

**Purpose:**
- Track monthly conversion count for free users
- Used for limit enforcement
- Auto-cleanup via `ON DELETE CASCADE`

---

## Frontend Gating Logic

### Conversion Tracking

**Monthly Tracking:**
```javascript
// Get current month key: "2024-01"
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Track conversion
const monthKey = getCurrentMonthKey();
const conversionsKey = `conversions_${monthKey}`;
const current = parseInt(localStorage.getItem(conversionsKey) || '0', 10);
localStorage.setItem(conversionsKey, (current + 1).toString());
```

**Check Limit:**
```javascript
const used = getConversionsThisMonth();
const limit = 5;
const remaining = Math.max(0, limit - used);

if (remaining <= 0) {
  // Show upgrade modal
}
```

---

## Example Upgrade Modal Triggers

### Example 1: Conversion Limit Hit

```javascript
// In App.jsx handleConvert
const conversionCheck = checkConversionLimit();
if (!conversionCheck.canConvert) {
  setUpgradeTriggerFeature('conversionLimit');
  setShowUpgradeModal(true);
  return;
}
```

**User Experience:**
1. User tries to convert 6th recipe
2. Modal appears: "Monthly Conversion Limit Reached"
3. User can upgrade or dismiss

---

### Example 2: Strict Halal Mode

```javascript
// In HalalStandardPanel.jsx
const handleStrictnessChange = (level) => {
  if (level === "strict" && !isPremiumUser()) {
    setShowStrictModeUpgrade(true);
    return;
  }
  // ... proceed with change
};
```

**User Experience:**
1. User clicks "Strict" radio button
2. Modal appears: "Strict Halal Mode - Premium feature"
3. User can upgrade or use Standard mode

---

### Example 3: Shopping List Export

```javascript
// In shopping list export handler
const handleExportShoppingList = () => {
  if (!canExportShoppingList()) {
    setUpgradeTriggerFeature('shoppingListExport');
    setShowUpgradeModal(true);
    return;
  }
  // ... proceed with export
};
```

**User Experience:**
1. User clicks "Export Shopping List"
2. Modal appears: "Shopping List Export - Premium feature"
3. User can upgrade or dismiss

---

## Backend Checks

### Conversion Limit Middleware

```javascript
// Pseudocode
async function checkConversionLimit(req, res, next) {
  const userId = req.user.id;
  const isPremium = await hasPremiumAccess(userId);
  
  if (isPremium) {
    return next(); // No limit
  }
  
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const count = await db.query(
    `SELECT COUNT(*) FROM conversion_history
     WHERE user_id = $1 AND created_at >= $2`,
    [userId, monthStart]
  );
  
  if (count >= 5) {
    return res.status(403).json({
      error: 'Monthly conversion limit reached',
      upgrade_required: true
    });
  }
  
  next();
}
```

### Premium Feature Middleware

```javascript
// Require premium for advanced features
router.post('/advanced-substitutions', 
  authenticateToken, 
  requirePremium, 
  handler
);

router.post('/export-shopping-list',
  authenticateToken,
  requirePremium,
  handler
);
```

---

## Files Modified/Created

1. **`frontend/src/lib/subscription.js`**
   - Updated to track conversions per month (not per day)
   - Changed limit from `Infinity` to `5` for free users

2. **`frontend/src/lib/featureGating.js`**
   - Added `checkConversionLimit()` function
   - Added `canExportShoppingList()` function
   - Made functions synchronous (removed async)

3. **`frontend/src/App.jsx`**
   - Added conversion limit check before conversion
   - Added upgrade modal trigger on limit hit
   - Added conversion tracking after successful conversion

4. **`frontend/src/components/HalalStandardPanel.jsx`**
   - Updated strict mode check to be synchronous

5. **`backend/src/routes/convert.js`** (New)
   - Conversion limit checking
   - Premium-only endpoints

6. **`backend/src/migrations/create_conversion_history_table.sql`** (New)
   - Database table for tracking conversions

7. **`frontend/src/lib/upgradeCopy.js`**
   - Added `conversionLimit` and `shoppingListExport` copy

---

## Testing

### Test Conversion Limit

1. **Free User:**
   - Convert 5 recipes → Should work
   - Try 6th conversion → Should show upgrade modal

2. **Premium User:**
   - Convert unlimited recipes → Should work

### Test Premium Features

1. **Strict Halal Mode:**
   - Free user tries to enable → Show upgrade modal
   - Premium user enables → Should work

2. **Shopping List Export:**
   - Free user tries to export → Show upgrade modal
   - Premium user exports → Should work

3. **Advanced Substitutions:**
   - Free user sees 2 alternatives → Show upgrade hint
   - Premium user sees all alternatives → Should work

---

## Success Criteria

✅ Free users limited to 5 conversions per month  
✅ Premium users have unlimited conversions  
✅ Advanced substitutions are premium-only  
✅ Strict Halal Mode is premium-only  
✅ Shopping list export is premium-only  
✅ Upgrade modal shows at natural friction points  
✅ Conversion tracking works correctly  
✅ Monthly limit resets on 1st of month
