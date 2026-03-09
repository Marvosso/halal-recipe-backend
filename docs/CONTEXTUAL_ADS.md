# Light Contextual Advertising

Ads are limited to **ingredient lookup results** and **recipe conversion results**, with one ad per section. They never block core actions and use responsive placements for mobile and desktop.

---

## 1. Recommended ad placements

| Placement              | Where it appears                         | When visible                    | Limit   |
|------------------------|------------------------------------------|----------------------------------|--------|
| **ingredient_lookup**  | Below the Quick Lookup result card       | Only after user sees a lookup result | 1 per section |
| **recipe_conversion**  | Below the Ingredient Categories accordion| Only when a recipe has been converted | 1 per section |

Rules:

- Ads **only** on: (1) ingredient lookup results, (2) recipe conversion results.
- Ads **never** on: input/textarea, Convert button, or any step that must be completed to use the product.
- **One ad per page section**: one in the lookup area, one in the conversion results area.

---

## 2. Example UI layout

### Ingredient lookup (Is It Halal?)

```
┌─────────────────────────────────────────┐
│  Is It Halal? – Quick ingredient lookup  │
├─────────────────────────────────────────┤
│  [ Search input                    ] [🔍]│
│  Recent lookups: rice | gelatin | …     │
├─────────────────────────────────────────┤
│  ✓ Halal  (result card)                 │
│  What this means: …                     │
│  [Convert Full Recipe]                  │
├─────────────────────────────────────────┤
│  Ad                                     │  ← single ad slot
│  [ responsive ad unit ]                 │
└─────────────────────────────────────────┘
```

### Recipe conversion results

```
┌─────────────────────────────────────────┐
│  Converted Recipe                        │
│  [ recipe text ]                         │
│  [ Copy ] [ Download ] [ Save ] [ Share ]│
│  [ Helpful ] [ Not helpful ]             │
├─────────────────────────────────────────┤
│  Shop Halal Ingredients (if applicable)  │
├─────────────────────────────────────────┤
│  Confidence Score: 85%                   │
├─────────────────────────────────────────┤
│  Ingredient Categories            [ − ]  │
│  (accordion with ingredient cards)      │
├─────────────────────────────────────────┤
│  Ad                                     │  ← single ad slot
│  [ responsive ad unit ]                 │
└─────────────────────────────────────────┘
```

Ads sit **below** the main content in each section so they do not block conversion or lookup.

---

## 3. Integration approach for Google AdSense

### 3.1 Script (index.html)

Load the AdSense script once (e.g. in `index.html`), with your publisher ID:

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
  crossorigin="anonymous"
></script>
```

Replace `ca-pub-XXXXXXXXXX` with your AdSense client ID.

### 3.2 Environment variables (frontend)

Use env vars so ads are disabled when not set (e.g. local/dev):

| Variable | Description |
|----------|-------------|
| `VITE_ADSENSE_CLIENT` | AdSense client ID (e.g. `ca-pub-XXXXXXXXXX`). If unset, no ad slots render. |
| `VITE_ADSENSE_SLOT_LOOKUP` | Slot ID for **ingredient lookup** (optional; can pass via component prop). |
| `VITE_ADSENSE_SLOT_CONVERSION` | Slot ID for **recipe conversion** (optional; can pass via component prop). |

Example `.env.production`:

```env
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXX
VITE_ADSENSE_SLOT_LOOKUP=1234567890
VITE_ADSENSE_SLOT_CONVERSION=0987654321
```

### 3.3 Component usage

`ContextualAd` is used in two places:

- **QuickLookup.jsx**  
  Renders when there is a lookup result:  
  `<ContextualAd placement="ingredient_lookup" />`

- **App.jsx**  
  Renders inside the conversion results block:  
  `<ContextualAd placement="recipe_conversion" className="conversion-results-ad" />`

Optional props:

- `slotId` – override the slot for this placement (otherwise uses env slot for that placement).
- `className` – extra CSS class.

If `VITE_ADSENSE_CLIENT` (or the effective slot) is missing, the component renders nothing.

### 3.4 Ad unit setup in AdSense

1. Create two **responsive** display units (or auto ads if you prefer; these slots are for in-content only).
2. Name them e.g. “Halal Kitchen – Ingredient Lookup” and “Halal Kitchen – Recipe Conversion”.
3. Use **Responsive** or **In-article** so they work on mobile and desktop.
4. Put the generated slot IDs into `VITE_ADSENSE_SLOT_LOOKUP` and `VITE_ADSENSE_SLOT_CONVERSION` (or pass them via `slotId`).

### 3.5 Responsive behavior

- The component uses `data-ad-format="auto"` and `data-full-width-responsive="true"` so AdSense can choose size.
- CSS caps the ad wrapper at 728px on large screens and keeps padding/margins consistent with the rest of the app.
- On small screens the ad stays within the content width and does not cover primary actions.

---

## 4. Fallback and trust

- **No client/slot configured:** `ContextualAd` returns `null`; no placeholder or empty space.
- **Clear labeling:** The “Ad” label is shown above the unit so it’s obvious it’s paid content.
- **No overlap with actions:** Ads are only below lookup result and below conversion/ingredient section, so they do not block convert, copy, or search.
