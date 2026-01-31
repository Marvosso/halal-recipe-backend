# Stripe Setup Instructions

## Quick Start

### 1. Install Stripe Package

```bash
cd backend
npm install stripe
```

### 2. Set Environment Variables

Add to `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
STRIPE_PRICE_MONTHLY=price_1SvQyCAkaSYomILsLqkxsF6X
STRIPE_PRICE_YEARLY=price_1SvQyCAkaSYomILs1iILQygW
FRONTEND_URL=http://localhost:5173
```

### 3. Run Database Migration

```bash
# Make sure you have PostgreSQL running
psql -U your_user -d your_database -f src/migrations/create_subscriptions_tables.sql
```

### 4. Test Integration

```bash
cd backend
node test-stripe.js
```

---

## What's Implemented

✅ **Customer Creation**: Automatically creates Stripe customer when user signs up  
✅ **Checkout Sessions**: Creates checkout with existing customer  
✅ **Webhook Handling**: 
   - `invoice.payment_succeeded` → Activates premium
   - `customer.subscription.deleted` → Deactivates premium
✅ **Database Storage**: Stores `subscription_id`, `premium_status`, `subscription_end_date`

---

## API Endpoints

### Create Checkout
```bash
POST /api/subscriptions/create-checkout
Body: { "plan": "monthly" }
```

### Check Status
```bash
GET /api/subscriptions/status
```

### Webhook
```bash
POST /api/subscriptions/webhook
(Handled automatically by Stripe)
```

---

## Testing

1. **Register a user** → Check database for `stripe_customer_id`
2. **Create checkout** → Should return checkout URL
3. **Complete payment** → Use test card: `4242 4242 4242 4242`
4. **Check status** → Should show `subscribed: true`

---

## Files Created/Modified

- `backend/src/routes/auth.js` - Creates customer on signup
- `backend/src/routes/subscriptions.js` - Subscription management
- `backend/src/services/stripeService.js` - Stripe service layer
- `STRIPE_INTEGRATION_COMPLETE.md` - Full documentation
