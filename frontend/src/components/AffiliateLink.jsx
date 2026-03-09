import React from "react";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { getProviderById } from "../config/affiliateProviderConfig";
import "./AffiliateLink.css";

/**
 * Ethical, subtle affiliate link component.
 * Uses config for retailer name and URL; no hardcoded retailer list.
 *
 * @param {Object} props
 * @param {string} props.ingredientName - Name of the ingredient to shop for
 * @param {string} props.platform - Provider id (e.g. 'amazon', 'walmart', 'target', 'thrivemarket')
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showIcon - Whether to show shopping icon (default: true)
 * @param {string} props.variant - 'button', 'link', or 'inline' (default: 'button')
 */
function AffiliateLink({
  ingredientName,
  platform = "amazon",
  className = "",
  showIcon = true,
  variant = "button",
}) {
  const provider = getProviderById(platform);
  const displayName = provider?.display_name || "retailer";
  const searchQuery = encodeURIComponent(`${ingredientName} halal certified`);
  let affiliateUrl = provider?.url_template
    ? provider.url_template.replace("{query}", searchQuery)
    : `https://www.amazon.com/s?k=${searchQuery}`;
  if (provider?.affiliate_param?.key && provider?.affiliate_param?.value) {
    const sep = affiliateUrl.includes("?") ? "&" : "?";
    affiliateUrl += `${sep}${provider.affiliate_param.key}=${encodeURIComponent(provider.affiliate_param.value)}`;
  }
  const color = provider?.color_hex || "#666";

  const handleClick = (e) => {
    if (window.plausible) {
      window.plausible("Affiliate Click", {
        props: { platform, ingredient: ingredientName },
      });
    }
    window.open(affiliateUrl, "_blank", "noopener,noreferrer");
  };

  if (variant === "inline") {
    return (
      <span className={`affiliate-link-inline ${className}`}>
        <a
          href={affiliateUrl}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className="affiliate-link-text"
          aria-label={`Shop for ${ingredientName} on ${displayName}`}
        >
          {showIcon && <ShoppingCart className="affiliate-icon-inline" size={14} />}
          <span>Shop on {displayName}</span>
          <ExternalLink className="affiliate-external-icon" size={12} />
        </a>
      </span>
    );
  }

  if (variant === "link") {
    return (
      <a
        href={affiliateUrl}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={`affiliate-link-simple ${className}`}
        aria-label={`Shop for ${ingredientName} on ${displayName}`}
      >
        {showIcon && <ShoppingCart className="affiliate-icon" size={16} />}
        <span>Find on {displayName}</span>
        <ExternalLink className="affiliate-external-icon" size={14} />
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`affiliate-button ${className}`}
      aria-label={`Shop for ${ingredientName} on ${displayName}`}
      style={{ "--platform-color": color }}
    >
      {showIcon && <ShoppingCart className="affiliate-icon" size={18} />}
      <span>Shop {displayName}</span>
      <ExternalLink className="affiliate-external-icon" size={14} />
    </button>
  );
}

export default AffiliateLink;
