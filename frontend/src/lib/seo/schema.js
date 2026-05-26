import { SITE_NAME, SITE_URL } from "./constants.js";
import { getIngredientCanonicalUrl, getIngredientPagePath } from "./urls.js";

/**
 * @param {object} config
 */
export function buildWebPageSchema(config) {
  const url = config.canonical || getIngredientCanonicalUrl(config.slug);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: config.title || `Is ${config.ingredientName} Halal?`,
    description: config.metaDescription || config.description || config.rulingSummary,
    url,
    inLanguage: "en",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    ...(config.lastReviewed && {
      dateModified: config.lastReviewed,
    }),
  };
}

/**
 * Article-style schema for long-form ingredient guides.
 * @param {object} config
 */
export function buildArticleSchema(config) {
  const url = config.canonical || getIngredientCanonicalUrl(config.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: config.title || `Is ${config.ingredientName} Halal?`,
    description: config.metaDescription || config.rulingSummary,
    url,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(config.lastReviewed && { dateModified: config.lastReviewed }),
    mainEntityOfPage: url,
  };
}

/**
 * @param {Array<{ question: string, answer: string }>} faq
 */
export function buildFAQSchema(faq) {
  if (!faq?.length) return null;
  return {
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
  };
}

/**
 * @param {object} config
 */
export function buildBreadcrumbSchema(config) {
  const path = getIngredientPagePath(config.slug);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Is It Halal?",
        item: `${SITE_URL}/is-it-halal`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: config.ingredientName,
        item: config.canonical || `${SITE_URL}${path}`,
      },
    ],
  };
}

/**
 * Combined JSON-LD graph for ingredient pages.
 * @param {object} config
 */
export function buildIngredientPageSchemaGraph(config) {
  const graph = [
    buildWebPageSchema(config),
    buildArticleSchema(config),
    buildBreadcrumbSchema(config),
    buildFAQSchema(config.faq),
  ].filter(Boolean);
  return graph.length === 1 ? graph[0] : graph;
}

/**
 * Serialize for script tag.
 * @param {object|object[]} graph
 */
export function serializeSchemaGraph(graph) {
  return JSON.stringify(graph);
}
