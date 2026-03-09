import React, { useState, useMemo } from "react";
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import AffiliateLink from "./AffiliateLink";
import { getEnabledProviders } from "../config/affiliateProviderConfig";
import "./IngredientShopSection.css";

/**
 * Subtle "Shop Ingredients" section after recipe conversion.
 * Only shows for ingredients that were replaced (haram → halal).
 * Platform list is config-driven (no hardcoded retailers).
 */
function IngredientShopSection({ replacements = [] }) {
  const enabledProviders = useMemo(() => getEnabledProviders(), []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    enabledProviders[0]?.name ?? "amazon"
  );

  const shopableIngredients = replacements
    .filter(
      (item) =>
        item.replacement && item.replacement !== "Halal alternative needed"
    )
    .map((item) => ({
      original: item.ingredient || item.original,
      replacement: item.replacement,
      status: item.status,
    }));

  if (shopableIngredients.length === 0) {
    return null;
  }

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className="ingredient-shop-section">
      <div
        className="ingredient-shop-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
        aria-label="Shop for halal ingredients"
      >
        <div className="ingredient-shop-header-content">
          <ShoppingBag className="ingredient-shop-icon" size={20} />
          <div className="ingredient-shop-header-text">
            <h3 className="ingredient-shop-title">Shop Halal Ingredients</h3>
            <p className="ingredient-shop-subtitle">
              Find halal alternatives for {shopableIngredients.length} ingredient
              {shopableIngredients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="ingredient-shop-chevron" size={20} />
        ) : (
          <ChevronDown className="ingredient-shop-chevron" size={20} />
        )}
      </div>

      {isExpanded && (
        <div className="ingredient-shop-content">
          <div className="ingredient-shop-platform-selector">
            <span className="platform-selector-label">Shop on:</span>
            <div className="platform-buttons">
              {enabledProviders.map((p) => (
                <button
                  key={p.id}
                  className={`platform-button ${selectedPlatform === p.name ? "active" : ""}`}
                  onClick={() => setSelectedPlatform(p.name)}
                  aria-label={`Shop on ${p.display_name}`}
                >
                  {p.display_name}
                </button>
              ))}
            </div>
          </div>

          <ul className="ingredient-shop-list">
            {shopableIngredients.map((item, index) => (
              <li key={index} className="ingredient-shop-item">
                <div className="ingredient-shop-item-info">
                  <span className="ingredient-shop-original">{item.original}</span>
                  <span className="ingredient-shop-arrow">→</span>
                  <span className="ingredient-shop-replacement">{item.replacement}</span>
                </div>
                <AffiliateLink
                  ingredientName={item.replacement}
                  platform={selectedPlatform}
                  variant="button"
                  className="ingredient-shop-link"
                />
              </li>
            ))}
          </ul>

          <p className="ingredient-shop-disclaimer">
            <small>
              We may earn a small commission if you purchase through these links, at no extra cost to you.
              This helps us keep Halal Kitchen free for everyone.
            </small>
          </p>
        </div>
      )}
    </div>
  );
}

export default IngredientShopSection;
