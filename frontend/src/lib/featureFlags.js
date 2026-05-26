export const FEATURES = {
  HALAL_KNOWLEDGE_ENGINE: true,
  HALAL_ENGINE_SAFE_MODE: true,
  /** @deprecated Client-primary JSON path; use USE_SERVER_RECIPE_CONVERSION */
  USE_JSON_CONVERSION_PRIMARY: false,
  /**
   * Phase 3: Recipe conversion requires POST /convert (ingredient-intelligence pipeline).
   * On failure, optional legacy JSON path only if VITE_USE_LEGACY_JSON_RECIPE_CONVERSION=true.
   */
  USE_SERVER_RECIPE_CONVERSION: true,
  USE_LEGACY_JSON_RECIPE_CONVERSION:
    import.meta.env.PROD
      ? false
      : import.meta.env.VITE_USE_LEGACY_JSON_RECIPE_CONVERSION === "true",
  /**
   * When false (default), UI must not adjust recipe confidence for strictness/madhab.
   * Scores come only from server/legacy conversion pipelines.
   */
  USE_UI_CONFIDENCE_ADJUSTMENTS: false,
  /**
   * Phase 1: Quick Lookup requires POST /api/lookup (authoritative).
   * On failure, shows last server-cached result only — never client halalEngine.
   */
  USE_SERVER_LOOKUP: true,
  /**
   * Explicit offline/dev rollback: legacy POST /convert + client HKM enrichment.
   * Never enabled in production builds. Does not change server verdicts.
   */
  USE_OFFLINE_CONVERSION_FALLBACK:
    !import.meta.env.PROD &&
    import.meta.env.VITE_OFFLINE_CONVERSION_FALLBACK === "true",
  /**
   * Phase 1: Label scan requires POST /api/scan (per-token intelligence engine).
   * When false, scan shows an error instead of client evaluateItem.
   */
  USE_SERVER_SCAN: true,
};
