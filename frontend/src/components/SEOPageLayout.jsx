import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Search, RefreshCw, Link2, BookOpen } from "lucide-react";
import AffiliateLink from "./AffiliateLink";
import QuickLookup from "./QuickLookup";
import { getEnabledProviders } from "../config/affiliateProviderConfig";
import { VERDICT_LABELS, VALID_VERDICTS } from "../data/seoVerdicts";
import { getIngredientPageBySlug } from "../data/ingredientPageConfig";
import "./SEOPageLayout.css";

/**
 * SEO Page Layout Component
 * Reusable component for SEO-optimized "Is [ingredient] halal?" pages.
 *
 * Verdict: use one of seoVerdicts.VERDICT (halal | usually_halal | conditional | usually_haram | haram).
 * Scholarly basis: replaces "Islamic evidence" for a safer, trust-focused section.
 */
function SEOPageLayout({
  title,
  description,
  ingredientName,
  rulingSummary,
  whyExplanation,
  islamicEvidence = [],
  scholarlyBasis = [],
  halalAlternatives = [],
  faq = [],
  warnings = [],
  quickLookupIngredient = null,
  halalStatus = null,
  verdict = null,
  lastReviewed = null,
  relatedIngredients = [],
  relatedConversions = [],
  canonical = null,
}) {
  const [openFaqItems, setOpenFaqItems] = useState(new Set());
  const shopProviders = useMemo(() => getEnabledProviders().slice(0, 2), []);

  const principles = scholarlyBasis.length > 0 ? scholarlyBasis : islamicEvidence;

  // Inject SEO metadata
  useEffect(() => {
    // Set document title
    if (title) {
      document.title = title;
    }

    // Set meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    if (description) {
      metaDescription.content = description;
    }

    // Cleanup on unmount
    return () => {
      // Optionally reset to default title/description
    };
  }, [title, description]);

  // Toggle FAQ item
  const toggleFaqItem = (index) => {
    setOpenFaqItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Navigate to Quick Lookup tab and pre-fill search
  const handleCheckAnotherIngredient = () => {
    // First switch to convert tab (where Quick Lookup is)
    window.dispatchEvent(new CustomEvent("switchTab", { detail: { tab: "convert" } }));
    
    // Pre-fill Quick Lookup with ingredient if provided
    const ingredientToSearch = quickLookupIngredient || ingredientName;
    if (ingredientToSearch) {
      // Small delay to ensure tab switch completes
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("prefillQuickLookup", { 
          detail: { ingredient: ingredientToSearch } 
        }));
      }, 300);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigate to Convert tab
  const handleConvertRecipe = () => {
    window.dispatchEvent(new CustomEvent("switchTab", { detail: { tab: "convert" } }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Verdict-driven status: use standardized verdict first, then halalStatus, then derive from text
  const resolvedVerdict = verdict && VALID_VERDICTS.includes(verdict) ? verdict : null;
  const statusLabel = resolvedVerdict
    ? VERDICT_LABELS[resolvedVerdict]
    : (halalStatus ?? getRulingStatusLabel());

  function getRulingStatusLabel() {
    if (!rulingSummary) return "Unknown";
    const s = rulingSummary.toLowerCase();
    if (s.includes("halal") && !s.includes("not") && !s.includes("haram")) return "Halal";
    if (s.includes("haram") || s.includes("forbidden") || s.includes("prohibited")) return "Usually haram";
    if (s.includes("conditional") || s.includes("questionable") || s.includes("makruh")) return "Conditional";
    return "Unknown";
  }

  const rulingStatusForCss =
    resolvedVerdict === "halal" || resolvedVerdict === "usually_halal"
      ? "halal"
      : resolvedVerdict === "haram" || resolvedVerdict === "usually_haram"
        ? "haram"
        : resolvedVerdict === "conditional"
          ? "questionable"
          : rulingSummary
            ? (() => {
                const s = rulingSummary.toLowerCase();
                if (s.includes("halal") && !s.includes("haram")) return "halal";
                if (s.includes("haram") || s.includes("forbidden")) return "haram";
                return "questionable";
              })()
            : "unknown";

  const getStatusIcon = () => {
    const v = resolvedVerdict;
    if (v === "halal" || v === "usually_halal")
      return <CheckCircle className="status-icon halal-icon" aria-hidden="true" />;
    if (v === "haram" || v === "usually_haram")
      return <XCircle className="status-icon haram-icon" aria-hidden="true" />;
    return <AlertCircle className="status-icon questionable-icon" aria-hidden="true" />;
  };

  const formatLastReviewed = (isoDate) => {
    if (!isoDate || typeof isoDate !== "string") return null;
    try {
      const d = new Date(isoDate);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return null;
    }
  };

  const relatedIngredientConfigs = useMemo(() => {
    if (!relatedIngredients || relatedIngredients.length === 0) return [];
    return relatedIngredients
      .map((slug) => getIngredientPageBySlug(slug))
      .filter(Boolean)
      .map((c) => ({ slug: c.slug, title: c.title || `Is ${c.ingredientName} Halal?` }));
  }, [relatedIngredients]);

  const pageUrl = canonical || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (!pageUrl || !title) return;
    const webPage = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description: description || rulingSummary || "",
      url: pageUrl,
      ...(lastReviewed && { dateModified: new Date(lastReviewed).toISOString().split("T")[0] }),
    };
    const faqSchema =
      faq && faq.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }
        : null;

    const scriptId = "seo-schema-ld";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    const payload = faqSchema ? [webPage, faqSchema] : webPage;
    script.textContent = JSON.stringify(payload);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [pageUrl, title, description, rulingSummary, lastReviewed, faq]);

  return (
    <div className="seo-page-layout" role="main">
      {/* H1 Title */}
      <header className="seo-header">
        <h1 className="seo-title">
          {title || `Is ${ingredientName || "This Ingredient"} Halal?`}
        </h1>
      </header>

      {/* Halal status and ruling summary */}
      <section className="seo-section seo-status-section" aria-labelledby="halal-status-title">
        <h2 id="halal-status-title" className="seo-section-title">
          Halal status: {ingredientName || "this ingredient"}
        </h2>
        {rulingSummary && (
          <div className={`seo-ruling-summary ruling-${rulingStatusForCss}`} role="alert">
            <div className="ruling-summary-content">
              {getStatusIcon()}
              <div>
                <p className="seo-halal-status-label">
                  <strong>Verdict:</strong> {statusLabel}
                </p>
                <p className="ruling-summary-text">{rulingSummary}</p>
                {formatLastReviewed(lastReviewed) && (
                  <p className="seo-last-reviewed" aria-label="Content last reviewed">
                    Last reviewed: {formatLastReviewed(lastReviewed)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <section className="seo-section" aria-labelledby="warnings-section-title">
          <h2 id="warnings-section-title" className="seo-section-title">
            Things to watch for
          </h2>
          <div className="seo-section-content">
            <ul className="seo-warnings-list" role="list">
              {warnings.map((warning, index) => (
                <li key={index} className="seo-warning-item" role="listitem">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Why is it halal or haram? */}
      {whyExplanation && (
        <section className="seo-section" aria-labelledby="why-section-title">
          <h2 id="why-section-title" className="seo-section-title">
            {statusLabel === "Unknown"
              ? `What's the ruling on ${ingredientName || "this ingredient"}?`
              : `Why is ${ingredientName || "it"} ${statusLabel.toLowerCase()}?`}
          </h2>
          <div className="seo-section-content">
            <p className="seo-explanation-text">{whyExplanation}</p>
          </div>
        </section>
      )}

      {/* Scholarly basis (replaces "Islamic evidence" for trust and nuance) */}
      {principles && principles.length > 0 && (
        <section className="seo-section" aria-labelledby="scholarly-section-title">
          <h2 id="scholarly-section-title" className="seo-section-title">
            Scholarly basis
          </h2>
          <div className="seo-section-content">
            <p className="seo-section-note">
              This guidance draws on widely cited Islamic principles and scholarly positions. Rulings can vary; when in doubt, consult a qualified scholar.
            </p>
            <ul className="seo-evidence-list" role="list">
              {principles.map((item, index) => (
                <li key={index} className="seo-evidence-item" role="listitem">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Halal Alternatives */}
      {halalAlternatives && halalAlternatives.length > 0 && (
        <section className="seo-section" aria-labelledby="alternatives-section-title">
          <h2 id="alternatives-section-title" className="seo-section-title">
            Halal Alternatives
          </h2>
          <div className="seo-section-content">
            <ul className="seo-alternatives-list" role="list">
              {halalAlternatives.map((alternative, index) => (
                <li key={index} className="seo-alternative-item" role="listitem">
                  <div className="alternative-header">
                    <strong className="alternative-name">{alternative.name}</strong>
                    {alternative.ratio && (
                      <span className="alternative-ratio">{alternative.ratio}</span>
                    )}
                  </div>
                  {alternative.notes && (
                    <p className="alternative-notes">{alternative.notes}</p>
                  )}
                  <div className="alternative-shop-links">
                    {shopProviders.length > 0 && shopProviders.map((p) => (
                      <AffiliateLink
                        key={p.id}
                        ingredientName={alternative.name}
                        platform={p.name}
                        variant="link"
                      />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Embedded ingredient lookup tool */}
      {quickLookupIngredient && (
        <section className="seo-section seo-lookup-section" aria-labelledby="lookup-section-title">
          <h2 id="lookup-section-title" className="seo-section-title">
            Check any ingredient
          </h2>
          <div className="seo-section-content">
            <p className="seo-lookup-intro">
              Use the tool below to look up halal status for {ingredientName} or any other ingredient.
            </p>
            <div className="seo-embedded-lookup">
              <QuickLookup
                initialSearch={quickLookupIngredient}
                autoSearchOnMount={true}
                onConvertClick={() => window.location.href = "/app"}
              />
            </div>
          </div>
        </section>
      )}

      {/* Related ingredient pages (internal linking) */}
      {relatedIngredientConfigs.length > 0 && (
        <section className="seo-section" aria-labelledby="related-ingredients-title">
          <h2 id="related-ingredients-title" className="seo-section-title">
            Related ingredients
          </h2>
          <div className="seo-section-content">
            <ul className="seo-related-list">
              {relatedIngredientConfigs.map(({ slug, title }) => (
                <li key={slug}>
                  <Link to={`/is-${slug}-halal`} className="seo-related-link">
                    <BookOpen className="seo-related-icon" aria-hidden="true" />
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Related recipe conversions (internal linking) */}
      {relatedConversions && relatedConversions.length > 0 && (
        <section className="seo-section" aria-labelledby="related-conversions-title">
          <h2 id="related-conversions-title" className="seo-section-title">
            Related recipe conversions
          </h2>
          <div className="seo-section-content">
            <ul className="seo-related-list">
              {relatedConversions.map((item, index) => {
                const entry = typeof item === "string" ? { title: item, path: "/app" } : item;
                const path = entry.path || "/app";
                return (
                  <li key={index}>
                    <Link to={path} className="seo-related-link">
                      <Link2 className="seo-related-icon" aria-hidden="true" />
                      {entry.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* FAQ Accordion */}
      {faq && faq.length > 0 && (
        <section className="seo-section" aria-labelledby="faq-section-title">
          <h2 id="faq-section-title" className="seo-section-title">
            Frequently Asked Questions
          </h2>
          <div className="seo-section-content">
            <div className="seo-faq-accordion" role="region" aria-label="FAQ">
              {faq.map((item, index) => {
                const isOpen = openFaqItems.has(index);
                return (
                  <div key={index} className="seo-faq-item">
                    <button
                      className="seo-faq-question"
                      onClick={() => toggleFaqItem(index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      id={`faq-question-${index}`}
                    >
                      <span className="faq-question-text">{item.question}</span>
                      {isOpen ? (
                        <ChevronUp className="faq-icon" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="faq-icon" aria-hidden="true" />
                      )}
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-answer-${index}`}
                        className="seo-faq-answer"
                        role="region"
                        aria-labelledby={`faq-question-${index}`}
                      >
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Buttons */}
      <section className="seo-cta-section" aria-label="Call to action">
        <div className="seo-cta-buttons">
          <button
            className="seo-cta-button seo-cta-button-primary"
            onClick={handleCheckAnotherIngredient}
            aria-label="Check another ingredient using Quick Lookup"
          >
            <Search className="cta-icon" aria-hidden="true" />
            <span>Check Another Ingredient</span>
          </button>
          <button
            className="seo-cta-button seo-cta-button-secondary"
            onClick={handleConvertRecipe}
            aria-label="Convert a full recipe"
          >
            <RefreshCw className="cta-icon" aria-hidden="true" />
            <span>Convert a Full Recipe</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default SEOPageLayout;
