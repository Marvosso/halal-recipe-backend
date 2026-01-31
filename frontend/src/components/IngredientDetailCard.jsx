import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatIngredientName } from "../lib/ingredientDisplay";
import AffiliateLinkGroup from "./AffiliateLinkGroup";
import "./IngredientDetailCard.css";

/**
 * IngredientDetailCard Component
 * Displays detailed information about an ingredient with affiliate links
 * Used in Quick Lookup and ingredient detail screens
 * 
 * Rules:
 * - Only shows affiliate links for halal substitutes
 * - Maximum 3 affiliate buttons per ingredient
 * - Helpful, not salesy
 * 
 * @param {Object} props
 * @param {Object} props.ingredient - Ingredient data from lookup/conversion
 * @param {boolean} props.isExpanded - Whether card starts expanded
 * @param {Function} props.onToggle - Callback when card is toggled
 */
function IngredientDetailCard({ 
  ingredient = {}, 
  isExpanded = false,
  onToggle = null 
}) {
  const [expanded, setExpanded] = useState(isExpanded);
  
  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    if (onToggle) {
      onToggle(newExpanded);
    }
  };

  const ingredientName = formatIngredientName(
    ingredient.ingredient_id || 
    ingredient.ingredient || 
    ingredient.name || 
    "Unknown"
  );
  
  const status = ingredient.status || ingredient.hkmResult?.status || "unknown";
  const alternatives = ingredient.alternatives || [];
  const explanation = ingredient.explanation || 
                     ingredient.haram_explanation || 
                     ingredient.eli5 || 
                     "";
  
  // Get affiliate links for substitutes (if available)
  const substituteLinks = ingredient.substitute_affiliate_links || [];
  const substitutesWithLinks = ingredient.substitutes_with_links || [];
  
  // Determine if this is a haram ingredient with halal substitutes
  const hasHalalSubstitutes = (status === "haram" || status === "conditional" || status === "questionable") && 
                              (alternatives.length > 0 || substituteLinks.length > 0 || substitutesWithLinks.length > 0);

  return (
    <div className="ingredient-detail-card">
      <div 
        className="ingredient-detail-card-header"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={expanded}
      >
        <div className="ingredient-detail-card-title">
          <strong>{ingredientName}</strong>
          <span className={`ingredient-status-badge status-${status}`}>
            {status === "halal" && "✅ Halal"}
            {status === "conditional" && "⚠️ Conditional"}
            {status === "questionable" && "⚠️ Questionable"}
            {status === "haram" && "❌ Haram"}
            {status === "unknown" && "❓ Unknown"}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="ingredient-detail-chevron" size={20} />
        ) : (
          <ChevronDown className="ingredient-detail-chevron" size={20} />
        )}
      </div>
      
      {expanded && (
        <div className="ingredient-detail-card-content">
          {/* Explanation - Why ingredient is haram/conditional */}
          {explanation && (
            <div className="ingredient-detail-section">
              <h4 className="ingredient-detail-section-title">Why {status === "haram" ? "it's not halal" : "it may not be halal"}</h4>
              <p className="ingredient-detail-explanation">{explanation}</p>
            </div>
          )}
          
          {/* Halal Substitutes with Affiliate Links */}
          {hasHalalSubstitutes && (
            <div className="ingredient-detail-section">
              <h4 className="ingredient-detail-section-title">Halal Alternatives</h4>
              
              {/* Primary substitute with affiliate links */}
              {substituteLinks.length > 0 && (
                <div className="ingredient-substitute-primary">
                  <p className="ingredient-substitute-label">
                    <strong>Recommended:</strong> {formatIngredientName(
                      ingredient.replacement_id || 
                      ingredient.replacement || 
                      alternatives[0] || 
                      "Alternative"
                    )}
                  </p>
                  <AffiliateLinkGroup
                    affiliateLinks={substituteLinks}
                    ingredientName={formatIngredientName(
                      ingredient.replacement_id || 
                      ingredient.replacement || 
                      alternatives[0] || 
                      ""
                    )}
                    variant="card"
                    showDisclosure={true}
                  />
                </div>
              )}
              
              {/* Additional substitutes (1-3 total) */}
              {substitutesWithLinks.length > 0 && (
                <div className="ingredient-substitutes-list">
                  {substitutesWithLinks.map((substitute, idx) => (
                    <div key={substitute.id || idx} className="ingredient-substitute-item">
                      <p className="ingredient-substitute-label">
                        <strong>Option {idx + 1}:</strong> {substitute.name}
                      </p>
                      {substitute.affiliate_links && substitute.affiliate_links.length > 0 && (
                        <AffiliateLinkGroup
                          affiliateLinks={substitute.affiliate_links}
                          ingredientName={substitute.name}
                          variant="inline"
                          showDisclosure={false}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Fallback: Show alternatives list if no affiliate links */}
              {substituteLinks.length === 0 && 
               substitutesWithLinks.length === 0 && 
               alternatives.length > 0 && (
                <ul className="ingredient-alternatives-list">
                  {alternatives.slice(0, 3).map((alt, idx) => (
                    <li key={idx}>{formatIngredientName(alt)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* References */}
          {(ingredient.quranReference || ingredient.hadithReference) && (
            <div className="ingredient-detail-section">
              <h4 className="ingredient-detail-section-title">Islamic References</h4>
              <div className="ingredient-references">
                {ingredient.quranReference && (
                  <p className="ingredient-reference">
                    <strong>Quran:</strong> {ingredient.quranReference}
                  </p>
                )}
                {ingredient.hadithReference && (
                  <p className="ingredient-reference">
                    <strong>Hadith:</strong> {ingredient.hadithReference}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IngredientDetailCard;
