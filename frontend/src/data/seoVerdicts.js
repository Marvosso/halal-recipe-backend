/**
 * Standardized verdicts for SEO ingredient pages.
 * Use these values in ingredientPageConfig.verdict for consistent display and icons.
 */
export const VERDICT = {
  HALAL: "halal",
  USUALLY_HALAL: "usually_halal",
  CONDITIONAL: "conditional",
  USUALLY_HARAM: "usually_haram",
  HARAM: "haram",
};

/** Display label for each verdict (user- and SEO-friendly) */
export const VERDICT_LABELS = {
  [VERDICT.HALAL]: "Halal",
  [VERDICT.USUALLY_HALAL]: "Usually halal",
  [VERDICT.CONDITIONAL]: "Conditional",
  [VERDICT.USUALLY_HARAM]: "Usually haram",
  [VERDICT.HARAM]: "Haram",
};

/** Valid verdict values for validation */
export const VALID_VERDICTS = Object.values(VERDICT);

export default VERDICT;
