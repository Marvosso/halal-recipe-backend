/**
 * Deterministic explanation templates (no AI).
 */

const CATEGORY_INTROS = {
  plain_plant: "This is a plain plant ingredient and is generally permissible.",
  animal_byproduct: "This animal-derived ingredient depends on its source and certification.",
  flavoring_extract: "This flavoring may contain alcohol or animal-derived carriers; check the label.",
  cheese: "Cheese permissibility often depends on rennet and enzyme sources.",
  meat: "Meat is permissible when from halal slaughter and proper certification.",
  alcohol: "Intoxicating alcohol is not permissible in Islamic dietary guidance.",
  pork: "Pork and pork derivatives are not permissible.",
};

/**
 * @param {object} params
 * @returns {string}
 */
export function buildExplanation({
  verdict,
  baseDisplayName,
  category,
  modifiers = [],
  notes = "",
}) {
  if (notes && notes.trim()) {
    const name = baseDisplayName || "This ingredient";
    return `${name.charAt(0).toUpperCase() + name.slice(1)}: ${notes.trim()}`;
  }

  const name = baseDisplayName || "This ingredient";
  const modText =
    modifiers.filter((m) => m !== "unspecified").length > 0
      ? ` (${modifiers.filter((m) => m !== "unspecified").join(", ")})`
      : "";

  const intro = CATEGORY_INTROS[category] || "Review sourcing and certification when possible.";

  switch (verdict) {
    case "halal":
      return `${name}${modText} is generally considered halal. ${intro}`;
    case "usually_halal":
      return `${name}${modText} is usually halal, but sourcing can vary slightly. ${intro}`;
    case "conditional":
      return `${name}${modText} is conditional — verify source, processing, or halal certification. ${intro}`;
    case "usually_haram":
      return `${name}${modText} is usually not permissible in common commercial forms. ${intro}`;
    case "haram":
      return `${name}${modText} is not permissible. ${intro}`;
    default:
      return `${name}${modText} could not be classified with high certainty. Consult a scholar or certified source.`;
  }
}
