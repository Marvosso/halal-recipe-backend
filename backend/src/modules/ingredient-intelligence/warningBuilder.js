/**
 * Deterministic warnings from verdict and notes.
 */

/**
 * @param {{ verdict: string, notes?: string }} evaluation
 * @returns {string[]}
 */
export function buildWarnings({ verdict, notes = "" }) {
  const w = [];
  if (verdict === "conditional") {
    w.push("Source or preparation may affect permissibility; verify when possible.");
  }
  if (verdict === "usually_haram" || verdict === "haram") {
    w.push("Not permissible; use a halal substitute.");
  }
  if (verdict === "unknown") {
    w.push("Not in rule database; consult a scholar or certified source.");
  }
  if (verdict === "usually_halal") {
    w.push("Generally permissible; verify label when source is unclear.");
  }
  if (notes && /check|verify|must be halal|certified/i.test(notes) && !w.includes(notes)) {
    w.push(notes);
  }
  return w;
}
