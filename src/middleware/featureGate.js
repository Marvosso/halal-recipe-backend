/**
 * Feature gating middleware.
 * All features are available to authenticated users (no premium gating).
 */

import { getFeatureLimit } from '../services/subscriptionService.js';

/**
 * No longer gates by subscription; requires auth only.
 */
export function requirePremium(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * No longer gates by feature; requires auth only.
 */
export function requireFeature(_feature) {
  return (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };
}

/**
 * Attach feature limits to request object
 * Makes feature limits available in route handlers
 */
export async function attachFeatureLimits(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    return next();
  }

  try {
    req.featureLimits = {
      substitutions: await getFeatureLimit(userId, 'substitutions'),
      savedRecipes: await getFeatureLimit(userId, 'savedRecipes'),
      exportFormats: await getFeatureLimit(userId, 'exportFormats')
    };
    next();
  } catch (error) {
    console.error('Error attaching feature limits:', error);
    next(); // Continue anyway, limits will be undefined
  }
}
