import React from "react";
import { X, RotateCcw } from "lucide-react";

/**
 * Full-screen detail panel for reopening a saved conversion (mobile-first).
 */
function SavedRecipeDetail({ recipe, onClose, onOpenInConverter }) {
  if (!recipe) return null;

  const issueCount = recipe.issues?.length ?? 0;

  return (
    <div className="saved-recipe-detail-overlay" role="dialog" aria-modal="true">
      <div className="saved-recipe-detail">
        <header className="saved-recipe-detail-header">
          <h2>{recipe.title}</h2>
          <button type="button" className="saved-recipe-detail-close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </header>

        <div className="saved-recipe-detail-body">
          {issueCount > 0 && (
            <section className="saved-recipe-detail-section">
              <h3>Substitutions ({issueCount})</h3>
              <ul className="saved-recipe-detail-issues">
                {recipe.issues.map((issue, i) => (
                  <li key={i}>
                    <strong>{issue.ingredient || issue.haramIngredient || "Ingredient"}</strong>
                    {issue.replacement && (
                      <span> → {issue.replacement}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="saved-recipe-detail-section">
            <h3>Halal version</h3>
            <pre className="saved-recipe-detail-pre">{recipe.converted || "—"}</pre>
          </section>

          <section className="saved-recipe-detail-section">
            <h3>Original recipe</h3>
            <pre className="saved-recipe-detail-pre saved-recipe-detail-pre--muted">
              {recipe.original || "—"}
            </pre>
          </section>
        </div>

        <footer className="saved-recipe-detail-footer">
          <button
            type="button"
            className="saved-recipe-btn primary full-width"
            onClick={() => onOpenInConverter?.(recipe)}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Open in converter
          </button>
        </footer>
      </div>
      <div className="saved-recipe-detail-backdrop" onClick={onClose} aria-hidden="true" />
    </div>
  );
}

export default SavedRecipeDetail;
