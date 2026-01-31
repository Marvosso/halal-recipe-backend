import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Settings, X } from "lucide-react";
import { isPremiumUser } from "../lib/subscription";
import { canUseStrictHalalMode } from "../lib/featureGating";
import UpgradePrompt from "./UpgradePrompt";
import "./HalalStandardPanel.css";

function HalalStandardPanel({ onSettingsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [strictnessLevel, setStrictnessLevel] = useState("standard");
  const [schoolOfThought, setSchoolOfThought] = useState("no-preference");
  const [showStrictModeUpgrade, setShowStrictModeUpgrade] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedStrictness = localStorage.getItem("halalStrictnessLevel");
    const savedSchool = localStorage.getItem("halalSchoolOfThought");
    
    if (savedStrictness) {
      setStrictnessLevel(savedStrictness);
    }
    if (savedSchool) {
      setSchoolOfThought(savedSchool);
    }
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      
      // Prevent background scrolling (simpler approach like ProfileModal)
      document.body.style.overflow = "hidden";
      
      // Handle ESC key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };
      document.addEventListener("keydown", handleEscape);
      
      return () => {
        // Restore scrolling when modal closes
        document.body.style.overflow = originalOverflow;
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen]);

  const handleStrictnessChange = (level) => {
    // Check if strict mode requires premium
    if (level === "strict" && !isPremiumUser()) {
      const canUse = canUseStrictHalalMode();
      if (!canUse) {
        setShowStrictModeUpgrade(true);
        return; // Don't change to strict mode
      }
    }
    
    // Track strict halal mode usage (if premium)
    if (level === "strict" && isPremiumUser()) {
      const { trackStrictHalalModeUsage } = require("../lib/premiumAnalytics");
      trackStrictHalalModeUsage(true);
    }
    
    setStrictnessLevel(level);
    localStorage.setItem("halalStrictnessLevel", level);
    if (onSettingsChange) {
      onSettingsChange({ strictnessLevel: level, schoolOfThought });
    }
  };

  const handleSchoolChange = (school) => {
    setSchoolOfThought(school);
    localStorage.setItem("halalSchoolOfThought", school);
    if (onSettingsChange) {
      onSettingsChange({ strictnessLevel, schoolOfThought: school });
    }
  };

  const getStrictnessDescription = (level) => {
    switch (level) {
      case "strict":
        return "Avoid all cross-contamination mentions and questionable items";
      case "standard":
        return "Follow mainstream halal guidelines";
      case "flexible":
        return "Allow debatable items like vanilla extract";
      default:
        return "";
    }
  };

  return (
    <>
      <button
        className="settings-trigger-btn"
        onClick={() => setIsOpen(true)}
        aria-label="Open halal standard settings"
      >
        <Settings className="settings-icon" />
        <span>My Halal Standard</span>
      </button>

      {isOpen && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className="settings-overlay" 
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Halal Standard Settings"
        >
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>My Halal Standard</h2>
              <button
                className="settings-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close settings"
              >
                <X className="close-icon" />
              </button>
            </div>

            <div className="settings-content">
              <div className="settings-section">
                <h3>Strictness Level</h3>
                <p className="settings-description">
                  Choose how strictly you want to follow halal guidelines
                </p>
                <div className="radio-group">
                  <label className={`radio-option ${!isPremiumUser() && strictnessLevel !== "strict" ? "premium-feature" : ""}`}>
                    <input
                      type="radio"
                      name="strictness"
                      value="strict"
                      checked={strictnessLevel === "strict"}
                      onChange={(e) => handleStrictnessChange(e.target.value)}
                      disabled={!isPremiumUser() && strictnessLevel !== "strict"}
                    />
                    <div className="radio-content">
                      <span className="radio-label">
                        Strict {!isPremiumUser() && <span className="premium-badge">Premium</span>}
                      </span>
                      <span className="radio-description">
                        Avoid all cross-contamination mentions {!isPremiumUser() && "(Premium feature)"}
                      </span>
                    </div>
                  </label>

                  <label className="radio-option">
                    <input
                      type="radio"
                      name="strictness"
                      value="standard"
                      checked={strictnessLevel === "standard"}
                      onChange={(e) => handleStrictnessChange(e.target.value)}
                    />
                    <div className="radio-content">
                      <span className="radio-label">Standard</span>
                      <span className="radio-description">
                        Follow mainstream halal guidelines
                      </span>
                    </div>
                  </label>

                  <label className="radio-option">
                    <input
                      type="radio"
                      name="strictness"
                      value="flexible"
                      checked={strictnessLevel === "flexible"}
                      onChange={(e) => handleStrictnessChange(e.target.value)}
                    />
                    <div className="radio-content">
                      <span className="radio-label">Flexible</span>
                      <span className="radio-description">
                        Allow debatable items like vanilla extract
                      </span>
                    </div>
                  </label>
                </div>
                {strictnessLevel && (
                  <div className="current-selection">
                    <strong>Current:</strong> {getStrictnessDescription(strictnessLevel)}
                  </div>
                )}
                <p className="helper-text">
                  <em>Note: These preferences currently adjust confidence scoring and explanations only. Full jurisprudential rule differentiation is planned for a future update.</em>
                </p>
              </div>

              <div className="settings-section">
                <h3>School of Thought (Optional)</h3>
                <p className="settings-description">
                  Select your preferred Islamic school of thought
                </p>
                <select
                  className="school-select"
                  value={schoolOfThought}
                  onChange={(e) => handleSchoolChange(e.target.value)}
                >
                  <option value="no-preference">No preference</option>
                  <option value="hanafi">Hanafi</option>
                  <option value="shafii">Shafi'i</option>
                  <option value="maliki">Maliki</option>
                  <option value="hanbali">Hanbali</option>
                </select>
                {schoolOfThought !== "no-preference" && (
                  <div className="current-selection">
                    <strong>Selected:</strong> {schoolOfThought.charAt(0).toUpperCase() + schoolOfThought.slice(1)}
                  </div>
                )}
                <p className="helper-text">
                  <em>Note: These preferences currently adjust confidence scoring and explanations only. Full jurisprudential rule differentiation is planned for a future update.</em>
                </p>
              </div>

              <div className="settings-footer">
                <button
                  className="settings-save-btn"
                  onClick={() => setIsOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showStrictModeUpgrade && (
        <UpgradePrompt
          triggerFeature="strictHalalMode"
          onClose={() => setShowStrictModeUpgrade(false)}
          showModal={true}
        />
      )}
    </>
  );
}

export default HalalStandardPanel;
