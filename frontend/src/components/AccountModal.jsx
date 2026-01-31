import React, { useState, useEffect } from "react";
import { User, Package, Code, Info } from "lucide-react";
import ProfileModal from "./ProfileModal";
import "./AccountModal.css";

function AccountModal({ isOpen, onClose }) {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Generate or retrieve anonymous user ID
    let id = localStorage.getItem("anonymousUserId");
    if (!id) {
      // Generate a simple anonymous ID
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("anonymousUserId", id);
    }
    setUserId(id);
  }, []);

  const appVersion = "1.0.0";
  const environment = import.meta.env.MODE === "production" ? "Production" : "Development";

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Information"
      ariaLabel="Account information and app details"
    >
      <div className="account-modal-content">
        <div className="account-badge">
          <User className="account-badge-icon" />
          <div className="account-badge-content">
            <h3 className="account-badge-title">Anonymous User</h3>
            <p className="account-badge-text">
              No account required. All data is stored locally on your device.
            </p>
          </div>
        </div>

        <section className="account-section">
          <div className="account-info-item">
            <div className="account-info-label">
              <User className="account-info-icon" />
              <span>User ID</span>
            </div>
            <div className="account-info-value">
              <code className="account-code">{userId}</code>
              <button
                className="account-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  alert("User ID copied to clipboard!");
                }}
                aria-label="Copy user ID"
              >
                Copy
              </button>
            </div>
            <p className="account-info-note">
              This anonymous ID is used locally to track your preferences and saved recipes.
            </p>
          </div>

          <div className="account-info-item">
            <div className="account-info-label">
              <Package className="account-info-icon" />
              <span>App Version</span>
            </div>
            <div className="account-info-value">
              <span className="account-version">{appVersion}</span>
            </div>
          </div>

          <div className="account-info-item">
            <div className="account-info-label">
              <Code className="account-info-icon" />
              <span>Environment</span>
            </div>
            <div className="account-info-value">
              <span className="account-environment">{environment}</span>
            </div>
          </div>
        </section>

        <section className="account-section">
          <div className="account-future">
            <Info className="account-future-icon" />
            <div className="account-future-content">
              <h3 className="account-future-title">Accounts Coming Soon</h3>
              <p className="account-future-text">
                When accounts are introduced, you will be able to:
              </p>
              <ul className="account-future-list">
                <li>Sync your recipes across devices</li>
                <li>Back up your data securely</li>
                <li>Export your recipes anytime</li>
                <li>Delete your account and all data</li>
              </ul>
              <p className="account-future-note">
                Your data will always remain portable and under your control.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ProfileModal>
  );
}

export default AccountModal;
