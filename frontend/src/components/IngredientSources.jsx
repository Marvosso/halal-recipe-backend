import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { getSourcesForRuling } from "../lib/halalSources";
import "./IngredientSources.css";

/**
 * Renders a "Sources" section below ingredient explanations. References general
 * Islamic dietary principles and halal certification guidelines. Not presented as definitive fatwas.
 * @param {{ status?: string, ingredientId?: string, className?: string }} props
 */
function IngredientSources({ status = "unknown", ingredientId, className = "" }) {
  const [open, setOpen] = useState(false);
  const {
    principles,
    certificationBodies,
    ingredientPrinciples,
    ingredientGuidelines,
    disclaimer,
    labels,
  } = getSourcesForRuling(status, { ingredientId });

  return (
    <div className={`ingredient-sources ${className}`.trim()}>
      <button
        type="button"
        className="sources-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="sources-content"
        id="sources-toggle"
      >
        <BookOpen size={14} aria-hidden="true" />
        <span>Sources</span>
      </button>
      {open && (
        <div id="sources-content" className="sources-content" role="region" aria-labelledby="sources-toggle">
          <div className="sources-section">
            <span className="sources-section-title">{labels.principles}</span>
            <ul className="sources-list">
              {ingredientPrinciples?.length ? (
                ingredientPrinciples.map((r, i) => (
                  <li key={`ing-p-${i}`}>
                    {r.text} <cite className="sources-cite">{r.reference}</cite>
                  </li>
                ))
              ) : null}
              {principles.map((r, i) => (
                <li key={i}>
                  {r.text} <cite className="sources-cite">{r.reference}</cite>
                </li>
              ))}
            </ul>
          </div>
          <div className="sources-section">
            <span className="sources-section-title">{labels.certification}</span>
            <ul className="sources-list">
              {ingredientGuidelines?.length
                ? ingredientGuidelines.map((r, i) => (
                    <li key={`ing-g-${i}`}>
                      {r.text} <cite className="sources-cite">{r.reference}</cite>
                    </li>
                  ))
                : null}
              {certificationBodies.map((body) => (
                <li key={body.id}>
                  <strong>{body.name}</strong> — {body.fullName} ({body.region}). {body.note}
                </li>
              ))}
            </ul>
          </div>
          <p className="sources-disclaimer" role="note">
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}

export default IngredientSources;
