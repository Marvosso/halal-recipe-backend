# OCR Ingredient Scan MVP

Lightweight label scanning: **client OCR** → **server tokenize + alias cleanup** → **deterministic intelligence engine**.

## API

`POST /api/scan` (public, no auth)

**JSON body:**

```json
{
  "rawText": "Sugar, Gelatin (beef), Palm Oil",
  "ocrConfidence": 0.85,
  "locale": "en"
}
```

**Multipart:** field `image` (optional server OCR via `OCR_PROVIDER=tesseract`)

## Pipeline

```
raw OCR text
  → tokenizeIngredientList()     # commas, newlines, "and", noise filter
  → normalizeOcrToken()          # glitch fix + alias resolve
  → evaluateIngredientIntelligence()  # authoritative verdict
```

Module: `backend/src/modules/ocr-scan/`

## Mobile flow

1. User captures label (`capture="environment"`)
2. Tesseract.js runs in browser
3. `POST /api/scan` with `rawText` + confidence
4. UI groups results: not permissible / check / generally permissible

Frontend: `useIngredientScan`, `scanApi.js`, `IngredientScanModal.jsx`

Flag: `FEATURES.USE_SERVER_SCAN` (falls back to client `halalEngine` if API fails)

## Constraints

- No barcode scanning
- Verdicts never from AI (explanation AI off by default on scan)
- Legacy `/convert/scan-ingredients` still works via `photoScanPipelineService.js`
