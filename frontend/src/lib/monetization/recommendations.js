/**
 * Contextual substitute recommendations from lookup / conversion results.
 * Keeps monetization logic out of UI components.
 */

/** @param {string} nameOrSlug */
export function toSubstituteSlug(nameOrSlug) {
  if (!nameOrSlug || typeof nameOrSlug !== "string") return null;
  const s = nameOrSlug.trim();
  if (!s) return null;
  if (s.includes("_") && !/\s/.test(s)) return s.toLowerCase();
  return s
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/**
 * Collect substitute slugs from conversion issues (shared lookup + conversion).
 * @param {Array<object>} issues
 * @returns {string[]}
 */
export function collectSubstituteSlugsFromIssues(issues = []) {
  const ids = new Set();
  for (const issue of issues) {
    const replacementId = issue.replacement_id || issue.replacement;
    if (replacementId && replacementId !== "Halal alternative needed") {
      const slug = toSubstituteSlug(replacementId);
      if (slug) ids.add(slug);
    }
    for (const sub of issue.ranked_substitutes || []) {
      const id = typeof sub === "string" ? sub : sub?.id;
      const slug = toSubstituteSlug(id);
      if (slug) ids.add(slug);
    }
    for (const alt of issue.alternatives || []) {
      const slug = toSubstituteSlug(typeof alt === "string" ? alt : alt?.id);
      if (slug) ids.add(slug);
    }
  }
  return [...ids];
}

/**
 * Whether lookup result should show substitute shopping tips.
 * @param {object|null} result - normalized lookup result
 */
export function shouldShowLookupRecommendations(result) {
  if (!result?.substitutes?.all?.length) return false;
  if (result.statusClass === "halal" && result.verdict === "halal") return false;
  return true;
}

/**
 * @param {object} result
 * @param {{ maxItems?: number }} [options]
 * @returns {Array<{ slug: string, name: string, reason: string, isPrimary: boolean, originalSlug: string|null, originalName: string }>}
 */
export function extractLookupRecommendations(result, options = {}) {
  if (!shouldShowLookupRecommendations(result)) return [];
  const max = options.maxItems ?? 2;
  const baseSlug = result.baseIngredient || null;

  return (result.substitutes.all || [])
    .slice(0, max)
    .map((sub, index) => {
      const slug = sub.slug || toSubstituteSlug(sub.name);
      if (!slug) return null;
      return {
        slug,
        name: sub.name || slug.replace(/_/g, " "),
        reason: sub.reason || "",
        isPrimary: index === 0,
        originalSlug: baseSlug,
        originalName: result.displayName,
      };
    })
    .filter(Boolean);
}

/**
 * Shop tips from recipe conversion issues (links loaded deferred via gateway).
 * @param {Array<object>} issues
 * @param {{ maxItems?: number }} [options]
 */
export function extractConversionRecommendations(issues = [], options = {}) {
  const max = options.maxItems ?? 3;
  const out = [];
  const seen = new Set();

  for (const issue of issues) {
    if (out.length >= max) break;
    const replacementId = issue.replacement_id || issue.replacement;
    if (!replacementId || replacementId === "Halal alternative needed") continue;

    const slug = toSubstituteSlug(replacementId);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    out.push({
      slug,
      name: issue.replacement || slug.replace(/_/g, " "),
      reason:
        issue.ranked_substitutes?.find((s) => s.id === replacementId)?.why_it_works ||
        issue.notes ||
        "",
      isPrimary: out.length === 0,
      originalSlug: toSubstituteSlug(issue.ingredient_id || issue.ingredient),
      originalName: issue.ingredient || issue.ingredient_id,
    });
  }

  return out;
}
