/**
 * Phase 1+ consolidation feature flags (env-driven rollback).
 * Legacy paths are blocked in production unless ALLOW_LEGACY_IN_PRODUCTION=true.
 */

const env = typeof process !== "undefined" && process.env ? process.env : {};

function isProduction() {
  return env.NODE_ENV === "production";
}

function legacyAllowedInProduction() {
  return env.ALLOW_LEGACY_IN_PRODUCTION === "1" || env.ALLOW_LEGACY_IN_PRODUCTION === "true";
}

function warnLegacyFlag(name) {
  console.warn(`[FLAGS] ${name} active — non-canonical pipeline in use`);
}

/**
 * When true, POST /convert/classify-ingredient may use legacy halalClassificationService
 * for OCR/recipe-context requests. Default false — canonical lookup only.
 * Blocked in production unless ALLOW_LEGACY_IN_PRODUCTION=true.
 */
export function isLegacyHybridClassifyEnabled() {
  const v = env.LEGACY_HYBRID_CLASSIFY;
  const enabled = v === "1" || v === "true";
  if (!enabled) return false;
  if (isProduction() && !legacyAllowedInProduction()) {
    console.warn(
      "[FLAGS] LEGACY_HYBRID_CLASSIFY ignored in production (set ALLOW_LEGACY_IN_PRODUCTION=true to override)"
    );
    return false;
  }
  warnLegacyFlag("LEGACY_HYBRID_CLASSIFY");
  return true;
}

/**
 * Phase 3: recipe conversion via ingredient-intelligence (canonical).
 * Set USE_LEGACY_RECIPE_CONVERSION=true to use halalConverter.js only.
 * Blocked in production unless ALLOW_LEGACY_IN_PRODUCTION=true.
 */
export function isServerRecipeConversionEnabled() {
  const legacyRequested =
    env.USE_LEGACY_RECIPE_CONVERSION === "1" || env.USE_LEGACY_RECIPE_CONVERSION === "true";
  if (legacyRequested) {
    if (isProduction() && !legacyAllowedInProduction()) {
      console.warn(
        "[FLAGS] USE_LEGACY_RECIPE_CONVERSION ignored in production — intelligence pipeline enforced"
      );
    } else {
      warnLegacyFlag("USE_LEGACY_RECIPE_CONVERSION");
      return false;
    }
  }
  if (env.USE_SERVER_RECIPE_CONVERSION === "0" || env.USE_SERVER_RECIPE_CONVERSION === "false") {
    if (isProduction() && !legacyAllowedInProduction()) {
      console.warn(
        "[FLAGS] USE_SERVER_RECIPE_CONVERSION=false ignored in production — intelligence pipeline enforced"
      );
    } else {
      return false;
    }
  }
  return true;
}

/**
 * Dev-only routes (/api/dev/*). Requires ENABLE_DEV_ROUTES=true in production.
 */
export function isDevRoutesEnabled() {
  if (!isProduction()) return true;
  return env.ENABLE_DEV_ROUTES === "1" || env.ENABLE_DEV_ROUTES === "true";
}