import React from "react";
import ProfileModal from "./ProfileModal";
import "./HelpModal.css";

function HelpModal({ isOpen, onClose }) {
  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Help & Support"
      ariaLabel="Help and support information"
    >
      <div className="help-modal-content">
        <section className="help-section">
          <h3 className="help-section-title">What is Halal Kitchen?</h3>
          <p className="help-text">
            Halal Kitchen is a recipe conversion tool that helps you make any recipe halal-compliant. 
            Simply paste your recipe, and we'll identify non-halal ingredients and suggest halal alternatives 
            based on Islamic dietary guidelines.
          </p>
        </section>

        <section className="help-section">
          <h3 className="help-section-title">Important Disclaimer</h3>
          <p className="help-text help-disclaimer">
            <strong>Halal Kitchen provides guidance, not religious rulings.</strong> Always verify with trusted scholars.
          </p>
          <p className="help-text">
            Our converter uses knowledge bases and general Islamic dietary principles. Different schools of 
            thought and scholars may have varying opinions on certain ingredients. For matters of religious 
            importance, please consult with qualified Islamic scholars or halal certification authorities 
            in your area.
          </p>
        </section>

        <section className="help-section">
          <h3 className="help-section-title">How the Converter Works</h3>
          <p className="help-text">
            Our converter analyzes your recipe ingredients and:
          </p>
          <ul className="help-list">
            <li>Identifies haram (prohibited) ingredients like pork, alcohol, and non-halal gelatin</li>
            <li>Suggests halal alternatives that maintain flavor and texture</li>
            <li>Provides Islamic references (Qur'an and Hadith) for each substitution</li>
            <li>Calculates a Halal Confidence Score based on the conversion quality</li>
          </ul>
        </section>

        <section className="help-section">
          <h3 className="help-section-title">Understanding the Confidence Score</h3>
          <p className="help-text">
            The Halal Confidence Score (0-100%) indicates how confident we are that the converted recipe 
            is fully halal-compliant:
          </p>
          <ul className="help-list">
            <li><strong>90-100%:</strong> All ingredients verified halal, high confidence</li>
            <li><strong>70-89%:</strong> Most ingredients halal, some may need verification</li>
            <li><strong>50-69%:</strong> Many substitutions made, review recommended</li>
            <li><strong>Below 50%:</strong> Significant changes needed, manual review required</li>
          </ul>
          <p className="help-note">
            Your strictness level and school of thought preferences also affect this score.
          </p>
        </section>

        <section className="help-section">
          <h3 className="help-section-title">Learn More</h3>
          <div className="help-links">
            <button className="help-link-btn" onClick={() => alert("Coming soon: Detailed guide on how substitutions are chosen")}>
              How substitutions are chosen <span style={{opacity: 0.7, fontSize: '0.875rem'}}>(Coming soon)</span>
            </button>
            <button className="help-link-btn" onClick={() => alert("Coming soon: Guide to understanding halal differences")}>
              Understanding halal differences <span style={{opacity: 0.7, fontSize: '0.875rem'}}>(Coming soon)</span>
            </button>
            <button className="help-link-btn" onClick={() => alert("Coming soon: Common ingredient questions and answers")}>
              Common ingredient questions <span style={{opacity: 0.7, fontSize: '0.875rem'}}>(Coming soon)</span>
            </button>
          </div>
        </section>

        <div className="help-footer">
          <p className="help-footer-text">
            Need more help? Contact us through the app settings.
          </p>
        </div>
      </div>
    </ProfileModal>
  );
}

export default HelpModal;
