# Halal Kitchen – Hybrid Ingredient Evaluation API Contract

This document defines the request/response schemas, example payloads, and error format for the four core endpoints of the hybrid ingredient evaluation system. All ingredient **halal_status** and **confidence** come from the deterministic rule engine; AI is used only for explanation text and optional OCR cleanup.

**Base URL:** `/convert` (ingredient/conversion) and `/api/recipes` (saved recipes). All `/convert` endpoints require `Authorization: Bearer <token>` unless noted.

---

## 1. Ingredient lookup

**Endpoint:** `POST /convert/classify-ingredient`

**Purpose:** Look up a single ingredient and get halal classification, explanation, warnings, references, and ranked substitutes.

### Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ingredient` | string | Yes | Raw ingredient phrase (e.g. `"pork gelatin"`, `"2 tbsp soy sauce"`). |
| `useOCRNormalization` | boolean | No | If true, run OCR-style cleanup before rule engine (gated by AI flags). Default `false`. |
| `recipeContext` | object | No | Optional context; when present, intent may be `recipe_conversion`. |
| `intent` | string | No | `simple_lookup` \| `known_page` \| `recipe_conversion` \| `ocr_cleanup` \| `ambiguous_fallback`. Inferred if omitted. |
| `ocrConfidence` | number | No | 0–1; for scan flow, low value may trigger fallback AI. |
| `userPreferences` | object | No | Strictness, madhab for rule engine. |

**Example request body:**

```json
{
  "ingredient": "beef gelatin",
  "useOCRNormalization": false,
  "intent": "simple_lookup"
}
```

### Response schema (200)

| Field | Type | Description |
|-------|------|-------------|
| `normalized_query` | string | Query after normalization (trim, collapse spaces, optional OCR cleanup). |
| `base_ingredient` | string | Resolved base ingredient (display name from `base_slug`, e.g. `"gelatin"`). |
| `modifiers` | string[] | Detected modifiers (e.g. `["beef"]`, `["halal_certified"]`). |
| `halal_status` | string | `"halal"` \| `"conditional"` \| `"haram"` \| `"unknown"`. From rules only. |
| `confidence` | number | 0–1 from rule engine. |
| `explanation` | string | Human-readable explanation (template or AI). |
| `warnings` | string[] | Non-empty when conditional/haram/unknown or notes suggest caution. |
| `references` | array | Optional. `[{ "ref_type": string, "ref_text": string }]` from knowledge/DB when available. |
| `substitutes` | object | `{ "best": object \| null, "alternatives": array }`. Best pick + alternatives with name, score, reason, notes. |

**Substitute item:** `{ "name": string, "score": number | null, "reason": string, "notes": string }`

**Example response (200):**

```json
{
  "normalized_query": "beef gelatin",
  "base_ingredient": "gelatin",
  "modifiers": ["beef"],
  "halal_status": "conditional",
  "confidence": 0.7,
  "explanation": "Beef gelatin is permissible when from halal slaughter and certified. Many scholars consider it acceptable if the source is verified.",
  "warnings": ["Source or preparation may affect permissibility; verify when possible."],
  "references": [
    { "ref_type": "quran", "ref_text": "Surah Al-Baqarah 2:173" },
    { "ref_type": "hadith", "ref_text": "Sahih Muslim 10:3893" }
  ],
  "substitutes": {
    "best": {
      "name": "Agar agar",
      "score": 0.82,
      "reason": "Plant-based gelling; works in most desserts and jellies.",
      "notes": "Use about 1 tsp powder per 1 cup liquid. Sets at room temp."
    },
    "alternatives": [
      {
        "name": "Halal beef gelatin",
        "score": 0.78,
        "reason": "Same texture and behavior; must be halal-certified.",
        "notes": "1:1 with pork gelatin. Check certification."
      }
    ]
  }
}
```

---

## 2. Recipe conversion

**Endpoint:** `POST /convert`

**Purpose:** Convert recipe text to halal-compliant form: detect issues and return converted text with confidence.

### Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipeText` | string | Yes | Raw recipe text (full recipe or ingredient list). |

**Example request body:**

```json
{
  "recipeText": "1 lb pork bacon\n2 tbsp white wine\n1 pack gelatin\n..."
}
```

### Response schema (200)

| Field | Type | Description |
|-------|------|-------------|
| `originalText` | string | Input recipe text. |
| `convertedText` | string | Halal-converted recipe text (substitutions applied). |
| `issues` | array | Detected ingredient issues (haram/conditional) with replacements and metadata. |
| `confidenceScore` | number | 0–100 overall conversion confidence. |

**Issue item (shape used by converter):** includes `ingredient`, `normalizedName`, `status`, `replacement`, `alternatives`, `notes`, `confidence`, `references`, etc.

**Example response (200):**

```json
{
  "originalText": "1 lb pork bacon, 2 tbsp white wine",
  "convertedText": "1 lb smoked turkey bacon, 2 tbsp white grape juice + vinegar",
  "issues": [
    {
      "ingredient": "pork bacon",
      "normalizedName": "bacon",
      "haramIngredient": "pork bacon",
      "replacement": "Smoked turkey bacon",
      "alternatives": ["Halal beef bacon", "Halal turkey ham"],
      "status": "haram",
      "notes": "Pork is not permissible.",
      "confidence": 1,
      "references": []
    },
    {
      "ingredient": "white wine",
      "normalizedName": "white_wine",
      "replacement": "White grape juice + vinegar",
      "alternatives": ["Non-alcoholic wine", "Rice vinegar"],
      "status": "haram",
      "notes": "Alcohol is not permissible.",
      "confidence": 1,
      "references": []
    }
  ],
  "confidenceScore": 85
}
```

**403** when conversion limit reached (free tier): see Error handling below.

---

## 3. Photo scan result processing

**Endpoint:** `POST /convert/scan-ingredients`

**Purpose:** Submit raw OCR text or an image of an ingredient list; receive parsed ingredients and per-item halal evaluation.

### Request

- **JSON:** `Content-Type: application/json`
  - `rawText` (string, required if no image): ingredient list text.
  - `ocrConfidence` (number, optional): 0–1.
  - `useAINormalization` (boolean, optional): default true when allowed by flags.
  - `userPreferences` (object, optional).
- **Multipart:** `Content-Type: multipart/form-data`, field `image` (file). Server runs OCR and uses extracted text.

**Example request body (JSON):**

```json
{
  "rawText": "Sugar, Glucose Syrup, Palm Oil, Condensed Skim Milk, Gelatin (Beef), Color (E150a).",
  "ocrConfidence": 0.8
}
```

### Response schema (200)

| Field | Type | Description |
|-------|------|-------------|
| `summary` | object | Counts: `halal`, `conditional`, `haram`, `unknown`. |
| `ingredients` | array | Per-ingredient result (see below). |
| `ocr_confidence` | number | OCR confidence used for this run (0–1). |

**Ingredient item:** `{ "raw": string, "normalized"?: string, "ingredient": string, "halal_status": string, "confidence": number, "explanation": string | null, "ocr_uncertain": boolean }`

**Example response (200):**

```json
{
  "summary": {
    "halal": 4,
    "conditional": 1,
    "haram": 0,
    "unknown": 0
  },
  "ingredients": [
    {
      "raw": "Sugar",
      "ingredient": "Sugar",
      "halal_status": "halal",
      "confidence": 1,
      "explanation": null,
      "ocr_uncertain": false
    },
    {
      "raw": "Gelatin (Beef)",
      "normalized": "Gelatin (Beef)",
      "ingredient": "Gelatin (Beef)",
      "halal_status": "conditional",
      "confidence": 0.7,
      "explanation": "Beef gelatin permissible if from halal slaughter; verify certification.",
      "ocr_uncertain": false
    }
  ],
  "ocr_confidence": 0.8
}
```

---

## 4. Saved halal recipes

**Endpoints:** `GET /api/recipes/my`, `GET /api/recipes/:id`, `POST /api/recipes`, `PUT /api/recipes/:id`, `DELETE /api/recipes/:id`

**Purpose:** List, get, create, update, and delete saved (halal) recipes. `GET /api/recipes/my` and `GET /api/recipes/:id` return the same recipe shape.

### List my recipes: `GET /api/recipes/my`

**Response schema (200):** `{ "recipes": Recipe[] }`

### Get one recipe: `GET /api/recipes/:id`

**Response schema (200):** `{ "recipe": Recipe }`

### Create recipe: `POST /api/recipes`

**Request body:** `title` (required), `originalRecipe`, `convertedRecipe`, `ingredients` (array), `instructions`, `isPublic`, `category`, `hashtags`, `mediaUrls`, `confidenceScore`.

**Response (201):** `{ "message": string, "recipe": Recipe }`

### Update recipe: `PUT /api/recipes/:id`

**Request body:** Same fields as create (partial update). Owner only.

**Response (200):** `{ "message": string, "recipe": Recipe }`

### Delete recipe: `DELETE /api/recipes/:id`

**Response (200):** `{ "message": string }`

### Recipe schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique id. |
| `user_id` / `userId` | string | Owner user id. |
| `title` | string | Recipe title. |
| `original_recipe` / `originalRecipe` | string | Original text. |
| `converted_recipe` / `convertedRecipe` | string | Halal-converted text. |
| `ingredients` | string[] | Ingredient list. |
| `instructions` | string | Instructions. |
| `category` | string | e.g. `"Main Course"`. |
| `hashtags` | string[] | Tags. |
| `media_url` / `mediaUrls` | string \| string[] | Media URL(s). |
| `confidence_score` / `confidenceScore` | number | 0–100. |
| `visibility` / `is_public` / `isPublic` | string \| boolean | `"public"` \| `"private"` or boolean. |
| `created_at` / `createdAt` | string | ISO 8601. |
| `updated_at` / `updatedAt` | string | ISO 8601. |

**Example response (GET /api/recipes/:id):**

```json
{
  "recipe": {
    "id": "42",
    "user_id": "user-uuid",
    "title": "Halal Bacon Carbonara",
    "originalRecipe": "200g bacon, pasta, egg...",
    "convertedRecipe": "200g smoked turkey bacon, pasta, egg...",
    "ingredients": ["200g smoked turkey bacon", "400g pasta", "2 eggs"],
    "instructions": "Cook bacon until crisp...",
    "category": "Main Course",
    "hashtags": ["halal", "pasta"],
    "media_url": "https://example.com/image.jpg",
    "confidence_score": 90,
    "visibility": "public",
    "created_at": "2025-03-01T12:00:00.000Z",
    "updated_at": "2025-03-01T12:00:00.000Z"
  }
}
```

---

## Error handling format

All error responses use a consistent JSON shape. HTTP status reflects the kind of error.

### Standard error body

```json
{
  "error": "Short machine-readable code or message",
  "message": "Optional human-readable detail",
  "code": "OPTIONAL_CODE",
  "details": {}
}
```

- **`error`** (string): Always present; short description or code.
- **`message`** (string): Optional; longer explanation for clients.
- **`code`** (string): Optional; stable code for programmatic handling.
- **`details`** (object): Optional; extra context (e.g. validation errors, limit info).

### Status codes and examples

**400 Bad Request – validation / bad input**

```json
{
  "error": "ingredient string is required"
}
```

```json
{
  "error": "No text to analyze. Send rawText (JSON) or upload an image (multipart/form-data with field \"image\")."
}
```

**401 Unauthorized – missing or invalid token**

```json
{
  "error": "Access denied",
  "message": "Invalid or expired token"
}
```

**403 Forbidden – limit reached or no permission**

```json
{
  "error": "Monthly conversion limit reached",
  "message": "You've used all 5 free conversions this month. Upgrade to Premium for unlimited conversions.",
  "limit": 5,
  "used": 5,
  "remaining": 0,
  "upgrade_required": true,
  "upgrade_url": "/subscription/upgrade"
}
```

```json
{
  "error": "Recipe not found",
  "message": "You can only delete your own recipes"
}
```

**404 Not Found**

```json
{
  "error": "Recipe not found"
}
```

**500 Internal Server Error**

```json
{
  "error": "Failed to classify ingredient"
}
```

```json
{
  "error": "Failed to scan ingredients"
}
```

---

## Summary table

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/convert/classify-ingredient` | POST | Bearer | Single ingredient lookup (normalized_query, base_ingredient, modifiers, halal_status, confidence, explanation, warnings, references, substitutes). |
| `/convert` | POST | Bearer | Recipe conversion (originalText, convertedText, issues, confidenceScore). |
| `/convert/scan-ingredients` | POST | Bearer | Photo scan / OCR result processing (summary, ingredients[], ocr_confidence). |
| `/api/recipes/my` | GET | Bearer | List current user's saved recipes. |
| `/api/recipes/:id` | GET | Bearer / optional | Get one saved recipe. |
| `/api/recipes` | POST | Bearer | Create saved recipe. |
| `/api/recipes/:id` | PUT | Bearer | Update saved recipe (owner). |
| `/api/recipes/:id` | DELETE | Bearer | Delete saved recipe (owner). |
