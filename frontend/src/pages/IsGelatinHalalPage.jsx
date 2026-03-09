import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import SEOPageLayout from "../components/SEOPageLayout";
import { getIngredientPageBySlug } from "../data/ingredientPageConfig";
import "./SEO.css";

function IsGelatinHalalPage() {
  const config = getIngredientPageBySlug("gelatin");
  if (!config) return null;

  return (
    <>
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <meta name="keywords" content={config.keywords} />
        <link rel="canonical" href={config.canonical} />
      </Helmet>

      <div className="seo-page-wrapper">
        <nav className="seo-nav" aria-label="Navigation">
          <Link to="/app" className="seo-nav-link">
            ← Back to Halal Kitchen
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

export default IsGelatinHalalPage;
