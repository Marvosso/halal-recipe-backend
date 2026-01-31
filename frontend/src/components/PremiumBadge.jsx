import React from "react";
import { Crown, Sparkles } from "lucide-react";
import "./PremiumBadge.css";

/**
 * Premium Badge Component
 * Shows premium feature indicators and upgrade prompts
 * 
 * @param {Object} props
 * @param {string} props.variant - 'badge', 'banner', or 'inline'
 * @param {string} props.message - Custom message to display
 * @param {Function} props.onUpgrade - Callback when user clicks upgrade
 */
function PremiumBadge({ 
  variant = 'badge', 
  message = null,
  onUpgrade = null 
}) {
  const defaultMessage = variant === 'banner' 
    ? "Unlock unlimited conversions and advanced features"
    : "Premium Feature";

  const displayMessage = message || defaultMessage;

  if (variant === 'inline') {
    return (
      <span className="premium-badge-inline" title={displayMessage}>
        <Crown className="premium-icon-inline" size={14} />
        <span>Premium</span>
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="premium-banner">
        <div className="premium-banner-content">
          <Sparkles className="premium-icon" size={20} />
          <div className="premium-banner-text">
            <strong>{displayMessage}</strong>
            <span className="premium-banner-subtitle">Upgrade to unlock all features</span>
          </div>
        </div>
        {onUpgrade && (
          <button 
            className="premium-upgrade-btn"
            onClick={onUpgrade}
            aria-label="Upgrade to Premium"
          >
            Upgrade
          </button>
        )}
      </div>
    );
  }

  // Default: badge variant
  return (
    <span className="premium-badge" title={displayMessage}>
      <Crown className="premium-icon" size={16} />
      <span>Premium</span>
    </span>
  );
}

export default PremiumBadge;
