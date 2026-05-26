/**
 * Phase 3 — Server-authoritative recipe conversion (POST /convert).
 * @module lib/recipe/canonicalRecipeConversion
 */

import { getAxiosInstance } from "../../api/axiosConfig.js";
import { FEATURES } from "../featureFlags.js";
import { mapServerConversionResponse } from "./recipeConversionModel.js";

/**
 * @param {string} recipeText
 * @param {object} [userPreferences]
 * @returns {Promise<{
 *   originalText: string,
 *   convertedText: string,
 *   issues: object[],
 *   confidenceScore: number,
 *   error: { code: string, message: string } | null,
 *   pipeline?: string,
 * }>}
 */
export async function performCanonicalRecipeConversion(recipeText, userPreferences = {}) {
  const trimmed = (recipeText || "").trim();
  if (!trimmed) {
    return {
      originalText: "",
      convertedText: "",
      issues: [],
      confidenceScore: 0,
      error: null,
    };
  }

  if (!FEATURES.USE_SERVER_RECIPE_CONVERSION) {
    return {
      originalText: trimmed,
      convertedText: trimmed,
      issues: [],
      confidenceScore: 0,
      error: {
        code: "server_disabled",
        message:
          "Server recipe conversion is required. Enable USE_SERVER_RECIPE_CONVERSION or use legacy mode.",
      },
    };
  }

  try {
    const api = await getAxiosInstance();
    const res = await api.post("/convert", {
      recipe: trimmed,
      recipeText: trimmed,
      userPreferences,
    });

    if (res.data?.error) {
      return {
        originalText: trimmed,
        convertedText: trimmed,
        issues: [],
        confidenceScore: 0,
        error: {
          code: "convert_error",
          message: res.data.error,
        },
      };
    }

    const mapped = mapServerConversionResponse(res.data);
    return {
      ...mapped,
      error: null,
    };
  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "Recipe conversion failed. Check your connection and try again.";

    return {
      originalText: trimmed,
      convertedText: trimmed,
      issues: [],
      confidenceScore: 0,
      error: {
        code: err.response?.status === 403 ? "limit_reached" : "network_error",
        message,
      },
    };
  }
}
