# AI Explanation Layer for Halal Kitchen

## Goals

- Generate **clear, trustworthy** ingredient explanations.
- Use **deterministic halal results as fixed input**; AI never changes the verdict.
- **Guardrails:** no fatwa-like claims, no inventing Islamic sources, mention uncertainty when conditional.

---

## 1. Prompt template

### System prompt (guardrails)

```
You are a helpful assistant that explains halal ingredient classifications for Halal Kitchen. You never issue religious rulings or fatwas.

Rules you must follow:
1. You MUST NOT change, override, or suggest a different halal status than the one provided. The status (halal, conditional, haram, etc.) is fixed and comes from our rule engine.
2. You MUST NOT invent or fabricate Islamic sources (Quran, hadith, scholar names). Only mention sources if they are explicitly provided in the input.
3. Use plain language. Write 2 to 4 sentences only.
4. For "conditional" or uncertain status, clearly mention that it depends on source or preparation, and that users should verify when possible.
5. Use "generally," "often," or "many scholars consider" where appropriate for disputed or conditional items—do not state absolutes.
6. Be respectful and trustworthy. Do not make fatwa-like claims or speak as an authority.
```

### User prompt (structured input)

```
Given this deterministic halal classification result, write a short, clear explanation for the user. Do not change the status.

Ingredient: {{ingredient_name}}
Detected modifiers: {{modifiers}}
Halal status (fixed, do not change): {{halal_status}}
Confidence: {{confidence}}
Warnings (if any): {{warnings}}
Rule notes: {{notes}}
References (only mention if provided; do not invent): {{references}}

Write 2 to 4 sentences in plain language. Mention uncertainty when status is conditional. Do not fabricate sources.
```

Placeholders are filled from the rule-engine output: `ingredient_name`, `modifiers` (comma-separated or "none detected"), `halal_status`, `confidence`, `warnings`, `notes`, `references` (from DB or rule data; "none provided" if empty).

---

## 2. Server implementation

### Input (from rule engine only)

- **ingredient_name** – Display or normalized name.
- **modifiers** – Array of detected modifier slugs (e.g. `pork`, `halal_certified`).
- **halal_status** – `halal` | `usually_halal` | `conditional` | `usually_haram` | `haram` | `unknown`.
- **confidence** – `high` | `medium` | `low` (or derived from numeric confidence).
- **warnings** – Array of warning strings (e.g. “Source or preparation may affect permissibility”).
- **references** – Optional `[{ ref_type, ref_text }]` (e.g. quran, hadith); only passed through, never invented.
- **notes** – Rule notes from the deterministic engine.

### Flow

1. **buildExplanationInput(ruleResult, { references })** – Builds the structured object above from the rule result. No verdict is ever taken from AI.
2. **fillPromptTemplate(input)** – Fills the user prompt with that object.
3. **generateExplanation(ruleResult, options)**:
   - If **OPENAI_API_KEY** is set and **useLLM** is true: call **callOpenAIForExplanation(systemPrompt, userPrompt)** (e.g. `gpt-4o-mini`, max_tokens 200, temperature 0.3). Use the returned string as the explanation.
   - Else: use **templateFallbackExplanation(input)** – 2–4 sentences built from status phrases, notes, uncertainty sentence, and references (only if provided). Same guardrails as the prompt.
4. The **halal_status** and **confidence** in the API response are always the rule-engine values; the explanation is text only.

### Files

| File | Role |
|------|------|
| `backend/src/services/aiExplanationService.js` | `buildExplanationInput`, `SYSTEM_PROMPT`, `USER_PROMPT_TEMPLATE`, `fillPromptTemplate`, `templateFallbackExplanation`, `callOpenAIForExplanation`, `generateExplanation` |
| `backend/src/services/aiReasoningService.js` | Re-exports `generateExplanation` from aiExplanationService |
| `backend/src/services/halalClassificationService.js` | Passes `{ ...ruleResult, warnings }` into `generateExplanation` |

### Environment

- **OPENAI_API_KEY** (optional) – When set, explanations use the OpenAI Chat API. When unset, the template fallback is used.

---

## 3. Example outputs

Below are **template-fallback** examples (no LLM). With an LLM, tone and wording may vary but must still follow the same guardrails and must not change the status.

---

### Gelatin (conditional, source unknown)

**Input (from rule engine):**  
ingredient_name: `gelatin`, modifiers: `[]`, halal_status: `conditional`, confidence: `medium`, warnings: `["Source or preparation may affect permissibility; verify when possible.", "Source unknown; must be halal-certified if animal-derived."]`, notes: `Source unknown; must be halal-certified if animal-derived.`, references: `[{ ref_type: "quran", ref_text: "Surah Al-Baqarah 2:173" }, { ref_type: "hadith", ref_text: "Sahih Bukhari 7:67:400" }]`

**Example explanation:**

> Gelatin is often considered conditional—it depends on the source or how it was made. Source unknown; must be halal-certified if animal-derived. When in doubt, check the label for certification or consult a knowledgeable source. Islamic guidance on permitted and prohibited foods is found in sources such as Surah Al-Baqarah 2:173; Sahih Bukhari 7:67:400.

---

### Soy sauce (conditional, trace alcohol)

**Input:**  
ingredient_name: `soy sauce`, modifiers: `[]`, halal_status: `conditional`, confidence: `medium`, warnings: `["Source or preparation may affect permissibility; verify when possible."]`, notes: `Naturally contains trace alcohol from fermentation; many scholars allow.`, references: `[{ ref_type: "quran", ref_text: "Surah Al-Ma'idah 5:90" }]`

**Example explanation:**

> Soy sauce is often considered conditional—it depends on the source or how it was made. Naturally contains trace alcohol from fermentation; many scholars allow. When in doubt, check the label for certification or consult a knowledgeable source. Islamic guidance on permitted and prohibited foods is found in sources such as Surah Al-Ma'idah 5:90.

---

### Cheese (conditional, rennet)

**Input:**  
ingredient_name: `cheese`, modifiers: `[]`, halal_status: `conditional`, confidence: `medium`, warnings: `["Source or preparation may affect permissibility; verify when possible."]`, notes: `Depends on rennet and enzymes; check for halal or microbial rennet.`, references: `[{ ref_type: "scholarly", ref_text: "Rennet source determines permissibility." }]`

**Example explanation:**

> Cheese is often considered conditional—it depends on the source or how it was made. Depends on rennet and enzymes; check for halal or microbial rennet. When in doubt, check the label for certification or consult a knowledgeable source. Islamic guidance on permitted and prohibited foods is found in sources such as Rennet source determines permissibility.

---

### Vanilla extract (conditional, alcohol-based)

**Input:**  
ingredient_name: `vanilla extract`, modifiers: `[]`, halal_status: `conditional`, confidence: `medium`, warnings: `["Source or preparation may affect permissibility; verify when possible."]`, notes: `Often alcohol-based; check label or use alcohol-free.`, references: `[]`

**Example explanation:**

> Vanilla extract is often considered conditional—it depends on the source or how it was made. Often alcohol-based; check label or use alcohol-free. When in doubt, check the label for certification or consult a knowledgeable source.

---

### Pork gelatin (haram) – no references in input

**Input:**  
ingredient_name: `pork gelatin`, modifiers: `["pork"]`, halal_status: `haram`, confidence: `high`, warnings: `["Not permissible; use a halal substitute."]`, notes: `Pork and pork-derived ingredients are haram.`

**Example explanation:**

> Pork gelatin (pork) is not permissible. Pork and pork-derived ingredients are haram.

---

## 4. Guardrails summary

| Rule | Implementation |
|------|----------------|
| AI must not change halal_status | Status is only in the **input** to the prompt; API response status always comes from the rule engine. |
| AI must not fabricate sources | System prompt forbids inventing sources; user prompt only includes references "if provided"; template fallback only uses `input.references`. |
| Use "generally" / "often" for disputed items | System prompt requires it; template uses "is often considered conditional" and "generally" in STATUS_PHRASES. |
| 2–4 sentences | System prompt and template fallback both target 2–4 sentences. |
| Mention uncertainty when conditional | System prompt; template adds "When in doubt, check the label..." for conditional/unknown. |
