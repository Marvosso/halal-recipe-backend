# Photo Scan Pipeline – Ingredient List Analysis

Users can scan ingredient lists from product packaging (or paste text). The pipeline extracts text, normalizes it into ingredient tokens, and evaluates each with the **deterministic rule engine** only for halal verdicts. AI is used **only for text normalization**, not for determining halal status.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│ User uploads or  │     │ OCR (optional)    │     │ Raw text                 │
│ captures image  │────▶│ extractText()     │────▶│ (or pasted)              │
└─────────────────┘     └──────────────────┘     └────────────┬────────────┘
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  photoScanPipelineService.runPhotoScanPipeline(rawText, options)              │
│  1. parseIngredientList(rawText)  → tokens[] (comma/semicolon/newline/and)   │
│  2. For each token: cleanToken → optional normalizeIngredientOCR (AI)       │
│  3. evaluateIngredient(normalized, userPreferences)  → rule engine only      │
│  4. summary + ingredients[] with halal_status, confidence, ocr_uncertain    │
└─────────────────────────────────────────────────────────────────────────────┘
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Response: { summary: { halal, conditional, haram, unknown }, ingredients }│
│  UI: show halal / conditional / haram summary + per-ingredient list          │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **OCR**: Optional. If the client sends an image, the server uses the configured OCR adapter (`ocrAdapter.js`) to get `{ text, confidence }`. If the client sends `rawText` (e.g. from client-side OCR or paste), no server OCR.
- **Parsing**: Deterministic. Splits on newline, comma, semicolon, and “ and ”; trims and dedupes.
- **Normalization**: Per-token. `cleanToken()` (collapse spaces, trim). Optional AI via `normalizeIngredientOCR()` to fix obvious OCR errors; does **not** set halal status.
- **Verdicts**: Only from `ingredientRuleEngine.evaluateIngredient()`. No AI verdicts.
- **Confidence flags**: `ocr_uncertain: true` when OCR confidence &lt; 0.5 or when AI normalization changed the token.

---

## OCR Integration Suggestion

- **Default (no image on server)**: Client sends `rawText` in JSON. Client can use:
  - **Tesseract.js** in the browser to run OCR on a captured/uploaded image and send the extracted string to `POST /convert/scan-ingredients` with `{ rawText }`.
- **Server-side OCR** (optional):
  - **Tesseract.js** (Node): set `OCR_PROVIDER=tesseract` and install `tesseract.js`. Good for on-prem; no API key. Quality depends on image.
  - **Google Cloud Vision** (e.g. Text Detection): set `OCR_PROVIDER=google`, add credentials, implement in `ocrAdapter.js`. Better for messy or multi-language packaging.
- **Contract**: `extractTextFromImage(imageBuffer)` → `Promise<{ text: string, confidence: number }>`. Pipeline uses `confidence` to set `ocr_uncertain` when &lt; 0.5.

---

## Parsing Workflow

1. **Input**: Single string (full ingredient list from OCR or paste).
2. **Split**:  
   - Replace `\r\n` / `\r` with `\n`.  
   - Split on one or more of: newline, comma, semicolon.  
   - Then split each segment on ` and ` (case-insensitive).  
   - Trim each part, drop empty, dedupe (order preserved).
3. **Per token**:
   - `cleanToken(token)`: collapse whitespace, trim.  
   - Optional: `normalizeIngredientOCR(token)` (AI) → normalized string; if it changed, set `ocr_uncertain` for that ingredient when OCR confidence is low or normalization changed the text.  
   - `evaluateIngredient(normalized, userPreferences)` → `halal_status`, `confidence`, `notes`.
4. **Output**:  
   - `summary`: counts of `halal`, `conditional`, `haram`, `unknown`.  
   - `ingredients`: array of `{ raw, normalized?, ingredient, halal_status, confidence, explanation, ocr_uncertain }`.  
   - `ocr_confidence`: value used for the run (from OCR or default).

---

## API

- **Endpoint**: `POST /convert/scan-ingredients` (authenticated).
- **JSON body**:  
  - `rawText` (string): ingredient list text (required if no image).  
  - `ocrConfidence` (number, optional): 0–1; if omitted and no image, default 0.7.  
  - `useAINormalization` (boolean, optional): default true.  
  - `userPreferences` (object, optional): for rule engine.
- **Multipart**: field `image` (file) → server runs OCR, then pipeline on extracted text.
- **Response**:  
  `{ summary: { halal, conditional, haram, unknown }, ingredients: [...], ocr_confidence }`

---

## Example: Candy Ingredient List

**Input (messy OCR-style raw text):**

```
Sugar, Glucose Syrup, Palm Oil, Condensed Skim Milk, Cocoa Powder,
Whey (Milk), Emulsifier (E471), Flavouring, Salt, Gelatin (Beef), Color (E150a).
```

**Parsed tokens (after split on comma/newline and trim):**

- Sugar  
- Glucose Syrup  
- Palm Oil  
- Condensed Skim Milk  
- Cocoa Powder  
- Whey (Milk)  
- Emulsifier (E471)  
- Flavouring  
- Salt  
- Gelatin (Beef)  
- Color (E150a)  

**Example output (structure only; actual halal_status/explanation come from rule engine):**

```json
{
  "summary": {
    "halal": 8,
    "conditional": 1,
    "haram": 0,
    "unknown": 2
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
      "raw": "Glucose Syrup",
      "ingredient": "Glucose Syrup",
      "halal_status": "halal",
      "confidence": 1,
      "explanation": null,
      "ocr_uncertain": false
    },
    {
      "raw": "Palm Oil",
      "ingredient": "Palm Oil",
      "halal_status": "halal",
      "confidence": 1,
      "explanation": null,
      "ocr_uncertain": false
    },
    {
      "raw": "Condensed Skim Milk",
      "ingredient": "Condensed Skim Milk",
      "halal_status": "halal",
      "confidence": 1,
      "explanation": null,
      "ocr_uncertain": false
    },
    {
      "raw": "Cocoa Powder",
      "ingredient": "Cocoa Powder",
      "halal_status": "halal",
      "confidence": 1,
      "explanation": null,
      "ocr_uncertain": false
    },
    {
      "raw": "Whey (Milk)",
      "ingredient": "Whey (Milk)",
      "halal_status": "halal",
      "confidence": 0.9,
      "explanation": "Dairy derivative; check source if strict.",
      "ocr_uncertain": false
    },
    {
      "raw": "Emulsifier (E471)",
      "ingredient": "Emulsifier (E471)",
      "halal_status": "conditional",
      "confidence": 0.6,
      "explanation": "E471 may be plant or animal origin; verify source.",
      "ocr_uncertain": false
    },
    {
      "raw": "Flavouring",
      "ingredient": "Flavouring",
      "halal_status": "unknown",
      "confidence": 0.3,
      "explanation": null,
      "ocr_uncertain": false
    },
    {
      "raw": "Salt",
      "ingredient": "Salt",
      "halal_status": "halal",
      "confidence": 1,
      "explanation": null,
      "ocr_uncertain": false
    },
    {
      "raw": "Gelatin (Beef)",
      "ingredient": "Gelatin (Beef)",
      "halal_status": "conditional",
      "confidence": 0.7,
      "explanation": "Beef gelatin permissible if from halal slaughter; verify certification.",
      "ocr_uncertain": false
    },
    {
      "raw": "Color (E150a)",
      "ingredient": "Color (E150a)",
      "halal_status": "halal",
      "confidence": 0.9,
      "explanation": "Caramel color; typically plant-based.",
      "ocr_uncertain": false
    }
  ],
  "ocr_confidence": 0.7
}
```

**UI summary:** e.g. “8 halal, 1 conditional, 2 to verify (E471, Flavouring). Gelatin (Beef): check halal certification.”

---

## Files

| File | Role |
|------|------|
| `services/photoScanPipelineService.js` | Parse, clean, normalize, evaluate; summary + per-ingredient list |
| `services/ocrAdapter.js` | OCR adapter interface; stub / Tesseract (optional) / Google Vision |
| `services/aiReasoningService.js` | `normalizeIngredientOCR()` – AI only for text, not verdicts |
| `services/ingredientRuleEngine.js` | `evaluateIngredient()` – sole source of halal status |
| `routes/convert.js` | `POST /convert/scan-ingredients` (JSON `rawText` or multipart `image`) |
