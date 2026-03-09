import React from "react";
import { ShoppingCart, ExternalLink } from "lucide-react";
import { MAX_LINKS_PER_INGREDIENT } from "../config/affiliateProviderConfig";
import "./AffiliateLinkGroup.css";

/**
 * AffiliateLinkGroup Component
 * Displays up to 3 affiliate links for a halal substitute ingredient
 * 
 * Rules:
 * - Maximum 3 buttons per ingredient
 * - Only appears on ingredient detail screens and conversion results
 * - Buttons feel helpful, not salesy
 * - Clear disclosure text
 * 
 * @param {Object} props
 * @param {Array} props.affiliateLinks - Array of affiliate link objects from conversion
 * @param {string} props.ingredientName - Name of the substitute ingredient (for display)
 * @param {string} props.variant - 'card' (default) or 'inline'
 * @param {boolean} props.showDisclosure - Show commission disclosure (default: true)
 */
function AffiliateLinkGroup({ 
  affiliateLinks = [], 
  ingredientName = "",
  variant = "card",
  showDisclosure = true 
}) {
  const displayLinks = affiliateLinks.slice(0, MAX_LINKS_PER_INGREDIENT);
  
  // Don't render if no links
  if (displayLinks.length === 0) {
    return null;
  }

  // Track affiliate click
  const handleClick = (link, e) => {
    e.preventDefault();
    
    // Analytics tracking
    if (window.plausible) {
      window.plausible('Affiliate Click', {
        props: {
          platform: link.platform,
          ingredient: ingredientName,
          link_id: link.id
        }
      });
    }
    
    // Open in new tab
    if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Use order from routing (product-fit ranked); featured first
  const sortedLinks = [...displayLinks].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0; // Preserve provider-agnostic order from routing
  });

  if (variant === "inline") {
    return (
      <div className="affiliate-link-group-inline">
        <span className="affiliate-group-label">Find on:</span>
        <div className="affiliate-buttons-inline">
          {sortedLinks.map((link, idx) => (
            <a
              key={link.id || idx}
              href={link.url || "#"}
              onClick={(e) => handleClick(link, e)}
              className="affiliate-button-inline"
              style={{ '--platform-color': link.platform_color || '#666' }}
              aria-label={`Shop for ${ingredientName} on ${link.platform_display}`}
            >
              <ShoppingCart size={14} />
              <span>{link.platform_display}</span>
              {link.is_featured && <span className="featured-badge">Featured</span>}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <div className="affiliate-link-group">
      <div className="affiliate-group-header">
        <ShoppingCart className="affiliate-group-icon" size={18} />
        <span className="affiliate-group-title">Find {ingredientName || "this ingredient"}</span>
      </div>
      
      <div className="affiliate-buttons-grid">
        {sortedLinks.map((link, idx) => (
          <a
            key={link.id || idx}
            href={link.url || "#"}
            onClick={(e) => handleClick(link, e)}
            className={`affiliate-button-card ${link.is_featured ? 'featured' : ''}`}
            style={{ '--platform-color': link.platform_color || '#666' }}
            aria-label={`Shop for ${ingredientName} on ${link.platform_display}`}
          >
            <div className="affiliate-button-content">
              <div className="affiliate-button-icon-wrapper">
                <ShoppingCart size={18} />
              </div>
              <div className="affiliate-button-text">
                <span className="affiliate-button-label">Shop on</span>
                <span className="affiliate-button-platform">{link.platform_display}</span>
              </div>
              <ExternalLink className="affiliate-button-external" size={14} />
            </div>
            {link.is_featured && (
              <span className="affiliate-featured-badge">Featured</span>
            )}
          </a>
        ))}
      </div>
      
      {showDisclosure && (
        <p className="affiliate-disclosure">
          <small>
            💚 We may earn a small commission at no extra cost to you. 
            This helps keep Halal Kitchen free.
          </small>
        </p>
      )}
    </div>
  );
}

export default AffiliateLinkGroup;
