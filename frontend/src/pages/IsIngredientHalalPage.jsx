import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SEOPageLayout from "../components/SEOPageLayout";
import { getIngredientPageBySlug } from "../data/ingredientPageConfig";
import "../pages/SEO.css";

/**
 * SEO-friendly ingredient page driven by config.
 * URL: /is-:slug-halal (e.g. /is-gelatin-halal, /is-soy-sauce-halal)
 * Content and metadata come from ingredientPageConfig.js.
 */
function IsIngredientHalalPage() {
  const { slug } = useParams();
  const config = getIngredientPageBySlug(slug);

  if (!config) {
    return <Navigate to="/is-it-halal" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        {config.keywords && <meta name="keywords" content={config.keywords} />}
        {config.canonical && <link rel="canonical" href={config.canonical} />}
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:url" content={config.canonical} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={config.metaTitle} />
        <meta name="twitter:description" content={config.metaDescription} />
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

export default IsIngredientHalalPage;
