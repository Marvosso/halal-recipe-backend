/**
 * AI Explanation Layer for Halal Kitchen.
 * Uses deterministic halal results as fixed input; never changes verdict.
 * Generates 2–4 sentence, plain-language explanations with guardrails.
 */

/** Structured input passed to the explanation generator (from rule engine only). */
export const EXPLANATION_INPUT_KEYS = [
  "ingredient_name",
  "modifiers",
  "halal_status",
  "confidence",
  "warnings",
  "references",
  "notes",
];

/**
 * Build structured input for the AI from a rule result.
 * Only passes through deterministic fields; no verdict is ever from AI.
 *
 * @param {object} ruleResult - From ingredientRuleEngine.evaluateIngredient or equivalent
 * @param {object} [options] - { references: Array<{ ref_type, ref_text }> }
 * @returns {object} Structured input for the prompt
 */
export function buildExplanationInput(ruleResult, options = {}) {
  if (!ruleResult) return {};
  const references = options.references || [];
  const ingredientName =
    ruleResult.displayName ||
    ruleResult.ingredient ||
    ruleResult.normalizedInput ||
    (ruleResult.base_slug && ruleResult.base_slug.replace(/_/g, " ")) ||
    "this ingredient";
  const modifiers = Array.isArray(ruleResult.modifiers)
    ? ruleResult.modifiers
    : ruleResult.modifier_slug
      ? [ruleResult.modifier_slug]
      : [];
  const halal_status = ruleResult.halal_status || ruleResult.verdict || "unknown";
  const confidence = ruleResult.confidence ?? ruleResult.confidence_level ?? "medium";
  const warnings = Array.isArray(ruleResult.warnings) ? ruleResult.warnings : [];
  const notes = ruleResult.notes || "";

  return {
    ingredient_name: ingredientName,
    modifiers: modifiers.filter((m) => m && m !== "unspecified"),
    halal_status,
    confidence: typeof confidence === "number" ? (confidence >= 0.8 ? "high" : confidence >= 0.4 ? "medium" : "low") : confidence,
    warnings,
    references: references.map((r) => ({ ref_type: r.ref_type, ref_text: r.ref_text })),
    notes,
  };
}

// -----------------------------------------------------------------------------
// Prompt template (system + user)
// -----------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are a helpful assistant that explains halal ingredient classifications for Halal Kitchen. You never issue religious rulings or fatwas.

Rules you must follow:
1. You MUST NOT change, override, or suggest a different halal status than the one provided. The status (halal, conditional, haram, etc.) is fixed and comes from our rule engine.
2. You MUST NOT invent or fabricate Islamic sources (Quran, hadith, scholar names). Only mention sources if they are explicitly provided in the input.
3. Use plain language. Write 2 to 4 sentences only.
4. For "conditional" or uncertain status, clearly mention that it depends on source or preparation, and that users should verify when possible.
5. Use "generally," "often," or "many scholars consider" where appropriate for disputed or conditional items—do not state absolutes.
6. Be respectful and trustworthy. Do not make fatwa-like claims or speak as an authority.`;

export const USER_PROMPT_TEMPLATE = `Given this deterministic halal classification result, write a short, clear explanation for the user. Do not change the status.

Ingredient: {{ingredient_name}}
Detected modifiers: {{modifiers}}
Halal status (fixed, do not change): {{halal_status}}
Confidence: {{confidence}}
Warnings (if any): {{warnings}}
Rule notes: {{notes}}
References (only mention if provided; do not invent): {{references}}

Write 2 to 4 sentences in plain language. Mention uncertainty when status is conditional. Do not fabricate sources.`;

/**
 * Fill the user prompt template with structured input.
 * @param {object} input - From buildExplanationInput
 * @returns {string}
 */
export function fillPromptTemplate(input) {
  const modifiers =
    input.modifiers && input.modifiers.length > 0
      ? input.modifiers.join(", ")
      : "none detected";
  const warnings =
    input.warnings && input.warnings.length > 0
      ? input.warnings.join(" ")
      : "none";
  const notes = input.notes || "—";
  const references =
    input.references && input.references.length > 0
      ? input.references.map((r) => `${r.ref_type}: ${r.ref_text}`).join("; ")
      : "none provided";

  return USER_PROMPT_TEMPLATE.replace(/\{\{ingredient_name\}\}/g, input.ingredient_name || "this ingredient")
    .replace(/\{\{modifiers\}\}/g, modifiers)
    .replace(/\{\{halal_status\}\}/g, input.halal_status || "unknown")
    .replace(/\{\{confidence\}\}/g, input.confidence || "medium")
    .replace(/\{\{warnings\}\}/g, warnings)
    .replace(/\{\{notes\}\}/g, notes)
    .replace(/\{\{references\}\}/g, references);
}

// -----------------------------------------------------------------------------
// Template fallback (no LLM): 2–4 sentences from structured input
// -----------------------------------------------------------------------------

const STATUS_PHRASES = {
  halal: "is generally considered halal",
  usually_halal: "is generally considered permissible",
  conditional: "is often considered conditional—it depends on the source or how it was made",
  usually_haram: "is generally not considered permissible",
  haram: "is not permissible",
  unknown: "could not be classified with confidence",
};

function sentenceForStatus(input) {
  const phrase = STATUS_PHRASES[input.halal_status] || "has an uncertain status";
  const name = input.ingredient_name || "This ingredient";
  if (input.modifiers && input.modifiers.length > 0) {
    return `${name} (${input.modifiers.join(", ")}) ${phrase}.`;
  }
  return `${name} ${phrase}.`;
}

function sentenceForUncertainty(input) {
  if (input.halal_status !== "conditional" && input.halal_status !== "unknown") return "";
  return "When in doubt, check the label for certification or consult a knowledgeable source.";
}

function sentenceFromNotes(input) {
  if (!input.notes || input.notes.trim() === "") return "";
  const n = input.notes.trim();
  if (n.length > 120) return n.slice(0, 117) + "...";
  return n;
}

function sentenceForReferences(input) {
  if (!input.references || input.references.length === 0) return "";
  const refs = input.references.slice(0, 2).map((r) => r.ref_text).join("; ");
  return `Islamic guidance on permitted and prohibited foods is found in sources such as ${refs}.`;
}

/**
 * Generate a 2–4 sentence explanation from structured input without calling an LLM.
 * Follows the same guardrails: no fatwa language, mention uncertainty, use "generally" where appropriate.
 *
 * @param {object} input - From buildExplanationInput
 * @returns {string}
 */
export function templateFallbackExplanation(input) {
  if (!input || !input.ingredient_name) return "";
  const sentences = [];
  sentences.push(sentenceForStatus(input));
  const fromNotes = sentenceFromNotes(input);
  if (fromNotes && !sentences.includes(fromNotes)) sentences.push(fromNotes);
  const uncertainty = sentenceForUncertainty(input);
  if (uncertainty) sentences.push(uncertainty);
  const refs = sentenceForReferences(input);
  if (refs) sentences.push(refs);
  return sentences.filter(Boolean).join(" ").trim() || sentences[0] || "";
}

// -----------------------------------------------------------------------------
// LLM call (optional)
// -----------------------------------------------------------------------------

/**
 * Call OpenAI Chat API for explanation. Returns null if no API key or on error.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} [options] - { model, max_tokens }
 * @returns {Promise<string|null>}
 */
export async function callOpenAIForExplanation(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") return null;
  const model = options.model || "gpt-4o-mini";
  const max_tokens = options.max_tokens ?? 200;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      console.warn("[aiExplanation] OpenAI API error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.warn("[aiExplanation] OpenAI request failed:", err.message);
    return null;
  }
}

/**
 * Generate explanation: try LLM if configured, else use template fallback.
 * Guardrails: we never use AI output to set or override halal_status; this function only returns text.
 *
 * @param {object} ruleResult - From rule engine
 * @param {object} [options] - { references: [], locale: 'en', useLLM: true }
 * @returns {Promise<string>}
 */
export async function generateExplanation(ruleResult, options = {}) {
  const { references = [], locale = "en", useLLM = true } = typeof options === "string" ? { locale: options } : options;
  const input = buildExplanationInput(ruleResult, { references });
  if (!input.ingredient_name && !ruleResult?.notes) return ruleResult?.notes || "";

  if (useLLM) {
    const userPrompt = fillPromptTemplate(input);
    const llmText = await callOpenAIForExplanation(SYSTEM_PROMPT, userPrompt);
    if (llmText) return llmText;
  }

  return templateFallbackExplanation(input) || ruleResult?.notes || "";
}
