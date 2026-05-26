/**
 * Generate public/sitemap.xml from ingredient page config.
 * Run: node scripts/generate-sitemap.mjs
 */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getAllIngredientPages } from "../src/data/ingredientPageConfig.js";
import { SITE_URL, SEO_LAST_MOD_DEFAULT } from "../src/lib/seo/constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../public/sitemap.xml");

const staticPages = [
  { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" },
  { loc: `${SITE_URL}/is-it-halal`, priority: "0.95", changefreq: "weekly" },
  { loc: `${SITE_URL}/halal-substitutes`, priority: "0.8", changefreq: "monthly" },
  { loc: `${SITE_URL}/how-it-works`, priority: "0.7", changefreq: "monthly" },
  { loc: `${SITE_URL}/app`, priority: "0.85", changefreq: "weekly" },
  { loc: `${SITE_URL}/about`, priority: "0.5", changefreq: "monthly" },
  { loc: `${SITE_URL}/privacy`, priority: "0.4", changefreq: "yearly" },
  { loc: `${SITE_URL}/terms`, priority: "0.4", changefreq: "yearly" },
  { loc: `${SITE_URL}/contact`, priority: "0.5", changefreq: "monthly" },
];

const ingredientPages = getAllIngredientPages().map((p) => ({
  loc: p.canonical,
  priority: String(p.priority ?? 0.85),
  changefreq: p.changefreq || "monthly",
  lastmod: p.lastReviewed || SEO_LAST_MOD_DEFAULT,
}));

const all = [...staticPages, ...ingredientPages];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || SEO_LAST_MOD_DEFAULT}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(outPath, xml, "utf8");
console.log(`Wrote ${all.length} URLs to ${outPath}`);
