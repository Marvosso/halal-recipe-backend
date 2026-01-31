import React, { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import "./CommunityTips.css";

function CommunityTips({ ingredient, replacement }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Hardcoded community tips for common ingredients
  const communityTips = {
    bacon: "Many users recommend turkey bacon for a smoky flavor that's very similar to pork bacon. It works great in breakfast dishes and salads.",
    "white wine": "For deglazing, many users find that chicken or vegetable stock works perfectly. You can also add a splash of lemon juice for acidity.",
    wine: "Chicken or vegetable stock is a great substitute for wine in cooking. Some users also recommend non-alcoholic wine alternatives.",
    gelatin: "Agar-agar is a popular plant-based alternative that sets similarly to gelatin. Halal-certified gelatin is also widely available.",
    "vanilla extract": "Many users prefer vanilla powder or vanilla bean paste as they're alcohol-free. Look for halal-certified vanilla extract brands."
  };

  const getTip = () => {
    if (!ingredient) return null;
    
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Check exact match first
    if (communityTips[normalizedIngredient]) {
      return communityTips[normalizedIngredient];
    }
    
    // Check partial matches
    for (const key in communityTips) {
      if (normalizedIngredient.includes(key) || key.includes(normalizedIngredient)) {
        return communityTips[key];
      }
    }
    
    return null;
  };

  const tip = getTip();

  if (!tip) {
    return null;
  }

  return (
    <div className="community-tips">
      <button
        className="community-tips-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle community tips"
      >
        <Lightbulb className="tips-icon" />
        <span className="tips-label">Show community tips</span>
        {isExpanded ? (
          <ChevronUp className="tips-chevron" />
        ) : (
          <ChevronDown className="tips-chevron" />
        )}
      </button>
      
      {isExpanded && (
        <div className="community-tips-content fade-in">
          <div className="tips-header">
            <Lightbulb className="tips-header-icon" />
            <strong>Community Tip</strong>
          </div>
          <p className="tips-text">{tip}</p>
        </div>
      )}
    </div>
  );
}

export default CommunityTips;
