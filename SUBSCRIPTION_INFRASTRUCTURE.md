# Subscription Infrastructure Design

## Overview
Complete subscription infrastructure for Halal Kitchen with Stripe integration, feature gating, and graceful downgrade.

## Architecture

### Components

1. **Subscription Routes** (`backend/src/routes/subscriptions.js`)
   - Status checking
   - Checkout creation
   - Cancellation/reactivation
   - Webhook handling

2. **Subscription Service** (`backend/src/services/subscriptionService.js`)
   - Business logic
   - State management
   - Feature gating

3. **Feature Gate Middleware** (`backend/src/middleware/featureGate.js`)
   - Route protection
   - Feature access checks

4. **Database Schema** (`backend/src/migrations/create_subscriptions_tables.sql`)
   - Subscriptions table
   - Subscription events log

---

## Subscription State Machine

### States

```
free → active → canceled → expired → free
  ↓       ↓         ↓
  └───────┴─────────┘
    (payment flow)
```

**State Definitions**:

1. **free**: No subscription
   - Features: Free tier only
   - Can upgrade to active

2. **active**: Subscription active and paid
   - Features: Premium tier
   - Can cancel (moves to canceled)
   - Can expire (moves to expired)

3. **trialing**: In trial period
   - Features: Premium tier
   - Transitions to active after trial

4. **past_due**: Payment failed, grace period
   - Features: Premium tier (temporary)
   - Can recover (moves to active)
   - Can expire (moves to canceled)

5. **canceled**: User canceled, active until period end
   - Features: Premium tier (until period end)
   - Transitions to expired at period end

6. **expired**: Subscription expired
   - Features: Free tier
   - Graceful downgrade triggered
   - Can resubscribe (moves to active)

### State Transitions

```javascript
// Payment successful
free → active

// Payment failed
active → past_due

// Payment retried successfully
past_due → active

// Payment failed after grace period
past_due → canceled → expired

// User cancels
active → canceled → expired

// Period ends
canceled → expired
expired → free (graceful downgrade)
```

---

## API Endpoints

### GET /api/subscriptions/status

**Authentication**: Required

**Response** (Active Subscription):
```json
{
  "subscribed": true,
  "plan": "monthly",
  "status": "active",
  "expires_at": "2024-02-21T00:00:00Z",
  "cancel_at_period_end": false,
  "stripe_subscription_id": "sub_1234567890",
  "features": {
    "conversions": { "unlimited": true },
    "substitutions": { "max": Infinity },
    "savedRecipes": { "max": Infinity },
    "exportFormats": ["txt", "pdf", "json"],
    "brandVerification": true,
    "batchConversion": true,
    "conversionHistory": true,
    "mealPlanning": true,
    "recipeScaling": true,
    "prioritySupport": true,
    "earlyAccess": true
  }
}
```

**Response** (Free Tier):
```json
{
  "subscribed": false,
  "plan": null,
  "status": "free",
  "expires_at": null,
  "cancel_at_period_end": false,
  "features": {
    "conversions": { "unlimited": true },
    "substitutions": { "max": 2 },
    "savedRecipes": { "max": 10 },
    "exportFormats": ["txt"],
    "brandVerification": false,
    "batchConversion": false,
    "conversionHistory": false,
    "mealPlanning": false,
    "recipeScaling": false,
    "prioritySupport": false,
    "earlyAccess": false
  }
}
```

---

### POST /api/subscriptions/create-checkout

**Authentication**: Required

**Request Body**:
```json
{
  "plan": "monthly"  // or "yearly"
}
```

**Response**:
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_...",
  "session_id": "cs_1234567890"
}
```

---

### POST /api/subscriptions/cancel

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Subscription will cancel at period end",
  "cancel_at": 1704067200
}
```

---

### POST /api/subscriptions/reactivate

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "message": "Subscription reactivated"
}
```

---

### POST /api/subscriptions/webhook

**Authentication**: Stripe webhook signature

**Handles**:
- `checkout.session.completed` - Create subscription
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription deleted
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

---

## Feature Gating

### Route-Level Gating

```javascript
// Require premium for entire route
router.get('/premium-feature', requirePremium, (req, res) => {
  // Premium feature logic
});

// Require specific feature
router.get('/brand-verification', 
  requireFeature('brandVerification'), 
  (req, res) => {
    // Brand verification logic
  }
);
```

### Service-Level Gating

```javascript
import { canUseFeature, getFeatureLimit } from '../services/subscriptionService.js';

// Check feature access
const canUse = await canUseFeature(userId, 'batchConversion');
if (!canUse) {
  return res.status(403).json({ error: 'Premium feature required' });
}

// Get feature limit
const maxSubstitutions = await getFeatureLimit(userId, 'substitutions');
// Returns: 2 (free) or Infinity (premium)
```

---

## Graceful Downgrade

### When Subscription Expires

1. **State Update**: `active` → `expired`
2. **Feature Access**: Premium → Free tier
3. **Data Preservation**: 
   - Keep all saved recipes (but limit to 10)
   - Keep conversion history (but don't show)
   - Keep user preferences
   - No data deletion

4. **User Notification**: Email sent (optional)

### Downgrade Process

```javascript
// Triggered when subscription expires
async function triggerGracefulDowngrade(userId) {
  // 1. Log event
  await logSubscriptionEvent(userId, 'downgraded');
  
  // 2. Update subscription status
  await updateSubscriptionStatus(userId, 'expired');
  
  // 3. Handle data limits
  // - Keep all recipes, but enforce 10 limit on new saves
  // - Hide conversion history UI
  // - Disable premium features
  
  // 4. Send notification (optional)
  await sendDowngradeEmail(userId);
}
```

### Data Handling

**Saved Recipes**:
- Keep all recipes in database
- Enforce 10-recipe limit on new saves
- Show message: "You've saved 10 recipes. Upgrade for unlimited."

**Conversion History**:
- Keep all history in database
- Hide from UI for free users
- Show message: "Upgrade to view conversion history."

**Preferences**:
- Keep all preferences
- Disable premium-only preferences
- Re-enable when user resubscribes

---

## Stripe Integration

### Setup

1. **Create Products in Stripe Dashboard**:
   - Monthly Plan: $2.99/month
   - Yearly Plan: $29.99/year

2. **Get Price IDs**:
   - Set `STRIPE_PRICE_MONTHLY` in `.env`
   - Set `STRIPE_PRICE_YEARLY` in `.env`

3. **Configure Webhook**:
   - Endpoint: `https://your-api.com/api/subscriptions/webhook`
   - Events: `customer.subscription.*`, `invoice.*`, `checkout.session.completed`

### Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
FRONTEND_URL=https://halalkitchen.app
```

---

## Database Schema

### subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  plan_type VARCHAR(50), -- 'monthly' or 'yearly'
  status VARCHAR(50), -- 'active', 'canceled', 'expired', etc.
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### subscription_events Table

```sql
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(100), -- 'created', 'updated', 'canceled', etc.
  event_data JSONB,
  created_at TIMESTAMP
);
```

---

## Frontend Integration

### Check Subscription Status

```javascript
// On app load
const response = await fetch('/api/subscriptions/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const status = await response.json();

// Update UI based on status
if (status.subscribed) {
  // Show premium features
  enablePremiumFeatures(status.features);
} else {
  // Show free tier
  enableFreeTier(status.features);
}
```

### Create Checkout

```javascript
// User clicks "Upgrade"
const response = await fetch('/api/subscriptions/create-checkout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ plan: 'monthly' })
});

const { checkout_url } = await response.json();
window.location.href = checkout_url; // Redirect to Stripe
```

### Handle Success

```javascript
// After Stripe checkout success
// Redirect to: /subscription/success?session_id=cs_...

// Verify subscription
const response = await fetch('/api/subscriptions/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const status = await response.json();

if (status.subscribed) {
  // Show success message
  // Refresh app to enable premium features
}
```

---

## Example API Responses

### Active Subscription

```json
{
  "subscribed": true,
  "plan": "monthly",
  "status": "active",
  "expires_at": "2024-02-21T00:00:00Z",
  "cancel_at_period_end": false,
  "stripe_subscription_id": "sub_1234567890",
  "features": {
    "conversions": { "unlimited": true },
    "substitutions": { "max": Infinity },
    "savedRecipes": { "max": Infinity },
    "exportFormats": ["txt", "pdf", "json"],
    "brandVerification": true,
    "batchConversion": true,
    "conversionHistory": true,
    "mealPlanning": true,
    "recipeScaling": true,
    "prioritySupport": true,
    "earlyAccess": true
  }
}
```

### Canceled (Active Until Period End)

```json
{
  "subscribed": true,
  "plan": "monthly",
  "status": "canceled",
  "expires_at": "2024-02-21T00:00:00Z",
  "cancel_at_period_end": true,
  "stripe_subscription_id": "sub_1234567890",
  "features": {
    // Still premium features until period end
    "substitutions": { "max": Infinity },
    "savedRecipes": { "max": Infinity },
    // ...
  }
}
```

### Expired (Downgraded to Free)

```json
{
  "subscribed": false,
  "plan": "monthly",
  "status": "expired",
  "expires_at": "2024-01-21T00:00:00Z",
  "cancel_at_period_end": false,
  "features": {
    "conversions": { "unlimited": true },
    "substitutions": { "max": 2 },
    "savedRecipes": { "max": 10 },
    "exportFormats": ["txt"],
    "brandVerification": false,
    // ... all premium features false
  }
}
```

### Past Due (Grace Period)

```json
{
  "subscribed": true,
  "plan": "monthly",
  "status": "past_due",
  "expires_at": "2024-02-21T00:00:00Z",
  "cancel_at_period_end": false,
  "features": {
    // Still premium (grace period)
    "substitutions": { "max": Infinity },
    // ...
  }
}
```

---

## Error Handling

### Subscription Not Found
```json
{
  "error": "No subscription found"
}
```

### Premium Required
```json
{
  "error": "Premium subscription required",
  "upgrade_url": "/subscription/upgrade"
}
```

### Feature Not Available
```json
{
  "error": "Premium feature required: brandVerification",
  "upgrade_url": "/subscription/upgrade"
}
```

---

## Security Considerations

1. **Webhook Verification**: Always verify Stripe webhook signatures
2. **User Authentication**: All subscription endpoints require auth
3. **User Isolation**: Users can only access their own subscription
4. **Rate Limiting**: Prevent abuse of subscription endpoints
5. **Idempotency**: Handle duplicate webhook events gracefully

---

## Testing

### Test Scenarios

1. **Create Subscription**: User completes checkout
2. **Cancel Subscription**: User cancels, stays active until period end
3. **Expire Subscription**: Period ends, graceful downgrade
4. **Payment Failed**: Subscription goes to past_due
5. **Payment Recovered**: Subscription reactivates
6. **Feature Gating**: Free user tries premium feature
7. **Graceful Downgrade**: Expired user keeps data

---

## Files Created

1. **Backend**:
   - `backend/src/routes/subscriptions.js` - Subscription API routes
   - `backend/src/services/subscriptionService.js` - Business logic
   - `backend/src/middleware/featureGate.js` - Feature gating middleware
   - `backend/src/migrations/create_subscriptions_tables.sql` - Database schema

2. **Documentation**:
   - `SUBSCRIPTION_INFRASTRUCTURE.md` - This file

---

## Next Steps

1. **Install Stripe SDK**: `npm install stripe`
2. **Set Environment Variables**: Add Stripe keys to `.env`
3. **Create Stripe Products**: Set up monthly/yearly plans in Stripe dashboard
4. **Configure Webhook**: Set up webhook endpoint in Stripe
5. **Test Integration**: Test checkout flow end-to-end
6. **Implement Frontend**: Add subscription UI components
7. **Add Monitoring**: Track subscription metrics
