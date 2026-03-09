# Recipe Substitution System

Halal Kitchen returns **3–5 substitutes** per haram/conditional ingredient, with metadata and a **ranking formula** so the most useful option is first.

---

## 1. Substitution ranking algorithm

- **Inputs per substitute**
  - `flavor_similarity`: 0–100 (how close in taste to the original)
  - `cooking_context`: list of contexts (e.g. `["sauces", "deglazing", "marinades"]`)
  - `availability`: `"high"` (100), `"medium"` (70), `"low"` (40)

- **Context match** (optional)
  - If the recipe has a `cookingContext` hint, substitutes whose `cooking_context` includes it get 100; others get 70. If no hint, everyone gets 100.

- **Score**
  - `rank_score = 0.40 × flavor_similarity + 0.35 × availability_score + 0.25 × context_match`
  - All terms normalized 0–100; result is 0–100.

- **Sort**
  - Substitutes are sorted by `rank_score` descending; top 3–5 are returned (configurable `maxCount`).

---

## 2. Rule structure (per ingredient)

Each haram/conditional ingredient in `substitutionDatabase.js` has an array of substitutes. Each substitute has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Substitute ingredient ID (snake_case) |
| `flavor_similarity` | number | 0–100 |
| `cooking_context` | string[] | e.g. `["sauces", "deglazing", "general"]` |
| `availability` | `"high"` \| `"medium"` \| `"low"` | Ease of finding in stores |
| `why_it_works` | string | Short explanation for the user |

If an ingredient has no row in the DB, the engine falls back to `halal_knowledge` alternatives (no ranking or `why_it_works`).

---

## 3. Example output

### White wine

**Ranked substitutes (top 5):**

| Rank | Substitute | Flavor | Availability | Why it works |
|------|------------|--------|--------------|--------------|
| 1 | Grape juice + vinegar | 85 | high | Grape juice plus a splash of vinegar mimics wine’s acidity and fruit; use ¾ cup juice + ¼ cup vinegar per cup of wine. |
| 2 | Non-alcoholic wine | 95 | medium | Alcohol-free wine keeps the same flavor profile without alcohol; swap 1:1 in recipes. |
| 3 | Chicken stock + apple cider vinegar | 55 | high | Stock adds depth; a little vinegar adds tang. Good when you don’t need a fruity note. |
| 4 | White grape juice | 70 | high | Works well for white wine in poaching or light sauces; add a touch of vinegar if you want more acidity. |
| 5 | Vegetable broth + lemon | 50 | high | Broth with lemon gives brightness and acidity without alcohol; best in vegetable-focused dishes. |

**Primary replacement (first in list):** `grape_juice_plus_vinegar`.

---

### Bacon

**Ranked substitutes (top 5):**

| Rank | Substitute | Flavor | Availability | Why it works |
|------|------------|--------|--------------|--------------|
| 1 | Turkey bacon | 75 | high | Turkey bacon is widely available and halal; it crisps like pork bacon. Use 1:1; it’s leaner so a little oil can help. |
| 2 | Beef bacon (halal) | 90 | medium | Halal beef bacon is the closest in flavor and texture to pork bacon; look for halal-certified brands. |
| 3 | Smoked turkey bacon | 80 | high | Smoked turkey bacon adds a similar smoky note; use 1:1 in most recipes. |
| 4 | Halal beef pastrami | 65 | medium | Cured, sliced beef pastrami (halal) can stand in for bacon in sandwiches and salads when you want a salty, meaty bite. |
| 5 | Crispy mushrooms | 45 | high | Sliced mushrooms fried until crispy give an umami, slightly smoky option for vegetarian dishes. |

**Primary replacement:** `turkey_bacon` (or `beef_bacon_halal` depending on availability weight).

---

### Gelatin

**Ranked substitutes (top 5):**

| Rank | Substitute | Flavor | Availability | Why it works |
|------|------------|--------|--------------|--------------|
| 1 | Agar agar | 70 | high | Agar agar is plant-based and sets at room temperature. Use about 2 tbsp powder per 1 tbsp gelatin; boil to activate. |
| 2 | Halal beef gelatin | 98 | medium | Halal-certified beef gelatin behaves like regular gelatin; use 1:1. Check for a trusted halal symbol. |
| 3 | Pectin | 55 | high | Pectin is fruit-derived and ideal for jams and jellies; it doesn’t replace gelatin in mousses or marshmallows. |
| 4 | Chia seeds | 40 | high | Chia seeds gel when soaked and work in puddings and thickeners; not a direct swap for clear jellies. |
| 5 | Cornstarch slurry | 35 | high | Cornstarch thickens sauces and some fillings; it doesn’t set like gelatin but is useful in non-set applications. |

**Primary replacement:** `agar_agar` (or `halal_beef_gelatin` when availability is weighted higher).

---

## 4. Files

| File | Purpose |
|------|---------|
| `frontend/src/data/substitutionDatabase.js` | DB of 3–5 substitutes per ingredient with metadata; `getSubstituteEntries`, `getSubstitutionKey`. |
| `frontend/src/lib/substitutionRanking.js` | `getRankedSubstitutes(ingredientId, { cookingContext, maxCount })`; scoring and sort. |
| `frontend/src/lib/convertRecipeJson.js` | Uses `getRankedSubstitutes`; sets `replacement_id` to top substitute; attaches `ranked_substitutes` and `alternatives` on each issue. |
| `frontend/src/App.jsx` | Shows primary replacement with `whyItWorks`; “More substitutes” list with names and `why_it_works`. |
| `frontend/src/components/SubstitutePurchaseCard.jsx` | Optional `whyItWorks` prop; shows short explanation under replacement. |

---

## 5. API (for conversion issues)

Each issue in `convertRecipeWithJson` can include:

- **`replacement_id`** – Top-ranked substitute ID.
- **`alternatives`** – Array of substitute IDs (same order as ranked).
- **`ranked_substitutes`** – Array of `{ id, flavor_similarity, cooking_context, availability, why_it_works, rank_score }`.
- **`substitutes_with_links`** – Same as before, with optional `why_it_works` and `rank_score` per item for the UI.
