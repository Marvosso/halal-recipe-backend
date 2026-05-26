import React from "react";
import { RefreshCw } from "lucide-react";
import ShareCardFrame from "./ShareCardFrame";
import { formatIngredientName } from "../../lib/ingredientDisplay";

/**
 * Screenshot-ready recipe conversion card.
 */
function RecipeConversionShareCard({ data, formatId = "feed" }) {
  if (!data) return null;

  const swaps = data.swaps?.length
    ? data.swaps
    : data.haram?.map((h, i) => ({
        from: h,
        to: data.replacements?.[i] || "halal swap",
      })) || [];

  return (
    <ShareCardFrame formatId={formatId}>
      <p className="hk-share-card__eyebrow">Halal recipe conversion</p>
      <h2 className="hk-share-card__title">{data.title}</h2>

      {data.confidenceScore > 0 && (
        <p className="hk-share-confidence-banner">
          {data.confidenceScore}% ingredients halal-friendly
        </p>
      )}

      {swaps.length > 0 ? (
        <div className="hk-share-swaps">
          <p className="hk-share-swaps-label">
            <RefreshCw size={16} aria-hidden="true" /> Swapped for halal
          </p>
          <ul className="hk-share-swap-list">
            {swaps.slice(0, 5).map((s, i) => (
              <li key={i}>
                <span className="hk-share-swap-from">{formatIngredientName(s.from)}</span>
                <span className="hk-share-swap-arrow">→</span>
                <span className="hk-share-swap-to">{formatIngredientName(s.to)}</span>
              </li>
            ))}
          </ul>
          {swaps.length > 5 && (
            <p className="hk-share-more">+{swaps.length - 5} more substitutions</p>
          )}
        </div>
      ) : (
        <p className="hk-share-summary">All ingredients look halal-friendly in this recipe.</p>
      )}

      {data.snippet && (
        <blockquote className="hk-share-snippet">{data.snippet}…</blockquote>
      )}
    </ShareCardFrame>
  );
}

export default RecipeConversionShareCard;
