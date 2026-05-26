# SEO Ingredient Page System — Architecture

Config-driven ingredient pages for Halal Kitchen (top 25 initial rollout).

## 1. Page architecture

```
data/seo/top25Ingredients.js     → definitions (slug, verdict, copy)
data/seo/ingredientPageFactory.js → createIngredientPage(), buildIngredientPageMap()
data/ingredientPageConfig.js      → INGREDIENT_PAGE_CONFIG (single source of truth)

lib/seo/
  constants.js    → SITE_URL, SITE_NAME
  urls.js         → getIngredientPagePath(), getIngredientCanonicalUrl()
  metadata.js     → buildPageMetadata(), buildHubMetadata()
  schema.js       → WebPage, Article, FAQPage, BreadcrumbList
  internalLinks.js → hub sections, related slugs, footer featured list

pages/IsIngredientHalalPage.jsx   → route /is-:slug-halal
components/seo/IngredientPageHead.jsx → react-helmet-async metadata
components/seo/SchemaMarkup.jsx     → JSON-LD injection
components/SEOPageLayout.jsx        → template (lookup, FAQ, related links)
components/seo/IngredientHubIndex.jsx → /is-it-halal index
```

**URL pattern:** `/is-{slug}-halal` (e.g. `/is-gelatin-halal`)

## 2. Metadata system

`buildPageMetadata(config)` produces title, description, canonical, Open Graph, Twitter, and robots tags. Used by `IngredientPageHead` (Helmet).

Hub page uses `buildHubMetadata()` on `/is-it-halal`.

## 3. Schema implementation

`buildIngredientPageSchemaGraph(config)` emits:

- **WebPage** — name, description, url, dateModified
- **Article** — headline, publisher
- **BreadcrumbList** — Home → Is It Halal? → ingredient
- **FAQPage** — when `faq[]` is present

Injected via `SchemaMarkup` component (single `application/ld+json` script).

## 4. Static generation

| Artifact | Generator | Output |
|----------|-----------|--------|
| Sitemap | `npm run generate:seo` | `public/sitemap.xml` |
| SEO manifest | same | `public/seo-manifest.json` (metadata + schema per page) |

`prebuild` runs `generate:seo` before `vite build`.

## 5. Internal linking strategy

1. **Hub** — `/is-it-halal` lists all 25 pages by verdict group (`IngredientHubIndex`)
2. **Related ingredients** — auto-suggested by verdict cluster + config overrides
3. **Footer** — featured high-intent slugs (`FEATURED_INGREDIENT_SLUGS`)
4. **Cross-links** — each page links to 3 related ingredient pages and `/app`
5. **Embedded Quick Lookup** — `source=seo` on server lookup when enabled

## Adding a new ingredient page

1. Add entry to `data/seo/top25Ingredients.js` (or a new batch file merged in config)
2. Run `npm run generate:seo`
3. Route is automatic via `/is-:slug-halal`

## File reference

| File | Purpose |
|------|---------|
| `frontend/src/data/ingredientPageConfig.js` | Exported config map |
| `frontend/src/lib/seo/*` | Metadata, schema, URLs, linking |
| `frontend/scripts/generate-sitemap.mjs` | Sitemap builder |
| `frontend/scripts/generate-seo-manifest.mjs` | Static manifest for crawlers |
