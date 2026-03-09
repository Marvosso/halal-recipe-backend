# Monetization Layer (Affiliate)

Provider-agnostic affiliate system: **affiliate_providers** + **ingredient_substitute_links**. The frontend reads **normalized affiliate data** from the API (no hardcoded retailer names in UI).

## Schema

### affiliate_providers

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(50) UNIQUE | Slug (e.g. `amazon`, `walmart`, `target`, `thrivemarket`) |
| display_name | VARCHAR(100) | UI label (e.g. "Amazon", "Walmart") |
| url_template | TEXT | Search URL with `{query}` placeholder |
| color_hex | VARCHAR(7) | Optional button/theme color |
| product_fit | TEXT[] | Categories: `pantry`, `grocery`, `specialty` — for priority ranking |
| sort_order | INTEGER | Lower = higher priority when multiple providers match |
| regions | TEXT[] | Country codes (e.g. `{US,CA}`). Empty = all regions. |
| is_active | BOOLEAN | When false, provider is excluded (enable/disable by config) |
| affiliate_param_key / affiliate_param_value | VARCHAR | Optional global affiliate tag (e.g. Amazon `tag=halalkitchen-20`) |
| sponsorship_type | VARCHAR | `standard` (retailer) or `direct_halal_brand` (future sponsors) |

### ingredient_substitute_links

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| substitute_slug | VARCHAR(100) | Normalized ingredient id (e.g. `agar_agar`, `halal_beef_bacon`) — no FK |
| provider_id | UUID | FK → affiliate_providers |
| region_code | VARCHAR(10) | Optional; NULL = all regions |
| search_query | TEXT | Query for url_template |
| custom_url | TEXT | Optional direct product URL |
| affiliate_param_key / affiliate_param_value | VARCHAR | Optional override per link |
| is_featured | BOOLEAN | Preferred in ranking |
| is_active | BOOLEAN | When false, link is excluded |
| display_order | INTEGER | Tie-breaker in ranking |

Unique: `(substitute_slug, provider_id)`.

## Running migrations

```bash
# From project root (or backend)
psql $DATABASE_URL -f backend/src/migrations/create_monetization_layer.sql
psql $DATABASE_URL -f backend/src/migrations/seed_monetization_layer.sql
```

## Backend query logic

- **getActiveProviders(regionCode)**  
  Returns providers where `is_active = true` and either `regions` is empty or `regionCode` is in `regions`.  
  **Fallback:** If DB unavailable (`safeGetPool()` null), returns `[]`.

- **getLinksForSubstitute(substituteSlug, regionCode, limit)**  
  1. Load links from `ingredient_substitute_links` for `substitute_slug`, join `affiliate_providers`.  
  2. Keep only providers that are in `getActiveProviders(regionCode)` (enabled + in region).  
  3. Rank by: product_fit match (ingredient category) → provider `sort_order` → `is_featured` → `display_order`.  
  4. Return up to `limit` (default 3) with `url` built from template + optional affiliate param.  
  **Fallback:** No links or provider unavailable → return `[]`.

- **getLinksForSubstitutes(substituteSlugs, regionCode, limitPerSubstitute)**  
  Batch of the above. **Fallback:** Missing substitute → `[]` for that key.

## API

- `GET /api/affiliate/providers?region=US` → `{ providers: [...] }`
- `GET /api/affiliate/links?substitute=agar_agar&region=US&limit=3` → `{ links: [...] }`
- `POST /api/affiliate/links/batch` body `{ substituteIds: [], regionCode?, limitPerSubstitute? }` → `{ linksBySubstitute: { [slug]: [...] } }`

All links are **normalized** (provider `id`, `display_name`, `url`, etc.) so the frontend never relies on hardcoded retailer names.

## Frontend

- **affiliateService.js**  
  - Calls `POST /api/affiliate/links/batch` first.  
  - Normalizes response to `{ id, platform: { name, display_name, color_hex }, search_query, url, is_featured }`.  
  - **Fallback:** If API fails or a substitute has no links, uses client-side config (same shape) so the UI keeps working.

- **convertRecipeJson** uses `link.url || buildAffiliateUrl(link)` so API-sourced links use the pre-built `url`.

## Enabling/disabling providers

- **DB:** Set `affiliate_providers.is_active = false` for a provider; it will not appear in `getActiveProviders` or in link results.
- **Future:** Support env or config overlay to disable providers without DB change.

## Future direct halal brand sponsors

- Add a row in `affiliate_providers` with `sponsorship_type = 'direct_halal_brand'` and `product_fit` including `specialty`.  
- Add rows in `ingredient_substitute_links` for that `provider_id` and relevant `substitute_slug`s.  
- Ranking already prefers `product_fit` match, so specialty ingredients will surface the new provider when enabled.
