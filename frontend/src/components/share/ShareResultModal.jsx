import React, { useRef, useState, useMemo } from "react";
import { X, MessageCircle, Instagram, Download, Link2, Image } from "lucide-react";
import { SHARE_FORMATS } from "../../lib/shareCards/brand.js";
import { downloadShareCardImage, copyShareCardImage } from "../../lib/shareCards/exportImage.js";
import {
  getIngredientShareCaption,
  getIngredientWhatsAppUrl,
  getRecipeShareCaption,
  getRecipeWhatsAppUrl,
  getRecipeShareLink,
} from "../../lib/shareCards/captions.js";
import {
  buildIngredientSharePayload,
  copyShareLink,
  getShareUrl,
} from "../../lib/shareUtils.js";
import IngredientShareCard from "./IngredientShareCard";
import RecipeConversionShareCard from "./RecipeConversionShareCard";
import "./ShareCards.css";

/**
 * Unified share modal for ingredient verdicts and recipe conversions.
 * @param {{ isOpen: boolean, onClose: () => void, cardType: 'ingredient'|'recipe', data: object }} props
 */
function ShareResultModal({ isOpen, onClose, cardType = "recipe", data }) {
  const cardRef = useRef(null);
  const [formatId, setFormatId] = useState("feed");
  const [busy, setBusy] = useState(false);

  const isIngredient = cardType === "ingredient";

  const recipePayload = useMemo(() => {
    if (isIngredient || !data) return null;
    return {
      title: data.title,
      haram: data.haram,
      replacements: data.replacements,
      snippet: data.snippet,
    };
  }, [isIngredient, data]);

  if (!isOpen || !data) return null;

  const handleWhatsApp = () => {
    const url = isIngredient ? getIngredientWhatsAppUrl(data) : getRecipeWhatsAppUrl(recipePayload);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose?.();
  };

  const handleInstagram = async () => {
    const caption = isIngredient
      ? getIngredientShareCaption(data)
      : getRecipeShareCaption(recipePayload);
    try {
      await navigator.clipboard.writeText(caption);
      alert("Caption copied! Paste into your Instagram post, story, or bio link.");
    } catch {
      alert("Could not copy caption. Try Download image instead.");
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const name = isIngredient
        ? `halal-kitchen-${data.ingredientName?.replace(/\s+/g, "-") || "ingredient"}`
        : `halal-kitchen-${data.title?.replace(/\s+/g, "-") || "recipe"}`;
      await downloadShareCardImage(cardRef.current, { formatId, filename: `${name}-${formatId}.png` });
    } catch (err) {
      alert(err?.message || "Could not save image. Try a screenshot of the preview.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    const ok = await copyShareCardImage(cardRef.current, { formatId });
    setBusy(false);
    alert(ok ? "Image copied! Paste into WhatsApp or Stories." : "Copy not supported — use Download image.");
  };

  const handleCopyLink = async () => {
    if (isIngredient) {
      const payload = buildIngredientSharePayload(data);
      const url = getShareUrl(payload);
      try {
        await navigator.clipboard.writeText(url);
        alert("Share link copied!");
      } catch {
        alert("Could not copy link.");
      }
      return;
    }
    const ok = await copyShareLink(recipePayload);
    alert(ok ? "Share link copied!" : "Could not copy link.");
  };

  return (
    <div
      className="share-result-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-result-title"
    >
      <div
        className={`share-result-panel${busy ? " share-result-loading" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="share-result-header">
          <h2 id="share-result-title">
            {isIngredient ? "Share ingredient result" : "Share halal version"}
          </h2>
          <button type="button" className="share-result-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="share-result-formats" role="tablist" aria-label="Card format">
          {Object.values(SHARE_FORMATS).map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={formatId === f.id}
              className={`share-result-format-btn${formatId === f.id ? " share-result-format-btn--active" : ""}`}
              onClick={() => setFormatId(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="share-result-preview">
          <div className="share-result-preview-inner" ref={cardRef}>
            {isIngredient ? (
              <IngredientShareCard data={data} formatId={formatId} />
            ) : (
              <RecipeConversionShareCard data={data} formatId={formatId} />
            )}
          </div>
        </div>

        <div className="share-result-actions">
          <button
            type="button"
            className="share-result-action share-result-action--whatsapp"
            onClick={handleWhatsApp}
          >
            <MessageCircle size={22} aria-hidden="true" />
            WhatsApp
          </button>
          <button
            type="button"
            className="share-result-action share-result-action--instagram"
            onClick={handleInstagram}
          >
            <Instagram size={22} aria-hidden="true" />
            Caption
          </button>
          <button
            type="button"
            className="share-result-action share-result-action--copy"
            onClick={handleCopyImage}
          >
            <Image size={20} aria-hidden="true" />
            Copy image
          </button>
          <button
            type="button"
            className="share-result-action share-result-action--copy"
            onClick={handleCopyLink}
          >
            <Link2 size={20} aria-hidden="true" />
            Copy link
          </button>
          <button
            type="button"
            className="share-result-action share-result-action--download"
            onClick={handleDownload}
          >
            <Download size={22} aria-hidden="true" />
            Download PNG (screenshot-ready)
          </button>
        </div>

        <p className="share-result-hint">
          Tip: Download or screenshot the card, then post to Instagram Stories, WhatsApp status, or TikTok.
          {` Share link: ${
            isIngredient
              ? getShareUrl(buildIngredientSharePayload(data))
              : getRecipeShareLink(recipePayload)
          }`}
        </p>
      </div>
    </div>
  );
}

export default ShareResultModal;
