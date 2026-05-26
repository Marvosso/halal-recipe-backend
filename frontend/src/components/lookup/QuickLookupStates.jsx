import React from "react";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import "./QuickLookupStates.css";

export function QuickLookupLoading({ compact = false }) {
  return (
    <div
      className={`ql-state ql-state--loading ${compact ? "ql-state--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="ql-state__spinner" aria-hidden />
      <span>Checking ingredient…</span>
    </div>
  );
}

/**
 * @param {{ error: { code?: string, message?: string }|null, onRetry?: () => void }} props
 */
export function QuickLookupError({ error, onRetry }) {
  if (!error) return null;
  const isCached = error.code === "cached_result";
  const isOffline = error.code === "offline_fallback" || isCached;

  return (
    <div
      className={`ql-state ql-state--error ${isOffline ? "ql-state--offline" : ""} ${isCached ? "ql-state--cached" : ""}`}
      role={isCached ? "status" : "alert"}
      aria-live={isCached ? "polite" : "assertive"}
    >
      {isOffline ? (
        <WifiOff className="ql-state__icon" aria-hidden />
      ) : (
        <AlertCircle className="ql-state__icon" aria-hidden />
      )}
      <p className="ql-state__message">{error.message}</p>
      {onRetry && (
        <button type="button" className="ql-state__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function QuickLookupEmptyHint() {
  return (
    <p className="ql-state ql-state--hint" id="quick-lookup-hint">
      Type an ingredient from a label or recipe — e.g. gelatin, soy sauce, vanilla extract.
    </p>
  );
}
