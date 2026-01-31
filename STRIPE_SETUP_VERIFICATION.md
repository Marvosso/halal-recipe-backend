# Stripe Setup Verification Guide

## Quick Checklist

### ✅ Backend Setup

- [ ] Stripe account created (https://dashboard.stripe.com)
- [ ] API keys obtained (Test mode and Live mode)
- [ ] Environment variables set in backend `.env`
- [ ] Stripe package installed (`npm install stripe`)
- [ ] Webhook endpoint configured in Stripe dashboard
- [ ] Webhook secret obtained and added to `.env`

### ✅ Frontend Setup

- [ ] Subscription API client created (`subscriptionApi.js`)
- [ ] Upgrade modal integrated
- [ ] Checkout flow tested

### ✅ Database Setup

- [ ] Subscription tables created (`create_subscriptions_tables.sql`)
- [ ] Migrations run successfully
- [ ] Test subscription record can be created

---

## Step-by-Step Verification

### 1. Backend Environment Variables

Check your `backend/.env` file has:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Test mode key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
STRIPE_PRICE_MONTHLY=price_...  # Monthly price ID
STRIPE_PRICE_YEARLY=price_...   # Yearly price ID

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173  # Development
# FRONTEND_URL=https://halalkitchen.app  # Production
```

**How to verify:**
```bash
# In backend directory
node -e "require('dotenv').config(); console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');"
```

---

### 2. Stripe Products & Prices

**In Stripe Dashboard (Test Mode):**

1. Go to **Products** → **Add Product**
2. Create two products:
   - **Monthly Plan**: $2.99/month
   - **Yearly Plan**: $29.99/year

3. Copy the **Price IDs** (starts with `price_...`)
4. Add them to your `.env` file

**How to verify:**
- Products show in Stripe dashboard
- Prices are correct ($2.99/month, $29.99/year)
- Price IDs are in `.env` file

---

### 3. Webhook Configuration

**In Stripe Dashboard:**

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-backend-url.com/api/subscriptions/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

**How to verify:**
- Webhook endpoint shows in Stripe dashboard
- Signing secret is in `.env` file
- Events are selected correctly

---

### 4. Backend Code Verification

**Check `backend/src/routes/subscriptions.js`:**

```javascript
// Should import stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Should have these routes:
// - GET /api/subscriptions/status
// - POST /api/subscriptions/create-checkout
// - POST /api/subscriptions/cancel
// - POST /api/subscriptions/reactivate
// - POST /api/subscriptions/webhook
```

**Test backend routes:**

```bash
# Test subscription status endpoint
curl http://localhost:3000/api/subscriptions/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
# {
#   "subscribed": false,
#   "plan": null,
#   "status": "free",
#   "features": {...}
# }
```

---

### 5. Frontend Integration

**Check `frontend/src/lib/subscriptionApi.js`:**

```javascript
// Should have these functions:
// - getSubscriptionStatus()
// - createCheckoutSession(plan)
// - cancelSubscription()
// - reactivateSubscription()
```

**Test frontend:**

1. Open browser console
2. Try creating checkout:
```javascript
import { createCheckoutSession } from './lib/subscriptionApi';
const url = await createCheckoutSession('monthly');
console.log('Checkout URL:', url);
```

---

### 6. Database Setup

**Run migrations:**

```bash
# In backend directory
psql -U your_user -d your_database -f src/migrations/create_subscriptions_tables.sql
```

**Verify tables exist:**

```sql
-- Check subscriptions table
SELECT * FROM subscriptions LIMIT 1;

-- Check subscription_events table
SELECT * FROM subscription_events LIMIT 1;
```

---

## Testing Flow

### Test 1: Create Checkout Session

**Backend Test:**
```bash
curl -X POST http://localhost:3000/api/subscriptions/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"plan": "monthly"}'

# Should return:
# {
#   "checkout_url": "https://checkout.stripe.com/c/pay/...",
#   "session_id": "cs_..."
# }
```

**Frontend Test:**
1. Click "Upgrade to Premium" button
2. Should redirect to Stripe checkout
3. URL should be `https://checkout.stripe.com/c/pay/...`

---

### Test 2: Complete Test Payment

**In Stripe Test Mode:**

1. Use test card: `4242 4242 4242 4242`
2. Expiry: Any future date (e.g., `12/34`)
3. CVC: Any 3 digits (e.g., `123`)
4. ZIP: Any 5 digits (e.g., `12345`)

**After payment:**
- Should redirect to success page
- Webhook should fire `checkout.session.completed`
- Subscription should be created in database

---

### Test 3: Verify Webhook

**Check Stripe Dashboard:**
1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View **Recent events**
4. Should see `checkout.session.completed` event

**Check Backend Logs:**
```bash
# Should see:
# [Webhook] checkout.session.completed received
# [Webhook] Subscription created: sub_...
```

**Check Database:**
```sql
SELECT * FROM subscriptions 
WHERE stripe_subscription_id = 'sub_...';
-- Should have one record
```

---

### Test 4: Verify Subscription Status

**Backend:**
```bash
curl http://localhost:3000/api/subscriptions/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return:
# {
#   "subscribed": true,
#   "plan": "monthly",
#   "status": "active",
#   "expires_at": "2024-02-21T00:00:00Z",
#   "features": {...}
# }
```

**Frontend:**
```javascript
import { getSubscriptionStatus } from './lib/subscriptionApi';
const status = await getSubscriptionStatus();
console.log('Subscription:', status);
// Should show subscribed: true
```

---

## Common Issues & Solutions

### Issue 1: "Stripe is not defined"

**Solution:**
```bash
# Install stripe package
cd backend
npm install stripe
```

**Verify:**
```javascript
// In backend/src/routes/subscriptions.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
console.log('Stripe initialized:', !!stripe);
```

---

### Issue 2: "Invalid API Key"

**Solution:**
1. Check `.env` file has correct key
2. Make sure key starts with `sk_test_...` (test mode)
3. Restart backend server after changing `.env`

**Verify:**
```bash
# Test Stripe connection
node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
stripe.customers.list({limit: 1}).then(() => {
  console.log('✅ Stripe connection works');
}).catch(err => {
  console.error('❌ Stripe error:', err.message);
});
"
```

---

### Issue 3: "Webhook signature verification failed"

**Solution:**
1. Check `STRIPE_WEBHOOK_SECRET` in `.env`
2. Make sure webhook endpoint uses `express.raw()` middleware
3. Verify webhook secret matches Stripe dashboard

**Verify:**
```javascript
// In backend/src/routes/subscriptions.js
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Should verify signature
});
```

---

### Issue 4: "Price not found"

**Solution:**
1. Check `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` in `.env`
2. Verify price IDs exist in Stripe dashboard
3. Make sure prices are in test mode (if testing)

**Verify:**
```bash
# Test price retrieval
node -e "
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY).then(price => {
  console.log('✅ Monthly price:', price.unit_amount / 100, price.currency);
}).catch(err => {
  console.error('❌ Price error:', err.message);
});
"
```

---

### Issue 5: "Redirect URL mismatch"

**Solution:**
1. Check `FRONTEND_URL` in `.env`
2. Make sure it matches your frontend URL
3. Update Stripe checkout session success/cancel URLs

**Verify:**
```javascript
// In backend/src/routes/subscriptions.js
success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
```

---

## Testing Checklist

### Pre-Launch:

- [ ] Test checkout session creation
- [ ] Test payment with test card
- [ ] Verify webhook receives events
- [ ] Verify subscription created in database
- [ ] Verify subscription status endpoint works
- [ ] Test subscription cancellation
- [ ] Test subscription reactivation
- [ ] Verify feature gating works (premium vs free)

### Production Readiness:

- [ ] Switch to live mode API keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real payment (small amount)
- [ ] Verify webhook works in production
- [ ] Set up webhook monitoring/alerts
- [ ] Test subscription renewal
- [ ] Test subscription cancellation
- [ ] Verify graceful downgrade on expiration

---

## Quick Test Script

Save as `test-stripe.js` in backend directory:

```javascript
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
  console.log('Testing Stripe Integration...\n');
  
  // Test 1: API Key
  try {
    await stripe.customers.list({ limit: 1 });
    console.log('✅ Stripe API key is valid');
  } catch (err) {
    console.error('❌ Stripe API key error:', err.message);
    return;
  }
  
  // Test 2: Prices
  try {
    const monthlyPrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY);
    console.log('✅ Monthly price found:', `$${monthlyPrice.unit_amount / 100}/month`);
  } catch (err) {
    console.error('❌ Monthly price error:', err.message);
  }
  
  try {
    const yearlyPrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_YEARLY);
    console.log('✅ Yearly price found:', `$${yearlyPrice.unit_amount / 100}/year`);
  } catch (err) {
    console.error('❌ Yearly price error:', err.message);
  }
  
  // Test 3: Webhook secret
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('✅ Webhook secret is set');
  } else {
    console.error('❌ Webhook secret is missing');
  }
  
  console.log('\n✅ Stripe setup looks good!');
}

testStripe();
```

**Run:**
```bash
cd backend
node test-stripe.js
```

---

## Success Indicators

You're doing it right if:

1. ✅ Test checkout session creates successfully
2. ✅ Test payment completes and redirects
3. ✅ Webhook receives `checkout.session.completed` event
4. ✅ Subscription record appears in database
5. ✅ Subscription status endpoint returns `subscribed: true`
6. ✅ Premium features are unlocked
7. ✅ Free users see upgrade prompts correctly

---

## Next Steps

Once verified:

1. **Set up monitoring**: Monitor webhook events in Stripe dashboard
2. **Test edge cases**: Cancellation, renewal, expiration
3. **Set up alerts**: Email alerts for failed payments
4. **Go live**: Switch to production keys when ready
5. **Monitor metrics**: Track conversion rate, churn, revenue

---

## Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Testing**: https://stripe.com/docs/testing
- **Webhook Testing**: Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/subscriptions/webhook`
- **Stripe Dashboard**: https://dashboard.stripe.com/test
