import React, { useState, useEffect, useRef } from "react";
import { Search, X, CheckCircle, AlertCircle, XCircle, Leaf, Package, Drumstick, AlertTriangle, HelpCircle } from "lucide-react";
import { evaluateItem } from "../lib/halalEngine";
import { FEATURES } from "../lib/featureFlags";
import { formatIngredientName } from "../lib/ingredientDisplay";
import { getConfidenceLevelInfo, getIngredientTypeInfo } from "../lib/ingredientClassification";
import { getStatusExplanation, getReassuringMessage, getConfidenceDescription, getIngredientTypeDescription, getStatusSummary } from "../lib/quickLookupCopy";
import { performBrandLookup, isBrandSearch } from "../lib/brandLookup";
import { formatBrandLookupResponse } from "../lib/brandLookupResponseFormatter";
import { detectAdditives } from "../lib/additiveDetection";
import { formatAdditiveBreakdown } from "../lib/additiveBreakdownFormatter";
import { getFilteredSuggestions } from "../lib/ingredientSuggestions";
import { getRecentLookups, addRecentLookup } from "../lib/recentLookupsStorage";
import IngredientSources from "./IngredientSources";
import ContextualAd from "./ContextualAd";
import "./QuickLookup.css";

function QuickLookup({ onConvertClick, initialSearch = "", autoSearchOnMount = false }) {
  const [searchTerm, setSearchTerm] = useState(initialSearch || "");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentLookups, setRecentLookups] = useState(() => getRecentLookups());
  const suggestionsRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  const suggestions = getFilteredSuggestions(searchTerm, { limit: 20 });
  const showSuggestions = suggestionsOpen && suggestions.length > 0;

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
      
      // Check if this is a brand search and user is premium
      const isBrand = isBrandSearch(searchValue);
      const isPremium = isPremiumUser();
      
      if (isBrand && isPremium) {
        // Premium brand-level lookup
        const brandResult = performBrandLookup(searchValue);
        const formattedBrandResult = formatBrandLookupResponse(brandResult);
        
        // Convert to QuickLookup format
        if (formattedBrandResult.is_brand_lookup) {
          result = {
            status: formattedBrandResult.halal_status === "halal" ? "halal" :
                   formattedBrandResult.halal_status === "haram" ? "haram" :
                   formattedBrandResult.halal_status === "conditional" ? "questionable" : "unknown",
            explanation: formattedBrandResult.short_explanation,
            simpleExplanation: formattedBrandResult.short_explanation,
            alternatives: [],
            confidence: formattedBrandResult.confidence_score / 100,
            confidenceScore: formattedBrandResult.confidence_score,
            confidencePercentage: formattedBrandResult.confidence_score,
            confidenceLevel: formattedBrandResult.confidence_level,
            ingredientType: "processed",
            isBrandLookup: true,
            brandName: formattedBrandResult.brand_name,
            productName: formattedBrandResult.product_name,
            halalCertified: formattedBrandResult.halal_certified,
            certifyingBody: formattedBrandResult.certifying_body,
            certificationNumber: formattedBrandResult.certification_number,
            lastVerifiedDate: formattedBrandResult.last_verified_date,
            verificationSource: formattedBrandResult.verification_source,
            warnings: formattedBrandResult.warnings || [],
            displayName: formattedBrandResult.display_name
          };
        } else if (formattedBrandResult.brand_not_found) {
          // Brand not found, use generic fallback
          const genericResult = formattedBrandResult;
          const normalizedTerm = searchValue.toLowerCase().trim().replace(/\s+/g, "_");
          const hkmResult = evaluateItem(normalizedTerm);
          
          // Convert generic result to QuickLookup format (existing logic)
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
          
          const confidenceScore = hkmResult.confidenceScore !== undefined
            ? hkmResult.confidenceScore
            : (hkmResult.confidencePercentage !== undefined
                ? hkmResult.confidencePercentage
                : (hkmResult.confidence !== undefined
                    ? Math.round(hkmResult.confidence * 100)
                    : 50));
          
          const explanation = hkmResult.explanation || hkmResult.notes || 
                             (hkmResult.status === "unknown" ? "Insufficient data — please verify" : "Status determined by Halal Knowledge Model.");
          const simpleExplanation = hkmResult.simpleExplanation || hkmResult.eli5 || 
                                  "In simple terms: this ingredient is not halal and needs a replacement.";
          
          result = {
            status: uiStatus,
            explanation: explanation,
            simpleExplanation: simpleExplanation,
            alternatives: hkmResult.alternatives || [],
            confidence: confidenceScore / 100,
            confidenceScore: confidenceScore,
            confidencePercentage: confidenceScore,
            confidenceLevel: hkmResult.confidenceLevel || "conditional",
            ingredientType: hkmResult.ingredientType || "processed",
            isBrandLookup: false,
            brandNotFound: true,
            brandNotFoundMessage: genericResult.message,
            displayName: hkmResult.displayName
          };
        } else {
          // Premium required - but still show generic lookup, don't block
          // Fall through to generic lookup below
          result = null; // Will trigger generic lookup
        }
      }
      
      // If brand search but not premium, show generic lookup with upgrade prompt
      if (isBrand && !isPremium && !result) {
        // Perform generic lookup (never block basic lookup)
        const normalizedTerm = searchValue.toLowerCase().trim().replace(/\s+/g, "_");
        const hkmResult = evaluateItem(normalizedTerm);
        
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
        
        const confidenceScore = hkmResult.confidenceScore !== undefined
          ? hkmResult.confidenceScore
          : (hkmResult.confidencePercentage !== undefined
              ? hkmResult.confidencePercentage
              : (hkmResult.confidence !== undefined
                  ? Math.round(hkmResult.confidence * 100)
                  : 50));
        
        const explanation = hkmResult.explanation || hkmResult.notes || 
                           (hkmResult.status === "unknown" ? "Insufficient data — please verify" : "Status determined by Halal Knowledge Model.");
        const simpleExplanation = hkmResult.simpleExplanation || hkmResult.eli5 || 
                                "In simple terms: this ingredient is not halal and needs a replacement.";
        
        result = {
          status: uiStatus,
          explanation: explanation,
          simpleExplanation: simpleExplanation,
          alternatives: hkmResult.alternatives || [],
          confidence: confidenceScore / 100,
          confidenceScore: confidenceScore,
          confidencePercentage: confidenceScore,
          confidenceLevel: hkmResult.confidenceLevel || "conditional",
          ingredientType: hkmResult.ingredientType || "processed",
          displayName: hkmResult.displayName,
          brandSearchAttempted: true
        };
      }
      
      // Check for additive breakdown (premium feature)
      // Only if we have ingredient list text (future: from ingredient details)
      if (result && !isPremium && result.hkmResult) {
        // For now, we'll add this as a button/option in the UI
        // The actual detection would happen when user clicks "Show Additive Breakdown"
      }
      
      if (!result && FEATURES.HALAL_KNOWLEDGE_ENGINE) {
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
          confidenceLevel: hkmResult.confidenceLevel || "conditional", // NEW: certain_halal, conditional, haram, rare_unknown
          ingredientType: hkmResult.ingredientType || "processed", // NEW: natural, processed, animal, alcohol-derived
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
          isDefaultHalal: hkmResult.isDefaultHalal || false, // Flag for default halal natural ingredients
          hkmResult: hkmResult // Keep original for reference
        };
      } else {
        // Use existing lookup logic when feature flag is off
        result = existingLookupLogic(searchValue);
      }
      
      setResult(result);
      setIsLoading(false);
      const trimmed = (searchValue || "").trim();
      if (trimmed) {
        addRecentLookup(trimmed);
        setRecentLookups(getRecentLookups());
      }
    }, 300);
  };

  // Public handleSearch function that uses current searchTerm state
  const handleSearch = async () => {
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
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

  // Embedded on SEO pages: run lookup for initial ingredient on mount
  useEffect(() => {
    if (autoSearchOnMount && initialSearch && initialSearch.trim()) {
      performSearch(initialSearch.trim());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount when embedded

  const handleSearchInputKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === "Enter") handleSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === "Enter" && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightedIndex]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setSuggestionsOpen(false);
      setHighlightedIndex(-1);
      return;
    }
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const selectSuggestion = (ingredient) => {
    setSearchTerm(ingredient);
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
    performSearch(ingredient);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target?.value ?? "";
    setSearchTerm(value);
    setSuggestionsOpen(true);
    setHighlightedIndex(-1);
    if (result && !value.trim()) setResult(null);
  };

  const handleSearchInputFocus = () => {
    setSuggestionsOpen(true);
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const handleSearchInputBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setSuggestionsOpen(false);
      setHighlightedIndex(-1);
      blurTimeoutRef.current = null;
    }, 180);
  };

  useEffect(() => {
    if (highlightedIndex >= suggestions.length) {
      setHighlightedIndex(Math.max(0, suggestions.length - 1));
    }
  }, [suggestions.length, highlightedIndex]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const clearSearch = () => {
    setSearchTerm("");
    setResult(null);
    setSuggestionsOpen(true);
    setHighlightedIndex(-1);
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

  const getTypeIcon = (type) => {
    switch (type) {
      case "natural":
        return <Leaf size={16} />;
      case "processed":
        return <Package size={16} />;
      case "animal":
        return <Drumstick size={16} />;
      case "alcohol-derived":
        return <AlertTriangle size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getConfidenceIcon = (confidenceLevel) => {
    switch (confidenceLevel) {
      case "certain_halal":
        return <CheckCircle size={16} />;
      case "conditional":
        return <AlertCircle size={16} />;
      case "haram":
        return <XCircle size={16} />;
      case "rare_unknown":
        return <HelpCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
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
            onChange={handleSearchInputChange}
            onFocus={handleSearchInputFocus}
            onBlur={handleSearchInputBlur}
            onKeyDown={handleSearchInputKeyDown}
            className={`search-input ${showSuggestions ? "suggestions-open" : ""}`}
            aria-label="Search ingredient"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="ingredient-suggestions-list"
            aria-activedescendant={highlightedIndex >= 0 && suggestions[highlightedIndex] ? `suggestion-${highlightedIndex}` : undefined}
            id="quick-lookup-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="clear-button"
              aria-label="Clear search"
            >
              <X className="clear-icon" />
            </button>
          )}
          {showSuggestions && (
            <ul
              id="ingredient-suggestions-list"
              className="quick-lookup-suggestions"
              role="listbox"
              ref={suggestionsRef}
            >
              {!searchTerm.trim() && (
                <li className="suggestions-heading" role="presentation">
                  Popular lookups
                </li>
              )}
              {suggestions.map((item, index) => (
                <li
                  key={item}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`suggestion-item ${index === highlightedIndex ? "highlighted" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(item);
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
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

      {recentLookups.length > 0 && (
        <div className="recent-lookups">
          <span className="recent-lookups-label">Recent lookups:</span>
          <div className="recent-lookups-list">
            {recentLookups.map((term, idx) => (
              <button
                key={`${term}-${idx}`}
                type="button"
                className="recent-lookup-chip"
                onClick={() => selectSuggestion(term)}
                aria-label={`Look up ${term} again`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="quick-lookup-result fade-in">
          {/* Main Status Header */}
          <div className={`result-header ${result.status}`}>
            {getStatusIcon(result.status)}
            <div className="result-status-main">
              <div className="status-row">
                <span className="status-label">{getStatusText(result.status)}</span>
                {result.confidenceLevel && (
                  <span className="status-summary">
                    {getStatusSummary(result.status, result.confidenceLevel)}
                  </span>
                )}
              </div>
              {result.quranRef && (
                <span className="result-reference">{result.quranRef}</span>
              )}
            </div>
          </div>
          
          {/* Detailed Explanation Section */}
          <div className="explanation-section">
            <h4 className="explanation-title">What this means</h4>
            <p className="explanation-text">
              {getStatusExplanation(
                result.status,
                result.confidenceLevel,
                result.explanation || result.simpleExplanation || result.eli5,
                result.ingredientType
              )}
            </p>
            {getReassuringMessage(result.status, result.confidenceLevel) && (
              <p className="reassuring-message">
                {getReassuringMessage(result.status, result.confidenceLevel)}
              </p>
            )}
            <IngredientSources status={result.status || "unknown"} ingredientId={result.ingredient} />
          </div>
          
          {/* Ingredient Type and Confidence Level */}
          {(result.ingredientType || result.confidenceLevel) && (
            <div className="classification-section">
              {result.ingredientType && (
                <div className="info-card type-card">
                  <div className="info-card-header">
                    {getTypeIcon(result.ingredientType)}
                    <span className="info-card-title">
                      {getIngredientTypeInfo(result.ingredientType).label}
                    </span>
                  </div>
                  <p className="info-card-description">
                    {getIngredientTypeDescription(result.ingredientType)}
                  </p>
                </div>
              )}
              {result.confidenceLevel && (
                <div className="info-card confidence-card">
                  <div className="info-card-header">
                    {getConfidenceIcon(result.confidenceLevel)}
                    <span className="info-card-title">
                      Confidence: {getConfidenceDescription(result.confidenceLevel, result.confidenceScore).score}
                    </span>
                  </div>
                  <p className="info-card-description">
                    {getConfidenceDescription(result.confidenceLevel, result.confidenceScore).text}
                  </p>
                  {result.confidenceScore !== undefined && (
                    <div className="confidence-bar-wrapper">
                      <div 
                        className="confidence-bar"
                        style={{ 
                          width: `${result.confidenceScore}%`,
                          backgroundColor: getConfidenceLevelInfo(result.confidenceLevel).color
                        }}
                      />
                      <span className="confidence-score-text">{result.confidenceScore}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="result-content">
            
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
            
            {/* Additive Breakdown Button */}
            {result && result.hkmResult && (
              <div className="additive-breakdown-section">
                <button
                  className="additive-breakdown-button premium"
                  onClick={() => {
                    const ingredientText = result.hkmResult?.notes || result.explanation || result.hkmResult?.simpleExplanation || "";
                    if (ingredientText) {
                      const additives = detectAdditives(ingredientText);
                      const breakdown = formatAdditiveBreakdown(additives, result.displayName);
                      setResult({ ...result, additiveBreakdown: breakdown });
                    }
                  }}
                >
                  📊 Show Additive Breakdown
                </button>
              </div>
            )}
            
            {/* Additive Breakdown Display (Premium) */}
            {result && result.additiveBreakdown && result.additiveBreakdown.has_additives && (
              <div className="additive-breakdown-display">
                <h4 className="additive-breakdown-title">Additive Breakdown</h4>
                <p className="additive-breakdown-summary">{result.additiveBreakdown.summary_explanation}</p>
                {result.additiveBreakdown.warnings && result.additiveBreakdown.warnings.length > 0 && (
                  <div className="additive-warnings">
                    {result.additiveBreakdown.warnings.map((warning, idx) => (
                      <div key={idx} className={`additive-warning warning-${warning.severity}`}>
                        <strong>{warning.type.replace(/_/g, ' ')}:</strong> {warning.message}
                      </div>
                    ))}
                  </div>
                )}
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

      {result && (
        <ContextualAd placement="ingredient_lookup" className="quick-lookup-ad" />
      )}
    </div>
  );
}

export default QuickLookup;
