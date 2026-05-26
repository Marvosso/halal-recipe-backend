/**
 * Static SEO manifest for prerender/CDN/crawl tools.
 * Run: node scripts/generate-seo-manifest.mjs
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getAllIngredientPages } from "../src/data/ingredientPageConfig.js";
import { buildPageMetadata } from "../src/lib/seo/metadata.js";
import { buildIngredientPageSchemaGraph } from "../src/lib/seo/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/seo-manifest.json");

const pages = getAllIngredientPages().map((config) => ({
  slug: config.slug,
  path: config.path,
  canonical: config.canonical,
  metadata: buildPageMetadata(config),
  schema: buildIngredientPageSchemaGraph(config),
  verdict: config.verdict,
  lastReviewed: config.lastReviewed,
}));

const manifest = {
  generatedAt: new Date().toISOString(),
  pageCount: pages.length,
  pages,
};

writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Wrote seo-manifest.json (${pages.length} ingredient pages)`);
