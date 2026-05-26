/**
 * Structured AI contracts — explanation layer only.
 * Deterministic classification is input; AI returns prose + tone only.
 */

export const EXPLANATION_INPUT_SCHEMA_VERSION = "1.0";

/** @typedef {object} ExplanationDeterministicInput */
export const EXPLANATION_INPUT_FIELDS = Object.freeze([
  "schema_version",
  "ingredient_name",
  "base_ingredient",
  "modifiers",
  "verdict",
  "halal_status",
  "confidence_level",
  "confidence_score",
  "warnings",
  "references",
  "notes",
  "category",
  "locale",
]);

/** @typedef {object} ExplanationAIOutput */
export const EXPLANATION_OUTPUT_FIELDS = Object.freeze([
  "explanation",
  "tone",
  "uncertainty_acknowledged",
]);

export const EXPLANATION_TONES = Object.freeze(["neutral", "cautious", "reassuring"]);

export const FORBIDDEN_OUTPUT_KEYS = Object.freeze([
  "halal_status",
  "verdict",
  "confidence",
  "confidence_level",
  "confidence_score",
  "ruling",
  "fatwa",
  "is_halal",
  "is_haram",
]);

/**
 * Build contract input from intelligence evaluation (post-deterministic only).
 * @param {object} evaluation - From evaluateIngredientIntelligence
 * @param {object} [options]
 * @returns {ExplanationDeterministicInput}
 */
export function buildExplanationInput(evaluation, options = {}) {
  const refs = (evaluation.references || []).map((r) =>
    typeof r === "string"
      ? { ref_type: "general", ref_text: r }
      : { ref_type: r.ref_type || "general", ref_text: r.ref_text || "" }
  );

  const modifiers = evaluation.modifier_slugs?.length
    ? evaluation.modifier_slugs
    : (evaluation.modifiers || []).map((m) => (typeof m === "string" ? m : m.slug)).filter(Boolean);

  const warnings = normalizeWarningsForInput(evaluation.warnings);

  return {
    schema_version: EXPLANATION_INPUT_SCHEMA_VERSION,
    ingredient_name:
      evaluation.base_ingredient?.display_name ||
      evaluation.baseSlug?.replace(/_/g, " ") ||
      evaluation.query ||
      "this ingredient",
    base_ingredient: evaluation.baseSlug || evaluation.base_ingredient?.slug || null,
    modifiers: modifiers.filter((m) => m && m !== "unspecified"),
    verdict: evaluation.verdict || evaluation.halal_status || "unknown",
    halal_status: evaluation.halal_status || evaluation.verdict || "unknown",
    confidence_level: evaluation.confidence_level || "medium",
    confidence_score: evaluation.confidence_score ?? null,
    warnings,
    references: refs,
    notes: evaluation.notes || "",
    category: evaluation.category || evaluation.base_ingredient?.category || null,
    locale: options.locale || "en",
  };
}

function normalizeWarningsForInput(warnings) {
  if (!Array.isArray(warnings)) return [];
  return warnings.map((w) => (typeof w === "string" ? w : w.message || String(w))).filter(Boolean);
}

/**
 * Validate and sanitize AI JSON/text output. Strips forbidden keys; never returns verdict fields.
 * @param {object|string} raw
 * @returns {ExplanationAIOutput|null}
 */
export function parseExplanationOutput(raw) {
  if (!raw) return null;

  let obj = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    try {
      if (trimmed.startsWith("{")) {
        obj = JSON.parse(trimmed);
      } else {
        return sanitizeExplanationOutput({ explanation: trimmed, tone: "neutral" });
      }
    } catch {
      return sanitizeExplanationOutput({ explanation: trimmed, tone: "neutral" });
    }
  }

  return sanitizeExplanationOutput(obj);
}

/**
 * @param {object} obj
 * @returns {ExplanationAIOutput|null}
 */
export function sanitizeExplanationOutput(obj) {
  if (!obj || typeof obj !== "object") return null;

  for (const key of FORBIDDEN_OUTPUT_KEYS) {
    if (key in obj) {
      console.warn("[ai-explanation] Stripped forbidden AI output key:", key);
      delete obj[key];
    }
  }

  const explanation = String(obj.explanation || obj.text || "").trim();
  if (!explanation) return null;

  if (containsFatwaLanguage(explanation)) {
    console.warn("[ai-explanation] Rejected output with fatwa-like language");
    return null;
  }

  const tone = EXPLANATION_TONES.includes(obj.tone) ? obj.tone : inferTone(obj);

  return {
    explanation,
    tone,
    uncertainty_acknowledged: Boolean(
      obj.uncertainty_acknowledged ??
        /verify|depends|check the label|when in doubt|uncertain|may vary/i.test(explanation)
    ),
  };
}

function inferTone(obj) {
  const v = obj.verdict || obj.halal_status;
  if (v === "conditional" || v === "unknown") return "cautious";
  if (v === "halal" || v === "usually_halal") return "reassuring";
  return "neutral";
}

const FATWA_PATTERNS = [
  /\bislam declares\b/i,
  /\b(is|are)\s+halal\s*$/i,
  /\b(is|are)\s+haram\s*$/i,
  /\bthis is a fatwa\b/i,
  /\breligiously forbidden\b/i,
  /\ballah has ruled\b/i,
  /\bshariah mandates\b/i,
];

function containsFatwaLanguage(text) {
  return FATWA_PATTERNS.some((p) => p.test(text));
}

/**
 * Fingerprint for cache keys — verdict fields from deterministic engine only.
 * @param {ExplanationDeterministicInput} input
 */
export function buildExplanationCacheKey(input) {
  const mods = [...(input.modifiers || [])].sort().join(",");
  const warn = (input.warnings || []).slice(0, 3).join("|").slice(0, 80);
  const base = input.base_ingredient || input.ingredient_name || "";
  return [
    "exp",
    input.locale || "en",
    base,
    input.verdict,
    input.halal_status,
    input.confidence_level,
    mods,
    warn,
  ]
    .join(":")
    .toLowerCase()
    .replace(/\s+/g, "_");
}
