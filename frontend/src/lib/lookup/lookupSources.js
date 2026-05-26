/** @typedef {'typed'|'ocr'|'recipe'|'seo'} LookupSource */

/**
 * Resolve lookup source for API (matches backend lookupService.sourceToIntent).
 * @param {string} [source]
 * @returns {LookupSource}
 */
export function resolveLookupSource(source = "typed") {
  const allowed = new Set(["typed", "ocr", "recipe", "seo", "known_page"]);
  return allowed.has(source) ? (source === "known_page" ? "seo" : source) : "typed";
}
