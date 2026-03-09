# Affiliate Single-Provider Mode (Amazon)

Monetization is refactored to support multiple retailers in the future while using **Amazon Associates** as the only affiliate provider initially. Purchase options are limited to **one retailer** until additional programs are approved.

---

## 1. Affiliate data model

### Provider config (frontend)

**`frontend/src/config/affiliateProviderConfig.js`**

- **AFFILIATE_PROVIDERS** – One entry per retailer (amazon, walmart, target, thrivemarket, etc.). Each has:
  - `id`, `name`, `display_name`, `enabled`, `url_template`, `affiliate_param`, `regions`, `product_fit`, `sort_order`, `color_hex`.
- **Initial state:** Only `amazon.enabled === true`. Others exist but `enabled: false` until approved.
- **MAX_LINKS_PER_INGREDIENT** – Number of purchase options shown per substitute. Set to **1** in single-provider mode; set to **3** when multiple providers are enabled.

### Backend (when DB is used)

- **affiliate_providers** – Rows per retailer; `is_active` controls inclusion. Only Amazon is active initially.
- **ingredient_substitute_links** – One row per (substitute_slug, provider_id) with `search_query`, optional `custom_url`, `is_featured`, etc.
- API returns at most **1** link per substitute (backend default limit = 1). Increase when more providers are approved.

### Link payload (normalized)

Each link sent to the UI has:

- `id`, `platform` (provider id), `platform_display`, `platform_color`, `search_query`, `url`, `is_featured`.
- Affiliate links are **only** attached to **halal substitutes** (replacement ingredients). Never to haram ingredients.

---

## 2. Frontend display logic

- **Who gets links:** Only ingredients that have a **halal replacement** (e.g. Bacon → Halal Beef Bacon). The replacement id is used to fetch affiliate links; haram ingredients never get a purchase card.
- **How many options:** `MAX_LINKS_PER_INGREDIENT` (currently 1). All slices and API limits use this:
  - **convertRecipeJson** – `getAffiliateLinksForSubstitutes(..., MAX_LINKS_PER_INGREDIENT)` and `links.slice(0, MAX_LINKS_PER_INGREDIENT)`.
  - **SubstitutePurchaseCard** – `affiliateLinks.slice(0, MAX_LINKS_PER_INGREDIENT)`.
  - **App.jsx** – Passes `(issue?.substitute_affiliate_links || []).slice(0, MAX_LINKS_PER_INGREDIENT)` into the card.
  - **AffiliateLinkGroup** – `affiliateLinks.slice(0, MAX_LINKS_PER_INGREDIENT)`.
- **When to show the card:** Only when `substitute_affiliate_links.length > 0`. If there are no links, the purchase card is **not** rendered; only a “Halal Replacement: [name]” row is shown (no shopping CTA).
- **Copy:** One option uses “Find it at:” + single retailer button (e.g. Amazon). Disclosure text is unchanged.

---

## 3. Fallback behavior

| Situation | Behavior |
|----------|----------|
| **No affiliate link for substitute** | Purchase card is hidden. Only “Halal Replacement: [name]” is shown; no buy button. |
| **API / backend unavailable** | Frontend uses client-side config: only enabled provider (Amazon) and mock link map; still at most 1 link per substitute. |
| **Provider disabled in config** | Excluded from `getEnabledProviders()`; no links returned for that provider. |
| **DB has no rows for substitute** | Backend returns `[]`; frontend shows no purchase card for that ingredient. |

---

## 4. Enabling more providers later

1. **Config:** In `affiliateProviderConfig.js`, set `enabled: true` for the new provider(s) and set `MAX_LINKS_PER_INGREDIENT = 3`.
2. **Backend:** In `backend/src/db/monetization.js`, set `MAX_LINKS_PER_INGREDIENT = 3` (and ensure `affiliate_providers` has the new provider active and `ingredient_substitute_links` has data).
3. **No UI changes required** – cards and copy already support 1–3 options (“Find it at” for 1, “Where to buy” for 2–3).
