# Save Halal Version – Feature Summary

## Overview

Users can save a converted recipe as a “Halal Version” to their account. Saved recipes are stored in the backend (PostgreSQL when available), listed on a dedicated **My Halal Recipes** page, and can be revisited (opened in the converter) or deleted.

---

## 1. Database schema

The existing **`recipes`** table is used. No new tables.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (default `uuid_generate_v4()`) |
| `user_id` | UUID | Owner; references `users(id)` ON DELETE CASCADE |
| `title` | TEXT | Recipe title (required) |
| `original_recipe` | TEXT | Original recipe text before conversion |
| `converted_recipe` | TEXT | Halal-converted recipe text |
| `ingredients` | JSONB | Optional structured ingredients |
| `instructions` | TEXT | Optional instructions/description |
| `category` | TEXT | e.g. "Main Course" (default) |
| `hashtags` | TEXT[] | Optional tags |
| `media_url` | TEXT | Optional image URL |
| `confidence_score` | INTEGER | Conversion confidence (default 0) |
| `visibility` | TEXT | `'public'` or `'private'` (default `'private'` for saved halal versions) |
| `likes`, `comments`, `shares` | INTEGER | Counts (default 0) |
| `created_at` | TIMESTAMP | Set on insert |
| `updated_at` | TIMESTAMP | Set on insert/update |

**Indexes:** `idx_recipes_user_id`, `idx_recipes_visibility`.

Saved halal versions are stored with **`visibility = 'private'`** so they only appear for the owning user.

---

## 2. Backend API routes

All recipe endpoints live under **`/api/recipes`**. When PostgreSQL is available, list/get/delete use the DB; otherwise they fall back to file storage. Create (POST) already used the DB when available.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| **GET** | `/api/recipes/my` | Required | Current user’s recipes (DB or file). Used for “My Halal Recipes” and sidebar list. |
| **GET** | `/api/recipes/:id` | Optional | Single recipe by ID. Access: public or owner. |
| **POST** | `/api/recipes` | Required | Create recipe. Body: `title`, `originalRecipe`, `convertedRecipe`, `isPublic` (false for “Save Halal Version”). |
| **PUT** | `/api/recipes/:id` | Required | Update recipe (owner only). |
| **DELETE** | `/api/recipes/:id` | Required | Delete recipe (owner only). |

**Request/response (relevant fields):**

- **POST** body: `title` (required), `originalRecipe`, `convertedRecipe`, `isPublic` (default false).
- **Response** (create/get): `recipe` with `id`, `title`, `originalRecipe` / `original_recipe`, `convertedRecipe` / `converted_recipe`, `createdAt` / `created_at`, `userId` / `user_id`, etc. Frontend normalizes both camelCase and snake_case.

---

## 3. Frontend UI design

### 3.1 Save button (after conversion)

- **Location:** Recipe actions row, after “Convert”, next to Copy, Download, Share, etc.
- **Label:** **“Save Halal Version”** (replaces previous “Save Privately”).
- **Behavior:**
  - **Logged in:** Calls `POST /api/recipes` with `title` (from first line of recipe), `originalRecipe`, `convertedRecipe`, `isPublic: false`. On success: add to local list, show “Halal version saved to your account!”.
  - **Not logged in:** Saves to `localStorage` and shows “Recipe saved locally. Log in to save to your account and sync across devices.”

### 3.2 Saved recipes in converter (sidebar)

- **Section:** “Saved Recipes” with a **“View all”** link to `/my-halal-recipes`.
- **Content:** List of saved recipes (from API when logged in, else from `localStorage`). Each item shows title, date, short preview; click opens it in the converter (revisit). **Delete** removes from API and/or local list.

### 3.3 My Halal Recipes page (`/my-halal-recipes`)

- **Route:** `/my-halal-recipes` (linked from footer and from “View all” in Saved Recipes).
- **Not logged in:** Message: “Log in to see your saved halal recipes and sync across devices” + “Go to App” (login/register).
- **Logged in:**
  - **Loading:** “Loading your recipes…”.
  - **Empty:** “No saved recipes yet.” + “Convert a recipe and tap ‘Save Halal Version’ to add it here.” + “Convert a recipe” → `/app`.
  - **List:** Cards with title, saved date, short preview (from converted text). Actions:
    - **Revisit:** Navigate to `/app` with `state: { loadRecipe }`; App loads that recipe into the converter and runs conversion.
    - **Delete:** Confirm → `DELETE /api/recipes/:id` → remove from list.
- **Footer:** “Back to Converter” (`/app`), “Home” (`/`).

### 3.4 Revisit flow

- From **My Halal Recipes**, user clicks **Revisit** → `navigate('/app', { state: { loadRecipe: item } })`.
- **App** (on `/app`) has a `useEffect` that checks `location.state?.loadRecipe`; if present, calls `loadSavedRecipe(loadRecipe)` (sets recipe text, triggers convert, scrolls to top) and clears `location.state`.

---

## 4. File reference

| Area | File(s) |
|------|--------|
| DB schema | `backend/src/migrations/00_create_core_tables.sql` (recipes table) |
| DB layer | `backend/src/db/recipes.js` (create, getById, getByUserId, update, delete) |
| API routes | `backend/src/routes/recipes.js` (GET /my, GET /:id, POST, DELETE; DB when available) |
| Frontend API | `frontend/src/api/recipesApi.js` (getMyRecipes, getRecipe, createRecipe, deleteRecipe) |
| Save button & state | `frontend/src/App.jsx` (saveRecipe, deleteSavedRecipe, load from API on mount) |
| My Halal Recipes page | `frontend/src/pages/MyHalalRecipesPage.jsx` + `MyHalalRecipesPage.css` |
| Routing | `frontend/src/components/AppRouter.jsx` (route `/my-halal-recipes`) |
| Footer link | `frontend/src/components/SEOFooter.jsx` |

---

## 5. Limits (existing)

- **Free tier:** Up to 10 saved recipes (see `subscription.js` / `featureGating.js`). Enforcing the cap in the UI (e.g. disabling “Save Halal Version” when at limit) can be added on top of this flow.
- **Premium:** Unlimited saved recipes.
