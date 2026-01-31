import React, { useState, useEffect } from "react";
import ProfileModal from "./ProfileModal";
import "./HalalPreferencesModal.css";

function HalalPreferencesModal({ isOpen, onClose, onSettingsChange }) {
  const [strictnessLevel, setStrictnessLevel] = useState("standard");
  const [schoolOfThought, setSchoolOfThought] = useState("no-preference");

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

  const handleStrictnessChange = (level) => {
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
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Halal Preferences"
      ariaLabel="Halal standard preferences"
    >
      <div className="halal-preferences-content">
        <div className="halal-preferences-intro">
          <p className="halal-preferences-intro-text">
            Configure your halal standards. These preferences affect how recipes are converted 
            and the confidence score calculation.
          </p>
        </div>

        <div className="halal-preferences-section">
          <h3 className="halal-preferences-section-title">Strictness Level</h3>
          <p className="halal-preferences-description">
            Choose how strictly you want to follow halal guidelines
          </p>
          <div className="halal-preferences-radio-group">
            <label className="halal-preferences-radio-option">
              <input
                type="radio"
                name="strictness"
                value="strict"
                checked={strictnessLevel === "strict"}
                onChange={(e) => handleStrictnessChange(e.target.value)}
              />
              <div className="halal-preferences-radio-content">
                <span className="halal-preferences-radio-label">Strict</span>
                <span className="halal-preferences-radio-description">
                  Avoid all cross-contamination mentions
                </span>
              </div>
            </label>

            <label className="halal-preferences-radio-option">
              <input
                type="radio"
                name="strictness"
                value="standard"
                checked={strictnessLevel === "standard"}
                onChange={(e) => handleStrictnessChange(e.target.value)}
              />
              <div className="halal-preferences-radio-content">
                <span className="halal-preferences-radio-label">Standard</span>
                <span className="halal-preferences-radio-description">
                  Follow mainstream halal guidelines
                </span>
              </div>
            </label>

            <label className="halal-preferences-radio-option">
              <input
                type="radio"
                name="strictness"
                value="flexible"
                checked={strictnessLevel === "flexible"}
                onChange={(e) => handleStrictnessChange(e.target.value)}
              />
              <div className="halal-preferences-radio-content">
                <span className="halal-preferences-radio-label">Flexible</span>
                <span className="halal-preferences-radio-description">
                  Allow debatable items like vanilla extract
                </span>
              </div>
            </label>
          </div>
          {strictnessLevel && (
            <div className="halal-preferences-current-selection">
              <strong>Current:</strong> {getStrictnessDescription(strictnessLevel)}
            </div>
          )}
        </div>

        <div className="halal-preferences-section">
          <h3 className="halal-preferences-section-title">School of Thought (Optional)</h3>
          <p className="halal-preferences-description">
            Select your preferred Islamic school of thought
          </p>
          <select
            className="halal-preferences-select"
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
            <div className="halal-preferences-current-selection">
              <strong>Selected:</strong> {schoolOfThought.charAt(0).toUpperCase() + schoolOfThought.slice(1)}
            </div>
          )}
        </div>
      </div>
    </ProfileModal>
  );
}

export default HalalPreferencesModal;
