import React from "react";
import { RefreshCw, Home, Plus, User } from "lucide-react";
import "./TabNavigation.css";

function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: "convert", label: "Convert", icon: RefreshCw },
    { id: "feed", label: "Feed", icon: Home },
    { id: "create", label: "Create", icon: Plus },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="tab-navigation" role="navigation" aria-label="Main navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            className={`tab-button ${isActive ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="tab-icon" aria-hidden="true" />
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default TabNavigation;
