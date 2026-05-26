/**
 * Recipe conversion orchestration — server-authoritative with explicit offline rollback only.
 */

import { useState, useCallback } from "react";
import { getAxiosInstance } from "../../api/axiosConfig";
import { FEATURES } from "../../lib/featureFlags";
import { convertRecipeWithJson } from "../../lib/convertRecipeJson";
import { performCanonicalRecipeConversion } from "../../lib/recipe/canonicalRecipeConversion";
import { enrichIssuesWithAffiliateLinks } from "../../lib/monetization";
import { isPremiumUser, trackConversion } from "../../lib/subscription";
import { trackConversionLimitHit, trackConversionLimitApproach } from "../../lib/premiumAnalytics";
import logger from "../../utils/logger";
import { applyLegacyHkmEnrichment } from "./legacyHkmEnrichment.js";

const CACHE_KEY = "lastConversionCache";

/**
 * @param {object} params
 * @param {object} params.halalSettings
 * @param {object} params.analytics - useAnalytics() return value
 */
export function useRecipeConversion({ halalSettings, analytics }) {
  const [converted, setConverted] = useState("");
  const [issues, setIssues] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [showCachedResult, setShowCachedResult] = useState(false);

  const resetAccordionHints = useCallback(() => ({
    closeAccordion: true,
    clearOpenCards: true,
  }), []);

  /**
   * @param {string|null} recipeText
   * @param {object} options
   * @param {string} [options.currentRecipe] - textarea state when recipeText omitted
   * @param {boolean} [options.isAutoConvert]
   */
  const convert = useCallback(
    async (recipeText = null, options = {}) => {
      const { currentRecipe = "", isAutoConvert = false } = options;

      const recipeToConvert =
        recipeText !== null && recipeText !== undefined ? recipeText : currentRecipe;

      if (recipeToConvert === null || recipeToConvert === undefined) {
        if (!isAutoConvert) alert("Please enter a recipe to convert.");
        return { ok: false, resetAccordionHints: resetAccordionHints() };
      }

      const recipeString =
        typeof recipeToConvert === "string" ? recipeToConvert : String(recipeToConvert || "");
      const trimmedRecipe = recipeString.trim();

      if (trimmedRecipe === "") {
        if (!isAutoConvert) alert("Please enter a recipe to convert.");
        return { ok: false, resetAccordionHints: resetAccordionHints() };
      }

      setError("");
      setIsOffline(false);
      setShowCachedResult(false);

      try {
        let convertedText = "";
        let convertedIssues = [];
        let convertedConfidence = 0;
        let jsonConversionUsed = false;
        let serverConversionUsed = false;

        if (FEATURES.USE_SERVER_RECIPE_CONVERSION) {
          const serverResult = await performCanonicalRecipeConversion(
            trimmedRecipe,
            halalSettings
          );
          if (serverResult.error) {
            if (
              FEATURES.USE_LEGACY_JSON_RECIPE_CONVERSION &&
              FEATURES.HALAL_KNOWLEDGE_ENGINE
            ) {
              console.warn(
                "[recipe-conversion] server failed, legacy JSON fallback:",
                serverResult.error.code
              );
            } else {
              setError(serverResult.error.message);
              setConverted("");
              setIssues([]);
              setConfidence(0);
              return { ok: false, resetAccordionHints: resetAccordionHints() };
            }
          } else {
            convertedText = serverResult.convertedText || "";
            convertedIssues = Array.isArray(serverResult.issues) ? serverResult.issues : [];
            convertedConfidence =
              typeof serverResult.confidenceScore === "number" &&
              !Number.isNaN(serverResult.confidenceScore)
                ? serverResult.confidenceScore
                : 0;
            serverConversionUsed = true;
            void enrichIssuesWithAffiliateLinks(convertedIssues).then((enriched) => {
              if (enriched?.length) setIssues(enriched);
            });
          }
        }

        if (
          !serverConversionUsed &&
          FEATURES.USE_JSON_CONVERSION_PRIMARY &&
          FEATURES.HALAL_KNOWLEDGE_ENGINE
        ) {
          try {
            const jsonResult = await convertRecipeWithJson(trimmedRecipe, halalSettings);
            convertedText = jsonResult.convertedText || "";
            convertedIssues = Array.isArray(jsonResult.issues) ? jsonResult.issues : [];
            convertedConfidence =
              typeof jsonResult.confidenceScore === "number" &&
              !Number.isNaN(jsonResult.confidenceScore)
                ? jsonResult.confidenceScore
                : typeof jsonResult.confidence === "number" && !Number.isNaN(jsonResult.confidence)
                  ? Math.round(jsonResult.confidence * 100)
                  : 0;
            jsonConversionUsed = true;
          } catch (jsonError) {
            console.warn("JSON conversion failed:", jsonError);
            if (!FEATURES.USE_SERVER_RECIPE_CONVERSION) {
              setError("Recipe conversion failed. Please try again.");
              return { ok: false, resetAccordionHints: resetAccordionHints() };
            }
          }
        }

        if (
          !serverConversionUsed &&
          !jsonConversionUsed &&
          FEATURES.USE_LEGACY_JSON_RECIPE_CONVERSION &&
          FEATURES.HALAL_KNOWLEDGE_ENGINE
        ) {
          try {
            const jsonResult = await convertRecipeWithJson(trimmedRecipe, halalSettings);
            convertedText = jsonResult.convertedText || "";
            convertedIssues = Array.isArray(jsonResult.issues) ? jsonResult.issues : [];
            convertedConfidence =
              typeof jsonResult.confidenceScore === "number"
                ? jsonResult.confidenceScore
                : 0;
            jsonConversionUsed = true;
          } catch (jsonError) {
            console.warn("Legacy JSON fallback failed:", jsonError);
            setError("Recipe conversion failed. Please try again.");
            return { ok: false, resetAccordionHints: resetAccordionHints() };
          }
        }

        // Explicit offline rollback only (dev): legacy POST /convert + client HKM
        if (
          FEATURES.USE_OFFLINE_CONVERSION_FALLBACK &&
          !serverConversionUsed &&
          !jsonConversionUsed
        ) {
          const api = await getAxiosInstance();
          const res = await api.post("/convert", { recipe: trimmedRecipe });

          if (res.data?.error) {
            setError(res.data.error);
            setConverted("");
            setIssues([]);
            setConfidence(0);
            return { ok: false, resetAccordionHints: resetAccordionHints() };
          }

          convertedText = res.data?.convertedText || "";
          convertedIssues = Array.isArray(res.data?.issues) ? res.data.issues : [];
          convertedConfidence =
            typeof res.data?.confidenceScore === "number" ? res.data.confidenceScore : 0;
          convertedIssues = applyLegacyHkmEnrichment(convertedIssues, halalSettings);
        }

        setConverted(convertedText);
        setIssues(convertedIssues);
        setConfidence(convertedConfidence);

        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              recipe: trimmedRecipe,
              converted: convertedText,
              issues: convertedIssues,
              confidence: convertedConfidence,
              timestamp: new Date().toISOString(),
            })
          );
        } catch (cacheErr) {
          logger.warn("Failed to cache conversion:", cacheErr);
        }

        const conversionResult = trackConversion();
        analytics.trackConversion({
          hasIssues: convertedIssues.length > 0,
          confidenceScore: convertedConfidence,
        });

        if (
          !isPremiumUser() &&
          conversionResult.remaining <= 2 &&
          conversionResult.remaining > 0
        ) {
          trackConversionLimitApproach(
            conversionResult.used,
            conversionResult.limit,
            conversionResult.remaining
          );
        }

        return {
          ok: true,
          isAutoConvert,
          resetAccordionHints: resetAccordionHints(),
          clearViewingRecipe: !isAutoConvert,
        };
      } catch (err) {
        logger.error("Conversion error:", err);

        let errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
        let usedCache = false;

        if (err.response) {
          errorMessage = err.response.data?.error || `Server error: ${err.response.status}`;
        } else if (
          err.request ||
          err.code === "ECONNREFUSED" ||
          err.message?.includes("Network Error")
        ) {
          errorMessage =
            "Unable to connect to the server. Please check your internet connection and try again.";

          try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              const cacheData = JSON.parse(cached);
              const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
              if (cacheAge < 24 * 60 * 60 * 1000) {
                usedCache = true;
                setIsOffline(true);
                setShowCachedResult(true);
                setConverted(cacheData.converted);
                setIssues(cacheData.issues || []);
                setConfidence(cacheData.confidence || 0);
                errorMessage =
                  "You're offline. Showing your last successful conversion. Please reconnect to convert a new recipe.";
              }
            }
          } catch (cacheErr) {
            logger.warn("Failed to load cached conversion:", cacheErr);
          }
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        if (!usedCache) {
          setConverted("");
          setIssues([]);
          setConfidence(0);
        }

        return { ok: false, resetAccordionHints: resetAccordionHints() };
      }
    },
    [halalSettings, analytics, resetAccordionHints]
  );

  return {
    converted,
    setConverted,
    issues,
    setIssues,
    confidence,
    setConfidence,
    error,
    setError,
    isOffline,
    showCachedResult,
    convert,
  };
}
