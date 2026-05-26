import React from "react";
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import ShareCardFrame from "./ShareCardFrame";
import { formatIngredientName } from "../../lib/ingredientDisplay";

function VerdictIcon({ statusClass, size = 40 }) {
  const props = { size, "aria-hidden": true };
  switch (statusClass) {
    case "halal":
      return <CheckCircle {...props} className="hk-share-verdict-icon hk-share-verdict-icon--halal" />;
    case "haram":
      return <XCircle {...props} className="hk-share-verdict-icon hk-share-verdict-icon--haram" />;
    case "conditional":
      return <AlertCircle {...props} className="hk-share-verdict-icon hk-share-verdict-icon--conditional" />;
    default:
      return <HelpCircle {...props} className="hk-share-verdict-icon hk-share-verdict-icon--unknown" />;
  }
}

/**
 * Screenshot-ready ingredient verdict card.
 */
function IngredientShareCard({ data, formatId = "feed" }) {
  if (!data) return null;

  return (
    <ShareCardFrame formatId={formatId}>
      <p className="hk-share-card__eyebrow">Ingredient check</p>
      <h2 className="hk-share-card__title">{data.ingredientName}</h2>
      {data.query &&
        data.query.toLowerCase() !== data.ingredientName?.toLowerCase() && (
          <p className="hk-share-card__sub">Searched: {data.query}</p>
        )}

      <div className={`hk-share-verdict-block hk-share-verdict-block--${data.statusClass}`}>
        <VerdictIcon statusClass={data.statusClass} />
        <div>
          <span className={`hk-share-verdict-badge hk-share-verdict-badge--${data.statusClass}`}>
            {data.statusLabel}
          </span>
          {data.confidenceScore > 0 && (
            <span className="hk-share-confidence">{data.confidenceScore}% confidence</span>
          )}
        </div>
      </div>

      <p className="hk-share-summary">{data.statusSummary}</p>

      {data.modifiers?.length > 0 && (
        <div className="hk-share-pill-row">
          {data.modifiers.map((m) => (
            <span key={m} className="hk-share-pill">
              {formatIngredientName(m)}
            </span>
          ))}
        </div>
      )}

      {data.warnings?.length > 0 && (
        <ul className="hk-share-mini-list">
          {data.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {data.substitutes?.length > 0 && (
        <p className="hk-share-alt-line">
          <strong>Alternatives:</strong> {data.substitutes.map(formatIngredientName).join(", ")}
        </p>
      )}
    </ShareCardFrame>
  );
}

export default IngredientShareCard;
