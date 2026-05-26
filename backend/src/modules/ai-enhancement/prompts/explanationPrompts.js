/**
 * Explanation prompt templates — guardrailed, non-authoritative, uncertainty-aware.
 */

export const SYSTEM_PROMPT = `You are a helpful writing assistant for Halal Kitchen, a practical halal ingredient information tool.

STRICT RULES (never break these):
1. The halal_status and verdict in the user message are FINAL — from a deterministic rule engine. You must NOT change, debate, or re-label them.
2. Do NOT issue fatwas, religious rulings, or speak as an Islamic authority.
3. Do NOT invent Quran verses, hadith, scholar names, or certifications not provided in the input.
4. Use careful language: "generally," "often," "many Muslims check," "depends on source" — not absolutes like "Islam declares…"
5. For conditional or unknown status, clearly acknowledge uncertainty and suggest verifying labels or consulting a knowledgeable source.
6. Write 2–4 short sentences in plain language for someone shopping or cooking.
7. Respond with valid JSON only, matching the required schema.`;

export const USER_PROMPT_TEMPLATE = `Write an ingredient explanation using ONLY the facts below. The classification is already decided — explain it, do not change it.

REQUIRED JSON schema:
{
  "explanation": "2-4 sentences, plain language",
  "tone": "neutral" | "cautious" | "reassuring",
  "uncertainty_acknowledged": true or false
}

Deterministic classification (DO NOT CHANGE):
- Ingredient: {{ingredient_name}}
- Base ingredient: {{base_ingredient}}
- Modifiers detected: {{modifiers}}
- Verdict (fixed): {{verdict}}
- Halal status (fixed): {{halal_status}}
- Confidence level: {{confidence_level}}
- Existing warnings: {{warnings}}
- Rule notes: {{notes}}
- References (mention only if listed; never invent): {{references}}

If status is conditional or unknown, uncertainty_acknowledged must be true.`;

export const JSON_RESPONSE_INSTRUCTION =
  'Return only a JSON object with keys: explanation, tone, uncertainty_acknowledged.';

/**
 * @param {import("../contracts/explanationContract.js").ExplanationDeterministicInput} input
 */
export function fillUserPrompt(input) {
  const modifiers =
    input.modifiers?.length > 0 ? input.modifiers.join(", ") : "none detected";
  const warnings =
    input.warnings?.length > 0 ? input.warnings.join(" ") : "none";
  const notes = input.notes?.trim() || "—";
  const references =
    input.references?.length > 0
      ? input.references.map((r) => `${r.ref_type}: ${r.ref_text}`).join("; ")
      : "none provided";

  return USER_PROMPT_TEMPLATE.replace(/\{\{ingredient_name\}\}/g, input.ingredient_name || "this ingredient")
    .replace(/\{\{base_ingredient\}\}/g, input.base_ingredient || "—")
    .replace(/\{\{modifiers\}\}/g, modifiers)
    .replace(/\{\{verdict\}\}/g, input.verdict || "unknown")
    .replace(/\{\{halal_status\}\}/g, input.halal_status || "unknown")
    .replace(/\{\{confidence_level\}\}/g, input.confidence_level || "medium")
    .replace(/\{\{warnings\}\}/g, warnings)
    .replace(/\{\{notes\}\}/g, notes)
    .replace(/\{\{references\}\}/g, references);
}
