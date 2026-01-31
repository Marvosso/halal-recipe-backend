/**
 * Feature Gating Middleware
 * Checks if user has access to premium features
 */

import { hasPremiumAccess, canUseFeature, getFeatureLimit } from '../services/subscriptionService.js';

/**
 * Middleware to check premium access
 * Returns 403 if user doesn't have premium
 */
export function requirePremium(req, res, next) {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  hasPremiumAccess(userId)
    .then(hasAccess => {
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Premium subscription required',
          upgrade_url: '/subscription/upgrade'
        });
      }
      next();
    })
    .catch(error => {
      console.error('Error checking premium access:', error);
      res.status(500).json({ error: 'Failed to check subscription status' });
    });
}

/**
 * Middleware to check specific feature access
 * @param {string} feature - Feature name
 */
export function requireFeature(feature) {
  return (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    canUseFeature(userId, feature)
      .then(hasAccess => {
        if (!hasAccess) {
          return res.status(403).json({
            error: `Premium feature required: ${feature}`,
            upgrade_url: '/subscription/upgrade'
          });
        }
        next();
      })
      .catch(error => {
        console.error('Error checking feature access:', error);
        res.status(500).json({ error: 'Failed to check feature access' });
      });
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
