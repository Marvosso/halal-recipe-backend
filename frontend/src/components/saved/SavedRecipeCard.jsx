import React from "react";
import { RotateCcw, Trash2, Loader2, ChevronRight } from "lucide-react";

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

/**
 * Mobile-first card for one saved conversion.
 */
function SavedRecipeCard({ recipe, onOpen, onDelete, deleting, selected }) {
  const preview = (recipe.converted || recipe.original || "").slice(0, 140);
  const issueCount = recipe.issues?.length ?? 0;

  return (
    <article
      className={`saved-recipe-card${selected ? " saved-recipe-card--selected" : ""}`}
    >
      <button
        type="button"
        className="saved-recipe-card-main"
        onClick={() => onOpen?.(recipe)}
        aria-label={`Open ${recipe.title}`}
      >
        <div className="saved-recipe-card-text">
          <h2 className="saved-recipe-card-title">{recipe.title}</h2>
          <p className="saved-recipe-card-meta">
            {formatDate(recipe.savedAt)}
            {issueCount > 0 && ` · ${issueCount} substitution${issueCount !== 1 ? "s" : ""}`}
            {recipe.confidenceScore > 0 && ` · ${Math.round(recipe.confidenceScore)}% halal`}
          </p>
          <p className="saved-recipe-card-preview">
            {preview}
            {(recipe.converted || recipe.original || "").length > 140 ? "…" : ""}
          </p>
        </div>
        <ChevronRight size={20} className="saved-recipe-card-chevron" aria-hidden="true" />
      </button>
      <div className="saved-recipe-card-actions">
        <button
          type="button"
          className="saved-recipe-btn secondary"
          onClick={() => onOpen?.(recipe)}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Open
        </button>
        <button
          type="button"
          className="saved-recipe-btn danger"
          onClick={() => onDelete?.(recipe.id)}
          disabled={deleting}
          aria-label={`Delete ${recipe.title}`}
        >
          {deleting ? (
            <Loader2 size={16} className="spin" aria-hidden="true" />
          ) : (
            <Trash2 size={16} aria-hidden="true" />
          )}
          Delete
        </button>
      </div>
    </article>
  );
}

export default SavedRecipeCard;
