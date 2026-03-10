# Hybrid AI Architecture for Halal Kitchen

## Goals

- **Combine deterministic halal rules with AI assistance** so rulings are reliable and explanations are rich.
- **Avoid AI hallucinations about religious rulings** by never letting AI set or override halal status.

## Principles

| Layer | Responsibility | Source of truth |
|-------|----------------|------------------|
| **Rule engine** | Halal status, base ingredient matching, modifier detection | Database + deterministic logic |
| **AI layer** | Explanations, substitution suggestions, OCR normalization | AI (optional); never overrides status |

- **AI must never override rule-based halal classifications.**
- **AI may only enhance explanations and substitutions.**
- **Ingredient rules remain deterministic** (DB + code only).

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (recipe text)                           │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API: POST /convert                               │
│  (recipe text, user preferences)                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌──────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│ Optional: OCR    │      │ Ingredient Rule       │      │ Optional: AI     │
│ normalization    │ ──►  │ Engine (deterministic)│ ──►  │ reasoning layer   │
│ (AI)             │      │                      │      │ (explanations,    │
│                  │      │ • Base ingredient    │      │  substitutions)   │
│ Normalize raw    │      │ • Modifier detection │      │                   │
│ ingredient lines │      │ • DB rule lookup     │      │ Never touches     │
└──────────────────┘      │ • Status = DB only   │      │ status            │
                           └──────────────────────┘      └──────────────────┘
                                      │
                                      ▼
                           ┌──────────────────────┐
                           │ Response             │
                           │ • status (from rules)│
                           │ • explanation (AI?)  │
                           │ • substitutes (rules │
                           │   + optional AI)     │
                           └──────────────────────┘
```

### 1.1 Ingredient Rule Engine (deterministic)

- **Input:** Normalized ingredient text (and optionally raw line if OCR normalization is used).
- **Steps:**
  1. **Base ingredient:** Match to a known base (e.g. `gelatin`, `soy_sauce`, `vanilla_extract`) from DB or fallback knowledge.
  2. **Modifier detection:** Detect source/type modifiers from text (e.g. “pork gelatin”, “beef gelatin”, “alcohol-free vanilla”, “halal soy sauce”). Uses keyword/pattern rules, not AI for status.
  3. **Rule lookup:** Query `ingredient_rules` (and related tables) by `(base_ingredient, modifier)` to get a single row → **halal_status**, **notes**, **alternatives**.
  4. **Output:** `{ halal_status, notes, alternatives, rule_id }`. No AI in this path; status is 100% from DB/code.

### 1.2 AI Reasoning Layer (enhancement only)

- **Generate explanations:** Given the **rule result** (status + notes), AI may produce a friendlier or localized explanation. It must not change status.
- **Suggest substitutions:** Given the rule result and optional recipe context, AI may suggest extra substitution ideas. Official alternatives remain from the rule engine.
- **Normalize OCR ingredient text:** Raw OCR line → cleaned/normalized ingredient phrase for better matching. Output is text only; the rule engine then decides status from this text.

**Contract:** All AI outputs are either free text (explanations, suggestions) or normalized text (OCR). The API must never assign `halal_status` from AI.

---

## 2. API Flow

### 2.1 High-level conversion flow

1. **Parse / normalize**  
   - Option A: Use existing recipe text as-is.  
   - Option B: Run OCR normalization (AI) on each line → normalized lines.

2. **Detect ingredients**  
   - From recipe text (or normalized lines), detect ingredient phrases (existing logic or rule-engine-driven matching).

3. **Rule engine (per ingredient)**  
   - `normalizeIngredientText(phrase)` → normalized string.  
   - `matchBaseIngredient(normalized)` → base slug.  
   - `detectModifiers(normalized, baseSlug)` → list of modifier slugs.  
   - `evaluate(baseSlug, modifierSlugs)` → `{ halal_status, notes, alternatives }` from DB.  
   - **Status is final at this step.**

4. **Optional AI enhancement**  
   - For each result: `generateExplanation(ruleResult)`, `suggestSubstitutions(ruleResult)`.  
   - Merge: keep `halal_status` and rule `alternatives`; append AI explanation and optional extra suggestions.

5. **Response**  
   - For each ingredient: `status` (from rule engine), `explanation` (rule notes + optional AI), `alternatives` (rule alternatives + optional AI suggestions), `wasReplaced`, etc.  
   - Confidence score computed from rule results only (e.g. unresolved haram/conditional count).

### 2.2 Endpoints (existing + optional new)

| Endpoint | Role |
|----------|------|
| `POST /convert` | Full recipe conversion. Uses rule engine for status; can optionally call AI for explanations/substitutions. |
| `GET /convert/ingredient?q=...` (optional) | Single-ingredient evaluation for UI. Returns rule result + optional AI explanation. |

### 2.3 Data flow (rule engine only for status)

- **Rule engine in:** Normalized ingredient string.  
- **Rule engine out:** `halal_status`, `notes`, `alternatives` (from DB).  
- **AI in:** Rule result + optional context.  
- **AI out:** Explanation text, optional substitution suggestions.  
- **Response:** Status and alternatives from rules; explanation = rule notes + AI if present.

---

## 3. Example Evaluations

The following examples show how the **rule engine** (deterministic) assigns status; AI only adds explanations or extra substitution ideas and never changes status.

### 3.1 Gelatin

| Input (normalized) | Modifier detected | Rule lookup | Halal status | Notes (from rules) |
|-------------------|-------------------|-------------|--------------|--------------------|
| `gelatin` | `unspecified` | base=gelatin, modifier=unspecified | **conditional** | Source unknown; must be halal-certified if animal-derived. |
| `pork gelatin` | `pork` | base=gelatin, modifier=pork | **haram** | Pork-derived gelatin is not permissible. |
| `beef gelatin` | `beef` | base=gelatin, modifier=beef | **conditional** | Permissible only if from zabiha/halal-certified beef. |
| `halal beef gelatin` | `beef`, `halal_certified` | base=gelatin, modifier=halal_certified | **halal** | Halal-certified beef gelatin is permissible. |
| `agar agar` / `plant gelatin` | `plant` | base=gelatin, modifier=plant | **halal** | Plant-based; no animal source. |

**Alternatives (from rules):** e.g. agar-agar, halal beef gelatin, pectin. AI may suggest more context-specific options (e.g. “for gummies use agar-agar”) without changing status.

---

### 3.2 Soy sauce

| Input (normalized) | Modifier detected | Rule lookup | Halal status | Notes (from rules) |
|-------------------|-------------------|-------------|--------------|--------------------|
| `soy sauce` | `unspecified` / `fermented` | base=soy_sauce, modifier=fermented_trace | **conditional** | Naturally contains trace alcohol from fermentation; many scholars allow. |
| `halal soy sauce` | `halal_certified` | base=soy_sauce, modifier=halal_certified | **halal** | Certified halal or alcohol-free. |
| `tamari alcohol free` | `alcohol_free` | base=soy_sauce, modifier=alcohol_free | **halal** | No alcohol; permissible. |

**Alternatives (from rules):** e.g. halal-certified soy sauce, tamari (alcohol-free). AI may add usage notes (e.g. “tamari is gluten-free”) without changing status.

---

### 3.3 Vanilla extract

| Input (normalized) | Modifier detected | Rule lookup | Halal status | Notes (from rules) |
|-------------------|-------------------|-------------|--------------|--------------------|
| `vanilla extract` | `unspecified` / `alcohol_based` | base=vanilla_extract, modifier=alcohol_based | **conditional** | Often alcohol-based; check label or use alcohol-free. |
| `alcohol-free vanilla` | `alcohol_free` | base=vanilla_extract, modifier=alcohol_free | **halal** | Alcohol-free vanilla is permissible. |
| `vanilla powder` | `powder` / non-extract | base=vanilla_extract, modifier=alcohol_free | **halal** | No alcohol carrier. |

**Alternatives (from rules):** e.g. alcohol-free vanilla, vanilla powder, vanilla bean paste. AI may explain conversion (e.g. “½ tsp powder ≈ 1 tsp extract”) without changing status.

---

## 4. Implementation checklist

- [x] **Rule tables:** `ingredient_rule_bases`, `ingredient_rule_modifiers`, `ingredient_rules` (base + modifier → status, notes, alternatives).
- [x] **Rule engine:** Evaluate base + modifiers → single deterministic status; no AI in this path.
- [x] **AI layer:** Optional explanation and substitution suggestions; never returns or overrides `halal_status`.
- [x] **Convert pipeline:** Use rule engine for status; optionally call AI for explanations/substitutions; confidence from rule results only.

---

## 5. File / component mapping

| Component | Location | Role |
|-----------|----------|------|
| Rule engine | `backend/src/services/ingredientRuleEngine.js` | Base match, modifier detection, DB lookup, deterministic status. |
| AI reasoning | `backend/src/services/aiReasoningService.js` | Explanations, substitution suggestions, OCR normalization (no status). |
| Rule data | `backend/src/migrations/11_create_ingredient_rules.sql` | Tables + seed for gelatin, soy sauce, vanilla extract. |
| Conversion | `backend/src/services/convertService.js` | Orchestrates rule engine + optional AI; keeps status from rules only. |
| DB layer | `backend/src/db/ingredientRules.js` | `getRule(baseSlug, modifierSlug)`, `getBaseSlugs()`, `getModifierSlugs()`. |

### Running the migration

Run the ingredient rules migration after the core and monetization migrations:

```bash
cd backend
psql $DATABASE_URL -f src/migrations/11_create_ingredient_rules.sql
```

If you use a different migration runner, run `11_create_ingredient_rules.sql` in order after other migrations.

---

## 6. Folder / service architecture (hybrid classification)

```
backend/src/
├── db/
│   ├── ingredientRules.js      # getRule(base, modifier), getBaseSlugs(), getModifierSlugs()
│   ├── database.js
│   ├── monetization.js
│   └── ...
├── migrations/
│   ├── 00_create_core_tables.sql
│   ├── 11_create_ingredient_rules.sql   # ingredient_rule_bases, modifiers, ingredient_rules
│   └── ...
├── services/
│   ├── ingredientRuleEngine.js   # Deterministic: normalizeIngredientText, detectModifiers,
│   │                             # matchBaseIngredient, evaluateIngredient (status + confidence)
│   ├── aiReasoningService.js     # Enhancement only: generateExplanation, rankSubstitutes,
│   │                             # normalizeIngredientOCR (never sets status)
│   ├── halalClassificationService.js  # Orchestrates rule engine → AI; structured classification
│   ├── convertService.js         # Recipe conversion (uses rule engine + optional AI)
│   └── ...
├── utils/
│   ├── halalEngine.js            # Fallback JSON knowledge
│   ├── halalConverter.js         # detectHaramIngredientsHybrid, convertRecipeHybrid
│   └── halalRules.js
└── routes/
    └── convert.js                # POST /convert, POST /convert/classify-ingredient
```

**Data flow (single-ingredient classification):**

1. Request → `POST /convert/classify-ingredient` with `{ ingredient, useOCRNormalization?, recipeContext? }`.
2. Optional OCR → `aiReasoningService.normalizeIngredientOCR(ingredient)` (AI does not set status).
3. Rule engine → `ingredientRuleEngine.evaluateIngredient(text)` → halal_status, confidence, modifiers, notes, alternatives (deterministic).
4. AI enhancement → `generateExplanation(ruleResult)`, `rankSubstitutes(ruleResult)` (consume rule result; never override status).
5. Response → Structured: ingredient, modifiers, halal_status, confidence, explanation, warnings, substitutes.

---

## 7. API flow: classify ingredient

| Step | Component | Input | Output |
|------|-----------|--------|--------|
| 1 | Route | POST body | ingredient string, options |
| 2 | halalClassificationService | classifyIngredient(ingredient, options) | — |
| 3 | Optional | normalizeIngredientOCR(ingredient) | Normalized text |
| 4 | ingredientRuleEngine | evaluateIngredient(text) | halal_status, confidence, modifiers, notes, alternatives |
| 5 | aiReasoningService | generateExplanation(ruleResult) | explanation string |
| 6 | aiReasoningService | rankSubstitutes(ruleResult, recipeContext) | substitutes with rank |
| 7 | halalClassificationService | buildWarnings(ruleResult) | warnings string[] |
| 8 | Response | — | Structured classification (§8) |

**Invariant:** halal_status and confidence are never overwritten by AI.

---

## 8. Example request / response

**Request:**

```http
POST /convert/classify-ingredient
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "ingredient": "pork gelatin",
  "useOCRNormalization": false,
  "recipeContext": { "cuisine": "baking" }
}
```

**Response (200):**

```json
{
  "ingredient": "pork gelatin",
  "modifiers": ["pork"],
  "halal_status": "haram",
  "confidence": 1,
  "explanation": "Pork-derived gelatin is not permissible.",
  "warnings": [
    "Not permissible; use a halal substitute.",
    "Pork-derived gelatin is not permissible."
  ],
  "substitutes": [
    { "name": "agar_agar", "rank": 1 },
    { "name": "halal_beef_gelatin", "rank": 2 },
    { "name": "pectin", "rank": 3 }
  ]
}
```

**Example: conditional (soy sauce)** — Request: `{ "ingredient": "soy sauce" }`. Response: halal_status `"conditional"`, confidence `0.6`, explanation and warnings about trace alcohol, substitutes halal_certified_soy_sauce and tamari_alcohol_free.

**Example: halal (alcohol-free vanilla)** — Request: `{ "ingredient": "alcohol-free vanilla extract" }`. Response: halal_status `"halal"`, confidence `1`, empty warnings, empty substitutes.

---

## 9. Structured output contract

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| ingredient | string | Input / OCR | The phrase classified. |
| modifiers | string[] | Rule engine | e.g. pork, alcohol_free. |
| halal_status | string | Rule engine only | halal \| conditional \| haram \| unknown. |
| confidence | number | Rule engine only | 0–1; 1 = definitive. |
| explanation | string | Rule notes + optional AI | Human-readable; AI must not change status. |
| warnings | string[] | From rule result | When conditional/haram or notes suggest caution. |
| substitutes | Array<{ name, rank }> | Rule + optional AI rank | Halal alternatives; AI may re-rank only. |
