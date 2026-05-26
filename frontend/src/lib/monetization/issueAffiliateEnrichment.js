/**
 * Fetch + attach affiliate links to conversion issues.
 */

import {
  fetchAffiliateLinksBySubstitute,
} from "./affiliateGateway.js";
import { applyAffiliateLinksToIssues } from "./issueAffiliateApply.js";
import { collectSubstituteSlugsFromIssues } from "./recommendations.js";
import { isAffiliateRecommendationsEnabled } from "./config.js";

export { applyAffiliateLinksToIssues } from "./issueAffiliateApply.js";

/**
 * @param {Array<object>} issues
 * @param {{ regionCode?: string, enabled?: boolean }} [options]
 * @returns {Promise<Array<object>>}
 */
export async function enrichIssuesWithAffiliateLinks(issues, options = {}) {
  if (!issues?.length) return issues;

  const enabled = options.enabled ?? isAffiliateRecommendationsEnabled();
  if (!enabled) return issues;

  const slugs = collectSubstituteSlugsFromIssues(issues);
  if (slugs.length === 0) return issues;

  try {
    const linksBySlug = await fetchAffiliateLinksBySubstitute(slugs, {
      regionCode: options.regionCode,
    });
    return applyAffiliateLinksToIssues(issues, linksBySlug);
  } catch (err) {
    console.warn("[monetization] issue affiliate enrichment failed:", err);
    return issues;
  }
}

/** @deprecated alias */
export const enrichConversionIssuesWithAffiliates = enrichIssuesWithAffiliateLinks;
