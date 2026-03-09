# SEO-Friendly Ingredient Pages

## URL structure

- Pattern: `/is-{slug}-halal`
- Examples:
  - `/is-gelatin-halal`
  - `/is-soy-sauce-halal`
  - `/is-bacon-halal`

Slugs use lowercase and hyphens (e.g. `soy-sauce`, `vanilla-extract`).

---

## Page template

Each ingredient page is built from:

1. **Helmet (meta)** – title, description, keywords, canonical, Open Graph, Twitter Card
2. **Nav** – “Back to Halal Kitchen” link to `/app`
3. **SEOPageLayout** with:
   - **H1** – “Is [Ingredient] Halal?”
   - **Ruling summary** – Short halal / haram / conditional statement + icon
   - **Warnings** (optional) – “Things to watch for” list
   - **Why** – Explanation of the ruling
   - **Islamic evidence** – Qur’an / Hadith / scholarly notes
   - **Halal alternatives** – Substitutes with ratio and notes
   - **FAQ** – Accordion of Q&A
   - **CTA** – “Check Another Ingredient” (Quick Lookup) + “Convert a Full Recipe”

Quick Lookup is pre-filled via `quickLookupIngredient` when the user clicks “Check Another Ingredient”.

---

## SEO metadata suggestions

| Field | Suggestion | Example |
|-------|------------|--------|
| **Title** | “Is [Ingredient] Halal? [Angle] \| Halal Kitchen” (≈ 60 chars) | Is Soy Sauce Halal? Guide to Halal Soy Sauce & Alternatives \| Halal Kitchen |
| **Meta description** | One sentence answering “Is X halal?” + what they’ll learn (≈ 155 chars) | Is soy sauce halal? Many brands contain alcohol. Learn which are halal, what to look for, and halal alternatives like tamari and coconut aminos. |
| **Canonical** | Absolute URL for the ingredient page | https://halalkitchen.app/is-soy-sauce-halal |
| **Keywords** | “is [X] halal”, “[X] haram”, “halal [X]”, alternatives, “Islamic dietary” | is soy sauce halal, halal soy sauce, soy sauce alcohol, tamari halal, coconut aminos |
| **OG title** | Same as title or shortened | Is Soy Sauce Halal? Guide \| Halal Kitchen |
| **OG description** | Same as meta description | |
| **OG url** | Same as canonical | |
| **Twitter card** | summary; title and description same as above | |

---

## Config shape (ingredientPageConfig.js)

Add an entry per ingredient, keyed by **slug** (e.g. `"soy-sauce"`):

```js
"soy-sauce": {
  slug: "soy-sauce",
  metaTitle: "Is Soy Sauce Halal? Guide to Halal Soy Sauce & Alternatives | Halal Kitchen",
  metaDescription: "Is soy sauce halal? Many brands contain alcohol...",
  canonical: "https://halalkitchen.app/is-soy-sauce-halal",
  keywords: "is soy sauce halal, halal soy sauce, ...",
  title: "Is Soy Sauce Halal?",
  description: "Soy sauce is often questionable...",
  ingredientName: "Soy Sauce",
  quickLookupIngredient: "soy sauce",
  rulingSummary: "Soy sauce is typically conditional...",
  warnings: [
    "Traditional soy sauce is fermented and may contain trace alcohol.",
    "Check the label for 'alcohol' and halal certification.",
  ],
  whyExplanation: "Soy sauce is made from soybeans, wheat...",
  islamicEvidence: [
    "Qur'an 5:90 - Prohibition of intoxicants...",
  ],
  halalAlternatives: [
    { name: "Halal-certified soy sauce", ratio: "1:1", notes: "Look for JAKIM, IFANCA..." },
    { name: "Tamari", ratio: "1:1", notes: "Often alcohol-free. Check label." },
    { name: "Coconut aminos", ratio: "1:1", notes: "Alcohol-free, naturally halal." },
  ],
  faq: [
    { question: "Is Kikkoman soy sauce halal?", answer: "Kikkoman has some halal-certified..." },
  ],
},
```

---

## Example page content: Is Soy Sauce Halal?

- **Ruling:** Conditional (depends on brand and scholar; many require halal-certified or alcohol-free).
- **Warnings:** Trace alcohol in fermented soy sauce; check labels; Japanese/Chinese brands vary.
- **Why:** Fermentation can produce alcohol; scholars differ on trace amounts and transformation (istihalah).
- **Evidence:** Qur’an 5:90, istihalah, “when in doubt avoid.”
- **Alternatives:** Halal-certified soy sauce, tamari, coconut aminos.
- **FAQ:** Kikkoman halal?, Does soy sauce contain alcohol?, Best halal substitute?, Light vs dark soy sauce?

The live page is at **/is-soy-sauce-halal** and is driven by the `soy-sauce` entry in `ingredientPageConfig.js`.

---

## Adding a new ingredient page

1. Add a new key to `INGREDIENT_PAGE_CONFIG` in `frontend/src/data/ingredientPageConfig.js` (slug = URL segment, e.g. `"rice"` → `/is-rice-halal`).
2. Fill in all fields (meta, title, description, rulingSummary, warnings, whyExplanation, islamicEvidence, halalAlternatives, faq).
3. No route change needed: the dynamic route `/is-:slug-halal` serves all slugs present in the config.
4. Optional: add internal links from the main “Is it halal?” or substitutes page to the new URL.

---

## Files

| File | Purpose |
|------|--------|
| `frontend/src/data/ingredientPageConfig.js` | Config for all ingredient pages (slug → content + meta) |
| `frontend/src/pages/IsIngredientHalalPage.jsx` | Dynamic page: reads `:slug`, loads config, renders Helmet + SEOPageLayout |
| `frontend/src/components/SEOPageLayout.jsx` | Reusable layout: ruling, warnings, why, evidence, alternatives, FAQ, CTAs |
| `frontend/src/components/AppRouter.jsx` | Route `path="/is-:slug-halal"` → IsIngredientHalalPage |
