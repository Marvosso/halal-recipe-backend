# Deterministic Halal Rule Engine

## Verdicts

| Verdict | Description |
|---------|-------------|
| `halal` | Permissible; no restriction. |
| `usually_halal` | Generally permissible; minor scholarly difference. |
| `conditional` | Depends on source or preparation; verify when possible. |
| `usually_haram` | Generally not permissible; e.g. alcohol as ingredient. |
| `haram` | Not permissible. |
| `unknown` | Used only when classification truly fails (no base identified). |

## Confidence levels

| Level | When used |
|-------|-----------|
| `high` | Clear rule or hard override (e.g. pork → haram, halal-certified → halal, plain plant → halal). |
| `medium` | Category default (e.g. meat, animal byproduct, cheese, flavoring/extract). |
| `low` | Unknown base or ambiguous case. |

## Evaluation order

The engine applies steps in this order:

1. **Normalize input** – Lowercase, trim, collapse spaces, strip non-word characters.
2. **Identify base ingredient** – Match against DB bases first, then in-code keywords (e.g. rice, gelatin, vanilla extract). Yields `baseSlug` and `category`.
3. **Detect modifiers** – Extract all applicable modifiers (e.g. pork, beef, halal_certified, plant, alcohol_free, alcohol_based) from the normalized text.
4. **Apply hard overrides** – If any override matches, use its verdict and confidence (overrides DB and category defaults):
   - **Pork modifier** → haram, high
   - **Halal-certified modifier** → halal, high
   - **Plant modifier** (for animal_byproduct / meat / flavoring_extract) → halal, high
   - **Alcohol-free modifier** (for flavoring_extract) → halal, high
   - **Alcohol-based modifier** → usually_haram, high
5. **Apply category defaults** – If no override matched, use DB rule for `(base, primaryModifier)` if present; otherwise use category default:
   - **plain_plant** → halal, high  
   - **pork** / **alcohol** → haram, high  
   - **meat** / **animal_byproduct** / **cheese** / **flavoring_extract** → conditional, medium  
6. **Return** – Final `verdict`, `confidence_level`, `notes`, `alternatives`.

## Core rules (summary)

- Pork and pork-derived ingredients → **haram**
- Intoxicating alcohol as an ingredient → **haram** (or **usually_haram** when detected as modifier)
- Plain plant ingredients → **halal**
- Meat → **conditional** unless explicitly halal-certified
- Animal byproducts → **conditional** unless source is known (then overrides can make it halal/haram)
- Plant-based modifier → **halal** override where applicable
- Halal-certified modifier → **halal** override
- Pork modifier → **haram** override
- Cheese → **conditional** by default
- Flavorings/extracts → **conditional** by default
- **unknown** only when base identification fails

## Example outputs

### Gelatin

- **Input:** `gelatin`
- **Normalized:** `gelatin`
- **Base:** gelatin | **Category:** animal_byproduct
- **Modifiers:** `["unspecified"]`
- **Hard overrides:** none
- **Result:** category default animal_byproduct → **conditional**, **medium**
- **Output:**
```json
{
  "verdict": "conditional",
  "confidence_level": "medium",
  "halal_status": "conditional",
  "notes": "Source unknown; must be halal-certified if animal-derived.",
  "alternatives": ["agar_agar", "halal_beef_gelatin", "pectin"]
}
```

### Bovine gelatin

- **Input:** `bovine gelatin`
- **Normalized:** `bovine gelatin`
- **Base:** gelatin | **Category:** animal_byproduct
- **Modifiers:** `["beef"]`
- **Hard overrides:** none (beef is not pork/halal_certified/plant)
- **Result:** DB rule (gelatin, beef) or category default → **conditional**, **medium**
- **Output:**
```json
{
  "verdict": "conditional",
  "confidence_level": "medium",
  "halal_status": "conditional",
  "notes": "Permissible only if from zabiha/halal-certified beef.",
  "alternatives": ["agar_agar", "halal_beef_gelatin", "pectin"]
}
```

### Halal-certified bovine gelatin

- **Input:** `halal-certified bovine gelatin`
- **Normalized:** `halal certified bovine gelatin`
- **Base:** gelatin | **Category:** animal_byproduct
- **Modifiers:** `["halal_certified", "beef"]`
- **Hard overrides:** halal_certified → **halal**, **high**
- **Output:**
```json
{
  "verdict": "halal",
  "confidence_level": "high",
  "halal_status": "halal",
  "notes": "Halal-certified override.",
  "alternatives": []
}
```

### Pork gelatin

- **Input:** `pork gelatin`
- **Normalized:** `pork gelatin`
- **Base:** gelatin | **Category:** animal_byproduct
- **Modifiers:** `["pork"]`
- **Hard overrides:** pork → **haram**, **high**
- **Output:**
```json
{
  "verdict": "haram",
  "confidence_level": "high",
  "halal_status": "haram",
  "notes": "Pork and pork-derived ingredients are haram.",
  "alternatives": ["agar_agar", "halal_beef_gelatin", "pectin"]
}
```

### Rice

- **Input:** `rice`
- **Normalized:** `rice`
- **Base:** rice (in-code keyword) | **Category:** plain_plant
- **Modifiers:** `["unspecified"]`
- **Hard overrides:** none
- **Result:** category default plain_plant → **halal**, **high**
- **Output:**
```json
{
  "verdict": "halal",
  "confidence_level": "high",
  "halal_status": "halal",
  "notes": "",
  "alternatives": []
}
```

### Vanilla extract

- **Input:** `vanilla extract`
- **Normalized:** `vanilla extract`
- **Base:** vanilla_extract | **Category:** flavoring_extract
- **Modifiers:** `["unspecified"]` or `["alcohol_based"]` if “alcohol” appears
- **Hard overrides:** none (unless alcohol_free or plant)
- **Result:** DB rule or category default flavoring_extract → **conditional**, **medium**
- **Output:**
```json
{
  "verdict": "conditional",
  "confidence_level": "medium",
  "halal_status": "conditional",
  "notes": "Often alcohol-based; check label or use alcohol-free.",
  "alternatives": ["alcohol_free_vanilla", "vanilla_powder", "vanilla_bean_paste"]
}
```

If input is **alcohol-free vanilla extract**, modifier `alcohol_free` triggers hard override → **halal**, **high**.

## Files

| File | Role |
|------|------|
| `backend/src/services/halalRuleEngineConstants.js` | VERDICTS, CONFIDENCE_LEVELS, BASE_CATEGORIES, CATEGORY_DEFAULTS, HARD_OVERRIDES, MODIFIER_PATTERNS, BASE_KEYWORDS |
| `backend/src/services/ingredientRuleEngine.js` | normalizeIngredientText, identifyBaseIngredient, detectModifiers, applyHardOverrides, applyCategoryDefaults, evaluateIngredient (full pipeline) |
| `backend/src/db/ingredientRules.js` | getRule(base, modifier), getBaseSlugs(), getModifierSlugs() |
