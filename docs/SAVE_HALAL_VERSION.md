# Save Halal Version — Feature Spec

Users can save a converted recipe (original + halal version + substitutions used) and revisit or delete it from **My Halal Recipes**.

---

## Schema

### Database: `recipes` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key. |
| `user_id` | UUID | Owner (references `users.id`). |
| `title` | TEXT | Recipe title (e.g. first line of original). |
| `original_recipe` | TEXT | Raw recipe before conversion. |
| `converted_recipe` | TEXT | Halal-converted recipe text. |
| `substitutions_used` | JSONB | Substitutions applied: `[{ ingredient, replacement, alternatives?, status?, notes? }]`. |
| `confidence_score` | INTEGER | 0–100 conversion confidence. |
| `ingredients` | JSONB | Optional ingredient list. |
| `instructions` | TEXT | Optional instructions. |
| `category` | TEXT | e.g. `"Main Course"`. |
| `hashtags` | TEXT[] | Tags. |
| `media_url` | TEXT | Optional image URL. |
| `visibility` | TEXT | `"public"` \| `"private"`. |
| `created_at` | TIMESTAMP | When saved. |
| `updated_at` | TIMESTAMP | Last update. |

Migration: `migrations/add_recipes_substitutions_used.sql` adds `substitutions_used` if missing.

---

## API routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/recipes` | Bearer | Create saved recipe. Body: `title`, `originalRecipe`, `convertedRecipe`, `substitutionsUsed`, `confidenceScore`, … |
| GET | `/api/recipes/my` | Bearer | List current user’s recipes. |
| GET | `/api/recipes/:id` | Bearer / optional | Get one recipe (owner or public). |
| PUT | `/api/recipes/:id` | Bearer | Update recipe (owner). |
| DELETE | `/api/recipes/:id` | Bearer | Delete recipe (owner). |

**POST body (create):**  
`title` (required), `originalRecipe`, `convertedRecipe`, `substitutionsUsed` (array), `confidenceScore`, `ingredients`, `instructions`, `isPublic` / `visibility`.

**Response (recipe object):**  
`id`, `title`, `original_recipe` / `originalRecipe`, `converted_recipe` / `convertedRecipe`, `substitutions_used` / `substitutionsUsed` / `issues`, `confidence_score` / `confidenceScore`, `created_at` / `createdAt` / `savedAt`, …

---

## Frontend components

- **Save button (after conversion):** In main app converter UI; uses `saveRecipe()` which calls `createRecipe()` with `originalRecipe`, `convertedRecipe`, `substitutionsUsed` (from current `issues`), `confidenceScore`.  
- **SaveHalalVersionButton:** Reusable component: `SaveHalalVersionButton({ disabled, onClick, label })`. Used in App.jsx for the “Save Halal Version” action.  
- **My Halal Recipes page:** Lists saved recipes (title, date, preview); **Revisit** navigates to `/app` with `state.loadRecipe` (original, converted, issues, confidenceScore); **Delete** calls `DELETE /api/recipes/:id`.  
- **Reopen behavior:** When opening a saved recipe, the app shows the saved converted text and saved substitutions without re-converting.

---

## Example saved recipe object

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user-uuid",
  "title": "Bacon Carbonara",
  "original_recipe": "200g bacon\n300g spaghetti\n2 eggs\n50g Parmesan\n...",
  "converted_recipe": "200g smoked turkey bacon\n300g spaghetti\n2 eggs\n50g Parmesan\n...",
  "substitutions_used": [
    {
      "ingredient": "bacon",
      "replacement": "Smoked turkey bacon",
      "alternatives": ["Halal beef bacon", "Halal turkey ham"],
      "status": "haram",
      "notes": "Pork is not permissible."
    }
  ],
  "confidence_score": 85,
  "created_at": "2025-03-09T14:30:00.000Z",
  "updated_at": "2025-03-09T14:30:00.000Z",
  "visibility": "private"
}
```

Frontend-friendly shape (from API): same fields plus `original`, `converted`, `savedAt`, `issues` (alias for `substitutions_used`), `confidenceScore`, `createdAt`, `updatedAt`.
