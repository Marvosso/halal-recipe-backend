export {
  isAffiliateRecommendationsEnabled,
  isContextualAdsEnabled,
  getAdSenseClient,
} from "./config.js";

export {
  toSubstituteSlug,
  shouldShowLookupRecommendations,
  extractLookupRecommendations,
  extractConversionRecommendations,
  collectSubstituteSlugsFromIssues,
} from "./recommendations.js";

export {
  normalizeAffiliateLink,
  fetchAffiliateLinksBySubstitute,
  pickAffiliateLinksForSlug,
  resolveAffiliateRegionCode,
} from "./affiliateGateway.js";

export {
  applyAffiliateLinksToIssues,
  enrichIssuesWithAffiliateLinks,
  enrichConversionIssuesWithAffiliates,
} from "./issueAffiliateEnrichment.js";
