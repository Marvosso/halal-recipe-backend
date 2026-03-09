import React, { useMemo } from "react";
import { X, MessageCircle, Instagram, Link2 } from "lucide-react";
import { buildSharePayload, getWhatsAppShareUrl, copyShareLink, copyShareText } from "../lib/shareUtils";
import { formatIngredientName } from "../lib/ingredientDisplay";
import "./ShareHalalModal.css";

function ShareHalalModal({ isOpen, onClose, recipe = "", converted = "", issues = [] }) {
  const payload = useMemo(
    () =>
      buildSharePayload({
        recipeTitle: recipe,
        issues,
        convertedSnippet: typeof converted === "string" ? converted : "",
      }),
    [recipe, issues, converted]
  );

  const handleWhatsApp = () => {
    window.open(getWhatsAppShareUrl(payload), "_blank", "noopener,noreferrer");
    onClose?.();
  };

  const handleCopyLink = async () => {
    const ok = await copyShareLink(payload);
    if (ok) alert("Link copied to clipboard!");
    else alert("Could not copy. Please try again.");
  };

  const handleInstagram = async () => {
    const ok = await copyShareText(payload);
    if (ok) alert("Caption copied! Paste it in your Instagram post or story.");
    else alert("Could not copy. Please try again.");
  };

  if (!isOpen) return null;

  return (
    <div className="share-halal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-halal-title">
      <div className="share-halal-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-halal-header">
          <h2 id="share-halal-title">Share Halal Version</h2>
          <button type="button" className="share-halal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="share-halal-card-preview">
          <div className="share-card-inner">
            <h3 className="share-card-title">{payload.title}</h3>
            {payload.haram.length > 0 && (
              <div className="share-card-section">
                <span className="share-card-label">Original ingredients (swapped)</span>
                <p className="share-card-list">{payload.haram.map((n) => formatIngredientName(n)).join(", ")}</p>
              </div>
            )}
            {payload.replacements.length > 0 && (
              <div className="share-card-section">
                <span className="share-card-label">Halal replacements</span>
                <p className="share-card-list">{payload.replacements.map((n) => formatIngredientName(n)).join(", ")}</p>
              </div>
            )}
            <p className="share-card-branding">Converted with Halal Kitchen</p>
          </div>
        </div>

        <div className="share-halal-actions">
          <button type="button" className="share-action-btn whatsapp" onClick={handleWhatsApp} aria-label="Share on WhatsApp">
            <MessageCircle size={22} aria-hidden="true" />
            <span>WhatsApp</span>
          </button>
          <button type="button" className="share-action-btn instagram" onClick={handleInstagram} aria-label="Copy for Instagram">
            <Instagram size={22} aria-hidden="true" />
            <span>Instagram</span>
          </button>
          <button type="button" className="share-action-btn copy-link" onClick={handleCopyLink} aria-label="Copy link">
            <Link2 size={22} aria-hidden="true" />
            <span>Copy link</span>
          </button>
        </div>

        <p className="share-halal-hint">Anyone who opens the link will see this card and can convert their own recipe.</p>
      </div>
    </div>
  );
}

export default ShareHalalModal;
