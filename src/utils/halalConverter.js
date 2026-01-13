import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to CSV file
const csvFilePath = path.resolve(__dirname, "../data/haram_ingredients.csv");

// Cache for parsed CSV data
let halalMap = null;
let ingredientList = null;

/**
 * Load and parse CSV data into memory
 * Uses caching to avoid re-reading file on every request
 */
const loadHalalMap = () => {
  if (halalMap !== null) {
    return { halalMap, ingredientList };
  }

  try {
    // Read CSV file
    const fileContent = fs.readFileSync(csvFilePath, "utf8");

    // Parse CSV into records
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Build lookup maps
    halalMap = {};
    ingredientList = [];

    records.forEach((row) => {
      const name = row.haram_ingredient?.trim();
      if (!name) return;

      const aliases = row.aliases
        ? row.aliases
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        : [];

      const entry = {
        haramIngredient: name,
        aliases: aliases,
        replacement: row.halal_alternative?.trim() || "",
        ratio: row.conversion_ratio?.trim() || "",
        flavor: row.flavor_role?.trim() || "",
        cuisine: row.cuisine?.trim() || "",
        severity: row.severity?.trim().toLowerCase() || "medium",
        notes: row.notes?.trim() || "",
        quranReference: row.quran_reference?.trim() || "",
        hadithReference: row.hadith_reference?.trim() || "",
      };

      // Store by lowercase name for case-insensitive lookup
      const key = name.toLowerCase();
      halalMap[key] = entry;

      // Add to ingredient list for detection
      ingredientList.push({
        name: name.toLowerCase(),
        aliases: aliases.map((a) => a.toLowerCase()),
        entry: entry,
      });
    });

    return { halalMap, ingredientList };
  } catch (error) {
    console.error("Error loading halal map from CSV:", error);
    // Return empty maps on error to prevent crashes
    halalMap = {};
    ingredientList = [];
    return { halalMap, ingredientList };
  }
};

/**
 * Detect haram ingredients in recipe text
 * Returns array of detected ingredients with their details
 */
const detectHaramIngredients = (recipeText) => {
  if (!recipeText || typeof recipeText !== "string") {
    return [];
  }

  const { ingredientList } = loadHalalMap();
  const detected = [];
  const textLower = recipeText.toLowerCase();

  ingredientList.forEach((item) => {
    const allNames = [item.name, ...item.aliases].filter(Boolean);

    allNames.forEach((name) => {
      // Use word boundary regex for accurate detection
      const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      if (regex.test(recipeText)) {
        // Check if already detected (avoid duplicates)
        const alreadyDetected = detected.some(
          (d) => d.ingredient.toLowerCase() === name
        );

        if (!alreadyDetected) {
          detected.push({
            ingredient: name,
            haramIngredient: item.entry.haramIngredient,
            replacement: item.entry.replacement,
            notes: item.entry.notes,
            severity: item.entry.severity,
            flavor: item.entry.flavor,
            ratio: item.entry.ratio,
            quranReference: item.entry.quranReference,
            hadithReference: item.entry.hadithReference,
          });
        }
      }
    });
  });

  return detected;
};

/**
 * Replace haram ingredients with halal alternatives in recipe text
 */
const replaceIngredients = (recipeText, detectedIngredients) => {
  if (!recipeText || typeof recipeText !== "string") {
    return recipeText;
  }

  if (!Array.isArray(detectedIngredients) || detectedIngredients.length === 0) {
    return recipeText;
  }

  let convertedText = recipeText;

  detectedIngredients.forEach((item) => {
    const { ingredient, replacement } = item;

    if (!replacement || replacement.trim() === "") {
      return; // Skip if no replacement available
    }

    // Replace all occurrences with word boundaries
    const regex = new RegExp(
      `\\b${ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );
    convertedText = convertedText.replace(regex, replacement);
  });

  return convertedText;
};

/**
 * Calculate confidence score based on detected ingredients and replacements
 * - 100% if all haram ingredients have replacements
 * - Lower if some are unknown or partial
 */
const calculateConfidenceScore = (detectedIngredients) => {
  if (!Array.isArray(detectedIngredients) || detectedIngredients.length === 0) {
    return 100; // No haram ingredients = 100% confidence
  }

  const totalDetected = detectedIngredients.length;
  const withReplacement = detectedIngredients.filter(
    (item) => item.replacement && item.replacement.trim() !== ""
  ).length;
  const withoutReplacement = totalDetected - withReplacement;

  // Base score: percentage of ingredients with replacements
  let baseScore = (withReplacement / totalDetected) * 100;

  // Penalty for high-severity items without replacements
  const highSeverityMissing = detectedIngredients.filter(
    (item) =>
      !item.replacement &&
      item.severity &&
      item.severity.toLowerCase() === "high"
  ).length;

  // Apply penalty: -10 points per high-severity missing replacement
  const penalty = highSeverityMissing * 10;
  const finalScore = Math.max(0, Math.min(100, baseScore - penalty));

  return Math.round(finalScore);
};

/**
 * Main conversion function
 * Converts recipe text by detecting and replacing haram ingredients
 */
export const convertRecipe = (recipeText) => {
  // Defensive checks
  if (!recipeText || typeof recipeText !== "string") {
    return {
      originalText: "",
      convertedText: "",
      issues: [],
      confidenceScore: 0,
    };
  }

  const trimmedText = recipeText.trim();
  if (trimmedText === "") {
    return {
      originalText: "",
      convertedText: "",
      issues: [],
      confidenceScore: 0,
    };
  }

  try {
    // Step 1: Detect haram ingredients
    const detectedIngredients = detectHaramIngredients(trimmedText);

    // Step 2: Replace ingredients in text
    const convertedText = replaceIngredients(trimmedText, detectedIngredients);

    // Step 3: Calculate confidence score
    const confidenceScore = calculateConfidenceScore(detectedIngredients);

    // Step 4: Format issues for API response
    const issues = detectedIngredients.map((item) => {
      const quranRef = item.quranReference || "";
      const hadithRef = item.hadithReference || "";
      const reference = [quranRef, hadithRef].filter(Boolean).join("; ") || "";
      
      return {
        ingredient: item.ingredient,
        replacement: item.replacement || "No replacement available",
        notes: item.notes || "",
        severity: item.severity || "medium",
        flavor: item.flavor || "",
        quranReference: quranRef,
        hadithReference: hadithRef,
        reference: reference,
      };
    });

    return {
      originalText: trimmedText,
      convertedText: convertedText,
      issues: issues,
      confidenceScore: confidenceScore,
    };
  } catch (error) {
    console.error("Error in convertRecipe:", error);
    // Return safe fallback on error
    return {
      originalText: trimmedText,
      convertedText: trimmedText,
      issues: [],
      confidenceScore: 0,
    };
  }
};
