/**
 * Subscription API Routes
 * Handles subscription management, Stripe integration, and feature gating
 */

import express from 'express';
import { getPool } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/subscriptions/status
 * Get current user's subscription status
 * 
 * Returns subscription status, plan, expiration, and feature access
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    // Get user's subscription
    const subscriptionResult = await pool.query(
      `SELECT 
        s.id,
        s.user_id,
        s.stripe_subscription_id,
        s.stripe_customer_id,
        s.plan_type,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.created_at,
        s.updated_at
      FROM subscriptions s
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      // No subscription - return free tier status
      return res.json({
        subscribed: false,
        plan: null,
        status: 'free',
        expires_at: null,
        cancel_at_period_end: false,
        features: getFreeTierFeatures()
      });
    }

    const subscription = subscriptionResult.rows[0];
    const isActive = subscription.status === 'active' && 
                     new Date(subscription.current_period_end) > new Date();

    return res.json({
      subscribed: isActive,
      plan: subscription.plan_type, // 'monthly' or 'yearly'
      status: subscription.status, // 'active', 'canceled', 'past_due', etc.
      expires_at: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      stripe_subscription_id: subscription.stripe_subscription_id,
      features: isActive ? getPremiumFeatures() : getFreeTierFeatures()
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

/**
 * POST /api/subscriptions/create-checkout
 * Create Stripe checkout session for subscription
 * 
 * Body: { plan: 'monthly' | 'yearly' }
 */
router.post('/create-checkout', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be "monthly" or "yearly"' });
    }

    // Stripe prices (set these in Stripe dashboard)
    const prices = {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_id',
      yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_id'
    };

    // Create Stripe checkout session
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    const pool = getPool();
    
    // Get or create Stripe customer
    let customerId = null;
    const userResult = await pool.query(
      `SELECT stripe_customer_id FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length > 0 && userResult.rows[0].stripe_customer_id) {
      customerId = userResult.rows[0].stripe_customer_id;
    } else {
      // Create customer if doesn't exist
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          user_id: userId
        }
      });
      customerId = customer.id;
      
      // Store customer ID in database
      await pool.query(
        `UPDATE users SET stripe_customer_id = $1 WHERE id = $2`,
        [customerId, userId]
      );
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Use existing customer
      payment_method_types: ['card'],
      line_items: [
        {
          price: prices[plan],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        user_id: userId,
        plan: plan
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan: plan
        }
      }
    });

    res.json({
      checkout_url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription (at period end)
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    // Get user's active subscription
    const subscriptionResult = await pool.query(
      `SELECT stripe_subscription_id, status
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const { stripe_subscription_id } = subscriptionResult.rows[0];

    // Cancel in Stripe (at period end)
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update database
    await pool.query(
      `UPDATE subscriptions
       SET cancel_at_period_end = true,
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [stripe_subscription_id]
    );

    res.json({
      success: true,
      message: 'Subscription will cancel at period end',
      cancel_at: subscription.cancel_at
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/subscriptions/reactivate
 * Reactivate canceled subscription
 */
router.post('/reactivate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    // Get user's subscription
    const subscriptionResult = await pool.query(
      `SELECT stripe_subscription_id
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const { stripe_subscription_id } = subscriptionResult.rows[0];

    // Reactivate in Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: false
    });

    // Update database
    await pool.query(
      `UPDATE subscriptions
       SET cancel_at_period_end = false,
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [stripe_subscription_id]
    );

    res.json({ success: true, message: 'Subscription reactivated' });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

/**
 * POST /api/subscriptions/change-plan
 * Change subscription plan (upgrade/downgrade between monthly/yearly)
 * 
 * Body: { newPlan: 'monthly' | 'yearly' }
 */
router.post('/change-plan', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPlan } = req.body;
    const pool = getPool();

    if (!newPlan || !['monthly', 'yearly'].includes(newPlan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be "monthly" or "yearly"' });
    }

    // Get user's active subscription
    const subscriptionResult = await pool.query(
      `SELECT stripe_subscription_id, plan_type, status
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const { stripe_subscription_id, plan_type: currentPlan } = subscriptionResult.rows[0];

    // If already on the requested plan, return success
    if (currentPlan === newPlan) {
      return res.json({ 
        success: true, 
        message: `Already on ${newPlan} plan`,
        plan: newPlan 
      });
    }

    // Get Stripe price IDs
    const prices = {
      monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_1SvQyCAkaSYomILsLqkxsF6X',
      yearly: process.env.STRIPE_PRICE_YEARLY || 'price_1SvQyCAkaSYomILs1iILQygW'
    };

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);
    
    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(stripe_subscription_id, {
      items: [{
        id: subscription.items.data[0].id,
        price: prices[newPlan],
      }],
      proration_behavior: 'always_invoice', // Prorate the difference
      metadata: {
        user_id: userId,
        plan: newPlan
      }
    });

    // Update database
    await pool.query(
      `UPDATE subscriptions
       SET plan_type = $1,
           current_period_start = $2,
           current_period_end = $3,
           updated_at = NOW()
       WHERE stripe_subscription_id = $4`,
      [
        newPlan,
        new Date(updatedSubscription.current_period_start * 1000),
        new Date(updatedSubscription.current_period_end * 1000),
        stripe_subscription_id
      ]
    );

    // Log subscription event
    await pool.query(
      `INSERT INTO subscription_events (user_id, event_type, event_data, created_at)
       VALUES ($1, 'plan_changed', $2, NOW())`,
      [userId, JSON.stringify({ 
        from: currentPlan, 
        to: newPlan,
        subscription_id: stripe_subscription_id
      })]
    );

    res.json({
      success: true,
      message: `Plan changed to ${newPlan}`,
      plan: newPlan,
      subscription: {
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    res.status(500).json({ error: 'Failed to change subscription plan' });
  }
});

/**
 * POST /api/subscriptions/webhook
 * Stripe webhook handler for subscription events
 * 
 * Handles:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * 
 * Note: This route must use express.raw() to verify Stripe signature
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const pool = getPool();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, pool);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, pool);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, pool);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, pool);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, pool);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook handlers

async function handleCheckoutCompleted(session, pool) {
  const userId = session.metadata.user_id;
  const plan = session.metadata.plan;

  // Get subscription from Stripe
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Create or update subscription record
  const result = await pool.query(
    `INSERT INTO subscriptions (
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      plan_type,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    ON CONFLICT (stripe_subscription_id) 
    DO UPDATE SET
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = NOW()
    RETURNING id, user_id`,
    [
      userId,
      subscription.id,
      subscription.customer,
      plan,
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.cancel_at_period_end || false
    ]
  );

  // Log subscription event
  if (result.rows.length > 0) {
    const subId = result.rows[0].id;
    const subUserId = result.rows[0].user_id;
    
    await pool.query(
      `INSERT INTO subscription_events (subscription_id, user_id, event_type, event_data, created_at)
       VALUES ($1, $2, 'checkout_completed', $3, NOW())`,
      [subId, subUserId, JSON.stringify({ 
        subscription_id: subscription.id,
        plan: plan,
        session_id: session.id 
      })]
    );
    
    console.log(`✅ Subscription created for user ${subUserId}: ${subscription.id}`);
    
    // Log premium analytics event
    await logPremiumAnalyticsEvent(pool, {
      event_type: 'subscription_success',
      event_props: {
        plan: plan,
        subscription_id: subscription.id,
        session_id: session.id,
        user_tier: 'premium',
        revenue: plan === 'monthly' ? 2.99 : 29.99
      },
      user_id: subUserId
    });
  }
}

async function handleSubscriptionUpdated(subscription, pool) {
  await pool.query(
    `UPDATE subscriptions
     SET status = $1,
         current_period_start = $2,
         current_period_end = $3,
         cancel_at_period_end = $4,
         updated_at = NOW()
     WHERE stripe_subscription_id = $5`,
    [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.cancel_at_period_end || false,
      subscription.id
    ]
  );
}

async function handleSubscriptionDeleted(subscription, pool) {
  // Get user_id before updating
  const subResult = await pool.query(
    `SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );
  
  // Update subscription status to canceled
  await pool.query(
    `UPDATE subscriptions
     SET status = 'canceled',
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );

  // Log subscription event
  if (subResult.rows.length > 0) {
    const userId = subResult.rows[0].user_id;
    await pool.query(
      `INSERT INTO subscription_events (user_id, event_type, event_data, created_at)
       VALUES ($1, 'subscription_deleted', $2, NOW())`,
      [userId, JSON.stringify({ subscription_id: subscription.id })]
    );
    
    console.log(`⚠️ Premium deactivated for user ${userId} via customer.subscription.deleted`);
    
    // Log premium analytics event
    await logPremiumAnalyticsEvent(pool, {
      event_type: 'subscription_cancelled',
      event_props: {
        subscription_id: subscription.id,
        reason: 'subscription_deleted',
        user_tier: 'premium'
      },
      user_id: userId
    });
  }

  // Trigger graceful downgrade
  await triggerGracefulDowngrade(subscription.customer, pool);
}

async function handlePaymentSucceeded(invoice, pool) {
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    // Update subscription period and activate premium
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Update subscription in database
    const result = await pool.query(
      `UPDATE subscriptions
       SET current_period_start = $1,
           current_period_end = $2,
           status = 'active',
           updated_at = NOW()
       WHERE stripe_subscription_id = $3
       RETURNING user_id`,
      [
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscriptionId
      ]
    );
    
    // Log subscription event
    if (result.rows.length > 0) {
      const userId = result.rows[0].user_id;
      await pool.query(
        `INSERT INTO subscription_events (user_id, event_type, event_data, created_at)
         VALUES ($1, 'payment_succeeded', $2, NOW())`,
        [userId, JSON.stringify({ subscription_id: subscriptionId, invoice_id: invoice.id })]
      );
      
      console.log(`✅ Premium activated for user ${userId} via invoice.payment_succeeded`);
      
      // Log premium analytics event (renewal)
      const subscriptionData = await pool.query(
        `SELECT plan_type FROM subscriptions WHERE stripe_subscription_id = $1`,
        [subscriptionId]
      );
      const planType = subscriptionData.rows[0]?.plan_type || 'monthly';
      
      await logPremiumAnalyticsEvent(pool, {
        event_type: 'subscription_renewed',
        event_props: {
          plan: planType,
          subscription_id: subscriptionId,
          invoice_id: invoice.id,
          user_tier: 'premium',
          revenue: planType === 'monthly' ? 2.99 : 29.99
        },
        user_id: userId
      });
    }
  }
}

async function handlePaymentFailed(invoice, pool) {
  const subscriptionId = invoice.subscription;
  
  if (subscriptionId) {
    await pool.query(
      `UPDATE subscriptions
       SET status = 'past_due',
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );
  }
}

async function triggerGracefulDowngrade(customerId, pool) {
  // Get user by customer ID
  const userResult = await pool.query(
    `SELECT id FROM users WHERE stripe_customer_id = $1`,
    [customerId]
  );

  if (userResult.rows.length === 0) return;

  const userId = userResult.rows[0].id;

  // Graceful downgrade: Keep user data, just remove premium features
  // No data deletion, just feature access changes
  console.log(`Graceful downgrade triggered for user ${userId}`);
  
  // Optional: Send email notification
  // await sendDowngradeEmail(userId);
}

/**
 * Log premium analytics event
 * @param {Pool} pool - Database pool
 * @param {Object} eventData - Event data
 */
async function logPremiumAnalyticsEvent(pool, eventData) {
  try {
    const { event_type, event_props, user_id } = eventData;
    
    // Generate session ID (use user_id as fallback for authenticated users)
    const session_id = user_id ? `user_${user_id}` : `anon_${Date.now()}`;
    
    await pool.query(
      `INSERT INTO premium_analytics_events (
        event_type,
        event_props,
        session_id,
        user_id,
        created_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [
        event_type,
        JSON.stringify(event_props),
        session_id,
        user_id || null
      ]
    );
  } catch (error) {
    // Don't throw - analytics logging shouldn't break subscription flow
    console.error('Error logging premium analytics event:', error);
  }
}

// Feature helpers

function getFreeTierFeatures() {
  return {
    conversions: { unlimited: true },
    substitutions: { max: 2 },
    savedRecipes: { max: 10 },
    exportFormats: ['txt'],
    brandVerification: false,
    batchConversion: false,
    conversionHistory: false,
    mealPlanning: false,
    recipeScaling: false,
    prioritySupport: false,
    earlyAccess: false
  };
}

function getPremiumFeatures() {
  return {
    conversions: { unlimited: true },
    substitutions: { max: Infinity },
    savedRecipes: { max: Infinity },
    exportFormats: ['txt', 'pdf', 'json'],
    brandVerification: true,
    batchConversion: true,
    conversionHistory: true,
    mealPlanning: true,
    recipeScaling: true,
    prioritySupport: true,
    earlyAccess: true
  };
}

export default router;
