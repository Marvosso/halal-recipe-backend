import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import SEOPageLayout from "../components/SEOPageLayout";
import IngredientPageHead from "../components/seo/IngredientPageHead";
import SchemaMarkup from "../components/seo/SchemaMarkup";
import { getIngredientPageBySlug } from "../data/ingredientPageConfig";
import "../pages/SEO.css";

/**
 * Config-driven SEO ingredient page.
 * URL: /is-:slug-halal
 */
function IsIngredientHalalPage() {
  const { slug } = useParams();
  const config = getIngredientPageBySlug(slug);

  if (!config) {
    return <Navigate to="/is-it-halal" replace />;
  }

  return (
    <>
      <IngredientPageHead config={config} />
      <SchemaMarkup config={config} />

      <div className="seo-page-wrapper">
        <nav className="seo-nav" aria-label="Navigation">
          <Link to="/is-it-halal" className="seo-nav-link">
            ← All ingredients
          </Link>
          <Link to="/app" className="seo-nav-link">
            Open app
          </Link>
        </nav>

        <SEOPageLayout
          title={config.title}
          description={config.description}
          ingredientName={config.ingredientName}
          quickLookupIngredient={config.quickLookupIngredient}
          rulingSummary={config.rulingSummary}
          whyExplanation={config.whyExplanation}
          islamicEvidence={config.islamicEvidence}
          scholarlyBasis={config.scholarlyBasis}
          halalAlternatives={config.halalAlternatives}
          faq={config.faq}
          warnings={config.warnings}
          verdict={config.verdict}
          lastReviewed={config.lastReviewed}
          relatedIngredients={config.relatedIngredients}
          relatedConversions={config.relatedConversions}
          canonical={config.canonical}
        />
      </div>
    </>
  );
}

export default IsIngredientHalalPage;
