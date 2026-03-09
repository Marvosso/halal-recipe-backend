/**
 * Subscription API Client
 * Frontend functions for interacting with subscription API
 */

import { getAxiosInstance } from '../api/axiosConfig';

/**
 * Get current subscription status
 * @returns {Promise<Object>} Subscription status and features
 */
export async function getSubscriptionStatus() {
  try {
    const axios = await getAxiosInstance();
    const response = await axios.get('/api/subscriptions/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    // Return free tier on error
    return {
      subscribed: false,
      plan: null,
      status: 'free',
      expires_at: null,
      features: getFreeTierFeatures()
    };
  }
}

/**
 * Create Stripe checkout session
 * @param {string} plan - 'monthly' or 'yearly'
 * @returns {Promise<string>} Checkout URL
 */
export async function createCheckoutSession(plan = 'monthly') {
  try {
    const axios = await getAxiosInstance();
    const response = await axios.post('/api/subscriptions/create-checkout', { plan });
    return response.data.checkout_url || response.data.checkoutUrl;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Cancel subscription (at period end)
 * @returns {Promise<Object>} Cancellation result
 */
export async function cancelSubscription() {
  try {
    const axios = await getAxiosInstance();
    const response = await axios.post('/api/subscriptions/cancel');
    return response.data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Reactivate canceled subscription
 * @returns {Promise<Object>} Reactivation result
 */
export async function reactivateSubscription() {
  try {
    const axios = await getAxiosInstance();
    const response = await axios.post('/api/subscriptions/reactivate');
    return response.data;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

/**
 * Change subscription plan (upgrade/downgrade)
 * @param {string} newPlan - 'monthly' or 'yearly'
 * @returns {Promise<Object>} Plan change result
 */
export async function changeSubscriptionPlan(newPlan) {
  try {
    const axios = await getAxiosInstance();
    const response = await axios.post('/api/subscriptions/change-plan', { newPlan });
    return response.data;
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    throw error;
  }
}

/**
 * Get free tier features (fallback)
 * @returns {Object} Free tier feature set
 */
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
