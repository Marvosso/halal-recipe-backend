/**
 * Stripe Service
 * Centralized Stripe operations for Halal Kitchen
 */

// Use require for Stripe (CommonJS module)
let Stripe;
try {
  Stripe = require('stripe');
} catch (err) {
  console.warn('Stripe package not installed. Run: npm install stripe');
}

// Initialize Stripe
let stripe = null;

if (Stripe && process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia', // Use latest API version
  });
} else if (!Stripe) {
  console.warn('⚠️  Stripe package not installed. Run: npm install stripe');
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Stripe features will be disabled.');
}

/**
 * Create a Stripe customer for a user
 * @param {string} email - User email
 * @param {string} userId - User ID (for metadata)
 * @returns {Promise<Stripe.Customer>}
 */
export async function createStripeCustomer(email, userId) {
  if (!stripe) {
    throw new Error('Stripe not initialized. Set STRIPE_SECRET_KEY in .env');
  }

  try {
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        user_id: userId,
        created_at: new Date().toISOString()
      }
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

/**
 * Get Stripe customer by ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Stripe.Customer>}
 */
export async function getStripeCustomer(customerId) {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving Stripe customer:', error);
    throw error;
  }
}

/**
 * Create checkout session for subscription
 * @param {string} customerId - Stripe customer ID
 * @param {string} priceId - Stripe price ID
 * @param {string} userId - User ID
 * @param {string} plan - 'monthly' or 'yearly'
 * @param {string} successUrl - Success redirect URL
 * @param {string} cancelUrl - Cancel redirect URL
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export async function createCheckoutSession(customerId, priceId, userId, plan, successUrl, cancelUrl) {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
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

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get subscription by ID
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function getSubscription(subscriptionId) {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription (at period end)
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function cancelSubscription(subscriptionId) {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Reactivate subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function reactivateSubscription(subscriptionId) {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 * @param {Buffer} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @param {string} secret - Webhook secret
 * @returns {Stripe.Event}
 */
export function verifyWebhookSignature(payload, signature, secret) {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    throw error;
  }
}

export { stripe };
