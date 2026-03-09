/**
 * Upgrade Copy for Halal Kitchen Premium
 * Respectful, value-based, non-pushy messaging
 */

export const UPGRADE_COPY = {
  // Main upgrade modal
  modal: {
    title: "Unlock Premium Features",
    subtitle: "Support Halal Kitchen and get advanced tools for your halal cooking journey",
    
    // Value proposition
    valueProp: {
      headline: "Everything you need for confident halal cooking",
      description: "Premium helps you make informed decisions with advanced verification, unlimited saves, and priority support."
    },
    
    // Features list
    features: [
      {
        icon: "🔍",
        title: "All Halal Alternatives",
        description: "See every halal substitute option, not just the top 2. Find the perfect match for your recipe."
      },
      {
        icon: "🛡️",
        title: "Strict Halal Mode",
        description: "Enhanced verification with stricter rules for maximum confidence in your halal choices."
      },
      {
        icon: "💾",
        title: "Unlimited Recipe Saves",
        description: "Save as many converted recipes as you need. Organize your halal recipe collection."
      },
      {
        icon: "📄",
        title: "PDF & JSON Export",
        description: "Export recipes in professional formats. Share with family or import to meal planning apps."
      },
      {
        icon: "🏷️",
        title: "Brand-Level Verification",
        description: "Check if specific brands are halal-certified. Know exactly what you're buying."
      },
      {
        icon: "📊",
        title: "Conversion History",
        description: "Access your past conversions. Review substitutions and build your halal recipe library."
      }
    ],
    
    // Pricing
    pricing: {
      monthly: {
        price: "$2.99",
        period: "per month",
        cta: "Start Monthly Plan",
        note: "Cancel anytime"
      },
      yearly: {
        price: "$29.99",
        period: "per year",
        cta: "Start Yearly Plan",
        savings: "Save 17%",
        note: "Billed annually"
      }
    },
    
    // Trust elements
    trust: {
      guarantee: "30-day money-back guarantee",
      support: "Priority email support",
      cancel: "Cancel anytime, no questions asked"
    },
    
    // Footer
    footer: {
      why: "Your subscription helps us maintain and expand the halal knowledge base, keeping Halal Kitchen free for everyone.",
      thanks: "Thank you for supporting halal cooking! 🙏"
    }
  },
  
  // Settings page copy
  settings: {
    title: "Premium Subscription",
    subtitle: "Unlock advanced features and support Halal Kitchen",
    
    currentStatus: {
      free: {
        title: "Free Plan",
        description: "You're using the free plan with basic features.",
        cta: "Upgrade to Premium"
      },
      premium: {
        title: "Premium Active",
        description: "Thank you for supporting Halal Kitchen!",
        expires: "Renews on {date}",
        manage: "Manage Subscription"
      },
      expired: {
        title: "Premium Expired",
        description: "Your premium subscription has ended. Upgrade to restore premium features.",
        cta: "Renew Premium"
      }
    },
    
    benefits: {
      title: "What you get with Premium",
      list: [
        "All halal substitution alternatives",
        "Strict Halal Mode verification",
        "Unlimited recipe saves",
        "PDF and JSON export formats",
        "Brand-level halal verification",
        "Full conversion history",
        "Priority email support"
      ]
    }
  },
  
  // Post-conversion upgrade nudge
  postConversion: {
    // When user hits conversion limit
    conversionLimit: {
      title: "Monthly Conversion Limit Reached",
      message: "You've used all 5 free conversions this month. Upgrade to Premium for unlimited conversions, advanced substitutions, and more.",
      cta: "Upgrade to Premium",
      dismiss: "Maybe Later"
    },
    
    // When user sees limited alternatives
    limitedAlternatives: {
      title: "See All Halal Alternatives",
      message: "You're seeing the top 2 substitutes. Premium shows all {total} alternatives with flavor and texture match details.",
      cta: "Upgrade to See All",
      dismiss: "Maybe Later"
    },
    
    // When conversion is successful
    successfulConversion: {
      title: "Save This Recipe?",
      message: "You've saved {count} of 10 free recipes. Upgrade for unlimited saves and recipe collections.",
      cta: "Upgrade for Unlimited Saves",
      dismiss: "Continue Free"
    },
    
    // When user wants to export
    exportPrompt: {
      title: "Export Recipe",
      message: "Text export is free. Upgrade to export as PDF (formatted) or JSON (for meal planning apps).",
      cta: "Upgrade for PDF/JSON Export",
      dismiss: "Export as Text"
    },
    
    // When user tries to export shopping list
    shoppingListExport: {
      title: "Shopping List Export",
      message: "Shopping list export is a Premium feature. Upgrade to generate and export shopping lists for your converted recipes.",
      cta: "Upgrade for Shopping Lists",
      dismiss: "Maybe Later"
    }
  },
  
  // Feature-specific upgrade prompts
  features: {
    strictHalalMode: {
      title: "Strict Halal Mode",
      message: "Enhanced halal verification with stricter rules for maximum confidence. Premium feature.",
      cta: "Upgrade to Enable",
      dismiss: "Use Standard Mode"
    },
    
    brandVerification: {
      title: "Brand-Level Verification",
      message: "Check if specific brands are halal-certified. Know exactly what you're buying. Premium feature.",
      cta: "Upgrade to Verify Brands",
      dismiss: "Continue Free"
    },
    
    batchConversion: {
      title: "Batch Conversion",
      message: "Convert up to 5 recipes at once. Save time when planning meals. Premium feature.",
      cta: "Upgrade for Batch Conversion",
      dismiss: "Convert One at a Time"
    },
    
    conversionHistory: {
      title: "Conversion History",
      message: "View and manage your past conversions. Build your halal recipe library. Premium feature.",
      cta: "Upgrade to View History",
      dismiss: "Continue Free"
    },
    
    additiveBreakdown: {
      title: "Additive & E-Number Breakdown",
      message: "Get detailed breakdown of additives and E-numbers in ingredients. See which additives are halal, conditional, or haram with simplified explanations.",
      cta: "Upgrade to See Additive Breakdown",
      dismiss: "Continue Free",
      valueProp: "Make informed decisions with detailed additive analysis and halal status explanations."
    }
  },
  
  // General upgrade CTA
  general: {
    title: "Upgrade to Premium",
    message: "Unlock all features and support Halal Kitchen's mission to make halal cooking accessible to everyone.",
    cta: "Learn More",
    value: "Just $2.99/month"
  }
};

/**
 * Get upgrade copy for a specific feature
 * @param {string} feature - Feature name
 * @returns {Object} Copy object
 */
export function getUpgradeCopy(feature) {
  // Check postConversion first (for conversion limit, etc.)
  if (UPGRADE_COPY.postConversion[feature]) {
    return UPGRADE_COPY.postConversion[feature];
  }
  
  // Check features
  if (UPGRADE_COPY.features[feature]) {
    return UPGRADE_COPY.features[feature];
  }
  
  // Fallback to general
  return UPGRADE_COPY.general;
}

/**
 * Format pricing display
 * @param {string} plan - 'monthly' or 'yearly'
 * @returns {string} Formatted price string
 */
export function formatPrice(plan = 'monthly') {
  const pricing = UPGRADE_COPY.modal.pricing[plan];
  return `${pricing.price} ${pricing.period}`;
}
