import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./App.css";
import { getAxiosInstance } from "./api/axiosConfig";
import halalArabicImage from "./assets/halal-arabic.png";
import halalInputIcon from "./assets/halal-input.png";
import halalOutputIcon from "./assets/halal-output.png";
import halalSavedIcon from "./assets/halal-saved.png";
import { RefreshCw, ClipboardCopy, Download, Bookmark, Star, ThumbsUp, ThumbsDown, Play, Share2, Camera, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import HaramIngredient from "./components/HaramIngredient";
import QuickLookup from "./components/QuickLookup";
import IngredientTreeDisplay from "./components/IngredientTreeDisplay";
import IngredientSources from "./components/IngredientSources";
import HalalStandardPanel from "./components/HalalStandardPanel";
import CommunityTips from "./components/CommunityTips";
import TabNavigation from "./components/TabNavigation";
import IngredientShopSection from "./components/IngredientShopSection";
import AffiliateLink from "./components/AffiliateLink";
import AffiliateLinkGroup from "./components/AffiliateLinkGroup";
import SubstitutePurchaseCard from "./components/SubstitutePurchaseCard";
import ContextualAd from "./components/ContextualAd";
import { MAX_LINKS_PER_INGREDIENT } from "./config/affiliateProviderConfig";
import SocialFeed from "./components/SocialFeed";
import UserProfile from "./components/UserProfile";
import CreatePostModal from "./components/CreatePostModal";
import ShareHalalModal from "./components/ShareHalalModal";
import IngredientScanModal from "./components/IngredientScanModal";
import AuthModal from "./components/AuthModal";
import { t } from "./lib/i18n";
import { useAnalytics } from "./hooks/useAnalytics";
import logger from "./utils/logger";
import { evaluateItem } from "./lib/halalEngine";
import { FEATURES } from "./lib/featureFlags";
import { convertRecipeWithJson } from "./lib/convertRecipeJson";
import { convertBatchRecipes } from "./lib/batchConversion";
import { formatIngredientName } from "./lib/ingredientDisplay";
import { isPremiumUser, canConvert, getRemainingConversionsThisMonth, getConversionsThisMonth, trackConversion } from "./lib/subscription";
import { checkConversionLimit, canUseAdvancedSubstitutions, canUseStrictHalalMode, canExportShoppingList } from "./lib/featureGating";
import { trackConversionLimitHit, trackConversionLimitApproach } from "./lib/premiumAnalytics";
import { isAuthenticated, getUserData, getCurrentUser, clearAuth } from "./api/authApi";
import { createRecipe, getMyRecipes, deleteRecipe as deleteRecipeApi } from "./api/recipesApi";
import SaveHalalVersionButton from "./components/SaveHalalVersionButton";

function App() {
  const analytics = useAnalytics();
  const location = useLocation();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState("");
  const [converted, setConverted] = useState("");
  const [issues, setIssues] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState("");
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [openIngredientCards, setOpenIngredientCards] = useState(new Set());
  const [openReferences, setOpenReferences] = useState(new Set());
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [publicRecipes, setPublicRecipes] = useState([]);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [halalSettings, setHalalSettings] = useState({
    strictnessLevel: "standard",
    schoolOfThought: "no-preference"
  });
  const [activeTab, setActiveTab] = useState("convert");
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showShareHalalModal, setShowShareHalalModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [user, setUser] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [showCachedResult, setShowCachedResult] = useState(false);
  const [mealPlanInput, setMealPlanInput] = useState("");
  const [batchResult, setBatchResult] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSectionOpen, setBatchSectionOpen] = useState(false);

  // Listen for auth modal trigger and other events
  useEffect(() => {
    const handleShowAuthModal = (e) => {
      const mode = e.detail?.mode || "login";
      setAuthMode(mode);
      setShowAuthModal(true);
    };
    
    // Listen for recipe loading from saved recipes
    const handleLoadRecipe = (e) => {
      const { recipe, converted, issues } = e.detail || {};
      if (recipe) {
        setRecipe(recipe);
        setConverted(converted || "");
        setIssues(issues || []);
      }
    };
    
    // Listen for tab switching
    const handleSwitchTab = (e) => {
      const tab = e.detail?.tab;
      if (tab) {
        setActiveTab(tab);
      }
    };
    
    window.addEventListener("showAuthModal", handleShowAuthModal);
    window.addEventListener("loadRecipe", handleLoadRecipe);
    window.addEventListener("switchTab", handleSwitchTab);
    return () => {
      window.removeEventListener("showAuthModal", handleShowAuthModal);
      window.removeEventListener("loadRecipe", handleLoadRecipe);
      window.removeEventListener("switchTab", handleSwitchTab);
    };
  }, []);

  // Load user data and saved recipes on mount
  useEffect(() => {
    // Check authentication and load user
    if (isAuthenticated()) {
      getCurrentUser().then((userData) => {
        if (userData) {
          setUser(userData);
        }
      }).catch((err) => {
        logger.error("Error loading user:", err);
        clearAuth();
      });
      // Load saved recipes from account when authenticated
      getMyRecipes().then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map((r) => ({
            id: r.id,
            title: r.title || "Untitled Recipe",
            original: r.originalRecipe ?? r.original_recipe ?? r.original ?? "",
            converted: r.convertedRecipe ?? r.converted_recipe ?? r.converted ?? "",
            savedAt: r.createdAt ?? r.created_at ?? r.savedAt,
            isPublic: r.isPublic ?? r.is_public ?? false,
          }));
          setSavedRecipes(normalized);
          if (typeof Storage !== "undefined") {
            localStorage.setItem("halalRecipes", JSON.stringify(normalized));
          }
        }
      }).catch(() => { /* fall back to localStorage below */ });
    } else {
      // Try loading from localStorage
      const userData = getUserData();
      if (userData) {
        setUser(userData);
      }
    }

    try {
      if (typeof Storage !== "undefined") {
        const saved = localStorage.getItem("halalRecipes");
        const publicRecipesData = localStorage.getItem("halalPublicRecipes");
        const strictness = localStorage.getItem("halalStrictnessLevel");
        const school = localStorage.getItem("halalSchoolOfThought");
        
        if (saved && !isAuthenticated()) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSavedRecipes(parsed);
          }
        }
        
        if (publicRecipesData) {
          const parsed = JSON.parse(publicRecipesData);
          if (Array.isArray(parsed)) {
            setPublicRecipes(parsed);
          }
        }

        if (strictness) {
          setHalalSettings(prev => ({ ...prev, strictnessLevel: strictness }));
        }

        if (school) {
          setHalalSettings(prev => ({ ...prev, schoolOfThought: school }));
        }
      }
    } catch (err) {
      logger.error("Error loading saved recipes:", err);
    }
    
    // Track initial page view
    analytics.trackPageView(activeTab);
  }, []);

  // When navigating from "My Halal Recipes" with a recipe to load, open it in the converter
  useEffect(() => {
    const toLoad = location.state?.loadRecipe;
    if (!toLoad || (!toLoad.original && !toLoad.converted)) return;
    loadSavedRecipe(toLoad);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  // Handle mobile tap to show/hide tooltips
  useEffect(() => {
    if (converted) {
      const recipePre = document.querySelector(".recipe-card pre");
      if (recipePre) {
        const handleTouchStart = (e) => {
          const target = e.target;
          if (target.classList.contains("haram-tooltip")) {
            // Toggle tooltip on mobile tap
            target.classList.toggle("tooltip-active");
            // Close other tooltips
            document.querySelectorAll(".haram-tooltip.tooltip-active").forEach((el) => {
              if (el !== target) {
                el.classList.remove("tooltip-active");
              }
            });
          }
        };

        const handleClickOutside = (e) => {
          if (!e.target.closest(".haram-tooltip")) {
            document.querySelectorAll(".haram-tooltip.tooltip-active").forEach((el) => {
              el.classList.remove("tooltip-active");
            });
          }
        };

        recipePre.addEventListener("touchstart", handleTouchStart, { passive: true });
        document.addEventListener("click", handleClickOutside);

        return () => {
          recipePre.removeEventListener("touchstart", handleTouchStart);
          document.removeEventListener("click", handleClickOutside);
        };
      }
    }
  }, [converted]);

  const handleConvert = async (recipeText = null, isAutoConvert = false) => {
    // Determine which recipe text to use
    // If recipeText is provided (from saved recipe), use it
    // Otherwise, use the current recipe state
    const recipeToConvert = recipeText !== null && recipeText !== undefined 
      ? recipeText 
      : recipe;
    
    // Defensive validation - only alert if truly empty and manual conversion
    if (recipeToConvert === null || recipeToConvert === undefined) {
      if (!isAutoConvert) {
        alert("Please enter a recipe to convert.");
      }
      return;
    }

    // Convert to string if not already
    const recipeString = typeof recipeToConvert === "string" 
      ? recipeToConvert 
      : String(recipeToConvert || "");

    // Trim and check if empty
    const trimmedRecipe = recipeString.trim();
    
    if (trimmedRecipe === "") {
      if (!isAutoConvert) {
        alert("Please enter a recipe to convert.");
      }
      return;
    }

    // Clear any previous errors
    setError("");
    setIsOffline(false);
    setShowCachedResult(false);
    
    try {
      let convertedText = "";
      let convertedIssues = [];
      let convertedConfidence = 0;
      let jsonConversionUsed = false;
      
      // Use JSON engine as primary conversion source if enabled
      if (FEATURES.USE_JSON_CONVERSION_PRIMARY && FEATURES.HALAL_KNOWLEDGE_ENGINE) {
        try {
          const jsonResult = await convertRecipeWithJson(trimmedRecipe, halalSettings);
          convertedText = jsonResult.convertedText || "";
          convertedIssues = Array.isArray(jsonResult.issues) ? jsonResult.issues : [];
          // Ensure confidenceScore is never 0 unless truly 0
          convertedConfidence = typeof jsonResult.confidenceScore === "number" && !isNaN(jsonResult.confidenceScore)
            ? jsonResult.confidenceScore
            : (typeof jsonResult.confidence === "number" && !isNaN(jsonResult.confidence)
                ? Math.round(jsonResult.confidence * 100)
                : null); // null indicates missing, not 0
          
          // Temporary console.log at boundary (as requested)
          console.log("[CONFIDENCE DEBUG] Recipe conversion result:", {
            confidenceScore: convertedConfidence,
            hasIssues: convertedIssues.length > 0,
            issuesWithConfidence: convertedIssues.map(i => ({
              ingredient: i.ingredient_id || i.ingredient,
              confidenceScore: i.confidenceScore || i.engineResult?.confidenceScore
            }))
          });
          
          jsonConversionUsed = true;
        } catch (jsonError) {
          console.warn("JSON conversion failed, falling back to backend API:", jsonError);
          // Fall through to backend API
        }
      }
      
      // Fallback to backend API if JSON conversion not used or failed
      if (!jsonConversionUsed) {
        const api = await getAxiosInstance();
        const res = await api.post("/convert", { recipe: trimmedRecipe });
        
        // Check if the response contains an error
        if (res.data?.error) {
          setError(res.data.error);
          setConverted("");
          setIssues([]);
          setConfidence(0);
          setIsAccordionOpen(false);
          setOpenIngredientCards(new Set());
          return;
        }
        
        // Update state with response data
        convertedText = res.data?.convertedText || "";
        convertedIssues = Array.isArray(res.data?.issues) ? res.data.issues : [];
        convertedConfidence = typeof res.data?.confidenceScore === "number" ? res.data.confidenceScore : 0;
      }
      
      // Enhance backend results with JSON engine data (if not already using JSON conversion)
      // JSON conversion already includes all engine data, so skip enhancement
      if (!jsonConversionUsed && FEATURES.HALAL_KNOWLEDGE_ENGINE && convertedIssues.length > 0) {
        // Enhance with Halal Knowledge Model (if enabled)
        let inheritanceFlags = 0;
        let preferenceEnforcedFlags = 0;
        let maxConfidenceReduction = 1;
        
        // Process each ingredient through HKM
        convertedIssues = convertedIssues.map((issue) => {
          const existingResult = issue; // Preserve all CSV data
          
          if (FEATURES.HALAL_KNOWLEDGE_ENGINE && issue?.ingredient) {
            const normalizedIngredient = issue.ingredient.toLowerCase().trim().replace(/\s+/g, "_");
            const engineResult = evaluateItem(normalizedIngredient, {
              madhab: halalSettings?.schoolOfThought || "no-preference",
              strictness: halalSettings?.strictnessLevel || "standard"
            });
            
            // Track if preferences were enforced
            if (engineResult.enforcedBy === "user_preferences") {
              preferenceEnforcedFlags++;
            }
            
            // Safe Mode: Only downgrade, never upgrade
            if (FEATURES.HALAL_ENGINE_SAFE_MODE && engineResult.status === "haram") {
              inheritanceFlags++;
              // Track minimum confidence from inheritance
              maxConfidenceReduction = Math.min(maxConfidenceReduction, engineResult.confidence);
              
              // Determine validation state
              let validationState = "derived_haram";
              if (existingResult.ingredient && issue.ingredient) {
                // Check if it was in CSV (explicit)
                validationState = "explicit_haram";
              } else if (engineResult.enforcedBy === "user_preferences") {
                validationState = "preference_based";
              }
              
              return {
                ...existingResult,
                status: "haram",
                reason: engineResult.eli5 || existingResult.notes,
                trace: engineResult.trace || [],
                confidence: Math.min(existingResult.confidence || 1, engineResult.confidence),
                hkmResult: engineResult,
                validationState,
                preferencesApplied: engineResult.preferences,
                // Add knowledge model fields
                inheritedFrom: engineResult.inheritedFrom || existingResult.inheritedFrom,
                alternatives: engineResult.alternatives || existingResult.alternatives || [],
                notes: engineResult.notes || existingResult.notes,
                eli5: engineResult.eli5 || existingResult.eli5,
                tags: engineResult.tags || existingResult.tags,
                references: engineResult.references || [],
                // Map references to quranReference and hadithReference for backward compatibility
                quranReference: existingResult.quranReference || (engineResult.references && engineResult.references.filter(r => r.toLowerCase().includes("qur'an") || r.toLowerCase().includes("quran"))[0]) || undefined,
                hadithReference: existingResult.hadithReference || (engineResult.references && engineResult.references.filter(r => r.toLowerCase().includes("hadith") || r.toLowerCase().includes("bukhari") || r.toLowerCase().includes("muslim")).join("; ")) || undefined
              };
            } else if (engineResult.status === "conditional" && engineResult.trace?.length > 1) {
              // Track conditional items with inheritance chains
              inheritanceFlags++;
              maxConfidenceReduction = Math.min(maxConfidenceReduction, engineResult.confidence);
              
              let validationState = "needs_review";
              if (engineResult.enforcedBy === "user_preferences") {
                validationState = "preference_based";
              }
              
              return {
                ...existingResult,
                trace: engineResult.trace || [],
                hkmResult: engineResult,
                hasInheritance: true,
                validationState,
                preferencesApplied: engineResult.preferences,
                // Add knowledge model fields
                inheritedFrom: engineResult.inheritedFrom || existingResult.inheritedFrom,
                alternatives: engineResult.alternatives || existingResult.alternatives || [],
                notes: engineResult.notes || existingResult.notes,
                eli5: engineResult.eli5 || existingResult.eli5,
                tags: engineResult.tags || existingResult.tags,
                references: engineResult.references || []
              };
            } else {
              // Preserve existing result, but add HKM data if available
              let validationState = existingResult.ingredient ? "explicit_haram" : undefined;
              if (engineResult.enforcedBy === "user_preferences") {
                validationState = "preference_based";
              }
              
              return {
                ...existingResult,
                trace: engineResult.trace || existingResult.trace || [],
                hkmResult: engineResult.status !== "unknown" ? engineResult : undefined,
                validationState,
                preferencesApplied: engineResult.preferences,
                // Add knowledge model fields
                inheritedFrom: engineResult.inheritedFrom || existingResult.inheritedFrom,
                alternatives: engineResult.alternatives || existingResult.alternatives || [],
                notes: engineResult.notes || existingResult.notes,
                eli5: engineResult.eli5 || existingResult.eli5,
                tags: engineResult.tags || existingResult.tags,
                references: engineResult.references || []
              };
            }
          }
          
          // For CSV-only results, mark as explicit
          if (issue.ingredient && !issue.hkmResult) {
            return {
              ...existingResult,
              validationState: "explicit_haram"
            };
          }
          
          return existingResult;
        });
        
        // Minor adjustments for inheritance flags and preference enforcement
        // Only apply small reductions since we're already accounting for replacements in base score
        if (inheritanceFlags > 0 && preferenceEnforcedFlags > 0) {
          // Both inheritance and preference enforcement: apply small combined reduction
          convertedConfidence = Math.round(convertedConfidence * 0.95); // Was 0.75, now less severe
          // Also apply min confidence from HKM (if applicable)
          if (maxConfidenceReduction < 1) {
            convertedConfidence = Math.round(convertedConfidence * Math.max(0.95, maxConfidenceReduction));
          }
        } else if (inheritanceFlags > 0) {
          // Only inheritance flags - smaller penalty since replacements exist
          if (inheritanceFlags === 1) {
            convertedConfidence = Math.round(convertedConfidence * 0.95); // Was 0.85
          } else {
            convertedConfidence = Math.round(convertedConfidence * 0.92); // Was 0.7
          }
          // Also apply min confidence from HKM (if applicable)
          if (maxConfidenceReduction < 1) {
            convertedConfidence = Math.round(convertedConfidence * Math.max(0.95, maxConfidenceReduction));
          }
        } else if (preferenceEnforcedFlags > 0) {
          // Only preference enforcement - very small reduction
          convertedConfidence = Math.round(convertedConfidence * 0.98); // Was 0.9
        }
      }
      
      setConverted(convertedText);
      setIssues(convertedIssues);
      setConfidence(convertedConfidence);
      
      // Cache successful conversion
      try {
        const cacheData = {
          recipe: trimmedRecipe,
          converted: convertedText,
          issues: convertedIssues,
          confidence: convertedConfidence,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem("lastConversionCache", JSON.stringify(cacheData));
      } catch (cacheErr) {
        logger.warn("Failed to cache conversion:", cacheErr);
      }
      
      // Track conversion (increment counter for free users)
      const conversionResult = trackConversion();
      
      // Track conversion analytics
      analytics.trackConversion({
        hasIssues: convertedIssues.length > 0,
        confidenceScore: convertedConfidence,
      });
      
      // Track conversion limit approach
      if (!isPremiumUser() && conversionResult.remaining <= 2 && conversionResult.remaining > 0) {
        trackConversionLimitApproach(conversionResult.used, conversionResult.limit, conversionResult.remaining);
      }
      
      // Reset accordion state when new conversion happens
      setIsAccordionOpen(false);
      setOpenIngredientCards(new Set());
      
      // Only reset viewingRecipe if this is a manual conversion
      if (!isAutoConvert) {
        setViewingRecipe(null);
      }
    } catch (err) {
      logger.error("Conversion error:", err);
      
      // Determine error message based on error type
      let errorMessage = "Unable to connect to the server. Please check your internet connection.";
      let isNetworkError = false;
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
      } else if (err.request || err.code === "ECONNREFUSED" || err.message?.includes("Network Error")) {
        // Request was made but no response received (network error)
        isNetworkError = true;
        errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        
        // Check for cached result
        try {
          const cached = localStorage.getItem("lastConversionCache");
          if (cached) {
            const cacheData = JSON.parse(cached);
            // Only show cached if it's recent (within 24 hours)
            const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
            if (cacheAge < 24 * 60 * 60 * 1000) {
              setIsOffline(true);
              setShowCachedResult(true);
              setConverted(cacheData.converted);
              setIssues(cacheData.issues || []);
              setConfidence(cacheData.confidence || 0);
              errorMessage = "You're offline. Showing your last successful conversion. Please reconnect to convert a new recipe.";
            }
          }
        } catch (cacheErr) {
          logger.warn("Failed to load cached conversion:", cacheErr);
        }
      } else if (err.message) {
        // Something else happened
        errorMessage = err.message;
      }
      
      // Set error state
      setError(errorMessage);
      
      // Only clear converted recipe if we don't have a cached result
      if (!showCachedResult) {
        setConverted("");
        setIssues([]);
        setConfidence(0);
      }
      
      setIsAccordionOpen(false);
      setOpenIngredientCards(new Set());
    }
  };

  const handleBatchConvert = async () => {
    const trimmed = (mealPlanInput || "").trim();
    if (!trimmed) {
      alert("Paste your meal plan or multiple recipes first.");
      return;
    }
    setBatchLoading(true);
    setBatchResult(null);
    setError("");
    try {
      const result = await convertBatchRecipes(trimmed, halalSettings);
      setBatchResult(result);
      setBatchSectionOpen(true);
    } catch (err) {
      logger.error("Batch conversion error:", err);
      setError(err?.message || "Meal plan conversion failed.");
    } finally {
      setBatchLoading(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = converted || "";
    if (!textToCopy) {
      alert("No converted recipe to copy.");
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    alert("Converted recipe copied to clipboard!");
  };

  const downloadRecipe = () => {
    const textToDownload = converted || "";
    if (!textToDownload) {
      alert("No converted recipe to download.");
      return;
    }
    const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted_recipe.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveRecipe = async () => {
    const originalText = recipe || "";
    const convertedText = converted || "";

    if (!originalText || !convertedText) {
      alert("No recipe to save. Please convert a recipe first.");
      return;
    }

    const titleFromRecipe = originalText.split(/\n/)[0]?.trim() || "Converted Recipe";
    const title = titleFromRecipe.length > 80 ? titleFromRecipe.slice(0, 77) + "..." : titleFromRecipe;

    // Build substitutions_used from current issues (ingredient, replacement, alternatives, status)
    const substitutionsUsed = Array.isArray(issues) ? issues.map((issue) => ({
      ingredient: issue.ingredient ?? issue.haramIngredient ?? issue.normalizedName,
      replacement: issue.replacement ?? issue.replacement_id,
      alternatives: issue.alternatives ?? [],
      status: issue.status ?? issue.halal_status,
      notes: issue.notes ?? issue.explanation,
    })) : [];

    try {
      if (isAuthenticated()) {
        const recipeData = {
          title,
          originalRecipe: originalText,
          convertedRecipe: convertedText,
          ingredients: [],
          instructions: "",
          confidenceScore: confidence,
          substitutionsUsed,
          isPublic: false,
          visibility: "private",
        };
        const saved = await createRecipe(recipeData);
        const newRecipe = {
          id: saved?.id || Date.now().toString(),
          title: saved?.title || title,
          original: saved?.originalRecipe ?? saved?.original_recipe ?? originalText,
          converted: saved?.convertedRecipe ?? saved?.converted_recipe ?? convertedText,
          savedAt: saved?.createdAt ?? saved?.created_at ?? new Date().toISOString(),
          issues: saved?.substitutions_used ?? saved?.substitutionsUsed ?? saved?.issues ?? substitutionsUsed,
          confidenceScore: saved?.confidence_score ?? saved?.confidenceScore ?? confidence,
          isPublic: false,
        };
        const updated = [...savedRecipes, newRecipe];
        setSavedRecipes(updated);
        if (typeof Storage !== "undefined") {
          localStorage.setItem("halalRecipes", JSON.stringify(updated));
        }
        alert("Halal version saved to your account!");
        return;
      }

      if (typeof Storage !== "undefined") {
        const newRecipe = {
          id: Date.now().toString(),
          original: originalText,
          converted: convertedText,
          title,
          savedAt: new Date().toISOString(),
          issues: substitutionsUsed,
          confidenceScore: confidence,
          isPublic: false,
        };
        const updated = [...savedRecipes, newRecipe];
        setSavedRecipes(updated);
        localStorage.setItem("halalRecipes", JSON.stringify(updated));
        alert("Recipe saved locally. Log in to save to your account and sync across devices.");
      } else {
        alert("LocalStorage is not available in your browser.");
      }
    } catch (err) {
      logger.error("Error saving recipe:", err);
      const msg = err?.error || err?.message || "Error saving recipe. Please try again.";
      alert(typeof msg === "string" ? msg : "Error saving recipe. Please try again.");
    }
  };

  const loadSavedRecipe = async (savedRecipe) => {
    // Defensive checks
    if (!savedRecipe || typeof savedRecipe !== "object") {
      alert("Invalid recipe data.");
      return;
    }

    let recipeText = "";
    const hasSavedConversion = savedRecipe.converted && typeof savedRecipe.converted === "string";
    const savedIssues = savedRecipe.issues ?? savedRecipe.substitutions_used ?? savedRecipe.substitutionsUsed;

    // Handle both old format (original/converted) and new format (title/ingredients/instructions)
    if (savedRecipe.original && typeof savedRecipe.original === "string") {
      recipeText = savedRecipe.original.trim();
    } else if (
      savedRecipe.ingredients &&
      typeof savedRecipe.ingredients === "string" &&
      savedRecipe.instructions &&
      typeof savedRecipe.instructions === "string"
    ) {
      const title = savedRecipe.title && typeof savedRecipe.title === "string" ? savedRecipe.title.trim() : "";
      const ingredients = savedRecipe.ingredients.trim();
      const instructions = savedRecipe.instructions.trim();
      const notes = savedRecipe.notes && typeof savedRecipe.notes === "string" ? savedRecipe.notes.trim() : "";
      recipeText = `${title ? `${title}\n\n` : ""}Ingredients:\n${ingredients}\n\nInstructions:\n${instructions}${notes ? `\n\nNotes:\n${notes}` : ""}`;
    } else {
      alert("Invalid recipe format. Recipe data is missing required fields.");
      return;
    }

    if (!recipeText || recipeText.trim() === "") {
      alert("Recipe text is empty. Cannot load recipe.");
      return;
    }

    setRecipe(recipeText);
    setViewingRecipe(savedRecipe.id || null);

    // Reopen: show saved converted text and substitutions without re-converting
    if (hasSavedConversion && (savedIssues != null || savedRecipe.converted)) {
      setConverted(savedRecipe.converted.trim());
      setIssues(Array.isArray(savedIssues) ? savedIssues : []);
      setConfidence(savedRecipe.confidenceScore ?? savedRecipe.confidence_score ?? 0);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // No saved conversion: run conversion
    await handleConvert(recipeText, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReportSubstitution = (issue, idx) => {
    if (!issue) return;
    
    const ingredientName = issue?.ingredient_id || issue?.ingredient || `ingredient-${idx}`;
    const replacementName = issue?.replacement_id || issue?.replacement || "N/A";
    
    // Store report locally (ready for backend later)
    try {
      const reports = JSON.parse(localStorage.getItem("halalKitchenReports") || "[]");
      const report = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ingredient: ingredientName,
        replacement: replacementName,
        status: "pending",
      };
      reports.push(report);
      localStorage.setItem("halalKitchenReports", JSON.stringify(reports));
      
      alert("Thank you for your report. We'll review this substitution.");
    } catch (err) {
      logger.error("Error saving report:", err);
      alert("Unable to save report. Please try again.");
    }
  };

  const deleteSavedRecipe = async (id, isPublic = false) => {
    if (!id) return;

    try {
      if (isPublic) {
        const updated = publicRecipes.filter((r) => r?.id !== id);
        setPublicRecipes(updated);
        if (typeof Storage !== "undefined") {
          localStorage.setItem("halalPublicRecipes", JSON.stringify(updated));
        }
      } else {
        if (isAuthenticated()) {
          await deleteRecipeApi(id);
        }
        const updated = savedRecipes.filter((r) => r?.id !== id);
        setSavedRecipes(updated);
        if (typeof Storage !== "undefined") {
          localStorage.setItem("halalRecipes", JSON.stringify(updated));
        }
      }
      if (viewingRecipe === id) {
        setViewingRecipe(null);
        setRecipe("");
        setConverted("");
        setIssues([]);
        setConfidence(0);
      }
    } catch (err) {
      logger.error("Error deleting recipe:", err);
      alert(err?.error || err?.message || "Error deleting recipe. Please try again.");
    }
  };

  const highlightHaram = (text) => {
    if (!text || typeof text !== "string") {
      return [text];
    }
    if (!Array.isArray(issues) || issues.length === 0) {
      return [text];
    }

    // Create a map of haram ingredients (case insensitive)
    const haramList = new Map();
    issues.forEach((issue) => {
      const ingredient = issue?.ingredient;
      if (ingredient && typeof ingredient === "string") {
        const key = ingredient.toLowerCase();
        haramList.set(key, {
          name: ingredient,
          quranRef: issue?.quranReference || "",
          hadithRef: issue?.hadithReference || "",
        });
      }
    });

    // Process text word by word using regex to find word boundaries
    const elements = [];
    let lastIndex = 0;
    let keyIndex = 0;

    // Create a regex pattern for all haram ingredients
    const haramPatterns = Array.from(haramList.keys()).map(key => 
      key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    
    if (haramPatterns.length === 0) {
      return [text];
    }

    // Match all haram ingredients with word boundaries
    const regex = new RegExp(`\\b(${haramPatterns.join('|')})\\b`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      // Add the haram ingredient component
      const matchedWord = match[0].toLowerCase();
      const haramData = haramList.get(matchedWord);
      if (haramData) {
        elements.push(
          <HaramIngredient
            key={`haram-${keyIndex++}-${match.index}`}
            name={haramData.name}
            quranRef={haramData.quranRef}
            hadithRef={haramData.hadithRef}
            useSimpleExplanation={false}
          />
        );
      } else {
        // Fallback: add as text if data not found
        elements.push(match[0]);
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    // If no matches found, return original text
    if (elements.length === 0) {
      return [text];
    }

    return elements;
  };

  const handleQuickLookupConvert = (ingredient) => {
    // Track quick lookup usage
    analytics.trackQuickLookup(ingredient);
    setRecipe(ingredient);
    // Optionally auto-convert
    setTimeout(() => {
      handleConvert(ingredient, false);
    }, 100);
  };

  /** Sample recipe for "Try Example" — reduces blank-state friction for new users. */
  const EXAMPLE_RECIPE = `Spaghetti
Eggs
Pancetta
Parmesan
White wine`;

  const handleTryExample = () => {
    setRecipe(EXAMPLE_RECIPE);
    setError("");
    setTimeout(() => {
      handleConvert(EXAMPLE_RECIPE, true);
    }, 100);
  };

  const handleFeedback = (isPositive) => {
    // Analytics event
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "feedback", {
        value: isPositive ? "positive" : "negative",
        conversion_id: viewingRecipe || "new"
      });
    }
    alert(isPositive ? "Thank you for your positive feedback!" : "Thank you for your feedback. We'll work to improve!");
  };

  const adjustConfidenceScore = (baseScore) => {
    // Adjust confidence based on halal settings
    let adjustedScore = baseScore;
    
    if (halalSettings.strictnessLevel === "strict") {
      // Reduce score for strict mode (more conservative)
      adjustedScore = Math.max(0, adjustedScore - 5);
    } else if (halalSettings.strictnessLevel === "flexible") {
      // Increase score for flexible mode (more lenient)
      adjustedScore = Math.min(100, adjustedScore + 5);
    }
    
    return adjustedScore;
  };

  const handleShareToCommunity = () => {
    if (!converted) {
      alert("Please convert a recipe first before sharing!");
      return;
    }
    setShowCreatePostModal(true);
  };

  const handlePostCreated = async (post) => {
    try {
      const isPublic = post.isPublic === true;
      
      // If authenticated and saved to API, handle UI updates
      if (isAuthenticated() && post._fromAPI === true) {
        // Recipe was saved to API
        if (isPublic) {
          // Switch to feed tab to see the new post
          setActiveTab("feed");
          window.scrollTo({ top: 0, behavior: "smooth" });
          alert("Recipe posted to community feed!");
          // Refresh feed after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          alert("Recipe saved privately to your account!");
        }
      } else {
        // Guest mode or API failed - use localStorage
        if (isPublic) {
          // Save to public feed (localStorage)
          const existingPosts = JSON.parse(localStorage.getItem("halalKitchenPosts") || "[]");
          const updatedPosts = [post, ...existingPosts];
          localStorage.setItem("halalKitchenPosts", JSON.stringify(updatedPosts));
          setActiveTab("feed");
          alert("Recipe saved locally. Log in to post publicly and sync across devices.");
        } else {
          // Save as private recipe (localStorage)
          const privateRecipe = {
            id: post.id,
            title: post.title,
            ingredients: post.convertedRecipe || post.originalRecipe || "",
            instructions: post.description || "",
            notes: "",
            savedAt: post.createdAt || new Date().toISOString(),
            isPublic: false,
          };
          
          const updated = [...savedRecipes, privateRecipe];
          setSavedRecipes(updated);
          localStorage.setItem("halalRecipes", JSON.stringify(updated));
          alert("Recipe saved privately!");
        }
      }
      
      // Update stats
      const currentConverted = parseInt(localStorage.getItem("userRecipesConverted") || "0");
      localStorage.setItem("userRecipesConverted", (currentConverted + 1).toString());
      
      setShowCreatePostModal(false);
    } catch (error) {
      logger.error("Error saving post:", error);
      alert("Error saving recipe. Please try again.");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Track tab/page changes
    analytics.trackPageView(tab);
    
    if (tab === "create") {
      // If user has a converted recipe, open create modal
      if (converted) {
        setShowCreatePostModal(true);
      } else {
        // Otherwise, switch to convert tab
        setActiveTab("convert");
        alert("Please convert a recipe first before sharing!");
      }
    }
  };

  const toggleAccordion = () => {
    setIsAccordionOpen((prev) => !prev);
  };

  const toggleIngredientCard = (ingredientName) => {
    setOpenIngredientCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName);
      } else {
        newSet.add(ingredientName);
      }
      return newSet;
    });
  };

  const toggleReferences = (ingredientName) => {
    setOpenReferences((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName);
      } else {
        newSet.add(ingredientName);
      }
      return newSet;
    });
  };

  const safeConverted = typeof converted === "string" ? converted : "";
  const safeConfidence = typeof confidence === "number" && !isNaN(confidence) ? confidence : 0;
  const safeIssues = Array.isArray(issues) ? issues : [];
  const safeSavedRecipes = Array.isArray(savedRecipes) ? savedRecipes : [];
  const safePublicRecipes = Array.isArray(publicRecipes) ? publicRecipes : [];

  const renderRecipeCard = (recipeItem, isPublic = false) => {
    if (!recipeItem || !recipeItem.id) return null;
    
    const savedDate = recipeItem.savedAt 
      ? new Date(recipeItem.savedAt).toLocaleDateString()
      : "Unknown date";
    
    // Handle both old and new formats
    let title = recipeItem.title || "Untitled Recipe";
    let preview = "";
    
    if (recipeItem.converted && typeof recipeItem.converted === "string") {
      // Old format
      preview = recipeItem.converted.length > 100 
        ? recipeItem.converted.substring(0, 100) + "..." 
        : recipeItem.converted;
    } else if (recipeItem.ingredients && typeof recipeItem.ingredients === "string") {
      // New format
      preview = recipeItem.ingredients.length > 100 
        ? recipeItem.ingredients.substring(0, 100) + "..." 
        : recipeItem.ingredients;
    } else {
      preview = "No preview available";
    }

    return (
      <div 
        key={recipeItem.id} 
        className={`saved-recipe-item ${viewingRecipe === recipeItem.id ? "active" : ""}`}
      >
        <div 
          className="saved-recipe-content"
          onClick={() => loadSavedRecipe(recipeItem)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              loadSavedRecipe(recipeItem);
            }
          }}
        >
          <div className="saved-recipe-preview">
            <strong>{title}</strong>
            <span className="recipe-date">{savedDate}</span>
            <p>{preview}</p>
          </div>
        </div>
        <button
          className="delete-recipe-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to delete this recipe?")) {
              deleteSavedRecipe(recipeItem.id, isPublic);
            }
          }}
          aria-label="Delete recipe"
        >
          Delete
        </button>
      </div>
    );
  };

  return (
    <div className="app">
      {activeTab === "convert" && (
        <div className="header-section">
          <div className="header-top">
            <img src={halalArabicImage} alt="Halal" className="halal-arabic" />
            <div className="header-actions">
              <HalalStandardPanel onSettingsChange={setHalalSettings} />
            </div>
          </div>
          <h1>
            {t("halalKitchen")}
            <span className="beta-label" title="This is a beta version. Please verify guidance with trusted scholars.">Beta</span>
          </h1>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "convert" && (
          <>
            <QuickLookup onConvertClick={handleQuickLookupConvert} />
            
            <div className="input-section">
              <label htmlFor="recipe-input" className="input-label">
                <img src={halalInputIcon} alt="Recipe Input" className="section-icon" />
                <span>Recipe Input</span>
              </label>
              {error && (
                <div className="error-message" role="alert">
                  {error}
                  {isOffline && (
                    <button
                      className="retry-button"
                      onClick={() => handleConvert()}
                      aria-label="Retry conversion"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              <textarea
                id="recipe-input"
                placeholder={t("pasteRecipe")}
                value={recipe || ""}
                onChange={(e) => {
                  const newValue = e.target?.value || "";
                  setRecipe(newValue);
                  if (error) {
                    setError("");
                  }
                }}
              />
              <div className="input-actions">
                <button
                  onClick={handleTryExample}
                  className="try-example-btn demo-btn"
                  aria-label="Try example recipe and convert"
                >
                  <Play className="button-icon-inline" aria-hidden="true" />
                  <span>{t("tryExample")}</span>
                </button>
                <button
                  type="button"
                  className="scan-ingredients-btn"
                  onClick={() => setShowScanModal(true)}
                  aria-label="Scan ingredients from label photo"
                >
                  <Camera className="button-icon-inline" aria-hidden="true" />
                  <span>Scan ingredients</span>
                </button>
              </div>
            </div>

            <button onClick={() => handleConvert()} className="convert-btn" aria-label="Convert recipe">
              <RefreshCw className="button-icon-inline" aria-hidden="true" />
              <span>{t("convert")}</span>
            </button>

            <details
              className="batch-convert-section"
              open={batchSectionOpen}
              onToggle={(e) => setBatchSectionOpen(e.target.open)}
            >
              <summary className="batch-convert-summary">
                <CalendarDays size={18} aria-hidden="true" />
                <span>Convert meal plan (multiple recipes)</span>
                {batchResult ? ` — ${batchResult.total} recipe${batchResult.total !== 1 ? "s" : ""} converted` : ""}
                {batchSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </summary>
              <div className="batch-convert-inner">
                <p className="batch-convert-hint">Paste a weekly meal plan or several recipes. Use day names (Monday:, Tuesday:), numbers (1. Recipe... 2. Recipe...), or separate each recipe with a blank line.</p>
                <textarea
                  className="batch-convert-textarea"
                  placeholder={"Monday: Pasta with bacon\nIngredients: ...\n\nTuesday: Chicken curry\n..."}
                  value={mealPlanInput}
                  onChange={(e) => setMealPlanInput(e.target.value)}
                  rows={5}
                  aria-label="Meal plan or multiple recipes"
                />
                <button
                  type="button"
                  className="batch-convert-btn"
                  onClick={handleBatchConvert}
                  disabled={batchLoading}
                  aria-label="Convert meal plan"
                >
                  {batchLoading ? (
                    <>
                      <RefreshCw size={18} className="spin-inline" aria-hidden="true" />
                      <span>Converting…</span>
                    </>
                  ) : (
                    <>
                      <CalendarDays size={18} aria-hidden="true" />
                      <span>Convert meal plan</span>
                    </>
                  )}
                </button>
                {batchResult && batchResult.recipes && batchResult.recipes.length > 0 && (
                  <div className="batch-result" role="region" aria-label="Weekly halal meal plan">
                    <h3 className="batch-result-title">Your halal meal plan</h3>
                    {batchResult.truncated && (
                      <p className="batch-result-note">Showing first 14 recipes. Rest omitted.</p>
                    )}
                    <div className="batch-result-list">
                      {batchResult.recipes.map((item, idx) => (
                        <div key={idx} className="batch-result-card">
                          <h4 className="batch-result-label">{item.label}</h4>
                          {item.error && <p className="batch-result-error" role="alert">{item.error}</p>}
                          <pre className="batch-result-recipe">{item.convertedText}</pre>
                          {item.issues && item.issues.length > 0 && (
                            <p className="batch-result-issues">{item.issues.length} ingredient{item.issues.length !== 1 ? "s" : ""} adjusted (halal substitutes applied).</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>

            {safeConverted && (
              <div className="results fade-in">
                <div className="recipe-card">
                  <h2>
                    <img src={halalOutputIcon} alt="Converted Recipe" className="section-icon" />
                    <span>Converted Recipe</span>
                  </h2>
                  <pre className="recipe-output">
                    {highlightHaram(safeConverted)}
                  </pre>
                  <div className="recipe-actions">
                    <button onClick={copyToClipboard} aria-label="Copy to clipboard">
                      <ClipboardCopy className="button-icon-inline" aria-hidden="true" />
                      <span>{t("copy")}</span>
                    </button>
                    <button onClick={downloadRecipe} aria-label="Download recipe">
                      <Download className="button-icon-inline" aria-hidden="true" />
                      <span>{t("download")}</span>
                    </button>
                    <SaveHalalVersionButton disabled={!converted} onClick={saveRecipe} />
                    <button onClick={handleShareToCommunity} className="share-community-btn" aria-label="Share to community">
                      <Share2 className="button-icon-inline" aria-hidden="true" />
                      <span>Share to Feed</span>
                    </button>
                    <button onClick={() => setShowShareHalalModal(true)} className="share-halal-version-btn" aria-label="Share halal version">
                      <Share2 className="button-icon-inline" aria-hidden="true" />
                      <span>Share Halal Version</span>
                    </button>
                  </div>
                  <div className="feedback-section">
                    <p className="feedback-label">{t("feedback")}:</p>
                    <button
                      onClick={() => handleFeedback(true)}
                      className="feedback-btn positive"
                      aria-label="Positive feedback"
                    >
                      <ThumbsUp className="button-icon-inline" aria-hidden="true" />
                      <span>Helpful</span>
                    </button>
                    <button
                      onClick={() => handleFeedback(false)}
                      className="feedback-btn negative"
                      aria-label="Negative feedback"
                    >
                      <ThumbsDown className="button-icon-inline" aria-hidden="true" />
                      <span>Not helpful</span>
                    </button>
                  </div>
                </div>

                {/* Shop Ingredients Section - Only shows for replaced ingredients */}
                {safeIssues && safeIssues.length > 0 && (
                  <IngredientShopSection 
                    replacements={safeIssues.filter(issue => 
                      issue?.wasReplaced && 
                      issue?.replacement_id && 
                      issue.replacement_id !== "Halal alternative needed"
                    )}
                  />
                )}

                <div className="confidence-section">
                  <div className="confidence-header">
                    <h3>
                      {t("confidenceScore")}: {
                        safeConfidence === null || safeConfidence === undefined
                          ? "Confidence unavailable — evaluation error"
                          : `${adjustConfidenceScore(safeConfidence)}%`
                      }
                    </h3>
                    {(() => {
                      // Defensive: don't show badge if confidence is unavailable
                      if (safeConfidence === null || safeConfidence === undefined) {
                        return null;
                      }
                      
                      const adjustedScore = adjustConfidenceScore(safeConfidence);
                      let badgeText = "";
                      let badgeClass = "";
                      if (adjustedScore >= 80) {
                        badgeText = "🟢 High Confidence";
                        badgeClass = "confidence-badge high";
                      } else if (adjustedScore >= 50) {
                        badgeText = "🟡 Needs Review";
                        badgeClass = "confidence-badge medium";
                      } else {
                        badgeText = "🔴 Likely Haram";
                        badgeClass = "confidence-badge low";
                      }
                      return <span className={badgeClass}>{badgeText}</span>;
                    })()}
                  </div>
                  <div className="confidence-progress">
                    <div 
                      className="confidence-bar" 
                      style={{ 
                        width: safeConfidence === null || safeConfidence === undefined
                          ? "0%"
                          : `${adjustConfidenceScore(safeConfidence)}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="issues-section">
                  <div 
                    className="accordion-header" 
                    onClick={toggleAccordion}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleAccordion();
                      }
                    }}
                  >
                    <h2>{t("ingredientCategories")}</h2>
                    <span className="accordion-icon">
                      {isAccordionOpen ? "−" : "+"}
                    </span>
                  </div>
                  
                  {isAccordionOpen && (
                    <div className="accordion-content">
                      {safeIssues.length > 0 ? (
                        <div className="ingredient-cards">
                          {safeIssues.map((issue, idx) => {
                            const ingredientName = issue?.ingredient || `ingredient-${idx}`;
                            const isOpen = openIngredientCards.has(ingredientName);
                            
                            return (
                              <div key={idx} className="ingredient-card">
                                <div 
                                  className="ingredient-card-header"
                                  onClick={() => toggleIngredientCard(ingredientName)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      toggleIngredientCard(ingredientName);
                                    }
                                  }}
                                >
                                  <div className="ingredient-card-title">
                                    <strong>{formatIngredientName(issue?.ingredient_id || issue?.ingredient || "—")}</strong>
                                    <span className="ingredient-replacement-preview">
                                      → {formatIngredientName(issue?.replacement_id || issue?.replacement || "—")}
                                    </span>
                                  </div>
                                  <span className="ingredient-card-icon">
                                    {isOpen ? "−" : "+"}
                                  </span>
                                </div>
                                
                                {isOpen && (
                                  <div className="ingredient-card-content">
                                    <div className="ingredient-detail-row">
                                      <span className="detail-label">Original:</span>
                                      <span className="detail-value">{formatIngredientName(issue?.ingredient_id || issue?.ingredient || "—")}</span>
                                    </div>
                                    {/* Purchase card: replacement + buy options (up to 3) when links exist; otherwise replacement row only */}
                                    {issue?.replacement_id && issue.replacement_id !== "Halal alternative needed" && (
                                      (issue?.substitute_affiliate_links?.length > 0) ? (
                                        <SubstitutePurchaseCard
                                          originalId={issue?.ingredient_id || issue?.ingredient}
                                          originalName={formatIngredientName(issue?.ingredient_id || issue?.ingredient)}
                                          replacementId={issue.replacement_id}
                                          replacementName={formatIngredientName(issue.replacement_id || issue?.replacement)}
                                          affiliateLinks={(issue?.substitute_affiliate_links || []).slice(0, MAX_LINKS_PER_INGREDIENT)}
                                          showDisclosure={true}
                                          whyItWorks={(() => {
                                            const r = (issue?.ranked_substitutes || []).find(s => s.id === issue.replacement_id);
                                            if (r?.why_it_works) return r.why_it_works;
                                            const sw = (issue?.substitutes_with_links || []).find(s => s.id === issue.replacement_id);
                                            return sw?.why_it_works || "";
                                          })()}
                                        />
                                      ) : (
                                        <div className="ingredient-detail-row">
                                          <span className="detail-label">Halal Replacement:</span>
                                          <span className="detail-value">{formatIngredientName(issue.replacement_id || issue?.replacement || "—")}</span>
                                          {(() => {
                                            const r = (issue?.ranked_substitutes || []).find(s => s.id === issue.replacement_id);
                                            return r?.why_it_works ? (
                                              <p className="substitute-why-inline" style={{ marginTop: 6, marginBottom: 0, fontSize: "0.9em", color: "var(--text-secondary)" }}>{r.why_it_works}</p>
                                            ) : null;
                                          })()}
                                        </div>
                                      )
                                    )}
                                    {(!issue?.replacement_id || issue.replacement_id === "Halal alternative needed") && (
                                      <div className="ingredient-detail-row">
                                        <span className="detail-label">Halal Replacement:</span>
                                        <span className="detail-value">{formatIngredientName(issue?.replacement_id || issue?.replacement || "—")}</span>
                                      </div>
                                    )}
                                    
                                    {/* Replacement Ratio - Display clearly under replacement ingredient */}
                                    {issue?.replacementRatio && (
                                      <div className="ingredient-detail-row replacement-ratio-row">
                                        <span className="detail-label">Replacement Ratio:</span>
                                        <span className="detail-value replacement-ratio-value">
                                          {issue.replacementRatio}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Validation State Badge */}
                                    {issue?.validationState && (
                                      <div className="validation-badge-section">
                                        {issue.validationState === "explicit_haram" && (
                                          <span className="validation-badge explicit-haram" title="Detected from haram ingredients database">
                                            📋 Explicit Haram (CSV)
                                          </span>
                                        )}
                                        {issue.validationState === "derived_haram" && (
                                          <span className="validation-badge derived-haram" title="Inferred through ingredient inheritance chain">
                                            🔗 Derived Haram (Knowledge Engine)
                                          </span>
                                        )}
                                        {issue.validationState === "preference_based" && (
                                          <span className="validation-badge preference-based" title="Ruling based on your Halal Standard preferences">
                                            ⚙️ Preference-Based Ruling
                                          </span>
                                        )}
                                        {issue.validationState === "needs_review" && (
                                          <span className="validation-badge needs-review" title="May require consultation with a qualified Islamic scholar">
                                            ⚠️ Needs Scholarly Review
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Preference Note */}
                                    {issue?.preferencesApplied && (
                                      <div className="preference-note-section">
                                        <p className="preference-note">
                                          Based on your Halal Standard ({halalSettings?.strictnessLevel || "standard"})
                                          {halalSettings?.schoolOfThought && halalSettings.schoolOfThought !== "no-preference" && (
                                            <span> and School of Thought ({halalSettings.schoolOfThought})</span>
                                          )}
                                        </p>
                                        <span className="preference-tooltip" title="Different scholars hold different opinions. Adjust your preferences in Profile.">
                                          ℹ️
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Inherited From */}
                                    {issue?.inheritedFrom && (
                                      <div className="ingredient-detail-row">
                                        <span className="detail-label">Inherited From:</span>
                                        <span className="detail-value">
                                          {issue.inheritedFrom}
                                          {issue.inheritedFrom === "pork" && " (explicitly prohibited in Quran 2:173)"}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Nested Inheritance Chain Display (from ingredients.json) */}
                                    {issue?.ingredient && (
                                      <div className="ingredient-detail-row">
                                        <IngredientTreeDisplay 
                                          ingredientName={issue.ingredient} 
                                          showTree={true}
                                        />
                                      </div>
                                    )}
                                    
                                    {/* Alternatives: ranked with why_it_works when available */}
                                    {((issue?.ranked_substitutes && issue.ranked_substitutes.length > 0) || (issue?.alternatives && Array.isArray(issue.alternatives) && issue.alternatives.length > 0)) && (
                                      <div className="ingredient-detail-row">
                                        <span className="detail-label">More substitutes:</span>
                                        <div className="alternatives-list">
                                          <ul>
                                            {(issue?.ranked_substitutes && issue.ranked_substitutes.length > 0
                                              ? issue.ranked_substitutes.map((sub, idx) => (
                                                  <li key={sub.id || idx}>
                                                    <strong>{formatIngredientName(sub.id)}</strong>
                                                    {sub.why_it_works && (
                                                      <span className="alternatives-why"> — {sub.why_it_works}</span>
                                                    )}
                                                  </li>
                                                ))
                                              : issue.alternatives.map((alt, idx) => (
                                                  <li key={idx}>{formatIngredientName(alt)}</li>
                                                ))
                                            )}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Explanation - Religious justification (why ingredient is not halal) */}
                                    {(issue?.explanation || issue?.reason || issue?.notes || issue?.eli5) && (
                                      <div className="ingredient-detail-row explanation-row">
                                        <span className="detail-label">Explanation:</span>
                                        <span className="detail-value">
                                          {issue.explanation || issue.reason || issue.notes || issue.eli5}
                                        </span>
                                      </div>
                                    )}
                                    <IngredientSources status={issue?.status || "conditional"} ingredientId={issue?.ingredient_id || issue?.ingredient} />
                                    
                                    {/* Derived Ingredient Warning */}
                                    {issue?.trace && Array.isArray(issue.trace) && issue.trace.length > 1 && (
                                      <div className="derived-warning-section">
                                        <p className="derived-warning">
                                          ⚠️ This ingredient may contain hidden haram sources.
                                        </p>
                                        <details className="trace-details">
                                          <summary className="trace-summary">Show ingredient breakdown</summary>
                                          <ul className="trace-list">
                                            {issue.trace.map((t, i) => (
                                              <li key={i} className="trace-item">{t}</li>
                                            ))}
                                          </ul>
                                        </details>
                                      </div>
                                    )}
                                    
                                    {(issue?.quranReference || issue?.hadithReference) && (
                                      <div className="references-accordion">
                                        <div 
                                          className="references-accordion-header"
                                          onClick={() => toggleReferences(ingredientName)}
                                          role="button"
                                          tabIndex={0}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              toggleReferences(ingredientName);
                                            }
                                          }}
                                        >
                                          <span className="references-accordion-title">Quranic & Hadith References</span>
                                          <span className="references-accordion-icon">
                                            {openReferences.has(ingredientName) ? "−" : "+"}
                                          </span>
                                        </div>
                                        {openReferences.has(ingredientName) && (
                                          <div className="references-accordion-content">
                                            {/* Always show detailed Islamic references in full converter */}
                                            <>
                                              {issue?.quranReference && (
                                                <div className="reference-item">
                                                  <span className="reference-label">Qur'an Reference:</span>
                                                  <span className="reference-value quran-text">{issue.quranReference}</span>
                                                </div>
                                              )}
                                              {issue?.hadithReference && (
                                                <div className="reference-item">
                                                  <span className="reference-label">Hadith Reference:</span>
                                                  <span className="reference-value hadith-text">{issue.hadithReference}</span>
                                                </div>
                                              )}
                                            </>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {/* Culinary Guidance - Only show if helpful culinary information exists */}
                                    {issue?.culinaryNotes && (
                                      <div className="ingredient-detail-row">
                                        <span className="detail-label">Culinary Guidance:</span>
                                        <span className="detail-value culinary-notes-value">
                                          {typeof issue.culinaryNotes === 'string' 
                                            ? issue.culinaryNotes 
                                            : Array.isArray(issue.culinaryNotes)
                                              ? issue.culinaryNotes.map((note, idx) => (
                                                  <div key={idx} className="culinary-note-item">{note}</div>
                                                ))
                                              : issue.culinaryNotes}
                                        </span>
                                      </div>
                                    )}
                                    <CommunityTips
                                      ingredient={issue?.ingredient}
                                      replacement={issue?.replacement}
                                    />
                                    
                                    {/* Report Incorrect Substitution */}
                                    <div className="report-section">
                                      <button
                                        className="report-button"
                                        onClick={() => handleReportSubstitution(issue, idx)}
                                        aria-label="Report incorrect substitution"
                                      >
                                        Report incorrect substitution
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="no-issues-message">
                          No haram ingredients were detected in this recipe. All ingredients are halal-compliant!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <ContextualAd placement="recipe_conversion" className="conversion-results-ad" />
              </div>
            )}

            {safePublicRecipes.length > 0 && (
              <div className="public-recipes-section">
                <h2>
                  <Star className="section-icon-inline" aria-hidden="true" />
                  <span>{t("publicRecipes")}</span>
                </h2>
                <div className="saved-recipes-list">
                  {safePublicRecipes.map((recipeItem) => renderRecipeCard(recipeItem, true))}
                </div>
              </div>
            )}

            {safeSavedRecipes.length > 0 && (
              <div className="saved-recipes-section">
                <h2>
                  <Star className="section-icon-inline" aria-hidden="true" />
                  <span>{t("savedRecipes")}</span>
                  <Link to="/my-halal-recipes" className="saved-recipes-view-all">View all</Link>
                </h2>
                <div className="saved-recipes-list">
                  {safeSavedRecipes.map((recipeItem) => renderRecipeCard(recipeItem, false))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "feed" && <SocialFeed />}
        {activeTab === "profile" && <UserProfile />}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          if (activeTab === "create") {
            setActiveTab("convert");
          }
        }}
        onPost={handlePostCreated}
        originalRecipe={recipe}
        convertedRecipe={converted}
        confidenceScore={adjustConfidenceScore(safeConfidence)}
        issues={safeIssues}
        halalSettings={halalSettings}
      />

      {/* Share Halal Version Modal */}
      <ShareHalalModal
        isOpen={showShareHalalModal}
        onClose={() => setShowShareHalalModal(false)}
        recipe={recipe}
        converted={converted}
        issues={safeIssues}
      />

      {/* Ingredient scan (mobile): camera → OCR → halal summary */}
      <IngredientScanModal open={showScanModal} onClose={() => setShowScanModal(false)} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />

      {/* Bottom Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <footer className="app-footer">
        <p className="footer-text">© {new Date().getFullYear()} Halal Kitchen. Providing halal recipe conversion guidance.</p>
        <p className="footer-disclaimer">This tool provides general guidance and is not a religious ruling (fatwa). Consult a local scholar for complex cases.</p>
      </footer>
    </div>
  );
}

export default App;
