import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, Share2, CheckCircle } from "lucide-react";
import "./CommunityConversions.css";

/**
 * Community Conversions – anonymous social proof for the homepage.
 * Displays recent conversions/verifications with optional save/share counts.
 *
 * @param {Object} props
 * @param {Array<{ id: string, title: string, type: 'converted'|'verified', saves?: number, shares?: number }>} props.items - List of conversion items (default: mock data)
 * @param {number} [props.maxItems=5] - Max items to show
 */
function CommunityConversions({ items = [], maxItems = 5 }) {
  const displayItems = (items.length ? items : []).slice(0, maxItems);

  if (displayItems.length === 0) return null;

  return (
    <section className="community-conversions" aria-labelledby="community-conversions-heading">
      <h2 id="community-conversions-heading" className="community-conversions-heading">
        Recent community conversions
      </h2>
      <p className="community-conversions-subtitle">
        Real recipes people have made halal with Halal Kitchen
      </p>
      <ul className="community-conversions-list">
        {displayItems.map((item) => (
          <li key={item.id} className="community-conversion-item">
            <span className="community-conversion-icon" aria-hidden="true">
              <CheckCircle size={18} />
            </span>
            <span className="community-conversion-text">
              <strong className="community-conversion-title">{item.title}</strong>
              <span className="community-conversion-type">
                {item.type === "converted" ? " converted to halal" : " verified halal"}
              </span>
            </span>
            {(item.saves != null || item.shares != null) && (
              <span className="community-conversion-stats">
                {item.saves != null && item.saves > 0 && (
                  <span className="community-conversion-stat" title="Saves">
                    <Bookmark size={14} aria-hidden="true" />
                    {item.saves}
                  </span>
                )}
                {item.shares != null && item.shares > 0 && (
                  <span className="community-conversion-stat" title="Shares">
                    <Share2 size={14} aria-hidden="true" />
                    {item.shares}
                  </span>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
      <Link to="/app" className="community-conversions-cta">
        Convert your recipe
      </Link>
    </section>
  );
}

export default CommunityConversions;
