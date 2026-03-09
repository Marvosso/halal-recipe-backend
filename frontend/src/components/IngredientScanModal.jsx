import React, { useState, useRef } from "react";
import { X, Camera, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { parseOcrIngredients } from "../lib/parseOcrIngredients";
import { evaluateItem } from "../lib/halalEngine";
import { formatIngredientName } from "../lib/ingredientDisplay";
import "./IngredientScanModal.css";

const STAGES = { choose: "choose", preview: "preview", extracting: "extracting", results: "results" };

function IngredientScanModal({ open, onClose }) {
  const [stage, setStage] = useState(STAGES.choose);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const reset = () => {
    setStage(STAGES.choose);
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl(null);
    setOcrProgress(0);
    setSummary(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleFileChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose an image file (e.g. JPG, PNG).");
      return;
    }
    setError(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setStage(STAGES.preview);
  };

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const runOcrAndEvaluate = async () => {
    if (!imageFile) return;
    setStage(STAGES.extracting);
    setError(null);
    setOcrProgress(0);

    let worker = null;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress != null) {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { data } = await worker.recognize(imageFile);
      const text = data?.text || "";
      await worker.terminate();
      worker = null;

      const ingredients = parseOcrIngredients(text);
      if (ingredients.length === 0) {
        setError("No ingredients detected in the image. Try a clearer photo of the ingredient list.");
        setStage(STAGES.preview);
        return;
      }

      const halal = [];
      const questionable = [];
      const haram = [];

      for (const name of ingredients) {
        const normalized = name.toLowerCase().trim().replace(/\s+/g, "_");
        const result = evaluateItem(normalized);
        const status = (result?.status || "unknown").toLowerCase();
        const entry = {
          name: name,
          normalized,
          explanation: result?.explanation || result?.simpleExplanation || result?.eli5 || "",
        };
        if (status === "halal") halal.push(entry);
        else if (status === "haram") haram.push(entry);
        else questionable.push(entry);
      }

      setSummary({ halal, questionable, haram, rawCount: ingredients.length });
      setStage(STAGES.results);
    } catch (err) {
      setError(err?.message || "Failed to read text from image. Try another photo.");
      setStage(imagePreviewUrl ? STAGES.preview : STAGES.choose);
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (_) {}
      }
    }
  };

  if (!open) return null;

  return (
    <div className="ingredient-scan-overlay" role="dialog" aria-modal="true" aria-labelledby="scan-modal-title">
      <div className="ingredient-scan-modal">
        <div className="ingredient-scan-header">
          <h2 id="scan-modal-title">Scan ingredients</h2>
          <button type="button" className="ingredient-scan-close" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="ingredient-scan-body">
          {stage === STAGES.choose && (
            <>
              <p className="ingredient-scan-hint">Take a photo of the ingredient list on the package, or upload an image.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="ingredient-scan-file-input"
                aria-label="Choose or capture image"
              />
              <button type="button" className="ingredient-scan-capture-btn" onClick={handleCaptureClick}>
                <Camera size={24} aria-hidden="true" />
                <span>Take photo or choose image</span>
              </button>
            </>
          )}

          {stage === STAGES.preview && (
            <>
              <div className="ingredient-scan-preview-wrap">
                <img src={imagePreviewUrl} alt="Ingredient label" className="ingredient-scan-preview" />
              </div>
              {error && <p className="ingredient-scan-error" role="alert">{error}</p>}
              <div className="ingredient-scan-actions">
                <button type="button" className="ingredient-scan-secondary" onClick={() => { setStage(STAGES.choose); setImageFile(null); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null); setError(null); }}>
                  Choose another
                </button>
                <button type="button" className="ingredient-scan-primary" onClick={runOcrAndEvaluate}>
                  Extract text & check halal
                </button>
              </div>
            </>
          )}

          {stage === STAGES.extracting && (
            <div className="ingredient-scan-extracting">
              <Loader2 size={32} className="spin" aria-hidden="true" />
              <p>Reading label…</p>
              <div className="ingredient-scan-progress-wrap">
                <div className="ingredient-scan-progress-bar" style={{ width: `${ocrProgress}%` }} />
              </div>
              <span className="ingredient-scan-progress-text">{ocrProgress}%</span>
            </div>
          )}

          {stage === STAGES.results && summary && (
            <div className="ingredient-scan-results">
              <p className="ingredient-scan-results-intro">
                Found {summary.rawCount} ingredient{summary.rawCount !== 1 ? "s" : ""}. Summary:
              </p>

              {summary.haram.length > 0 && (
                <section className="ingredient-scan-group ingredient-scan-haram" aria-label="Haram ingredients">
                  <h3><XCircle size={18} aria-hidden="true" /> Haram ({summary.haram.length})</h3>
                  <ul>
                    {summary.haram.map((item, i) => (
                      <li key={i}>
                        <strong>{formatIngredientName(item.normalized) || item.name}</strong>
                        {item.explanation && <span className="ingredient-scan-explain"> — {item.explanation}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {summary.questionable.length > 0 && (
                <section className="ingredient-scan-group ingredient-scan-questionable" aria-label="Questionable ingredients">
                  <h3><AlertTriangle size={18} aria-hidden="true" /> Questionable ({summary.questionable.length})</h3>
                  <ul>
                    {summary.questionable.map((item, i) => (
                      <li key={i}>
                        <strong>{formatIngredientName(item.normalized) || item.name}</strong>
                        {item.explanation && <span className="ingredient-scan-explain"> — {item.explanation}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {summary.halal.length > 0 && (
                <section className="ingredient-scan-group ingredient-scan-halal" aria-label="Halal ingredients">
                  <h3><CheckCircle size={18} aria-hidden="true" /> Halal ({summary.halal.length})</h3>
                  <ul>
                    {summary.halal.map((item, i) => (
                      <li key={i}>
                        {formatIngredientName(item.normalized) || item.name}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="ingredient-scan-actions">
                <button type="button" className="ingredient-scan-primary" onClick={reset}>
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
