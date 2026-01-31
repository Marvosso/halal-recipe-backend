import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Search, RefreshCw } from "lucide-react";
import AffiliateLink from "./AffiliateLink";
import "./SEOPageLayout.css";

/**
 * SEO Page Layout Component
 * Reusable component for creating SEO-optimized ingredient pages
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (e.g., "Is Pork Halal?")
 * @param {string} props.description - Meta description for SEO
 * @param {string} props.ingredientName - Name of the ingredient
 * @param {string} props.rulingSummary - Short summary of halal/haram ruling
 * @param {string} props.whyExplanation - Detailed explanation of why it's halal/haram
 * @param {string[]} props.islamicEvidence - Array of Islamic evidence (Quran/Hadith references)
 * @param {Array<{name: string, notes?: string, ratio?: string}>} props.halalAlternatives - Array of halal alternatives
 * @param {Array<{question: string, answer: string}>} props.faq - Array of FAQ items
 */
function SEOPageLayout({
  title,
  description,
  ingredientName,
  rulingSummary,
  whyExplanation,
  islamicEvidence = [],
  halalAlternatives = [],
  faq = [],
  quickLookupIngredient = null // Ingredient name to pre-fill in Quick Lookup
}) {
  const [openFaqItems, setOpenFaqItems] = useState(new Set());

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

  // Determine ruling status from summary (for icon/color)
  const getRulingStatus = () => {
    if (!rulingSummary) return "unknown";
    const summary = rulingSummary.toLowerCase();
    if (summary.includes("halal") && !summary.includes("not") && !summary.includes("haram")) {
      return "halal";
    } else if (summary.includes("haram") || summary.includes("forbidden") || summary.includes("prohibited")) {
      return "haram";
    } else if (summary.includes("questionable") || summary.includes("conditional")) {
      return "questionable";
    }
    return "unknown";
  };

  const rulingStatus = getRulingStatus();

  const getStatusIcon = () => {
    switch (rulingStatus) {
      case "halal":
        return <CheckCircle className="status-icon halal-icon" aria-hidden="true" />;
      case "haram":
        return <XCircle className="status-icon haram-icon" aria-hidden="true" />;
      case "questionable":
        return <AlertCircle className="status-icon questionable-icon" aria-hidden="true" />;
      default:
        return <AlertCircle className="status-icon unknown-icon" aria-hidden="true" />;
    }
  };

  return (
    <div className="seo-page-layout" role="main">
      {/* H1 Title */}
      <header className="seo-header">
        <h1 className="seo-title">
          {title || `Is ${ingredientName || "This Ingredient"} Halal?`}
        </h1>
      </header>

      {/* Ruling Summary Box */}
      {rulingSummary && (
        <div className={`seo-ruling-summary ruling-${rulingStatus}`} role="alert">
          <div className="ruling-summary-content">
            {getStatusIcon()}
            <p className="ruling-summary-text">{rulingSummary}</p>
          </div>
        </div>
      )}

      {/* Why is it halal or haram? */}
      {whyExplanation && (
        <section className="seo-section" aria-labelledby="why-section-title">
          <h2 id="why-section-title" className="seo-section-title">
            Why is {ingredientName || "it"} {rulingStatus === "halal" ? "halal" : rulingStatus === "haram" ? "haram" : "questionable"}?
          </h2>
          <div className="seo-section-content">
            <p className="seo-explanation-text">{whyExplanation}</p>
          </div>
        </section>
      )}

      {/* Islamic Evidence */}
      {islamicEvidence && islamicEvidence.length > 0 && (
        <section className="seo-section" aria-labelledby="evidence-section-title">
          <h2 id="evidence-section-title" className="seo-section-title">
            Islamic Evidence
          </h2>
          <div className="seo-section-content">
            <ul className="seo-evidence-list" role="list">
              {islamicEvidence.map((evidence, index) => (
                <li key={index} className="seo-evidence-item" role="listitem">
                  {evidence}
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
                    <AffiliateLink
                      ingredientName={alternative.name}
                      platform="amazon"
                      variant="link"
                    />
                    <AffiliateLink
                      ingredientName={alternative.name}
                      platform="instacart"
                      variant="link"
                    />
                  </div>
                </li>
              ))}
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
