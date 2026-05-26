import React from "react";
import { Helmet } from "react-helmet-async";
import { buildPageMetadata } from "../../lib/seo/metadata.js";

/**
 * Dynamic metadata for config-driven ingredient pages.
 * @param {{ config: object }} props
 */
function IngredientPageHead({ config }) {
  if (!config) return null;
  const meta = buildPageMetadata(config);

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      <link rel="canonical" href={meta.canonical} />
      <meta name="robots" content={meta.robots} />

      <meta property="og:type" content={meta.openGraph.type} />
      <meta property="og:site_name" content={meta.openGraph.siteName} />
      <meta property="og:title" content={meta.openGraph.title} />
      <meta property="og:description" content={meta.openGraph.description} />
      <meta property="og:url" content={meta.openGraph.url} />
      <meta property="og:image" content={meta.openGraph.image} />

      <meta name="twitter:card" content={meta.twitter.card} />
      <meta name="twitter:title" content={meta.twitter.title} />
      <meta name="twitter:description" content={meta.twitter.description} />
    </Helmet>
  );
}

export default IngredientPageHead;
