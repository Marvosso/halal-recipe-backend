import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { setAnalyticsConsent, hasAnalyticsConsent } from "../lib/affiliateAnalytics";
import "./AnalyticsConsent.css";

/**
 * Analytics Consent Banner
 * GDPR-compliant consent request for anonymous analytics
 */
function AnalyticsConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has been given
    const consent = hasAnalyticsConsent();
    
    // Show banner if no consent decision has been made
    if (consent === null || consent === undefined) {
      // Delay showing banner slightly for better UX
      setTimeout(() => {
        setShowBanner(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 2000);
    }
  }, []);

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setShowBanner(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={`analytics-consent-banner ${isVisible ? 'visible' : ''}`}>
      <div className="analytics-consent-content">
        <div className="analytics-consent-icon">
          <Cookie size={20} />
        </div>
        <div className="analytics-consent-text">
          <p className="analytics-consent-title">Privacy-Friendly Analytics</p>
          <p className="analytics-consent-description">
            We use anonymous analytics to improve Halal Kitchen. No personal data is collected. 
            You can opt out anytime.
          </p>
        </div>
        <div className="analytics-consent-actions">
          <button
            onClick={handleAccept}
            className="analytics-consent-accept"
            aria-label="Accept analytics"
          >
            Accept
          </button>
          <button
            onClick={handleDecline}
            className="analytics-consent-decline"
            aria-label="Decline analytics"
          >
            Decline
          </button>
        </div>
        <button
          onClick={handleDecline}
          className="analytics-consent-close"
          aria-label="Close banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default AnalyticsConsent;
