import React, { useMemo } from "react";
import { Leaf } from "lucide-react";
import SubstitutePurchaseCard from "../SubstitutePurchaseCard";
import { useDeferredAffiliateLinks } from "../../hooks/useDeferredAffiliateLinks";
import {
  extractLookupRecommendations,
  isAffiliateRecommendationsEnabled,
} from "../../lib/monetization";
import "./ContextualSubstituteRecommendations.css";

/**
 * Trust-first contextual monetization: halal substitute shop tips only.
 * Renders below verdict content; affiliate fetch is deferred (no lookup delay).
 *
 * @param {object} props
 * @param {object} props.result - normalized lookup result
 * @param {"lookup"|"conversion"} [props.context]
 * @param {Array<object>} [props.recommendations] - pre-built (conversion); else from result
 */
function ContextualSubstituteRecommendations({
  result,
  context = "lookup",
  recommendations: recommendationsProp,
}) {
  const enabled = isAffiliateRecommendationsEnabled();

  const recommendations = useMemo(() => {
    if (recommendationsProp?.length) return recommendationsProp;
    if (!result) return [];
    return extractLookupRecommendations(result, { maxItems: 2 });
  }, [result, recommendationsProp]);

  const slugs = useMemo(
    () => recommendations.map((r) => r.slug).filter(Boolean),
    [recommendations]
  );

  const { linksBySlug, isLoading } = useDeferredAffiliateLinks(slugs, {
    enabled: enabled && slugs.length > 0,
  });

  if (!enabled || recommendations.length === 0) {
    return null;
  }

  const showSection =
    isLoading ||
    recommendations.some(
      (r) =>
        (r.affiliateLinks && r.affiliateLinks.length > 0) ||
        (linksBySlug?.[r.slug]?.length > 0)
    );

  if (!showSection) {
    return null;
  }

  return (
    <aside
      className="contextual-sub-recs"
      aria-label="Halal substitute shopping suggestions"
      data-context={context}
    >
      <header className="contextual-sub-recs__header">
        <Leaf size={18} className="contextual-sub-recs__icon" aria-hidden />
        <div>
          <h4 className="contextual-sub-recs__title">Find halal alternatives</h4>
          <p className="contextual-sub-recs__subtitle">
            Optional shopping links — verify labels and certification yourself.
          </p>
        </div>
      </header>

      <div className="contextual-sub-recs__list">
        {recommendations.map((rec) => {
          const links =
            rec.affiliateLinks?.length > 0
              ? rec.affiliateLinks
              : linksBySlug?.[rec.slug] || [];

          if (!links.length && isLoading) {
            return (
              <div
                key={rec.slug}
                className="contextual-sub-recs__placeholder"
                aria-hidden
              />
            );
          }

          if (!links.length) return null;

          return (
            <SubstitutePurchaseCard
              key={rec.slug}
              originalId={rec.originalSlug || ""}
              originalName={rec.originalName || ""}
              replacementId={rec.slug}
              replacementName={rec.name}
              affiliateLinks={links}
              whyItWorks={rec.reason}
              showDisclosure={rec.isPrimary}
            />
          );
        })}
      </div>

      <p className="contextual-sub-recs__footer-note">
        <small>
          Affiliate links may earn a small commission at no extra cost to you. Helps keep Halal
          Kitchen free.
        </small>
      </p>
    </aside>
  );
}

export default ContextualSubstituteRecommendations;
