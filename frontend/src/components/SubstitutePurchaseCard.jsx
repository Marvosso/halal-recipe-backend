import React, { useEffect, useRef } from "react";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { formatIngredientName } from "../lib/ingredientDisplay";
import { trackAffiliateClick, trackSubstituteViewed, trackAffiliateProviderShown } from "../lib/affiliateAnalytics";
import { MAX_LINKS_PER_INGREDIENT } from "../config/affiliateProviderConfig";
import "./SubstitutePurchaseCard.css";

/**
 * Small purchase card placed directly next to a substitution result.
 * Shows: Replacement (Original → Halal substitute) + Buy options (up to 3 links).
 * Links are already ranked by product fit (config-driven); no hardcoded retailer order.
 *
 * @param {Object} props
 * @param {string} props.originalId - Original ingredient ID (e.g. bacon)
 * @param {string} props.originalName - Display name for original
 * @param {string} props.replacementId - Substitute ingredient ID
 * @param {string} props.replacementName - Display name for substitute
 * @param {Array} props.affiliateLinks - Affiliate link objects (id, platform, platform_display, url, is_featured); limited by config
 * @param {boolean} props.showDisclosure - Show commission disclosure (default true)
 * @param {string} [props.whyItWorks] - Short explanation of why this substitute works (from ranking DB)
 */
function SubstitutePurchaseCard({
  originalId = "",
  originalName = "",
  replacementId = "",
  replacementName = "",
  affiliateLinks = [],
  showDisclosure = true,
  whyItWorks = "",
}) {
  const displayLinks = (affiliateLinks || []).slice(0, MAX_LINKS_PER_INGREDIENT);
  const hasLinks = displayLinks.length > 0;
  const trackedRef = useRef(null);

  useEffect(() => {
    if (!replacementId || trackedRef.current === replacementId) return;
    trackedRef.current = replacementId;
    trackSubstituteViewed(originalId, replacementId, displayLinks.map((l) => l.platform));
    if (displayLinks.length > 0) {
      trackAffiliateProviderShown(replacementId, displayLinks.map((l) => l.platform));
    }
  }, [originalId, replacementId, displayLinks.length]);

  const handleClick = (link, e) => {
    e.preventDefault();
    if (window.plausible) {
      window.plausible("Affiliate Click", {
        props: {
          platform: link.platform,
          ingredient: replacementName || replacementId,
          link_id: link.id,
          source: "substitute_purchase_card",
        },
      });
    }
    trackAffiliateClick(originalId, replacementId, link.platform, link.id, link.is_featured || false);
    if (link.url) {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  };

  // Retailer-agnostic copy: 1 option = "Find it at", 2–3 = "Where to buy"
  const buyLabel = displayLinks.length === 1
    ? "Find it at:"
    : "Where to buy:";

  return (
    <div className="substitute-purchase-card">
      <div className="substitute-purchase-replacement">
        <span className="substitute-purchase-label">Replacement:</span>
        <span className="substitute-purchase-original">
          {originalName || formatIngredientName(originalId) || "—"}
        </span>
        <span className="substitute-purchase-arrow">→</span>
        <span className="substitute-purchase-substitute">
          {replacementName || formatIngredientName(replacementId) || "—"}
        </span>
      </div>
      {whyItWorks && (
        <p className="substitute-purchase-why" aria-label="Why this substitute works">
          {whyItWorks}
        </p>
      )}
      {hasLinks && (
        <>
          <div className="substitute-purchase-buy-row">
            <span className="substitute-purchase-buy-label">{buyLabel}</span>
            <div className={`substitute-purchase-buttons substitute-purchase-buttons--count-${displayLinks.length}`}>
              {displayLinks.map((link, idx) => (
                <a
                  key={link.id || idx}
                  href={link.url || "#"}
                  onClick={(e) => handleClick(link, e)}
                  className="substitute-purchase-btn"
                  style={{ "--platform-color": link.platform_color || "var(--primary-green)" }}
                  aria-label={`Buy ${replacementName || "this ingredient"} on ${link.platform_display || "retailer"}`}
                >
                  <ShoppingCart size={14} aria-hidden="true" />
                  <span>{link.platform_display || "Shop"}</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          {showDisclosure && (
            <p className="substitute-purchase-disclosure" aria-hidden="true">
              <small>
                We may earn a small commission at no extra cost to you. Helps keep Halal Kitchen free.
              </small>
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default SubstitutePurchaseCard;
