import React from "react";
import { Bookmark } from "lucide-react";

/**
 * Save Halal Version button — shown after recipe conversion.
 * Calls onSave() when clicked; parent should pass recipe, converted text, and issues.
 * Disable when there is nothing to save (no converted text).
 */
function SaveHalalVersionButton({ disabled, onClick, label = "Save Halal Version", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`gold-outline save-halal-version-btn ${className}`.trim()}
      aria-label="Save halal version to your account"
    >
      <Bookmark className="button-icon-inline" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default SaveHalalVersionButton;
