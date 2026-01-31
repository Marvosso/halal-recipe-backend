# Conversion Limit Implementation

## Overview
Complete backend and database implementation for tracking and enforcing conversion limits for free users.

---

## Database Schema

### conversion_history Table

```sql
CREATE TABLE conversion_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_text TEXT, -- First 500 chars for tracking (not full recipe)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversion_history_user ON conversion_history(user_id);
CREATE INDEX idx_conversion_history_created ON conversion_history(created_at);
CREATE INDEX idx_conversion_history_user_month ON conversion_history(user_id, created_at);
```

**Purpose:**
- Tracks conversions per user per calendar month
- Used for limit enforcement (5 conversions/month for free users)
- Stores only first 500 chars of recipe text for tracking purposes
- Auto-cleanup via `ON DELETE CASCADE` when user is deleted

**Migration:**
```bash
psql -U your_user -d your_database -f backend/src/migrations/create_conversion_history_table.sql
```

---

## Backend Logic

### Conversion Limit Service

**File:** `backend/src/services/conversionLimitService.js`

**Functions:**

1. **`checkConversionLimit(userId)`**
   - Checks if user can convert
   - Returns: `{ canConvert, limit, used, remaining, isPremium }`
   - Premium users: `limit = Infinity`, `canConvert = true`
   - Free users: Checks monthly count against limit (5)

2. **`trackConversion(userId, recipeText)`**
   - Records conversion in database
   - Only tracks for free users (premium bypass)
   - Stores first 500 chars of recipe text

3. **`getConversionHistory(userId)`**
   - Returns conversions for current month
   - Used for displaying conversion history

4. **`getConversionStats(userId)`**
   - Returns full conversion statistics
   - Includes limit check + history

---

## API Endpoints

### POST /convert

**Authentication:** Required

**Request:**
```json
{
  "recipeText": "2 cups flour, 1 cup sugar..."
}
```

**Response (Success):**
```json
{
  "originalText": "...",
  "convertedText": "...",
  "issues": [...],
  "confidenceScore": 85
}
```

**Response (Limit Reached - 403):**
```json
{
  "error": "Monthly conversion limit reached",
  "message": "You've used all 5 free conversions this month. Upgrade to Premium for unlimited conversions.",
  "limit": 5,
  "used": 5,
  "remaining": 0,
  "upgrade_required": true,
  "upgrade_url": "/subscription/upgrade"
}
```

**Flow:**
1. Check conversion limit
2. If limit reached → Return 403 with upgrade info
3. If allowed → Perform conversion
4. Track conversion in database (free users only)
5. Return conversion result

---

### GET /convert/limit

**Authentication:** Required

**Response:**
```json
{
  "canConvert": true,
  "limit": 5,
  "used": 3,
  "remaining": 2,
  "isPremium": false,
  "monthStart": "2024-01-01T00:00:00.000Z"
}
```

**Premium User Response:**
```json
{
  "canConvert": true,
  "limit": Infinity,
  "used": 0,
  "remaining": Infinity,
  "isPremium": true
}
```

---

## Example Code

### Check Limit Before Conversion

```javascript
// Backend: routes/convert.js
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { recipeText } = req.body;

  // Check conversion limit
  const limitCheck = await checkConversionLimit(userId);
  
  if (!limitCheck.canConvert) {
    return res.status(403).json({
      error: 'Monthly conversion limit reached',
      limit: limitCheck.limit,
      used: limitCheck.used,
      remaining: limitCheck.remaining,
      upgrade_required: true
    });
  }

  // Perform conversion
  const result = await convertService(recipeText);
  
  // Track conversion
  await trackConversion(userId, recipeText);
  
  res.json(result);
});
```

---

### Frontend: Check Limit Before Conversion

```javascript
// Frontend: App.jsx
const handleConvert = async () => {
  // Check limit first
  const conversionCheck = checkConversionLimit();
  
  if (!conversionCheck.canConvert) {
    setUpgradeTriggerFeature('conversionLimit');
    setShowUpgradeModal(true);
    return;
  }
  
  // Proceed with conversion
  // ...
};
```

---

### Frontend: Display Limit Status

```javascript
// Get limit status from backend
const response = await axios.get('/convert/limit', {
  headers: { Authorization: `Bearer ${token}` }
});

const { limit, used, remaining, isPremium } = response.data;

if (!isPremium) {
  console.log(`You have ${remaining} of ${limit} conversions remaining this month.`);
}
```

---

## Monthly Reset Logic

**Calendar Month Reset:**
- Conversions reset on the 1st of each month
- Uses `created_at >= monthStart` query
- `monthStart` = First day of current month at 00:00:00

**Example:**
- January 1-31: Count conversions from Jan 1
- February 1: Reset, count from Feb 1
- No manual reset needed - automatic via date query

---

## Premium User Bypass

**Premium users:**
- `checkConversionLimit()` returns `canConvert: true`, `limit: Infinity`
- `trackConversion()` does nothing (no database insert)
- No limit enforcement

**Free users:**
- `checkConversionLimit()` checks monthly count
- `trackConversion()` records in database
- Limit enforced at 5 conversions/month

---

## Error Handling

**Database Errors:**
- If limit check fails → Fail open (allow conversion)
- If tracking fails → Log error but don't break conversion
- Errors logged but don't block user experience

**Example:**
```javascript
try {
  const limitCheck = await checkConversionLimit(userId);
  // ...
} catch (error) {
  console.error('Limit check failed:', error);
  // Fail open - allow conversion
  // Continue with conversion
}
```

---

## Testing

### Test Conversion Limit

```bash
# 1. Register free user
POST /api/auth/register
{ "email": "test@example.com", "password": "password123" }

# 2. Convert 5 recipes (should work)
POST /convert
{ "recipeText": "Recipe 1..." }
# ... repeat 4 more times

# 6. Try 6th conversion (should fail)
POST /convert
{ "recipeText": "Recipe 6..." }
# Response: 403 - Monthly conversion limit reached

# 7. Check limit status
GET /convert/limit
# Response: { used: 5, remaining: 0, canConvert: false }
```

### Test Premium Bypass

```bash
# 1. Upgrade user to premium
POST /api/subscriptions/create-checkout
{ "plan": "monthly" }
# Complete Stripe checkout

# 2. Convert unlimited recipes (should work)
POST /convert
{ "recipeText": "Recipe 1..." }
# ... unlimited conversions

# 3. Check limit status
GET /convert/limit
# Response: { isPremium: true, limit: Infinity, remaining: Infinity }
```

---

## Database Queries

### Count Conversions This Month

```sql
SELECT COUNT(*) as count
FROM conversion_history
WHERE user_id = $1 
AND created_at >= $2;
-- $1 = user_id
-- $2 = monthStart (first day of current month)
```

### Get Conversion History

```sql
SELECT id, recipe_text, created_at
FROM conversion_history
WHERE user_id = $1 
AND created_at >= $2
ORDER BY created_at DESC;
-- $1 = user_id
-- $2 = monthStart
```

### Insert Conversion Record

```sql
INSERT INTO conversion_history (user_id, recipe_text, created_at)
VALUES ($1, $2, NOW());
-- $1 = user_id
-- $2 = recipe_text (first 500 chars)
```

---

## Files Created/Modified

1. **`backend/src/services/conversionLimitService.js`** (New)
   - Conversion limit checking
   - Conversion tracking
   - History retrieval

2. **`backend/src/routes/convert.js`** (Updated)
   - Integrated limit checking
   - Integrated conversion tracking
   - Simplified limit endpoint

3. **`backend/src/migrations/create_conversion_history_table.sql`** (New)
   - Database schema for tracking

4. **`CONVERSION_LIMIT_IMPLEMENTATION.md`** (This file)
   - Complete documentation

---

## Success Criteria

✅ Free users limited to 5 conversions per month  
✅ Premium users bypass limit (unlimited)  
✅ Monthly reset on 1st of each month  
✅ Limit checked before conversion  
✅ Conversion tracked in database  
✅ Upgrade modal triggered on limit reached  
✅ Error handling (fail open)  
✅ Database indexes for performance

---

## Next Steps

1. Run database migration
2. Test conversion limit with free user
3. Test premium bypass
4. Verify monthly reset
5. Test error handling
6. Monitor database performance
