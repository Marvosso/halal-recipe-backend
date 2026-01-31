import React from "react";
import { Sparkles, X } from "lucide-react";
import { getUpgradeCopy } from "../lib/upgradeCopy";
import PremiumUpgradeModal from "./PremiumUpgradeModal";
import "./UpgradePrompt.css";

/**
 * Upgrade Prompt Component
 * Shows upgrade prompts at natural friction points
 * UX-safe: Only appears when user hits a limit or tries premium feature
 * 
 * @param {Object} props
 * @param {string} props.triggerFeature - Feature that triggered upgrade prompt
 * @param {Object} props.context - Additional context (e.g., currentCount, limit)
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.showModal - Whether to show upgrade modal
 */
function UpgradePrompt({ 
  triggerFeature, 
  context = {}, 
  onClose = null,
  showModal = false 
}) {
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(showModal);
  const prompt = getUpgradeCopy(triggerFeature) || {
    title: "Upgrade to Premium",
    message: "Unlock all features and support Halal Kitchen's mission.",
    cta: "Upgrade to Premium"
  };

  if (!triggerFeature) {
    return null;
  }

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <div className="upgrade-prompt">
        <button
          className="upgrade-prompt-close"
          onClick={onClose}
          aria-label="Close prompt"
        >
          <X size={16} />
        </button>
        
        <div className="upgrade-prompt-content">
          <div className="upgrade-prompt-icon">
            <Sparkles size={20} />
          </div>
          <div className="upgrade-prompt-text">
            <h4 className="upgrade-prompt-title">{prompt.title}</h4>
            <p className="upgrade-prompt-message">{prompt.message}</p>
          </div>
        </div>
        
        <div className="upgrade-prompt-actions">
          <button
            className="upgrade-prompt-cta"
            onClick={handleUpgrade}
          >
            {prompt.cta}
          </button>
          <button
            className="upgrade-prompt-dismiss"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>
      </div>

      {showUpgradeModal && (
        <PremiumUpgradeModal
          isOpen={showUpgradeModal}
          onClose={handleCloseModal}
          triggerFeature={triggerFeature}
        />
      )}
    </>
  );
}

export default UpgradePrompt;
