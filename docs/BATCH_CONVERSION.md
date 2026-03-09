# Batch Recipe Conversion (Meal Plan)

## Overview

Users can paste a **meal plan** or **multiple recipes** and convert them in one go. The app parses the input into separate recipes, runs halal conversion on each, and returns a **structured weekly halal meal plan**.

---

## 1. Parsing logic

**File:** `frontend/src/lib/mealPlanParser.js`

Input is split into blocks in this order:

### 1.1 Day headers

- Lines that start with a **day name** (Monday, Tuesday, … Sunday; Mon, Tue, …) or **Day N** / **Week N**.
- Optional colon or dash after the label (e.g. `Monday:`, `Tuesday -`).
- Everything from one header up to (but not including) the next header is one block. The header line is the label; the rest is the recipe text (including the part of the header line after the colon/dash).

**Example:**

```
Monday: Pasta with bacon
Ingredients: spaghetti, bacon, eggs
Instructions: ...

Tuesday: Chicken curry
Ingredients: chicken, curry paste, coconut milk
```

→ 2 blocks: `{ label: "Monday", text: "Pasta with bacon\nIngredients: ..." }`, `{ label: "Tuesday", text: "Chicken curry\nIngredients: ..." }`.

### 1.2 Numbered blocks

- If no day-style headers are found, split by **numbered lines**: `1. ...`, `2. ...`, etc.
- Each block is from one numbered line up to the next. The label is the text after the number (e.g. `1. Recipe title` → label `"Recipe title"`); the block text includes the full line and all following lines until the next number.

**Example:**

```
1. Spaghetti carbonara
Ingredients: spaghetti, bacon, eggs, parmesan
...

2. Beef stir-fry
Ingredients: beef, soy sauce, ...
```

→ 2 blocks with labels from the first line after the number.

### 1.3 Double newline

- If neither day nor numbered split applies, split by **double newline** (`\n\n`).
- Each block’s **label** is the first line of that block (truncated to 60 chars if long).

### 1.4 Limits

- **Max recipes per batch:** 14 (`MAX_BATCH_RECIPES`). Extra blocks are dropped.
- Empty blocks (no text after trimming) are ignored.

---

## 2. Batch conversion workflow

**File:** `frontend/src/lib/batchConversion.js`

1. **Parse**  
   `parseMealPlanInput(mealPlanText)` → array of `{ label, text }`.

2. **Convert each**  
   For each `{ label, text }`, call `convertRecipeWithJson(text, userPreferences)` (same engine as single-recipe conversion). User preferences (e.g. strictness, school of thought) are passed through.

3. **Aggregate**  
   Each result is normalized to:
   - `label`
   - `originalText`
   - `convertedText`
   - `issues` (haram/conditional + substitutes)
   - `confidenceScore` (0–100)
   - `error` (only if that recipe’s conversion threw).

4. **Return**  
   - `recipes`: array of the above objects (order preserved).
   - `total`: number of recipes.
   - `withIssues`: number of recipes that have at least one issue.
   - `truncated`: `true` if the parser hit the 14-recipe cap.

Conversion runs **sequentially** (one recipe after another). Failures are isolated: one recipe can have `error` while the rest still have `convertedText` and `issues`.

---

## 3. Example output

**Input (meal plan text):**

```
Monday: Pasta carbonara
Ingredients: spaghetti, bacon, eggs, parmesan cheese
Instructions: Cook pasta. Fry bacon. Mix with eggs and cheese.

Tuesday: Rice and chicken
Ingredients: rice, chicken breast, salt
Instructions: Cook rice. Grill chicken. Serve.
```

**Parsed blocks:**

- `{ label: "Monday", text: "Pasta carbonara\nIngredients: spaghetti, bacon, eggs, parmesan cheese\nInstructions: ..." }`
- `{ label: "Tuesday", text: "Rice and chicken\nIngredients: rice, chicken breast, salt\nInstructions: ..." }`

**Batch result (conceptual):**

```json
{
  "recipes": [
    {
      "label": "Monday",
      "originalText": "Pasta carbonara\nIngredients: spaghetti, bacon, eggs, parmesan cheese\n...",
      "convertedText": "Pasta carbonara\nIngredients: spaghetti, halal beef bacon, eggs, parmesan cheese\n...",
      "issues": [
        {
          "ingredient_id": "bacon",
          "replacement_id": "halal_beef_bacon",
          "explanation": "...",
          "wasReplaced": true
        },
        {
          "ingredient_id": "parmesan_cheese",
          "status": "conditional",
          "explanation": "..."
        }
      ],
      "confidenceScore": 85
    },
    {
      "label": "Tuesday",
      "originalText": "Rice and chicken\n...",
      "convertedText": "Rice and chicken\n...",
      "issues": [],
      "confidenceScore": 100
    }
  ],
  "total": 2,
  "withIssues": 1,
  "truncated": false
}
```

**UI:** The “Convert meal plan” section shows “Your halal meal plan” with one card per recipe: **label**, **converted text**, and a line like “2 ingredients adjusted (halal substitutes applied)” when `issues.length > 0`.

---

## 4. File reference

| Item | Location |
|------|----------|
| Parsing | `frontend/src/lib/mealPlanParser.js` (`parseMealPlanInput`, `MAX_BATCH_RECIPES`) |
| Batch workflow | `frontend/src/lib/batchConversion.js` (`convertBatchRecipes`) |
| Single-recipe engine | `frontend/src/lib/convertRecipeJson.js` (`convertRecipeWithJson`) |
| UI | `frontend/src/App.jsx` (details “Convert meal plan”, textarea, button, batch result list) |
| Styles | `frontend/src/App.css` (`.batch-convert-*`, `.batch-result-*`) |
