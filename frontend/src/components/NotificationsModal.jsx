import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import ProfileModal from "./ProfileModal";
import "./NotificationsModal.css";

function NotificationsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    conversionComplete: true,
    communityTips: true,
    featureUpdates: false,
  });

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem("notificationSettings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error("Error loading notification settings:", error);
      }
    }
  }, []);

  const handleToggle = (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(newSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings));
  };

  return (
    <ProfileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Settings"
      ariaLabel="Notification preferences"
    >
      <div className="notifications-modal-content">
        <div className="notifications-intro">
          <Bell className="notifications-icon" />
          <p className="notifications-intro-text">
            Configure your notification preferences. These settings are stored locally 
            and apply to in-app notifications only.
          </p>
        </div>

        <div className="notifications-list">
          <div className="notification-item">
            <div className="notification-item-content">
              <h4 className="notification-item-title">Conversion Complete</h4>
              <p className="notification-item-description">
                Get notified when your recipe conversion is finished
              </p>
            </div>
            <button
              className={`notification-toggle ${settings.conversionComplete ? "active" : ""}`}
              onClick={() => handleToggle("conversionComplete")}
              aria-label={`${settings.conversionComplete ? "Disable" : "Enable"} conversion complete notifications`}
            >
              {settings.conversionComplete && <Check className="toggle-check" />}
            </button>
          </div>

          <div className="notification-item">
            <div className="notification-item-content">
              <h4 className="notification-item-title">Community Tips</h4>
              <p className="notification-item-description">
                Receive helpful tips and suggestions from the community
              </p>
            </div>
            <button
              className={`notification-toggle ${settings.communityTips ? "active" : ""}`}
              onClick={() => handleToggle("communityTips")}
              aria-label={`${settings.communityTips ? "Disable" : "Enable"} community tips notifications`}
            >
              {settings.communityTips && <Check className="toggle-check" />}
            </button>
          </div>

          <div className="notification-item">
            <div className="notification-item-content">
              <h4 className="notification-item-title">Feature Updates</h4>
              <p className="notification-item-description">
                Learn about new features and improvements (coming soon)
              </p>
            </div>
            <button
              className={`notification-toggle ${settings.featureUpdates ? "active" : ""}`}
              onClick={() => handleToggle("featureUpdates")}
              aria-label={`${settings.featureUpdates ? "Disable" : "Enable"} feature updates notifications`}
            >
              {settings.featureUpdates && <Check className="toggle-check" />}
            </button>
          </div>
        </div>

        <div className="notifications-note">
          <p className="notifications-note-text">
            <strong>Note:</strong> These are in-app notifications only. Push notifications 
            and email alerts are not yet available.
          </p>
        </div>
      </div>
    </ProfileModal>
  );
}

export default NotificationsModal;
