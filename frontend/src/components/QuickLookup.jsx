import React, { useState, useEffect } from "react";
import { Search, X, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { evaluateItem } from "../lib/halalEngine";
import { FEATURES } from "../lib/featureFlags";
import { formatIngredientName } from "../lib/ingredientDisplay";
import "./QuickLookup.css";

function QuickLookup({ onConvertClick }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hardcoded lookup data for common ingredients
  // In production, this would come from the backend
  const ingredientDatabase = {
    bacon: {
      status: "haram",
      explanation: "Bacon is made from pork, which is prohibited in Islam.",
      alternatives: ["Turkey bacon", "Beef bacon", "Halal chicken bacon"],
      quranRef: "Qur'an 2:173",
      hadithRef: "Sahih Muslim 1934"
    },
    pork: {
      status: "haram",
      explanation: "Pork is explicitly prohibited in the Qur'an.",
      alternatives: ["Beef", "Lamb", "Chicken", "Turkey"],
      quranRef: "Qur'an 2:173",
      hadithRef: "Sahih Bukhari 5496"
    },
    wine: {
      status: "haram",
      explanation: "Alcoholic beverages are prohibited in Islam.",
      alternatives: ["Grape juice", "Non-alcoholic wine", "Chicken/vegetable stock"],
      quranRef: "Qur'an 5:90",
      hadithRef: "Sahih Bukhari 5580"
    },
    "white wine": {
      status: "haram",
      explanation: "Alcoholic beverages are prohibited in Islam.",
      alternatives: ["Chicken stock", "Vegetable stock", "Non-alcoholic white wine"],
      quranRef: "Qur'an 5:90"
    },
    gelatin: {
      status: "questionable",
      explanation: "Gelatin may be derived from pork or non-halal sources. Check the source.",
      alternatives: ["Halal gelatin", "Agar-agar", "Pectin"],
      quranRef: "Qur'an 2:173"
    },
    "vanilla extract": {
      status: "questionable",
      explanation: "Some vanilla extracts contain alcohol. Look for alcohol-free versions.",
      alternatives: ["Vanilla powder", "Vanilla bean paste", "Alcohol-free vanilla extract"]
    },
    "beef": {
      status: "halal",
      explanation: "Beef is halal when slaughtered according to Islamic guidelines.",
      alternatives: []
    },
    "chicken": {
      status: "halal",
      explanation: "Chicken is halal when slaughtered according to Islamic guidelines.",
      alternatives: []
    },
    "lamb": {
      status: "halal",
      explanation: "Lamb is halal when slaughtered according to Islamic guidelines.",
      alternatives: []
    }
  };


  // Existing lookup logic (preserved as fallback)
  const existingLookupLogic = (searchInput) => {
    const normalizedTerm = searchInput.toLowerCase().trim();
    const found = ingredientDatabase[normalizedTerm];
    
    if (found) {
      return found;
    } else {
      // Try to find partial matches
      const partialMatch = Object.keys(ingredientDatabase).find(key => 
        normalizedTerm.includes(key) || key.includes(normalizedTerm)
      );
      
      if (partialMatch) {
        return ingredientDatabase[partialMatch];
      } else {
        return {
          status: "unknown",
          explanation: "We couldn't find information about this ingredient. Please check with a qualified Islamic scholar or use our full recipe converter.",
          alternatives: []
        };
      }
    }
  };


  // Internal search function that accepts a term parameter
  const performSearch = async (termToSearch = null) => {
    const searchValue = termToSearch || searchTerm;
    if (!searchValue || !searchValue.trim()) {
      setResult(null);
      return;
    }

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let result;
      
      if (FEATURES.HALAL_KNOWLEDGE_ENGINE) {
        // Use shared evaluateItem() from halalEngine - same function used everywhere
        const normalizedTerm = searchValue.toLowerCase().trim().replace(/\s+/g, "_");
        const hkmResult = evaluateItem(normalizedTerm);
        
        // Use HKM result (including unknown) - evaluateItem is the single source of truth
        // Unknown ingredients are explicitly marked with "Insufficient data — please verify"
        // Map HKM status to UI status
        let uiStatus;
        switch (hkmResult.status) {
          case "halal":
            uiStatus = "halal";
            break;
          case "haram":
            uiStatus = "haram";
            break;
          case "conditional":
            uiStatus = "questionable";
            break;
          default:
            uiStatus = "unknown";
        }
        
        // Build inheritance chain display
        let inheritanceChain = [];
        if (hkmResult.inheritedFrom) {
          // Build chain from trace
          if (hkmResult.trace && hkmResult.trace.length > 1) {
            inheritanceChain = hkmResult.trace.map(t => {
              // Extract ingredient name from trace (e.g., "gelatin is conditional" -> "gelatin")
              const match = t.match(/^(\w+)/);
              return match ? match[1] : t;
            });
          } else {
            inheritanceChain = [normalizedTerm, hkmResult.inheritedFrom];
          }
        }
        
        // Extract references from JSON engine
        const references = hkmResult.references || [];
        const quranRefs = references.filter(r => r.toLowerCase().includes("qur'an") || r.toLowerCase().includes("quran"));
        const hadithRefs = references.filter(r => r.toLowerCase().includes("hadith") || r.toLowerCase().includes("bukhari") || r.toLowerCase().includes("muslim"));
        
        // Use inheritanceChain from result if available, otherwise build from trace
        if (hkmResult.inheritanceChain && hkmResult.inheritanceChain.length > 0) {
          inheritanceChain = hkmResult.inheritanceChain;
        }
        
        // Convert HKM result to QuickLookup format using shared evaluation result
        // All fields come from evaluateItem (single source of truth)
        // Ensure confidenceScore is ALWAYS present (0-100), never undefined
        const confidenceScore = hkmResult.confidenceScore !== undefined
          ? hkmResult.confidenceScore
          : (hkmResult.confidencePercentage !== undefined
              ? hkmResult.confidencePercentage
              : (hkmResult.confidence !== undefined
                  ? Math.round(hkmResult.confidence * 100)
                  : 50)); // Default to 50 if truly missing, not 0
        
        // Use explanation from evaluateItem (single source of truth)
        const explanation = hkmResult.explanation || hkmResult.notes || 
                           (hkmResult.status === "unknown" ? "Insufficient data — please verify" : "Status determined by Halal Knowledge Model.");
        const simpleExplanation = hkmResult.simpleExplanation || hkmResult.eli5 || 
                                  "In simple terms: this ingredient is not halal and needs a replacement.";
        
        // Temporary console.log at boundary (as requested)
        console.log("[CONFIDENCE DEBUG] QuickLookup result:", {
          ingredient: normalizedTerm,
          confidenceScore: confidenceScore,
          hasConfidenceScore: hkmResult.confidenceScore !== undefined,
          status: hkmResult.status
        });
        
        result = {
          status: uiStatus,
          explanation: explanation, // Full explanation from evaluateItem
          simpleExplanation: simpleExplanation, // ELI5 format from evaluateItem
          alternatives: hkmResult.alternatives || [],
          confidence: confidenceScore / 100, // Keep 0-1 for backward compatibility
          confidenceScore: confidenceScore, // PRIMARY: 0-100 format
          confidencePercentage: confidenceScore, // Alias
          trace: hkmResult.trace || [],
          eli5: simpleExplanation, // ELI5 format (alias for simpleExplanation)
          notes: hkmResult.notes || "", // From evaluateItem
          inheritedFrom: hkmResult.inheritedFrom || null,
          inheritanceChain: inheritanceChain.length > 0 ? inheritanceChain : (hkmResult.inheritanceChain || null),
          tags: hkmResult.tags || [],
          references: references, // From evaluateItem
          quranRef: quranRefs.length > 0 ? quranRefs[0] : undefined,
          hadithRef: hadithRefs.length > 0 ? hadithRefs.join("; ") : undefined,
          displayName: hkmResult.displayName, // Normalized display name from evaluateItem
          hkmResult: hkmResult // Keep original for reference
        };
      } else {
        // Use existing lookup logic when feature flag is off
        result = existingLookupLogic(searchValue);
      }
      
      setResult(result);
      setIsLoading(false);
    }, 300);
  };

  // Public handleSearch function that uses current searchTerm state
  const handleSearch = async () => {
    await performSearch();
  };

  // Listen for pre-fill events from SEO pages (after performSearch is defined)
  useEffect(() => {
    const handlePrefillSearch = (e) => {
      const ingredient = e.detail?.ingredient;
      if (ingredient) {
        setSearchTerm(ingredient);
        // Auto-trigger search after a short delay to ensure state is set
        setTimeout(() => {
          performSearch(ingredient);
        }, 100);
      }
    };

    window.addEventListener("prefillQuickLookup", handlePrefillSearch);
    return () => {
      window.removeEventListener("prefillQuickLookup", handlePrefillSearch);
    };
  }, []); // Empty deps - performSearch is stable

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setResult(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "halal":
        return <CheckCircle className="status-icon halal-icon" />;
      case "haram":
        return <XCircle className="status-icon haram-icon" />;
      case "questionable":
        return <AlertCircle className="status-icon questionable-icon" />;
      default:
        return <AlertCircle className="status-icon unknown-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "halal":
        return "Halal";
      case "haram":
        return "Haram";
      case "questionable":
        return "Questionable";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="quick-lookup">
      <div className="quick-lookup-header">
        <h3>Is It Halal?</h3>
        <p className="quick-lookup-subtitle">Quick ingredient lookup</p>
      </div>
      
      <div className="quick-lookup-search">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Type an ingredient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
            aria-label="Search ingredient"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="clear-button"
              aria-label="Clear search"
            >
              <X className="clear-icon" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="search-button"
          disabled={isLoading || !searchTerm.trim()}
          aria-label="Search"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {result && (
        <div className="quick-lookup-result fade-in">
          <div className={`result-header ${result.status}`}>
            {getStatusIcon(result.status)}
            <div className="result-status">
              <span className="status-label">{getStatusText(result.status)}</span>
              {result.quranRef && (
                <span className="result-reference">{result.quranRef}</span>
              )}
            </div>
          </div>
          
          <div className="result-content">
            {/* Always show simple explanation (ELI5 style) for Quick Lookup */}
            {(result.simpleExplanation || result.eli5) ? (
              <div className="eli5-section">
                <p className="eli5-text">
                  <strong>In simple terms:</strong> {result.simpleExplanation || result.eli5}
                </p>
              </div>
            ) : (
              // Fallback if simpleExplanation is missing
              <div className="eli5-section">
                <p className="eli5-text">
                  <strong>In simple terms:</strong> this ingredient is not halal and needs a replacement.
                </p>
              </div>
            )}
            
            {/* Inheritance Chain */}
            {result.inheritanceChain && result.inheritanceChain.length > 1 && (
              <div className="inheritance-chain-section">
                <strong className="inheritance-chain-label">Inheritance Chain:</strong>
                <div className="inheritance-chain">
                  {result.inheritanceChain.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <span className="chain-item">{item.replace(/_/g, " ")}</span>
                      {idx < result.inheritanceChain.length - 1 && (
                        <span className="chain-arrow">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {result.inheritedFrom && (
                  <p className="inheritance-source">
                    <strong>Source:</strong> {result.inheritedFrom.replace(/_/g, " ")} (explicitly prohibited)
                  </p>
                )}
              </div>
            )}
            
            {result.inheritedFrom && !result.inheritanceChain && (
              <div className="inheritance-source-section">
                <p className="inheritance-source">
                  <strong>Inherited From:</strong> {result.inheritedFrom.replace(/_/g, " ")}
                </p>
              </div>
            )}
            
            {result.confidence !== undefined && (
              <div className="confidence-section">
                <p className="confidence-score">
                  <strong>Confidence:</strong> {result.confidencePercentage !== undefined ? result.confidencePercentage : Math.round(result.confidence * 100)}%
                </p>
                {result.confidence_type === "classification" && (
                  <p className="confidence-type-note">
                    (classification only, no substitutions applied)
                  </p>
                )}
                {result.inheritanceChain && result.inheritanceChain.length > 0 && (
                  <p className="confidence-breakdown">
                    <small>Confidence reduced due to: {result.inheritanceChain.map(id => formatIngredientName(id)).join(", ")}</small>
                  </p>
                )}
              </div>
            )}
            
            {result.trace && result.trace.length > 0 && (
              <details className="trace-details">
                <summary className="trace-summary">Show Full Breakdown</summary>
                <ul className="trace-list">
                  {result.trace.map((step, idx) => (
                    <li key={idx} className="trace-item">{step}</li>
                  ))}
                </ul>
              </details>
            )}
            
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="result-alternatives">
                <strong>Halal Alternatives:</strong>
                <ul>
                  {result.alternatives.map((alt, idx) => (
                    <li key={idx}>{formatIngredientName(alt)}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.hadithRef && (
              <div className="result-hadith">
                <strong>Hadith Reference:</strong> {result.hadithRef}
              </div>
            )}
            
            {onConvertClick && (
              <button
                onClick={() => {
                  if (onConvertClick) {
                    onConvertClick(searchTerm);
                  }
                }}
                className="convert-full-recipe-btn"
              >
                Convert Full Recipe
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickLookup;
