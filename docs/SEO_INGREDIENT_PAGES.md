# SEO Ingredient Pages – Template & Metadata

Guide for "Is ___ halal?" pages: config-driven, trust-focused, and optimized for search and rich results.

---

## 1. Page template (updated)

### URL format

- Pattern: `/is-[ingredient]-halal`
- Examples: `/is-gelatin-halal`, `/is-soy-sauce-halal`
- Use lowercase; multi-word ingredients use hyphens (e.g. `soy-sauce`, `vanilla-extract`).

### Standardized verdict system

Use exactly one of these values in config `verdict` (from `seoVerdicts.js`):

| Verdict           | Value            | Use when |
|-------------------|------------------|----------|
| Halal             | `halal`          | Clearly permissible with no common exceptions. |
| Usually halal     | `usually_halal`  | Generally permissible; rare exceptions (e.g. cross-contamination). |
| Conditional       | `conditional`    | Depends on source, certification, or scholar; avoid absolute “halal” or “haram”. |
| Usually haram     | `usually_haram`  | Most common forms are not permissible; halal-certified or specific sources may be OK. |
| Haram             | `haram`          | Clearly impermissible (e.g. pork, alcohol as beverage). |

This keeps wording consistent and avoids sounding overly absolute on disputed matters.

### Section order and headings (H1/H2)

| Order | Section              | Heading (H2)                         | Content |
|-------|----------------------|--------------------------------------|---------|
| 1     | **Halal status**     | "Halal status: [ingredient name]"    | Verdict label + ruling summary + **Last reviewed** date. |
| 2     | **Warnings**         | "Things to watch for"                | Bullet list of practical cautions. |
| 3     | **Explanation**      | "Why is [ingredient] [verdict]?"      | One or two paragraphs. |
| 4     | **Scholarly basis**  | "Scholarly basis"                    | Principles and references; note that rulings can vary and to consult a scholar when in doubt. |
| 5     | **Halal alternatives** | "Halal Alternatives"               | Alternatives with name, ratio, notes. |
| 6     | **Lookup tool**      | "Check any ingredient"               | Embedded Quick Lookup. |
| 7     | **Related ingredients** | "Related ingredients"             | Internal links to other ingredient pages. |
| 8     | **Related conversions** | "Related recipe conversions"     | Internal links to app/convert. |
| 9     | **FAQ**              | "Frequently Asked Questions"        | Accordion Q&As. |
| 10    | **CTA**              | (no H2)                              | "Check Another Ingredient", "Convert a Full Recipe". |

- **H1**: "Is [Ingredient] Halal?"
- Prefer **Scholarly basis** over "Islamic evidence" for a safer, more trustworthy tone.
- **Last reviewed**: Shown under the verdict; use ISO date (e.g. `2025-03-01`) in config.

---

## 2. Config changes

### New/updated fields in `ingredientPageConfig.js`

| Field                 | Type     | Required | Description |
|-----------------------|----------|----------|-------------|
| `verdict`             | string   | Yes      | One of: `halal`, `usually_halal`, `conditional`, `usually_haram`, `haram` (use `VERDICT` from `seoVerdicts.js`). |
| `scholarlyBasis`       | string[] | Recommended | Replaces `islamicEvidence`; principles and references, phrased for trust and nuance. |
| `lastReviewed`        | string   | Recommended | ISO date (YYYY-MM-DD) when the page was last reviewed. |
| `relatedIngredients`  | string[] | Optional | Slugs of related ingredient pages (e.g. `["soy-sauce"]`). |
| `relatedConversions`  | array    | Optional | Related recipe conversions: `{ title, path? }[]` or `string[]` (path defaults to `/app`). |
| `canonical`           | string   | Yes      | Full canonical URL (used for schema and links). |

- **Backward compatibility**: If `scholarlyBasis` is missing, layout falls back to `islamicEvidence`.
- **Verdict**: Prefer `verdict` over `halalStatus`; the template derives the label from `verdict`.

### Example config entry (gelatin)

```js
import { VERDICT } from "./seoVerdicts";

gelatin: {
  slug: "gelatin",
  metaTitle: "Is Gelatin Halal? Complete Guide with Halal Alternatives | Halal Kitchen",
  metaDescription: "Is gelatin halal? Learn about the Islamic ruling on gelatin, why it's usually haram, and discover halal alternatives like agar agar. Complete guide with scholarly basis.",
  canonical: "https://halalkitchen.app/is-gelatin-halal",
  keywords: "is gelatin halal, gelatin haram, halal gelatin, agar agar, halal alternatives, Islamic dietary laws",
  title: "Is Gelatin Halal?",
  description: "Gelatin is typically haram (forbidden) in Islam because it's usually derived from pork or non-halal animals. However, halal-certified gelatin from halal sources is permissible. Learn about halal alternatives like agar agar.",
  ingredientName: "Gelatin",
  quickLookupIngredient: "gelatin",
  verdict: VERDICT.USUALLY_HARAM,
  rulingSummary: "Gelatin is usually haram unless it's halal-certified. Most commercial gelatin comes from pork or non-halal animals, making it impermissible for many Muslims. Halal-certified or plant-based alternatives are available.",
  lastReviewed: "2025-03-01",
  warnings: [
    "Most marshmallows, gummy candies, and Jell-O contain pork-derived gelatin unless labeled halal or vegan.",
    "Medicinal capsules and some dairy products may use gelatin—check the label or choose halal-certified brands.",
    "When the source is unknown, scholars recommend avoiding gelatin (principle of caution).",
  ],
  whyExplanation: "Gelatin is a protein derived from animal collagen...",
  scholarlyBasis: [
    "Prohibition of consuming what is derived from haram sources (e.g. Qur'an 2:173).",
    "Emphasis on consuming halal and avoiding doubtful matters (hadith literature).",
    "Principle of transformation (istihalah): some scholars debate whether gelatin undergoes sufficient change; the majority view is that gelatin from pork remains impermissible.",
  ],
  halalAlternatives: [ /* ... */ ],
  relatedIngredients: ["soy-sauce"],
  relatedConversions: [
    { title: "Marshmallow treats", path: "/app" },
    { title: "Panna cotta", path: "/app" },
  ],
  faq: [ /* ... */ ],
},
```

---

## 3. Structured data (schema markup)

The layout injects JSON-LD into the page `<head>` when `canonical` (or current URL) and `title` are available.

### WebPage

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Is Gelatin Halal?",
  "description": "Gelatin is usually haram unless halal-certified...",
  "url": "https://halalkitchen.app/is-gelatin-halal",
  "dateModified": "2025-03-01"
}
```

- `dateModified` is set from `lastReviewed` when provided (ISO date string).

### FAQPage

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is all gelatin haram?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Not necessarily. Gelatin derived from halal-certified sources..."
      }
    }
  ]
}
```

- One `Question`/`Answer` per FAQ item; supports rich results in search when eligible.

### Injection

- Both objects are emitted in a single `<script type="application/ld+json">` in `document.head` (array when both WebPage and FAQPage exist).
- Script id: `seo-schema-ld`; updated when `canonical`, `title`, `description`, `lastReviewed`, or `faq` change; removed on unmount.

---

## 4. Metadata suggestions

- **Title**: `Is [Ingredient] Halal? [Short benefit] | Halal Kitchen` (~50–60 chars).
- **Meta description**: Question + verdict nuance + alternative or action (~150–160 chars).
- **Canonical**: `https://halalkitchen.app/is-[ingredient]-halal`.
- **Keywords**: 6–10 phrases; avoid stuffing.
- **OG/Twitter**: Same title, description, and URL.

---

## 5. Trust and nuance

- Use **Scholarly basis** (not "Islamic evidence") and a short note that rulings can vary and that users should consult a qualified scholar when in doubt.
- Use the **standardized verdict** labels so pages don’t sound overly absolute on disputed matters (e.g. "Usually haram" or "Conditional" instead of definitive "Haram" where appropriate).
- **Last reviewed** signals that content is maintained and supports trust and SEO.

---

## 6. File reference

| File | Purpose |
|------|---------|
| `frontend/src/data/seoVerdicts.js` | Verdict constants and labels. |
| `frontend/src/data/ingredientPageConfig.js` | Config for all ingredient pages; verdict, scholarlyBasis, lastReviewed, relatedIngredients, relatedConversions. |
| `frontend/src/pages/IsIngredientHalalPage.jsx` | Route handler; passes config (including canonical) to SEOPageLayout. |
| `frontend/src/components/SEOPageLayout.jsx` | Template: verdict, status, warnings, explanation, Scholarly basis, last reviewed, related links, FAQ, JSON-LD. |
| `frontend/src/pages/IsGelatinHalalPage.jsx` | Dedicated gelatin page; reads from config for single source of truth. |
