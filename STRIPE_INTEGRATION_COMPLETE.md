# Complete Stripe Subscription Integration

## Overview
Full Stripe subscription integration for Halal Kitchen with customer creation, subscription management, and webhook handling.

---

## Implementation Summary

### ✅ Features Implemented

1. **Customer Creation on Signup**
   - Automatically creates Stripe customer when user registers
   - Stores `stripe_customer_id` in `users` table
   - Graceful fallback if Stripe fails (registration still succeeds)

2. **Subscription Creation**
   - Creates checkout session with existing customer
   - Supports monthly ($2.99) and yearly ($29.99) plans
   - Uses price IDs: `price_1SvQyCAkaSYomILsLqkxsF6X` and `price_1SvQyCAkaSYomILs1iILQygW`

3. **Webhook Handling**
   - `invoice.payment_succeeded` → Activates premium
   - `customer.subscription.deleted` → Deactivates premium
   - `checkout.session.completed` → Creates subscription record
   - `customer.subscription.updated` → Updates subscription status
   - `invoice.payment_failed` → Marks subscription as past_due

4. **Database Storage**
   - `subscription_id` → `stripe_subscription_id` in `subscriptions` table
   - `premium_status` → `status` field ('active', 'canceled', 'past_due', etc.)
   - `subscription_end_date` → `current_period_end` field

---

## Database Schema

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) CHECK (plan_type IN ('monthly', 'yearly')),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'past_due', etc.
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL, -- This is subscription_end_date
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Users Table (Updated)

```sql
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

---

## API Routes

### 1. GET /api/subscriptions/status

**Authentication**: Required

**Response**:
```json
{
  "subscribed": true,
  "plan": "monthly",
  "status": "active",
  "expires_at": "2024-02-21T00:00:00Z",
  "cancel_at_period_end": false,
  "stripe_subscription_id": "sub_1234567890",
  "features": {
    "substitutions": { "max": Infinity },
    "savedRecipes": { "max": Infinity },
    ...
  }
}
```

---

### 2. POST /api/subscriptions/create-checkout

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
  "checkout_url": "https://checkout.stripe.com/c/pay/...",
  "session_id": "cs_1234567890"
}
```

**Flow**:
1. Gets or creates Stripe customer for user
2. Creates checkout session with customer
3. Returns checkout URL

---

### 3. POST /api/subscriptions/webhook

**Authentication**: Stripe webhook signature

**Handles**:
- `checkout.session.completed` → Creates subscription record
- `invoice.payment_succeeded` → Activates premium (sets status to 'active')
- `customer.subscription.deleted` → Deactivates premium (sets status to 'canceled')
- `customer.subscription.updated` → Updates subscription status
- `invoice.payment_failed` → Marks as 'past_due'

---

## Webhook Event Flow

### 1. User Completes Checkout

```
User pays → Stripe processes → checkout.session.completed
  ↓
Webhook creates subscription record in database
  ↓
Status: 'active' (or 'trialing' if trial period)
```

### 2. Payment Succeeds (Renewal)

```
Stripe charges card → invoice.payment_succeeded
  ↓
Webhook updates subscription:
  - current_period_start = new period start
  - current_period_end = new period end
  - status = 'active'
  ↓
Premium remains active
```

### 3. Subscription Deleted

```
User cancels OR payment fails repeatedly → customer.subscription.deleted
  ↓
Webhook updates subscription:
  - status = 'canceled'
  ↓
Premium deactivated (graceful downgrade)
```

---

## Code Structure

### Backend Files

1. **`backend/src/routes/auth.js`**
   - Creates Stripe customer on user registration
   - Stores `stripe_customer_id` in users table

2. **`backend/src/routes/subscriptions.js`**
   - Subscription status endpoint
   - Checkout session creation
   - Webhook handler
   - Cancel/reactivate endpoints

3. **`backend/src/services/stripeService.js`** (New)
   - Centralized Stripe operations
   - Customer management
   - Subscription management
   - Webhook verification

4. **`backend/src/migrations/create_subscriptions_tables.sql`**
   - Database schema for subscriptions

---

## Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_1SvQyCAkaSYomILsLqkxsF6X
STRIPE_PRICE_YEARLY=price_1SvQyCAkaSYomILs1iILQygW
FRONTEND_URL=http://localhost:5173  # or https://halalkitchen.app
```

---

## Testing

### 1. Test Customer Creation

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Check database for stripe_customer_id
psql -c "SELECT id, email, stripe_customer_id FROM users WHERE email = 'test@example.com';"
```

### 2. Test Checkout Creation

```bash
# Create checkout session
curl -X POST http://localhost:3000/api/subscriptions/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"plan": "monthly"}'

# Should return checkout_url
```

### 3. Test Webhook

**Using Stripe CLI:**
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/subscriptions/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

**Or use test card in checkout:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

---

## Webhook Setup in Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://your-backend-url.com/api/subscriptions/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret** → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## Premium Status Logic

### Active Premium
- `status = 'active'` AND `current_period_end > NOW()`
- User has access to premium features

### Inactive Premium
- `status = 'canceled'` OR `current_period_end <= NOW()`
- User downgraded to free tier
- Data preserved, features limited

### Past Due
- `status = 'past_due'`
- Payment failed, but still has access (grace period)
- Will be canceled if payment doesn't succeed

---

## Example API Usage

### Frontend: Create Checkout

```javascript
import { createCheckoutSession } from './lib/subscriptionApi';

const handleUpgrade = async () => {
  try {
    const checkoutUrl = await createCheckoutSession('monthly');
    window.location.href = checkoutUrl; // Redirect to Stripe
  } catch (error) {
    console.error('Error creating checkout:', error);
  }
};
```

### Frontend: Check Status

```javascript
import { getSubscriptionStatus } from './lib/subscriptionApi';

const checkStatus = async () => {
  const status = await getSubscriptionStatus();
  if (status.subscribed) {
    console.log('User has premium!');
    console.log('Plan:', status.plan);
    console.log('Expires:', status.expires_at);
  }
};
```

---

## Error Handling

### Customer Creation Fails
- Registration still succeeds
- Customer can be created later when they upgrade
- Logs error but doesn't block user

### Webhook Verification Fails
- Returns 400 error
- Stripe will retry
- Check `STRIPE_WEBHOOK_SECRET` is correct

### Subscription Not Found
- Returns free tier status
- User can create new subscription

---

## Production Checklist

- [ ] Switch to live mode API keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real payment (small amount)
- [ ] Verify webhook receives events
- [ ] Set up webhook monitoring/alerts
- [ ] Test subscription renewal
- [ ] Test subscription cancellation
- [ ] Verify graceful downgrade on expiration
- [ ] Set up error monitoring (Sentry, etc.)

---

## Files Modified/Created

1. **`backend/src/routes/auth.js`** - Customer creation on signup
2. **`backend/src/routes/subscriptions.js`** - Complete subscription management
3. **`backend/src/services/stripeService.js`** - New Stripe service
4. **`backend/src/migrations/create_subscriptions_tables.sql`** - Database schema

---

## Next Steps

1. Install Stripe package: `npm install stripe` in backend
2. Set environment variables in `.env`
3. Run database migrations
4. Test customer creation on signup
5. Test checkout flow
6. Set up webhook endpoint in Stripe
7. Test webhook with Stripe CLI
8. Verify premium activation/deactivation

---

## Support

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Webhook Testing**: Use Stripe CLI
- **Dashboard**: https://dashboard.stripe.com/test
