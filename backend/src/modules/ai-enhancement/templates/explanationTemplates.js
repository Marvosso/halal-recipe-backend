/**
 * Template fallback explanations — no LLM, same guardrails as AI layer.
 */

const STATUS_PHRASES = {
  halal: "is generally considered permissible by many Muslims",
  usually_halal: "is usually considered permissible, though details can vary by brand",
  conditional:
    "is often considered conditional — it depends on how it was sourced or processed",
  usually_haram: "is commonly avoided because many commercial forms raise concerns",
  haram: "is generally not considered permissible",
  unknown: "could not be classified with high confidence in our database",
};

/**
 * @param {import("../contracts/explanationContract.js").ExplanationDeterministicInput} input
 * @returns {import("../contracts/explanationContract.js").ExplanationAIOutput}
 */
export function generateTemplateExplanation(input) {
  const name = input.ingredient_name || "This ingredient";
  const phrase = STATUS_PHRASES[input.verdict] || STATUS_PHRASES[input.halal_status] || STATUS_PHRASES.unknown;
  const modPart =
    input.modifiers?.length > 0 ? ` With modifiers noted (${input.modifiers.join(", ")}),` : "";

  const sentences = [];
  sentences.push(`${name}${modPart} ${phrase}.`);

  if (input.notes?.trim()) {
    sentences.push(input.notes.trim().length > 140 ? `${input.notes.trim().slice(0, 137)}...` : input.notes.trim());
  }

  const needsUncertainty =
    input.verdict === "conditional" ||
    input.verdict === "unknown" ||
    input.halal_status === "conditional" ||
    input.confidence_level === "low";

  if (needsUncertainty) {
    sentences.push(
      "Check the product label for halal certification when available, or consult a knowledgeable source if you are unsure."
    );
  }

  if (input.references?.length > 0) {
    const refs = input.references
      .slice(0, 2)
      .map((r) => r.ref_text)
      .join("; ");
    sentences.push(`General dietary guidance may reference sources such as ${refs} — we do not issue religious rulings.`);
  }

  const explanation = sentences.filter(Boolean).join(" ").trim();
  const tone =
    needsUncertainty ? "cautious" : input.verdict === "halal" || input.verdict === "usually_halal" ? "reassuring" : "neutral";

  return {
    explanation,
    tone,
    uncertainty_acknowledged: needsUncertainty,
  };
}
