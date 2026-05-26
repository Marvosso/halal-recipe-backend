import React from "react";
import { HK_BRAND } from "../../lib/shareCards/brand.js";
import "./ShareCards.css";

/**
 * Branded frame for screenshot / export cards.
 * @param {{ formatId?: string, children: React.ReactNode, footerNote?: string }} props
 */
function ShareCardFrame({ formatId = "feed", children, footerNote }) {
  return (
    <div
      className={`hk-share-card hk-share-card--${formatId}`}
      data-share-format={formatId}
    >
      <header className="hk-share-card__header">
        <div className="hk-share-card__brand">
          <span className="hk-share-card__logo" aria-hidden="true">
            ☪
          </span>
          <div>
            <p className="hk-share-card__brand-name">{HK_BRAND.name}</p>
            <p className="hk-share-card__brand-tag">{HK_BRAND.tagline}</p>
          </div>
        </div>
      </header>

      <div className="hk-share-card__body">{children}</div>

      <footer className="hk-share-card__footer">
        {footerNote && <p className="hk-share-card__footer-note">{footerNote}</p>}
        <p className="hk-share-card__disclaimer">{HK_BRAND.disclaimer}</p>
        <p className="hk-share-card__url">{HK_BRAND.url}</p>
      </footer>
    </div>
  );
}

export default ShareCardFrame;
