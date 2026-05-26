/**
 * Apply pre-fetched affiliate maps to conversion issues (pure, no I/O).
 */

import { MAX_LINKS_PER_INGREDIENT } from "../../config/affiliateProviderConfig.js";
import { pickAffiliateLinksForSlug } from "./affiliateLinkModel.js";
import { toSubstituteSlug } from "./recommendations.js";

/**
 * @param {Array<object>} issues
 * @param {object} linksBySlug - normalized map from gateway
 * @returns {Array<object>}
 */
export function applyAffiliateLinksToIssues(issues, linksBySlug) {
  if (!issues?.length) return issues;

  return issues.map((issue) => {
    const replacementSlug = toSubstituteSlug(
      issue.replacement_id || issue.replacement
    );

    const substituteAffiliateLinks = replacementSlug
      ? pickAffiliateLinksForSlug(linksBySlug, replacementSlug, MAX_LINKS_PER_INGREDIENT)
      : [];

    const substitutesWithLinks = (issue.ranked_substitutes || []).map((sub) => {
      const altId = typeof sub === "string" ? sub : sub.id;
      const altSlug = toSubstituteSlug(altId);
      const links = altSlug
        ? pickAffiliateLinksForSlug(linksBySlug, altSlug, MAX_LINKS_PER_INGREDIENT)
        : [];
      return {
        ...(typeof sub === "object" ? sub : { id: altId }),
        affiliate_links: links,
      };
    });

    return {
      ...issue,
      substitute_affiliate_links: substituteAffiliateLinks,
      substitutes_with_links: substitutesWithLinks,
    };
  });
}
