import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { decodeSharePayload } from "../lib/shareUtils";
import { buildRecipeShareData } from "../lib/shareCards/buildRecipeShareData";
import IngredientShareCard from "../components/share/IngredientShareCard";
import RecipeConversionShareCard from "../components/share/RecipeConversionShareCard";
import "./SharePage.css";
import "../components/share/ShareCards.css";

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
          <Link to="/app" className="share-page-cta">
            Convert your own recipe
          </Link>
        </div>
      </main>
    );
  }

  const isIngredient = payload.type === "ingredient";
  const recipeData = isIngredient
    ? null
    : buildRecipeShareData({
        recipe: payload.title,
        converted: payload.snippet,
        issues: payload.haram.map((h, i) => ({
          ingredient: h,
          replacement: payload.replacements[i],
        })),
      });

  const ingredientData = isIngredient
    ? {
        type: "ingredient",
        ingredientName: payload.ingredientName || payload.title,
        query: payload.query || "",
        statusLabel: payload.statusLabel || "Checked",
        statusClass: payload.statusClass || "unknown",
        statusSummary: payload.statusSummary || "",
        confidenceScore: payload.confidenceScore || 0,
        modifiers: payload.modifiers || [],
        warnings: payload.warnings || [],
        substitutes: payload.substitutes || [],
      }
    : null;

  return (
    <main className="share-page">
      <Helmet>
        <title>
          {isIngredient ? payload.ingredientName : payload.title} - Halal Kitchen
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="share-page-visual">
        {isIngredient ? (
          <IngredientShareCard data={ingredientData} formatId="feed" />
        ) : (
          <RecipeConversionShareCard data={recipeData} formatId="feed" />
        )}
        <Link to="/app" className="share-page-cta">
          Check your own ingredients
        </Link>
      </div>
    </main>
  );
}

export default SharePage;
