# Substitute Purchase UI – Retailer-Agnostic

The substitute purchase UI no longer assumes any specific retailer (e.g. Instacart). Copy and options are driven by config/API.

## Updated component copy

| Context | Copy |
|--------|------|
| **1 provider** | Label: **"Find it at:"** → one button with retailer name (e.g. "Amazon") |
| **2–3 providers** | Label: **"Where to buy:"** → up to 3 buttons with retailer names |
| **0 providers** | No shopping CTA; show only a **"Halal Replacement:"** row (no purchase card) |
| **Disclosure** | "We may earn a small commission at no extra cost to you. Helps keep Halal Kitchen free." (unchanged, subtle) |

All retailer names come from `platform_display` (API) or config (`display_name`). No hardcoded "Instacart" or other single-retailer copy.

---

## Conditional rendering logic

**SubstitutePurchaseCard**

- `affiliateLinks = (issue?.substitute_affiliate_links || []).slice(0, 3)`.
- **0 links:** Card is not rendered; App shows a single row: "Halal Replacement: [name]".
- **1 link:** Card shows replacement line + **"Find it at:"** + one button + disclosure.
- **2–3 links:** Card shows replacement line + **"Where to buy:"** + 2–3 buttons + disclosure.

**IngredientShopSection**

- Platform list from `getEnabledProviders()` (config). If no providers, section is not rendered.
- Buttons show `p.display_name` (e.g. Amazon, Walmart, Target, Thrive Market). No Instacart.

**AffiliateLink / SEOPageLayout**

- Use provider id from config; display text is `provider.display_name`. No hardcoded retailer list.

---

## Example UI states

### 0 providers

- **Where:** Ingredient card for a substitute that has no affiliate links.
- **Rendered:** No purchase card. One row: **Halal Replacement:** Halal Beef Bacon.
- **Shopping CTA:** None.

### 1 provider

- **Where:** Substitute has one link (e.g. Amazon only).
- **Rendered:**  
  **Replacement:** Bacon → Halal Beef Bacon  
  **Find it at:** [ Amazon ]  
  *We may earn a small commission…*
- **Shopping CTA:** Single button, clean.

### 2 providers

- **Where:** Substitute has two links (e.g. Amazon, Walmart).
- **Rendered:**  
  **Replacement:** Bacon → Halal Beef Bacon  
  **Where to buy:** [ Amazon ] [ Walmart ]  
  *We may earn a small commission…*
- **Shopping CTA:** Two buttons side by side.

### 3 providers

- **Where:** Substitute has three links (e.g. Amazon, Walmart, Target).
- **Rendered:**  
  **Replacement:** Bacon → Halal Beef Bacon  
  **Where to buy:** [ Amazon ] [ Walmart ] [ Target ]  
  *We may earn a small commission…*
- **Shopping CTA:** Three buttons; layout wraps on small screens.

---

## Styling notes

- Single button uses `.substitute-purchase-buttons--count-1` (e.g. min-width) so it doesn’t look lost.
- Affiliate block stays subtle: neutral background, light border, no loud CTAs.
- Disclosure is small, muted text below the buttons.
