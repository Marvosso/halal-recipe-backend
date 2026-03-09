# Ingredient Photo Scan Feature

## Overview

Users can scan an ingredient list (e.g. on a product label) with their phone camera. The app extracts text via OCR, parses it into ingredients, runs halal lookup on each, and shows a summary: **halal**, **questionable**, and **haram** ingredients.

---

## 1. Recommended OCR approach

**Client-side: Tesseract.js**

- **Why:** Runs in the browser; no image upload to a backend. Good for privacy and works offline after the first load (language data is cached).
- **Library:** `tesseract.js` (v5+). Loaded dynamically when the user runs a scan so the main bundle stays small.
- **Language:** English (`eng`) only for now; can add more languages via `createWorker('eng+ara')` etc. if needed.
- **Flow:** User selects/captures image → `createWorker('eng')` → `worker.recognize(imageFile)` → `data.text` → parse → evaluate.

**Alternatives considered**

- **Google Cloud Vision / AWS Textract:** Better accuracy and layout handling but requires backend, API keys, and sending images to the cloud. Not chosen for MVP to keep implementation simple and privacy-friendly.
- **Backend Tesseract:** Same engine on the server; adds hosting and latency. Can be added later if client-side performance is poor on low-end devices.

---

## 2. Parsing algorithm

**File:** `frontend/src/lib/parseOcrIngredients.js`

**Input:** Raw OCR string (often multi-line, with commas, numbers, and noise).

**Steps:**

1. **Split** on:
   - Newlines (`\n`)
   - Commas (`,`)
   - Semicolons (`;`)
   - The words “ and ” and “ & ” (case-insensitive)

2. **Clean each token:**
   - Trim whitespace.
   - Remove leading numbers/bullets (e.g. `1. Sugar` → `Sugar`).
   - Remove parenthetical content (e.g. `wheat (gluten)` → `wheat`) to reduce duplication; optional to keep for context.
   - Remove trailing footnote markers (`*`, `†`, etc.).

3. **Filter:**
   - Discard empty or very short tokens (e.g. length &lt; 2).
   - Discard very long tokens (&gt; 120 chars) as likely non-ingredient.
   - Skip lines that are mostly digits (e.g. nutrition facts).
   - Skip common label headers: “Ingredients:”, “Contains:”, “Nutrition”, “Serving”, “Calories”, “Product of”, “Manufactured”, “Distributed by”, “Best before”, “Exp ”, “©”, “™”, “®”.

4. **Deduplicate:** Normalize (lowercase, collapse spaces) and keep first occurrence.

5. **Output:** Array of cleaned ingredient strings in order.

**Example**

- OCR: `"Ingredients: Water, Sugar, 1. Wheat Flour, Salt (Sodium Chloride). Contains: Gluten."`
- Parsed: `["Water", "Sugar", "Wheat Flour", "Salt", "Gluten"]`

---

## 3. UI flow

1. **Entry (mobile only)**  
   On the Recipe Converter tab, a **“Scan ingredients”** button is shown only on viewports ≤768px (e.g. phones). Tapping it opens the scan modal.

2. **Capture**  
   User taps **“Take photo or choose image”**. This uses a hidden `<input type="file" accept="image/*" capture="environment">`. On mobile, this typically opens the camera (rear by default); on desktop, it opens the file picker. User captures or selects an image.

3. **Preview**  
   The selected image is shown in the modal. User can:
   - **“Choose another”** → back to file picker/camera.
   - **“Extract text & check halal”** → run OCR and halal evaluation.

4. **Extracting**  
   A loading state with “Reading label…” and a progress bar (when Tesseract reports progress). Tesseract.js is loaded dynamically on first use.

5. **Results**  
   Summary is shown in three sections:
   - **Haram** – ingredient name + short explanation.
   - **Questionable** – ingredient name + short explanation (conditional/unknown).
   - **Halal** – ingredient names only.

   If no ingredients are detected, an error message asks the user to try a clearer photo.

6. **After results**  
   User can **“Scan another label”** (resets to capture) or **“Close”** (closes modal).

---

## 4. File reference

| Item | Location |
|------|----------|
| OCR parsing | `frontend/src/lib/parseOcrIngredients.js` |
| Scan modal + flow | `frontend/src/components/IngredientScanModal.jsx` |
| Scan modal styles | `frontend/src/components/IngredientScanModal.css` |
| Scan button (mobile) | `frontend/src/App.jsx` (input-actions), `.scan-ingredients-btn` in `App.css` |
| Halal evaluation | `evaluateItem()` from `frontend/src/lib/halalEngine.js` |
| Display names | `formatIngredientName()` from `frontend/src/lib/ingredientDisplay.js` |

---

## 5. Dependencies

- **tesseract.js** – client-side OCR. Installed in `frontend/package.json`. Loaded at runtime via `import("tesseract.js")` when the user starts a scan.
