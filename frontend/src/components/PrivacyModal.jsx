import React from "react";
import { Shield, Lock, Eye, Database } from "lucide-react";
import ProfileModal from "./ProfileModal";
import "./PrivacyModal.css";

function PrivacyModal({ isOpen, onClose }) {
  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy & Data"
      ariaLabel="Privacy and data information"
    >
      <div className="privacy-modal-content">
        <div className="privacy-badge">
          <Shield className="privacy-icon" />
          <h3 className="privacy-badge-title">Your Privacy Matters</h3>
        </div>

        <section className="privacy-section">
          <div className="privacy-item">
            <Lock className="privacy-item-icon" />
            <div className="privacy-item-content">
              <h4 className="privacy-item-title">Use Without an Account</h4>
              <p className="privacy-item-text">
                You can use the recipe converter without creating an account. When you use Halal Kitchen 
                anonymously, your converted recipes and preferences are stored locally in your browser 
                and never sent to our servers.
              </p>
            </div>
          </div>

          <div className="privacy-item">
            <Database className="privacy-item-icon" />
            <div className="privacy-item-content">
              <h4 className="privacy-item-title">Anonymous vs. Account Usage</h4>
              <p className="privacy-item-text">
                <strong>Anonymous usage:</strong> All data stays in your browser's local storage. 
                Your recipes, preferences, and settings remain on your device only.<br /><br />
                <strong>With an account:</strong> Your profile, saved recipes, and public posts are 
                stored on our servers so you can access them from any device. You control what you share.
              </p>
            </div>
          </div>

          <div className="privacy-item">
            <Eye className="privacy-item-icon" />
            <div className="privacy-item-content">
              <h4 className="privacy-item-title">Your Data, Your Control</h4>
              <p className="privacy-item-text">
                We respect your privacy. You can use the converter anonymously, create an account 
                to save and share recipes, or delete your account at any time. We don't sell your 
                personal information to third parties.
              </p>
            </div>
          </div>
        </section>

        <section className="privacy-section">
          <h3 className="privacy-section-title">What Data Do We Store?</h3>
          <p className="privacy-item-text" style={{ marginBottom: '1rem' }}>
            <strong>When using anonymously (no account):</strong>
          </p>
          <ul className="privacy-list">
            <li>Converted recipes (localStorage only)</li>
            <li>Halal preferences (strictness level, school of thought)</li>
            <li>Language preference</li>
            <li>Theme preference (light/dark mode)</li>
          </ul>
          <p className="privacy-note" style={{ marginTop: '1.5rem' }}>
            <strong>With an account:</strong>
          </p>
          <ul className="privacy-list">
            <li>Your email address (for login)</li>
            <li>Profile information (display name, bio, profile photo)</li>
            <li>Your recipes (if you choose to save or post them)</li>
            <li>Public recipe posts (if you choose to share)</li>
          </ul>
          <p className="privacy-note" style={{ marginTop: '1.5rem' }}>
            Anonymous users can clear local data anytime by clearing browser storage. 
            Account holders can delete their account and all associated data at any time.
          </p>
        </section>

        <section className="privacy-section">
          <div className="privacy-future">
            <h3 className="privacy-section-title">Your Rights & Control</h3>
            <p className="privacy-future-text">
              You have full control over your data. With an account, you can:
            </p>
            <ul className="privacy-list">
              <li>Access and update your profile information</li>
              <li>Delete your account and all associated data at any time</li>
              <li>Choose whether to post recipes publicly or keep them private</li>
              <li>Manage your saved recipes and preferences</li>
            </ul>
            <p className="privacy-future-note">
              Your privacy is important to us. We are committed to protecting your personal 
              information and being transparent about how we use it.
            </p>
          </div>
        </section>
      </div>
    </ProfileModal>
  );
}

export default PrivacyModal;
