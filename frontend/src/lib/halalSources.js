/**
 * Halal explanation sources: general Islamic dietary principles and halal certification guidelines.
 * Used below ingredient explanations. Framed as guidance; not presented as definitive fatwas.
 */

/** Short disclaimer shown with Sources (avoid presenting as religious ruling) */
export const SOURCES_DISCLAIMER =
  "This tool provides general guidance and is not a religious ruling.";

/** Section labels for the Sources block */
export const SOURCES_LABELS = {
  principles: "General Islamic dietary principles",
  certification: "Halal certification guidelines",
};

/** Major halal certification bodies (guidelines, not rulings) */
export const SOURCE_CERTIFICATION_BODIES = [
  {
    id: "ifanca",
    name: "IFANCA",
    fullName: "Islamic Food and Nutrition Council of America",
    region: "North America",
    note: "Widely recognized halal standards and certification guidelines.",
  },
  {
    id: "hfa",
    name: "HFA",
    fullName: "Halal Food Authority",
    region: "UK & Europe",
    note: "Leading halal certification body in Europe; provides certification guidelines.",
  },
  {
    id: "jakim",
    name: "JAKIM",
    fullName: "Jabatan Kemajuan Islam Malaysia",
    region: "Malaysia / International",
    note: "Official Malaysian halal standard (MS 1500); widely referenced in certification.",
  },
  {
    id: "muis",
    name: "MUIS",
    fullName: "Majlis Ugama Islam Singapura",
    region: "Singapore / Southeast Asia",
    note: "Official Singapore halal certification; internationally recognized guidelines.",
  },
];

/**
 * General Islamic dietary principles by ruling type.
 * Worded as widely held views / guidelines, not definitive fatwas.
 */
export const ISLAMIC_DIETARY_PRINCIPLES = {
  haram: [
    { text: "Pork and pork-derived products are explicitly prohibited in the Qur'an.", reference: "Qur'an 2:173" },
    { text: "Intoxicants (including alcohol) are prohibited in the Qur'an.", reference: "Qur'an 5:90" },
    { text: "Many scholars and certification bodies consider gelatin from non-halal sources impermissible unless certified.", reference: "Widely cited position; IFANCA, JAKIM guidelines" },
  ],
  conditional: [
    { text: "When source is uncertain, many scholars recommend halal certification or verification.", reference: "Common scholarly position" },
    { text: "Animal-derived ingredients (e.g. enzymes, rennet) are generally treated as requiring a known halal source or certification.", reference: "IFANCA, JAKIM guidelines" },
    { text: "Alcohol-based extracts (e.g. vanilla): opinions differ; many scholars prefer alcohol-free where available.", reference: "Various schools of thought" },
  ],
  halal: [
    { text: "Plant-based ingredients are generally considered halal unless contaminated or processed with haram substances.", reference: "Widely accepted principle" },
    { text: "Halal meat and animal products require slaughter according to Islamic guidelines.", reference: "Qur'an 5:3, 6:118" },
  ],
  unknown: [
    { text: "When in doubt, avoid or verify with a qualified scholar or halal-certified source.", reference: "Principle of caution (ihtiyat)" },
    { text: "Certification bodies provide verification guidelines for processed and packaged goods.", reference: "IFANCA, JAKIM, HFA" },
  ],
};

/** @deprecated Use ISLAMIC_DIETARY_PRINCIPLES */
export const SCHOLARLY_RULINGS = ISLAMIC_DIETARY_PRINCIPLES;

/**
 * Optional ingredient-specific source lines (principles + guidelines).
 * Shown in addition to status-based principles when present.
 * Keeps wording as guidance, not fatwa.
 */
export const INGREDIENT_SOURCES = {
  gelatin: {
    principles: [
      { text: "Prohibition of consuming what is derived from haram sources is widely cited.", reference: "Qur'an 2:173" },
      { text: "Many scholars hold that gelatin from pork or non-halal slaughter remains impermissible; halal-certified or plant-based alternatives are widely used.", reference: "Common scholarly position" },
    ],
    guidelines: [
      { text: "IFANCA, JAKIM and similar bodies typically require gelatin to be from halal slaughter or plant-derived for certification.", reference: "Halal certification guidelines" },
    ],
  },
  soy_sauce: {
    principles: [
      { text: "Intoxicants are prohibited; scholars differ on trace alcohol in fermented condiments.", reference: "Qur'an 5:90" },
      { text: "Many scholars recommend alcohol-free or halal-certified soy sauce when available; others accept minimal trace alcohol in fermented products.", reference: "Differing scholarly positions" },
    ],
    guidelines: [
      { text: "Certification bodies (e.g. JAKIM, IFANCA) set limits on alcohol content and require verification for halal-certified soy sauce.", reference: "Halal certification guidelines" },
    ],
  },
};

/**
 * Get sources for the Sources section: principles + certification guidelines.
 * Optionally include ingredient-specific lines when ingredientId is provided.
 * @param {string} status - "halal" | "haram" | "questionable" | "conditional" | "unknown"
 * @param {{ ingredientId?: string }} options - ingredientId for optional ingredient-specific sources
 * @returns {{ principles: Array<{text, reference}>, certificationBodies: Array, ingredientPrinciples?: Array, ingredientGuidelines?: Array, disclaimer: string }}
 */
export function getSourcesForRuling(status, options = {}) {
  const normalized = (status || "unknown").toLowerCase();
  const rulingKey =
    normalized === "haram" ? "haram" :
    normalized === "questionable" || normalized === "conditional" ? "conditional" :
    normalized === "halal" ? "halal" : "unknown";

  const principles = ISLAMIC_DIETARY_PRINCIPLES[rulingKey] || ISLAMIC_DIETARY_PRINCIPLES.unknown;
  const ingredientId = (options.ingredientId || "").toLowerCase().trim().replace(/\s+/g, "_");
  const ingredientSources = ingredientId ? INGREDIENT_SOURCES[ingredientId] : null;

  return {
    principles,
    certificationBodies: SOURCE_CERTIFICATION_BODIES,
    scholarlyRulings: principles, // backward compat
    ingredientPrinciples: ingredientSources?.principles || null,
    ingredientGuidelines: ingredientSources?.guidelines || null,
    disclaimer: SOURCES_DISCLAIMER,
    labels: SOURCES_LABELS,
  };
}
