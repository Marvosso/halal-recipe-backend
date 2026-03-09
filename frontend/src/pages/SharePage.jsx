import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { decodeSharePayload } from "../lib/shareUtils";
import { formatIngredientName } from "../lib/ingredientDisplay";
import "./SharePage.css";

function SharePage() {
  const [searchParams] = useSearchParams();
  const encoded = searchParams.get("d") || "";
  const payload = decodeSharePayload(encoded);

  if (!payload) {
    return (
      <main className="share-page">
        <Helmet>
          <title>Share - Halal Kitchen</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="share-page-card share-page-error">
          <h1>Invalid or expired link</h1>
          <p>This share link may be broken or outdated.</p>
          <Link to="/app" className="share-page-cta">Convert your own recipe</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="share-page">
      <Helmet>
        <title>{payload.title} - Converted with Halal Kitchen</title>
        <meta name="description" content={`Halal version: ${payload.title}. ${payload.replacements.length ? `Swapped to: ${payload.replacements.join(", ")}.` : ""} Converted with Halal Kitchen.`} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="share-page-card">
        <h1 className="share-page-recipe-title">{payload.title}</h1>
        {payload.haram.length > 0 && (
          <div className="share-page-section">
            <span className="share-page-label">Original ingredients (swapped)</span>
            <p className="share-page-list">{payload.haram.map((n) => formatIngredientName(n)).join(", ")}</p>
          </div>
        )}
        {payload.replacements.length > 0 && (
          <div className="share-page-section">
            <span className="share-page-label">Halal replacements</span>
            <p className="share-page-list">{payload.replacements.map((n) => formatIngredientName(n)).join(", ")}</p>
          </div>
        )}
        <p className="share-page-branding">Converted with Halal Kitchen</p>
        <Link to="/app" className="share-page-cta">Convert your own recipe</Link>
      </div>
    </main>
  );
}

export default SharePage;
