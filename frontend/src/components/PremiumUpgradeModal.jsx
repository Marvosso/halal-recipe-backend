import React, { useState, useEffect } from "react";
import { X, Check, Sparkles, Heart } from "lucide-react";
import { UPGRADE_COPY } from "../lib/upgradeCopy";
import { createCheckoutSession } from "../lib/subscriptionApi";
import { trackUpgradeModalView, trackUpgradeAttempt, trackCheckoutStart } from "../lib/premiumAnalytics";
import "./PremiumUpgradeModal.css";

function PremiumUpgradeModal({ isOpen, onClose, triggerFeature = null }) {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);

  // Track modal view
  useEffect(() => {
    if (isOpen) {
      trackUpgradeModalView(triggerFeature, 'modal');
    }
  }, [isOpen, triggerFeature]);

  if (!isOpen) return null;

  const copy = UPGRADE_COPY.modal;
  const pricing = copy.pricing;

  const handleUpgrade = async () => {
    // Track upgrade attempt
    trackUpgradeAttempt(selectedPlan, triggerFeature, 'modal');
    
    setIsLoading(true);
    try {
      const checkoutUrl = await createCheckoutSession(selectedPlan);
      
      // Track checkout start
      const sessionId = checkoutUrl.split('session_id=')[1]?.split('&')[0] || 'unknown';
      trackCheckoutStart(selectedPlan, sessionId);
      
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  // Get context-specific copy if triggerFeature is provided
  const getContextualCopy = () => {
    if (!triggerFeature) return copy;
    
    // Check if there's specific copy for this trigger
    const contextualCopy = UPGRADE_COPY.postConversion?.[triggerFeature];
    if (contextualCopy) {
      return {
        ...copy,
        title: contextualCopy.title || copy.title,
        subtitle: contextualCopy.message || copy.subtitle
      };
    }
    
    return copy;
  };

  const displayCopy = getContextualCopy();

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
        <button className="premium-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="premium-modal-header">
          <div className="premium-modal-icon">
            <Sparkles size={32} />
          </div>
          <h2 className="premium-modal-title">{displayCopy.title}</h2>
          <p className="premium-modal-subtitle">{displayCopy.subtitle}</p>
        </div>

        <div className="premium-modal-value-prop">
          <h3 className="value-prop-headline">{displayCopy.valueProp.headline}</h3>
          <p className="value-prop-description">{displayCopy.valueProp.description}</p>
        </div>

        <div className="premium-modal-features">
          {displayCopy.features.map((feature, index) => (
            <div key={index} className="premium-feature-item">
              <div className="premium-feature-icon">{feature.icon}</div>
              <div className="premium-feature-content">
                <h4 className="premium-feature-title">{feature.title}</h4>
                <p className="premium-feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="premium-modal-pricing">
          <div className="pricing-toggle">
            <button
              className={`pricing-toggle-btn ${selectedPlan === "monthly" ? "active" : ""}`}
              onClick={() => setSelectedPlan("monthly")}
            >
              Monthly
            </button>
            <button
              className={`pricing-toggle-btn ${selectedPlan === "yearly" ? "active" : ""}`}
              onClick={() => setSelectedPlan("yearly")}
            >
              Yearly
              {pricing.yearly.savings && (
                <span className="pricing-savings-badge">{pricing.yearly.savings}</span>
              )}
            </button>
          </div>

          <div className="pricing-display">
            <div className="pricing-amount">
              <span className="pricing-price">{pricing[selectedPlan].price}</span>
              <span className="pricing-period">{pricing[selectedPlan].period}</span>
            </div>
            <p className="pricing-note">{pricing[selectedPlan].note}</p>
          </div>
        </div>

        <div className="premium-modal-cta">
          <button
            className="premium-upgrade-btn primary"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Upgrade Now"}
          </button>
          <button
            className="premium-upgrade-btn secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Maybe Later
          </button>
        </div>

        <div className="premium-modal-trust">
          <div className="trust-item">
            <Check size={16} />
            <span>{displayCopy.trust.guarantee}</span>
          </div>
          <div className="trust-item">
            <Check size={16} />
            <span>{displayCopy.trust.support}</span>
          </div>
          <div className="trust-item">
            <Check size={16} />
            <span>{displayCopy.trust.cancel}</span>
          </div>
        </div>

        <div className="premium-modal-footer">
          <p className="footer-message">
            <Heart size={14} className="footer-heart" />
            {displayCopy.footer.why}
          </p>
          <p className="footer-thanks">{displayCopy.footer.thanks}</p>
        </div>
      </div>
    </div>
  );
}

export default PremiumUpgradeModal;
