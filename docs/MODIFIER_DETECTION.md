# Ingredient Lookup: Modifier Detection

The Halal Kitchen ingredient engine parses user input into a **base ingredient** and **modifiers**, then applies a **modifier rule system** to override or adjust halal status.

---

## 1. Modifier detection algorithm

1. **Normalize input**  
   Lowercase, trim, replace spaces with underscores (e.g. `"Bovine Gelatin"` → `"bovine_gelatin"`).

2. **Tokenize**  
   Split on `[_-\s]+` to get tokens (e.g. `["bovine", "gelatin"]`).

3. **Match status-override patterns**  
   For each modifier key (halal_certified, plant_based, bovine, pork, alcohol), try to match one of its pattern token lists against consecutive tokens. Patterns are modifier-only (e.g. `["pork"]`, `["halal","certified"]`) so the base ingredient is not consumed.

4. **Build base**  
   Any token not matched as a modifier is part of the base. Join remaining tokens with `_` (e.g. `["gelatin"]` → base `"gelatin"`).

5. **Output**  
   `{ base, statusModifiers: string[], raw }`.  
   Example: `"halal-certified gelatin"` → `{ base: "gelatin", statusModifiers: ["halal_certified"], raw: "halal_certified_gelatin" }`.

6. **Override resolution**  
   `getModifierOverrideStatus(statusModifiers)` returns the highest-priority override: **haram** (pork, alcohol) > **conditional** (bovine) > **halal** (halal_certified, plant_based). Haram wins if any haram modifier is present.

---

## 2. Rule structure

### Status-override modifiers (`STATUS_OVERRIDE_MODIFIERS`)

| Modifier key     | Effect      | Priority | Example patterns                          |
|------------------|------------|----------|-------------------------------------------|
| `halal_certified`| halal      | 1        | halal_certified, halal certified, certified_halal |
| `plant_based`    | halal      | 1        | plant_based, plant based, plantbased      |
| `bovine`         | conditional| 2        | bovine, beef, cattle                      |
| `pork`           | haram      | 3        | pork, pig                                 |
| `alcohol`        | haram      | 3        | alcohol, wine, ethanol, liqueur, …       |

- **Priority** is used when multiple modifiers are present: haram (3) overrides conditional (2) and halal (1).
- Each entry has `status`, `priority`, `explanation`, and `patterns` (token lists for matching).

### Legacy haram modifiers

`HARAM_MODIFIERS` still lists terms that force haram when detected by `detectModifiers()` (e.g. wine, alcohol, pork, bacon, lard, pork_gelatin, animal_gelatin). **"gelatin" alone is no longer in this list** so that plain "gelatin" is evaluated as a base ingredient (usually conditional/usually haram from taxonomy).

---

## 3. Engine flow (summary)

1. **Parse**  
   `parseIngredientWithModifiers(normalizedId)` → `{ base, statusModifiers }`.

2. **Haram override**  
   If `getModifierOverrideStatus(statusModifiers)` is **haram**, return haram immediately with `detectedModifiers` and `baseIngredient`.

3. **Legacy haram check**  
   `detectModifiers(normalizedId)`. If `hasHaramModifier` (e.g. pork, alcohol in the legacy list), return haram.

4. **Base lookup**  
   Base for lookup = `parsed.base` when `statusModifiers.length > 0`, else `extractBaseIngredient(normalizedId)`. Use this for taxonomy, base overrides, and knowledge lookup.

5. **Base result**  
   Resolve status from taxonomy, base overrides, or knowledge using the base id.

6. **Apply status override**  
   If override is **halal** or **conditional**, set final status, explanation, and confidence from the modifier; set `detectedModifiers` and `baseIngredient` on the result.

7. **Return**  
   Result includes `detectedModifiers` (and `baseIngredient` when applicable) plus final halal status.

---

## 4. Example evaluations

| Input                    | Base    | Modifiers        | Final status  | Notes |
|--------------------------|---------|------------------|---------------|--------|
| gelatin                  | gelatin | []               | conditional   | Taxonomy: gelatin = conditional (usually haram unless certified). |
| bovine gelatin           | gelatin | [bovine]         | conditional   | Bovine override: conditional; explanation references cattle/halal slaughter. |
| halal-certified gelatin  | gelatin | [halal_certified]| halal         | Halal override: status halal, high confidence. |
| plant-based gelatin      | gelatin | [plant_based]    | halal         | Plant-based override: halal. |
| pork gelatin             | gelatin | [pork]           | haram         | Haram override; return before base lookup. |
| pork gelatin             | gelatin | [pork]           | haram         | Same with space. |
| alcohol                  | alcohol | [alcohol]        | haram         | Haram override. |
| beef gelatin             | gelatin | [bovine]         | conditional   | "beef" matches bovine. |

---

## 5. API surface

- **`parseIngredientWithModifiers(ingredientId)`**  
  Returns `{ base, statusModifiers, raw }`.

- **`getModifierOverrideStatus(statusModifiers)`**  
  Returns `{ status, explanation } | null` (priority: haram > conditional > halal).

- **`STATUS_OVERRIDE_MODIFIERS`**  
  Map of modifier key → `{ status, priority, explanation, patterns }`.

- **Evaluation result** (from `evaluateItem()`) may include:
  - **`detectedModifiers`**: string[] (e.g. `["bovine"]`).
  - **`baseIngredient`**: string (e.g. `"gelatin"`).
  - **`status`**: final halal status (halal | conditional | haram | etc.).

---

## 6. Files

| File | Role |
|------|------|
| `frontend/src/lib/ingredientModifiers.js` | STATUS_OVERRIDE_MODIFIERS, parseIngredientWithModifiers, getModifierOverrideStatus; HARAM_MODIFIERS (no standalone "gelatin"). |
| `frontend/src/lib/halalEngine.js` | Uses parsed base + override; applies override and sets detectedModifiers/baseIngredient on result. |
