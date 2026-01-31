import React, { useState } from "react";
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import AffiliateLink from "./AffiliateLink";
import "./IngredientShopSection.css";

/**
 * Subtle "Shop Ingredients" section that appears after recipe conversion
 * Only shows for ingredients that were replaced (haram → halal)
 * 
 * @param {Object} props
 * @param {Array} props.replacements - Array of replaced ingredients with replacement info
 */
function IngredientShopSection({ replacements = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('amazon');

  // Filter to only show ingredients that have replacements
  const shopableIngredients = replacements
    .filter(item => item.replacement && item.replacement !== "Halal alternative needed")
    .map(item => ({
      original: item.ingredient || item.original,
      replacement: item.replacement,
      status: item.status
    }));

  // Don't show if no shopable ingredients
  if (shopableIngredients.length === 0) {
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
          if (e.key === 'Enter' || e.key === ' ') {
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
              Find halal-certified alternatives for {shopableIngredients.length} ingredient{shopableIngredients.length !== 1 ? 's' : ''}
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
          {/* Platform selector */}
          <div className="ingredient-shop-platform-selector">
            <span className="platform-selector-label">Shop on:</span>
            <div className="platform-buttons">
              <button
                className={`platform-button ${selectedPlatform === 'amazon' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('amazon')}
                aria-label="Shop on Amazon"
              >
                Amazon
              </button>
              <button
                className={`platform-button ${selectedPlatform === 'instacart' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('instacart')}
                aria-label="Shop on Instacart"
              >
                Instacart
              </button>
              <button
                className={`platform-button ${selectedPlatform === 'thrivemarket' ? 'active' : ''}`}
                onClick={() => setSelectedPlatform('thrivemarket')}
                aria-label="Shop on Thrive Market"
              >
                Thrive Market
              </button>
            </div>
          </div>

          {/* Ingredient list */}
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
              💚 We may earn a small commission if you purchase through these links, at no extra cost to you. 
              This helps us keep Halal Kitchen free for everyone.
            </small>
          </p>
        </div>
      )}
    </div>
  );
}

export default IngredientShopSection;
