# Modifier Detection for Halal Kitchen

## Goals

- Parse user queries into **base ingredient + modifiers**.
- Support **exact** and **fuzzy** matching (OCR-cleaned and normal typed text).
- Return **detected modifiers** and **which rule each modifier triggered**.

## Modifier taxonomy

Each modifier has a **slug**, **display name**, **effect** on verdict, and **rules** (exact + optional fuzzy patterns).

| Slug | Display name | Effect | Description |
|------|--------------|--------|-------------|
| `halal_certified` | Halal-certified | override_halal | Forces halal when present. |
| `plant_based` | Plant-based | override_halal | Plant/vegan variant; overrides for byproducts, meat, flavorings. |
| `bovine` | Bovine | strengthen | Source is beef/bovine; informs verdict. |
| `pork` | Pork | override_haram | Pork-derived; forces haram. |
| `chicken` | Chicken | strengthen | Source is chicken. |
| `beef` | Beef | strengthen | Source is beef. |
| `alcohol` | Alcohol | override_haram | Alcohol as ingredient. |
| `wine` | Wine | override_haram | Wine as ingredient. |
| `fermented` | Fermented | context | Fermentation; trace alcohol possible. |
| `artificial` | Artificial | context | Synthetic / artificial. |
| `natural_flavor` | Natural flavor | context | Natural flavoring. |
| `enzyme` | Enzyme | context | Enzyme (source often animal). |
| `rennet` | Rennet | context | Rennet (source animal). |
| `alcohol_free` | Alcohol-free | override_halal | No alcohol; overrides for flavoring_extract. |
| `alcohol_based` | Alcohol-based | override_haram | Contains alcohol. |

**Effect types:** `override_halal`, `override_haram`, `strengthen`, `weaken`, `context`. Overrides take precedence in the rule engine; context modifiers inform notes and category.

**Alias:** `plant_based` is aliased to `plant` for engine compatibility.

## Parser logic

1. **Normalize input** – `normalizeForMatching(raw)`: lowercase, trim, collapse spaces, replace punctuation with space. Safe for OCR and typed text.
2. **Match order** – Modifiers are tried in `MODIFIER_MATCH_ORDER` (most specific first: halal_certified, alcohol_free, plant_based, pork, wine, alcohol, …).
3. **Per modifier** – For each slug, run **exact** rules (word-boundary regex or string include). If no exact match and `fuzzy: true`, run **fuzzy** rules (typo/OCR variants: ≤1 character difference per word).
4. **First match wins** – Each modifier appears at most once; the first rule that matches sets `ruleId` and `matchedText`.
5. **Output** – `{ normalizedText, modifiers: [{ slug, displayName, ruleId, matchedText, matchType: 'exact'|'fuzzy' }] }`.

## Matching strategy

- **Exact:** RegExp with `\b` word boundaries or literal string in normalized text.
- **Fuzzy:** Target string (e.g. `certifled`) compared to each word in text; match if word equals target or has length within 1 and at most one character difference. Used only when exact fails and `options.fuzzy === true`.
- **OCR-cleaned text:** Same pipeline; normalization collapses spaces and strips punctuation so "halal  certified" and "halal-certified" both match.
- **Multiple modifiers:** All matching modifiers are returned; engine applies overrides in a fixed order (e.g. pork → haram, then halal_certified → halal).

## Files

| File | Role |
|------|------|
| `backend/src/services/modifierTaxonomy.js` | MODIFIER_TAXONOMY, MODIFIER_EFFECT, MODIFIER_MATCH_ORDER, MODIFIER_SLUG_ALIAS |
| `backend/src/services/modifierParser.js` | normalizeForMatching, parseModifiers, getModifierSlugs; exact + fuzzy matching |
| `backend/src/services/ingredientRuleEngine.js` | detectModifiers() calls parseModifiers, returns slugs + modifierDetails; evaluateIngredient() includes modifierDetails in result |

## Example outputs

### halal-certified bovine gelatin

- **Input:** `halal-certified bovine gelatin`
- **Normalized:** `halal certified bovine gelatin`
- **Base:** gelatin | **Category:** animal_byproduct
- **Modifiers (slugs):** `halal_certified`, `beef` (bovine)
- **Modifier details (which rule triggered):**
  - `halal_certified` – ruleId `halal_certified_1`, matchedText `halal certified`, matchType `exact`
  - `beef` – ruleId `beef_1`, matchedText `bovine`, matchType `exact`
- **Override:** halal_certified → **halal**, high  
- **Result:** verdict **halal**, confidence_level **high**

---

### beef gelatin

- **Input:** `beef gelatin`
- **Normalized:** `beef gelatin`
- **Base:** gelatin | **Category:** animal_byproduct
- **Modifiers:** `beef`
- **Modifier details:** `beef` – ruleId `beef_1`, matchedText `beef`, matchType `exact`
- **No override** (no pork, no halal_certified); DB or category default → **conditional**, medium  
- **Result:** verdict **conditional**, confidence_level **medium**

---

### rice wine vinegar

- **Input:** `rice wine vinegar`
- **Normalized:** `rice wine vinegar`
- **Base:** vinegar (from BASE_KEYWORDS) | **Category:** flavoring_extract
- **Modifiers:** `wine`, `fermented` (if “fermented” in taxonomy and matched)
- **Modifier details:** `wine` – ruleId `wine_1`, matchedText `wine`, matchType `exact`
- **Override:** wine → **usually_haram**, high  
- **Result:** verdict **usually_haram**, confidence_level **high** (rice wine vinegar contains wine)

---

### pork enzyme flavoring

- **Input:** `pork enzyme flavoring`
- **Normalized:** `pork enzyme flavoring`
- **Base:** pork (first matching base) or flavoring | **Category:** pork or flavoring_extract
- **Modifiers:** `pork`, `enzyme`
- **Modifier details:**
  - `pork` – ruleId `pork_1`, matchedText `pork`, matchType `exact`
  - `enzyme` – ruleId `enzyme_1`, matchedText `enzyme`, matchType `exact`
- **Override:** pork → **haram**, high  
- **Result:** verdict **haram**, confidence_level **high**

---

## API response shape

The classification/evaluation response includes:

- **modifiers:** `string[]` – slugs used for overrides (alias applied, e.g. `plant` for `plant_based`).
- **modifierDetails:** `Array<{ slug, displayName, ruleId, matchedText, matchType }>` – which rule each modifier triggered.

Example:

```json
{
  "verdict": "halal",
  "confidence_level": "high",
  "modifiers": ["halal_certified", "plant"],
  "modifierDetails": [
    { "slug": "halal_certified", "displayName": "Halal-certified", "ruleId": "halal_certified_1", "matchedText": "halal certified", "matchType": "exact" },
    { "slug": "beef", "displayName": "Beef", "ruleId": "beef_1", "matchedText": "bovine", "matchType": "exact" }
  ]
}
```
