import React, { useEffect, useRef } from "react";
import "./ContextualAd.css";

/**
 * Light contextual ad slot. One per page section; never blocks core actions.
 * Renders a responsive AdSense placeholder when slotId and client are set.
 * When not configured, renders nothing (keeps experience clean in dev).
 *
 * @param {Object} props
 * @param {string} props.placement - 'ingredient_lookup' | 'recipe_conversion' (for analytics and slot choice)
 * @param {string} [props.slotId] - AdSense slot ID (e.g. from env). If empty, component renders nothing.
 * @param {string} [props.className] - Optional wrapper class
 */
function ContextualAd({ placement, slotId, className = "" }) {
  const wrapperRef = useRef(null);
  const pushedRef = useRef(false);

  const client = typeof import.meta !== "undefined" && import.meta.env?.VITE_ADSENSE_CLIENT;
  const effectiveSlot =
    slotId ||
    (placement === "ingredient_lookup" && import.meta.env?.VITE_ADSENSE_SLOT_LOOKUP) ||
    (placement === "recipe_conversion" && import.meta.env?.VITE_ADSENSE_SLOT_CONVERSION);

  useEffect(() => {
    if (!client || !effectiveSlot || !wrapperRef.current || pushedRef.current) return;

    const ins = wrapperRef.current.querySelector(".contextual-ad-ins");
    if (!ins) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch (e) {
      if (import.meta.env?.DEV) console.warn("[ContextualAd] AdSense push failed:", e);
    }
  }, [client, effectiveSlot]);

  if (!client || !effectiveSlot) {
    return null;
  }

  return (
    <aside
      className={`contextual-ad ${className}`}
      aria-label="Advertisement"
      data-placement={placement}
    >
      <div className="contextual-ad-wrapper" ref={wrapperRef}>
        <span className="contextual-ad-label">Ad</span>
        <ins
          className="adsbygoogle contextual-ad-ins"
          data-ad-client={client}
          data-ad-slot={effectiveSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
          style={{ display: "block", minHeight: 90 }}
        />
      </div>
    </aside>
  );
}

export default ContextualAd;
