import React from "react";
import { ExternalLink, ShoppingCart } from "lucide-react";
import "./AffiliateLink.css";

/**
 * Ethical, subtle affiliate link component
 * Displays as a helpful "Shop" button, not an intrusive ad
 * 
 * @param {Object} props
 * @param {string} props.ingredientName - Name of the ingredient to shop for
 * @param {string} props.platform - 'amazon', 'instacart', or 'thrivemarket'
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showIcon - Whether to show shopping icon (default: true)
 * @param {string} props.variant - 'button', 'link', or 'inline' (default: 'button')
 */
function AffiliateLink({ 
  ingredientName, 
  platform = 'amazon',
  className = '',
  showIcon = true,
  variant = 'button'
}) {
  // Platform-specific configuration
  const platformConfig = {
    amazon: {
      name: 'Amazon',
      baseUrl: 'https://www.amazon.com/s?k=',
      color: '#FF9900',
      icon: '🛒'
    },
    instacart: {
      name: 'Instacart',
      baseUrl: 'https://www.instacart.com/store/search?q=',
      color: '#00A862',
      icon: '🛒'
    },
    thrivemarket: {
      name: 'Thrive Market',
      baseUrl: 'https://thrivemarket.com/search?q=',
      color: '#2E7D32',
      icon: '🌱'
    }
  };

  const config = platformConfig[platform] || platformConfig.amazon;
  
  // Build affiliate URL with ingredient name
  const searchQuery = encodeURIComponent(`${ingredientName} halal certified`);
  const affiliateUrl = `${config.baseUrl}${searchQuery}`;
  
  // Track affiliate click (ethical tracking - no personal data)
  const handleClick = (e) => {
    // Analytics tracking (if available)
    if (window.plausible) {
      window.plausible('Affiliate Click', {
        props: {
          platform: platform,
          ingredient: ingredientName
        }
      });
    }
    
    // Open in new tab
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  // Render based on variant
  if (variant === 'inline') {
    return (
      <span className={`affiliate-link-inline ${className}`}>
        <a
          href={affiliateUrl}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="affiliate-link-text"
          aria-label={`Shop for ${ingredientName} on ${config.name}`}
        >
          {showIcon && <ShoppingCart className="affiliate-icon-inline" size={14} />}
          <span>Shop on {config.name}</span>
          <ExternalLink className="affiliate-external-icon" size={12} />
        </a>
      </span>
    );
  }

  if (variant === 'link') {
    return (
      <a
        href={affiliateUrl}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={`affiliate-link-simple ${className}`}
        aria-label={`Shop for ${ingredientName} on ${config.name}`}
      >
        {showIcon && <ShoppingCart className="affiliate-icon" size={16} />}
        <span>Find on {config.name}</span>
        <ExternalLink className="affiliate-external-icon" size={14} />
      </a>
    );
  }

  // Default: button variant
  return (
    <button
      onClick={handleClick}
      className={`affiliate-button ${className}`}
      aria-label={`Shop for ${ingredientName} on ${config.name}`}
      style={{ '--platform-color': config.color }}
    >
      {showIcon && <ShoppingCart className="affiliate-icon" size={18} />}
      <span>Shop {config.name}</span>
      <ExternalLink className="affiliate-external-icon" size={14} />
    </button>
  );
}

export default AffiliateLink;
