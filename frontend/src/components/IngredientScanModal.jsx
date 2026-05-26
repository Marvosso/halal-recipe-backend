import React, { useRef } from "react";
import { X, Camera, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useIngredientScan } from "../hooks/useIngredientScan";
import { formatIngredientName } from "../lib/ingredientDisplay";
import "./IngredientScanModal.css";

function IngredientRow({ item }) {
  const label = formatIngredientName(item.displayName) || item.raw;
  return (
    <li>
      <strong>{label}</strong>
      {item.modifiers?.length > 0 && (
        <span className="ingredient-scan-modifiers"> ({item.modifiers.join(", ")})</span>
      )}
      {item.explanation && (
        <span className="ingredient-scan-explain"> — {item.explanation}</span>
      )}
      {item.ocr_uncertain && (
        <span className="ingredient-scan-uncertain"> (low OCR confidence)</span>
      )}
    </li>
  );
}

function IngredientScanModal({ open, onClose }) {
  const fileInputRef = useRef(null);
  const imageFileRef = useRef(null);
  const {
    stage,
    ocrProgress,
    result,
    error,
    setError,
    imagePreviewUrl,
    setPreview,
    reset,
    scanFromImage,
  } = useIngredientScan();

  const handleClose = () => {
    reset();
    imageFileRef.current = null;
    onClose?.();
  };

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose an image file (e.g. JPG, PNG).");
      return;
    }
    imageFileRef.current = file;
    setPreview(file);
  };

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleScan = () => {
    if (imageFileRef.current) scanFromImage(imageFileRef.current);
  };

  const handleChooseAnother = () => {
    imageFileRef.current = null;
    reset();
  };

  if (!open) return null;

  const groups = result?.groups;
  const total =
    (groups?.haram?.length || 0) +
    (groups?.questionable?.length || 0) +
    (groups?.halal?.length || 0);

  return (
    <div
      className="ingredient-scan-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
    >
      <div className="ingredient-scan-modal">
        <div className="ingredient-scan-header">
          <h2 id="scan-modal-title">Scan ingredients</h2>
          <button
            type="button"
            className="ingredient-scan-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ingredient-scan-body">
          {stage === "choose" && (
            <>
              <p className="ingredient-scan-hint">
                Photograph the ingredient list on the package. We read the label on your device,
                then check each ingredient against our deterministic halal rules.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="ingredient-scan-file-input"
                aria-label="Choose or capture image"
              />
              <button
                type="button"
                className="ingredient-scan-capture-btn"
                onClick={handleCaptureClick}
              >
                <Camera size={24} aria-hidden="true" />
                <span>Take photo or choose image</span>
              </button>
              {error && (
                <p className="ingredient-scan-error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}

          {stage === "preview" && (
            <>
              <div className="ingredient-scan-preview-wrap">
                <img
                  src={imagePreviewUrl}
                  alt="Ingredient label preview"
                  className="ingredient-scan-preview"
                />
              </div>
              {error && (
                <p className="ingredient-scan-error" role="alert">
                  {error}
                </p>
              )}
              <div className="ingredient-scan-actions">
                <button
                  type="button"
                  className="ingredient-scan-secondary"
                  onClick={handleChooseAnother}
                >
                  Choose another
                </button>
                <button
                  type="button"
                  className="ingredient-scan-primary"
                  onClick={handleScan}
                >
                  Scan label
                </button>
              </div>
            </>
          )}

          {stage === "extracting" && (
            <div className="ingredient-scan-extracting">
              <Loader2 size={32} className="spin" aria-hidden="true" />
              <p>Reading label…</p>
              <div className="ingredient-scan-progress-wrap">
                <div
                  className="ingredient-scan-progress-bar"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <span className="ingredient-scan-progress-text">{ocrProgress}%</span>
            </div>
          )}

          {stage === "results" && result && (
            <div className="ingredient-scan-results">
              <p className="ingredient-scan-results-intro">
                Found {result.rawCount} ingredient{result.rawCount !== 1 ? "s" : ""}
                {total > 0 ? ` · ${total} evaluated` : ""}.
                {result.ocrConfidence != null && result.ocrConfidence < 0.5 && (
                  <span className="ingredient-scan-ocr-warn">
                    {" "}
                    Low OCR confidence — verify against the package.
                  </span>
                )}
              </p>

              {groups?.haram?.length > 0 && (
                <section
                  className="ingredient-scan-group ingredient-scan-haram"
                  aria-label="Not permissible"
                >
                  <h3>
                    <XCircle size={18} aria-hidden="true" /> Not permissible ({groups.haram.length})
                  </h3>
                  <ul>
                    {groups.haram.map((item, i) => (
                      <IngredientRow key={`h-${i}`} item={item} />
                    ))}
                  </ul>
                </section>
              )}

              {groups?.questionable?.length > 0 && (
                <section
                  className="ingredient-scan-group ingredient-scan-questionable"
                  aria-label="Check or verify"
                >
                  <h3>
                    <AlertTriangle size={18} aria-hidden="true" /> Check or verify (
                    {groups.questionable.length})
                  </h3>
                  <ul>
                    {groups.questionable.map((item, i) => (
                      <IngredientRow key={`q-${i}`} item={item} />
                    ))}
                  </ul>
                </section>
              )}

              {groups?.halal?.length > 0 && (
                <section
                  className="ingredient-scan-group ingredient-scan-halal"
                  aria-label="Generally permissible"
                >
                  <h3>
                    <CheckCircle size={18} aria-hidden="true" /> Generally permissible (
                    {groups.halal.length})
                  </h3>
                  <ul>
                    {groups.halal.map((item, i) => (
                      <IngredientRow key={`a-${i}`} item={item} />
                    ))}
                  </ul>
                </section>
              )}

              <div className="ingredient-scan-actions">
                <button type="button" className="ingredient-scan-primary" onClick={handleChooseAnother}>
                  Scan another label
                </button>
                <button type="button" className="ingredient-scan-secondary" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="ingredient-scan-backdrop" onClick={handleClose} aria-hidden="true" />
    </div>
  );
}

export default IngredientScanModal;
