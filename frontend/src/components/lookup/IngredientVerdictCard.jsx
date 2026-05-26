import React from "react";
import { CheckCircle, XCircle, AlertCircle, HelpCircle, AlertTriangle, Share2 } from "lucide-react";
import { getModifierEffectLabel, CONFIDENCE_DISPLAY } from "../../lib/lookup/verdictDisplay";
import IngredientSources from "../IngredientSources";
import "./IngredientVerdictCard.css";

function StatusIcon({ statusClass }) {
  const cls = "verdict-card__icon";
  switch (statusClass) {
    case "halal":
      return <CheckCircle className={`${cls} verdict-card__icon--halal`} aria-hidden />;
    case "haram":
      return <XCircle className={`${cls} verdict-card__icon--haram`} aria-hidden />;
    case "conditional":
      return <AlertCircle className={`${cls} verdict-card__icon--conditional`} aria-hidden />;
    default:
      return <HelpCircle className={`${cls} verdict-card__icon--unknown`} aria-hidden />;
  }
}

/**
 * Reusable structured ingredient result card.
 * @param {object} props
 * @param {object} props.result - normalized lookup result
 * @param {string} [props.query]
 * @param {boolean} [props.compact] - grocery / mobile dense layout
 * @param {function} [props.onConvertClick]
 * @param {function} [props.onShareClick]
 */
function IngredientVerdictCard({ result, query = "", compact = false, onConvertClick, onShareClick }) {
  if (!result) return null;

  const confidenceLabel =
    CONFIDENCE_DISPLAY[result.confidenceLevel]?.label || "Confidence";
  const hasModifiers =
    result.modifierDetails?.length > 0 &&
    !(
      result.modifierDetails.length === 1 &&
      result.modifierDetails[0].slug === "unspecified"
    );

  return (
    <article
      className={`verdict-card verdict-card--${result.statusClass} ${compact ? "verdict-card--compact" : ""}`}
      aria-label={result.ariaLabel}
      data-verdict={result.verdict}
    >
      <header className="verdict-card__hero">
        <StatusIcon statusClass={result.statusClass} />
        <div className="verdict-card__hero-text">
          <p className="verdict-card__ingredient-name">{result.displayName}</p>
          {query && query.toLowerCase() !== result.displayName?.toLowerCase() && (
            <p className="verdict-card__query-trace">
              Searched: <span>{query}</span>
            </p>
          )}
          <div className="verdict-card__badge-row">
            <span className={`verdict-card__badge verdict-card__badge--${result.statusClass}`}>
              {result.statusLabel}
            </span>
            <span
              className={`verdict-card__confidence verdict-card__confidence--${result.confidenceLevel}`}
            >
              {confidenceLabel} · {result.confidenceScore}%
            </span>
          </div>
          <p className="verdict-card__summary">{result.statusSummary}</p>
        </div>
      </header>

      {hasModifiers && (
        <section className="verdict-card__modifiers" aria-label="Detected modifiers">
          <h4 className="verdict-card__section-title">Modifiers</h4>
          <ul className="verdict-card__modifier-list">
            {result.modifierDetails
              .filter((m) => m.slug !== "unspecified")
              .map((mod) => (
                <li key={mod.slug} className="verdict-card__modifier-chip">
                  <span className="verdict-card__modifier-name">{mod.displayName}</span>
                  <span className="verdict-card__modifier-effect">
                    {getModifierEffectLabel(mod.effect)}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {result.warnings?.length > 0 && (
        <section
          className="verdict-card__warnings"
          role="alert"
          aria-label="Important warnings"
        >
          <h4 className="verdict-card__section-title">
            <AlertTriangle size={16} aria-hidden /> Warnings
          </h4>
          <ul className="verdict-card__warning-list">
            {result.warnings.map((w, i) => (
              <li
                key={i}
                className={`verdict-card__warning verdict-card__warning--${w.severity || "medium"}`}
              >
                {w.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.explanation && (
        <section className="verdict-card__explanation">
          <h4 className="verdict-card__section-title">What this means</h4>
          <p>{result.explanation}</p>
        </section>
      )}

      {result.substitutes?.all?.length > 0 && (
        <section className="verdict-card__substitutes" aria-label="Halal substitutes">
          <h4 className="verdict-card__section-title">Halal substitutes</h4>
          <ul className="verdict-card__substitute-list">
            {result.substitutes.all.map((sub, i) => (
              <li key={i} className="verdict-card__substitute-item">
                <span className="verdict-card__substitute-name">{sub.name}</span>
                {sub.reason && (
                  <span className="verdict-card__substitute-reason">{sub.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <IngredientSources status={result.status} ingredientId={result.baseIngredient} />

      {(onShareClick || onConvertClick) && (
        <footer className="verdict-card__actions">
          {onShareClick && (
            <button
              type="button"
              className="verdict-card__share-btn"
              onClick={() => onShareClick(result, query)}
              aria-label="Share ingredient result card"
            >
              <Share2 size={18} aria-hidden="true" />
              Share result
            </button>
          )}
          {onConvertClick && (
            <button
              type="button"
              className="verdict-card__convert-btn"
              onClick={() => onConvertClick(query || result.query)}
            >
              Convert full recipe
            </button>
          )}
        </footer>
      )}
    </article>
  );
}

export default IngredientVerdictCard;
