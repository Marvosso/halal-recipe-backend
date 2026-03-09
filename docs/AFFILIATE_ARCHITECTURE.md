# Affiliate Link Architecture (Provider-Agnostic)

## Overview

- **No dependency on Instacart.** Current preferred partners: Amazon Associates, Walmart Affiliate/Creator, Target Affiliates, Thrive Market, and future direct halal grocery brand partners.
- **Configuration-driven:** Providers can be enabled/disabled via config (and later via DB) without changing UI code.
- **Product-fit ranking:** Which 3 links to show is determined by ingredient category (pantry → Amazon/Thrive; grocery → Walmart/Target; specialty → halal partners when available).
- **Affiliate links only on halal substitutes** — never on haram ingredients.

---

## 1. Affiliate Provider Configuration

**Location (frontend):** `frontend/src/config/affiliateProviderConfig.js`

Each provider has:

| Field | Description |
|-------|-------------|
| `id` | Unique key (e.g. `amazon`, `walmart`, `target`, `thrivemarket`) |
| `display_name` | UI label (e.g. "Amazon", "Walmart") |
| `enabled` | If `false`, provider is excluded from all link resolution |
| `product_fit` | Array: `pantry`, `grocery`, and/or `specialty` — when to prefer this provider |
| `url_template` | Search URL with `{query}` placeholder |
| `affiliate_param` | Optional `{ key, value }` for affiliate tag (e.g. Amazon `tag=halalkitchen-20`) |
| `regions` | Country codes where this provider is available (e.g. `['US']`) |
| `sort_order` | Lower = higher priority when multiple providers match |

To add or disable a partner: edit the config only; no UI or routing code changes.

---

## 2. Database Schema (Backend)

### 2.1 Affiliate providers (extend existing `affiliate_platforms`)

Suggested columns to add so backend can drive config from DB:

```sql
-- Add to affiliate_platforms (or new table affiliate_providers)
ALTER TABLE affiliate_platforms
  ADD COLUMN IF NOT EXISTS product_fit TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 99,
  ADD COLUMN IF NOT EXISTS regions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS affiliate_param_key VARCHAR(50),
  ADD COLUMN IF NOT EXISTS affiliate_param_value VARCHAR(255);
```

| Column | Type | Description |
|--------|------|-------------|
| `name` | VARCHAR(50) | Unique provider id (amazon, walmart, target, thrivemarket) |
| `display_name` | VARCHAR(100) | Display label |
| `base_url_template` | TEXT | e.g. `https://www.amazon.com/s?k={query}` |
| `product_fit` | TEXT[] | `{pantry,grocery,specialty}` |
| `sort_order` | INTEGER | Priority when ranking |
| `regions` | TEXT[] | e.g. `{US}` |
| `is_active` | BOOLEAN | When false, provider is disabled |
| `affiliate_param_key` | VARCHAR(50) | e.g. `tag` |
| `affiliate_param_value` | VARCHAR(255) | e.g. `halalkitchen-20` |

**Seed/update:** Remove Instacart from seed; add Walmart and Target:

```sql
INSERT INTO affiliate_platforms (name, display_name, base_url_template, color_hex, product_fit, sort_order, regions)
VALUES
  ('amazon', 'Amazon', 'https://www.amazon.com/s?k={query}', '#FF9900', ARRAY['pantry','specialty'], 1, ARRAY['US','CA','UK']),
  ('walmart', 'Walmart', 'https://www.walmart.com/search?q={query}', '#0071CE', ARRAY['grocery'], 2, ARRAY['US']),
  ('target', 'Target', 'https://www.target.com/s?searchTerm={query}', '#CC0000', ARRAY['grocery'], 3, ARRAY['US']),
  ('thrivemarket', 'Thrive Market', 'https://thrivemarket.com/search?q={query}', '#2E7D32', ARRAY['pantry','specialty'], 4, ARRAY['US'])
ON CONFLICT (name) DO UPDATE SET
  product_fit = EXCLUDED.product_fit,
  sort_order = EXCLUDED.sort_order,
  regions = EXCLUDED.regions;
-- Do not insert or activate 'instacart'.
```

### 2.2 Substitute–provider links

Existing `affiliate_links` table links substitute (ingredient) to platform and holds `search_query`, `is_featured`, etc. Use it as:

- **substitute_id** → ingredient (normalized substitute id or FK to ingredients table)
- **platform_id** → FK to `affiliate_platforms`
- **search_query** → query string for url_template
- **region_id** → optional, for region-specific links

So: **affiliate_providers** (or extended `affiliate_platforms`) + **affiliate_links** (substitute_id, platform_id, search_query, …) give the full architecture. No separate “affiliate providers” table is required if you extend `affiliate_platforms` as above.

---

## 3. Ranking Logic (Which 3 Links to Show)

1. **Categorize ingredient** by product fit:
   - **pantry:** shelf-stable (e.g. agar_agar, grape_juice, vanilla_extract, flour, vinegar)
   - **grocery:** mainstream grocery (e.g. turkey_bacon, halal_beef_bacon, fresh_herbs, dairy)
   - **specialty:** halal-specific (e.g. halal_gelatin, halal_cheese, halal_parmesan)
   - **unknown:** fallback

2. **Select providers:** Among **enabled** providers available in the user’s **region**, keep those whose `product_fit` includes the ingredient’s category (or `specialty` for specialty). If none match, use all enabled in-region providers.

3. **Sort:** By `sort_order` (then by `is_featured` on the link, then by click count if available).

4. **Limit:** Return at most **3** links per ingredient.

**Result:** Pantry → Amazon, Thrive Market (and optionally a third). Grocery → Walmart, Target (and optionally a third). Specialty → Amazon, Thrive, future halal partners.

---

## 4. UI Component (React)

**SubstitutePurchaseCard** (`frontend/src/components/SubstitutePurchaseCard.jsx`):

- Renders **Replacement:** `Original → Halal substitute`.
- **Buy options:** Up to 3 links, in the order returned by ranking (no hardcoded retailer order).
- If there are **no** affiliate links for the substitute, the purchase card is **hidden** (graceful hide).
- Tracks: substitute_viewed, affiliate_provider_shown, affiliate_click (see Analytics).

---

## 5. Analytics Events

| Event | When | Props (example) | Use |
|-------|------|------------------|-----|
| `substitute_viewed` | Purchase card is shown for a halal replacement | `ingredient_id`, `substitute_id`, `providers_shown[]`, `region` | Denominator for CTR |
| `affiliate_provider_shown` | Same card with at least one link | `substitute_id`, `providers[]`, `region` | Per-provider impression |
| `affiliate_click` | User clicks a buy link | `ingredient_id`, `substitute_id`, `platform`, `link_id`, `region` | Numerator for CTR |

**CTR:**  
- **Overall:** `affiliate_click` count / `substitute_viewed` count (or / `affiliate_provider_shown` count).  
- **Per provider:** `affiliate_click` where `platform = X` / `affiliate_provider_shown` where `providers` includes `X`.

---

## 6. Enabling/Disabling Providers

- **Frontend:** In `affiliateProviderConfig.js`, set `enabled: false` for a provider. It will not appear in `getEnabledProviders()` and will be excluded from routing and UI.
- **Backend (future):** If providers are stored in DB, set `is_active = false` and have the API return only active providers; frontend or API can cache config and refresh when needed.

No UI code changes are required to add or remove a retailer.
