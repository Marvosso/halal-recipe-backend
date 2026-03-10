# Ranked Substitutions – Example Outputs

AI-assisted ranked substitutions return **3–5 halal substitute options** with a **best pick** and **alternatives**. Each option includes **name**, **score**, **reason**, and **notes**. Only halal or conditionally acceptable substitutes are included (deterministic rule filter).

---

## Scoring formula

```
score = w1×flavor_similarity + w2×texture_similarity + w3×cooking_context_fit + w4×availability + w5×affordability
```

Weights (each factor 0–1):

| Factor                | Weight |
|-----------------------|--------|
| flavor_similarity     | 0.30   |
| texture_similarity    | 0.25   |
| cooking_context_fit   | 0.20   |
| availability          | 0.15   |
| affordability         | 0.10   |

---

## Example 1: Bacon

**Input:** `bacon`

```json
{
  "best": {
    "name": "Smoked turkey bacon",
    "score": 0.87,
    "reason": "Closest match in flavor and crisp texture; works in most recipes.",
    "notes": "Add a little oil if the turkey bacon is lean. 1:1 swap."
  },
  "alternatives": [
    {
      "name": "Halal beef bacon",
      "score": 0.75,
      "reason": "Smoky, cured profile similar to bacon; halal-certified.",
      "notes": "Check for halal certification. Good for breakfast and wrapping."
    },
    {
      "name": "Halal turkey ham",
      "score": 0.66,
      "reason": "Cured, savory option when bacon is used for flavor.",
      "notes": "Better for dicing than streaky strips. Less crisp."
    },
    {
      "name": "Halal beef pastrami",
      "score": 0.56,
      "reason": "Bold, salty flavor; works in sandwiches and cooked dishes.",
      "notes": "Not a direct texture match; use where flavor is the main role."
    }
  ]
}
```

---

## Example 2: White wine

**Input:** `white wine`

```json
{
  "best": {
    "name": "White grape juice + vinegar",
    "score": 0.89,
    "reason": "Acidity and fruitiness mimic white wine in deglazing and sauces.",
    "notes": "About 3 parts juice to 1 part white wine vinegar or rice vinegar."
  },
  "alternatives": [
    {
      "name": "Grape juice + vinegar",
      "score": 0.86,
      "reason": "Same concept as white grape juice; red grape works for darker sauces.",
      "notes": "3 parts juice, 1 part vinegar. Use white wine vinegar for light dishes."
    },
    {
      "name": "Non-alcoholic wine",
      "score": 0.72,
      "reason": "Direct swap; verify alcohol content and halal certification.",
      "notes": "Check label for trace alcohol if strict."
    },
    {
      "name": "Rice vinegar",
      "score": 0.58,
      "reason": "Adds acidity for deglazing; milder than white wine.",
      "notes": "Use when only acidity is needed; add a pinch of sugar for balance."
    },
    {
      "name": "Chicken or vegetable broth",
      "score": 0.52,
      "reason": "Liquid and umami without alcohol; good for braises.",
      "notes": "No fruity note; best when wine is used for moisture more than flavor."
    }
  ]
}
```

---

## Example 3: Gelatin

**Input:** `gelatin`

```json
{
  "best": {
    "name": "Agar agar",
    "score": 0.82,
    "reason": "Plant-based gelling; works in most desserts and jellies.",
    "notes": "Use about 1 tsp powder per 1 cup liquid. Sets at room temp; heat to dissolve."
  },
  "alternatives": [
    {
      "name": "Halal beef gelatin",
      "score": 0.78,
      "reason": "Same texture and behavior as conventional gelatin; must be halal-certified.",
      "notes": "1:1 with pork gelatin. Check certification (e.g. bovine source, halal slaughter)."
    },
    {
      "name": "Pectin",
      "score": 0.65,
      "reason": "Plant-based set; ideal for jams and fruit gels.",
      "notes": "Different setting behavior; not a direct swap in all recipes."
    },
    {
      "name": "Cornstarch slurry",
      "score": 0.53,
      "reason": "Thickens and sets when heated; halal and widely available.",
      "notes": "Gives a softer set; good for pies and custards, not clear jellies."
    }
  ]
}
```

---

## Example 4: Mirin

**Input:** `mirin`

```json
{
  "best": {
    "name": "Sugar + rice vinegar",
    "score": 0.84,
    "reason": "Sweetness and mild acidity approximate mirin in glazes and teriyaki.",
    "notes": "About 1 tsp sugar per 1 tbsp rice vinegar; adjust to taste."
  },
  "alternatives": [
    {
      "name": "Halal mirin",
      "score": 0.80,
      "reason": "Alcohol-free or halal-certified mirin; direct substitute.",
      "notes": "Check label for alcohol content and certification."
    },
    {
      "name": "Rice vinegar + sugar",
      "score": 0.82,
      "reason": "Same as sugar + rice vinegar; mix to match recipe volume.",
      "notes": "Add a dash of water if a looser consistency is needed."
    },
    {
      "name": "Apple juice + vinegar",
      "score": 0.68,
      "reason": "Fruity sweetness and acidity; works in dressings and glazes.",
      "notes": "Use unsweetened juice; balance with rice or white vinegar."
    }
  ]
}
```

---

## API usage

- **Endpoint:** `POST /convert/classify-ingredient`
- **Body:** `{ "ingredient": "bacon" }` (optional: `recipeContext`, `useOCRNormalization`)
- **Response:** Classification result includes `substitutes: { best, alternatives }` with the shape above when the ingredient has ranked substitutes.

Implementation: `rankedSubstitutionsService.getRankedSubstitutes()` + `formatRankedSubstitutesForApi()`; halal filter via `ingredientRuleEngine.evaluateIngredient()`.
