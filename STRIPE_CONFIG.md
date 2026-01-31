# Stripe Configuration for Halal Kitchen

## Your Stripe Configuration

### Product Information
- **Product ID**: `prod_TtDPlql6dkiShp`
- **Monthly Plan**: `price_1SvQyCAkaSYomILsLqkxsF6X` ($2.99/month)
- **Yearly Plan**: `price_1SvQyCAkaSYomILs1iILQygW` ($29.99/year)

---

## Environment Variables

Add these to your `backend/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs (YOUR VALUES)
STRIPE_PRICE_MONTHLY=price_1SvQyCAkaSYomILsLqkxsF6X
STRIPE_PRICE_YEARLY=price_1SvQyCAkaSYomILs1iILQygW

# Frontend URL
FRONTEND_URL=http://localhost:5173
# Or for production:
# FRONTEND_URL=https://halalkitchen.app
```

---

## Quick Setup Steps

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** (starts with `sk_test_...`)
3. Add it to `.env` as `STRIPE_SECRET_KEY`

### 2. Set Up Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://your-backend-url.com/api/subscriptions/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add it to `.env` as `STRIPE_WEBHOOK_SECRET`

### 3. Verify Configuration

Run the test script:

```bash
cd backend
node test-stripe.js
```

You should see:
- ✅ Stripe API key is valid
- ✅ Monthly price found: USD $2.99/month
- ✅ Yearly price found: USD $29.99/year
- ✅ Webhook secret is set
- ✅ Checkout session created successfully

---

## Testing

### Test Card Numbers

Use these in Stripe test mode:

**Success:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Decline:**
- Card: `4000 0000 0000 0002`

**Requires Authentication:**
- Card: `4000 0025 0000 3155`

---

## Production Setup

When ready for production:

1. Switch to **Live mode** in Stripe Dashboard
2. Get new API keys (starts with `sk_live_...`)
3. Create products in Live mode
4. Get new price IDs
5. Update `.env` with live keys
6. Update webhook endpoint to production URL
7. Test with a small real payment

---

## Verification Checklist

- [ ] `STRIPE_SECRET_KEY` is set in `.env`
- [ ] `STRIPE_WEBHOOK_SECRET` is set in `.env`
- [ ] `STRIPE_PRICE_MONTHLY=price_1SvQyCAkaSYomILsLqkxsF6X` in `.env`
- [ ] `STRIPE_PRICE_YEARLY=price_1SvQyCAkaSYomILs1iILQygW` in `.env`
- [ ] `FRONTEND_URL` is set in `.env`
- [ ] Test script passes all checks
- [ ] Webhook endpoint configured in Stripe
- [ ] Test checkout flow works
- [ ] Test payment completes successfully

---

## Support

If you encounter issues:

1. Check `backend/test-stripe.js` output
2. Verify all environment variables are set
3. Check Stripe Dashboard for webhook events
4. Check backend logs for errors
5. Verify database tables are created

---

## Next Steps

Once verified:

1. Test the full checkout flow
2. Verify webhook receives events
3. Check subscription appears in database
4. Test subscription status endpoint
5. Test feature gating (premium vs free)
