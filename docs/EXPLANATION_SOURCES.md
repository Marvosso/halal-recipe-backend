# Halal Kitchen: Explanation & Sourcing

## Overview

Ingredient explanations in Halal Kitchen are followed by a **Sources** section that references general Islamic dietary principles and halal certification guidelines. Rulings are not presented as definitive fatwas; a short disclaimer is always shown.

---

## 1. Updated explanation format

Structure shown to the user:

1. **Explanation**  
   One or two sentences on why the ingredient is halal, haram, or conditional (from the engine or config).

2. **Sources** (expandable)  
   - **General Islamic dietary principles**  
     Short, status-based principles (and optional ingredient-specific lines for e.g. gelatin, soy sauce).  
   - **Halal certification guidelines**  
     Certification bodies (IFANCA, HFA, JAKIM, MUIS) and optional ingredient-specific guideline lines.

3. **Disclaimer**  
   *"This tool provides general guidance and is not a religious ruling."*

---

## 2. Source content guidelines

- **Principles:** Framed as “many scholars,” “widely cited,” “common scholarly position,” “differing opinions” — not as absolute fatwas.
- **Certification:** Described as “guidelines” and “standards,” not as religious rulings.
- **References:** Qur’an verses and “scholarly consensus” or “certification guidelines” are cited; wording avoids “it is forbidden” or “fatwa says.”

---

## 3. Example: Gelatin

**Explanation (from engine/config):**  
*"Gelatin is often derived from pork or non-halal animals. Unless it is halal-certified or plant-based, many scholars consider it impermissible."*

**Sources (when user expands):**

- **General Islamic dietary principles**
  - Prohibition of consuming what is derived from haram sources is widely cited. — *Qur'an 2:173*
  - Many scholars hold that gelatin from pork or non-halal slaughter remains impermissible; halal-certified or plant-based alternatives are widely used. — *Common scholarly position*
  - Many scholars and certification bodies consider gelatin from non-halal sources impermissible unless certified. — *Widely cited position; IFANCA, JAKIM guidelines*

- **Halal certification guidelines**
  - IFANCA, JAKIM and similar bodies typically require gelatin to be from halal slaughter or plant-derived for certification. — *Halal certification guidelines*
  - IFANCA — Islamic Food and Nutrition Council of America (North America). Widely recognized halal standards and certification guidelines.
  - HFA, JAKIM, MUIS (same format as in app).

**Disclaimer:**  
*This tool provides general guidance and is not a religious ruling.*

---

## 4. Example: Soy sauce

**Explanation:**  
*"Soy sauce is often fermented and may contain trace alcohol. Opinions differ: some scholars accept minimal trace alcohol in fermented condiments; others prefer alcohol-free or halal-certified soy sauce."*

**Sources (when user expands):**

- **General Islamic dietary principles**
  - Intoxicants are prohibited; scholars differ on trace alcohol in fermented condiments. — *Qur'an 5:90*
  - Many scholars recommend alcohol-free or halal-certified soy sauce when available; others accept minimal trace alcohol in fermented products. — *Differing scholarly positions*
  - When source is uncertain, many scholars recommend halal certification or verification. — *Common scholarly position*

- **Halal certification guidelines**
  - Certification bodies (e.g. JAKIM, IFANCA) set limits on alcohol content and require verification for halal-certified soy sauce. — *Halal certification guidelines*
  - IFANCA, HFA, JAKIM, MUIS (same as in app).

**Disclaimer:**  
*This tool provides general guidance and is not a religious ruling.*

---

## 5. Implementation reference

| Item | Location |
|------|----------|
| Disclaimer text | `frontend/src/lib/halalSources.js` → `SOURCES_DISCLAIMER` |
| Section labels | `SOURCES_LABELS` (principles, certification) |
| Status-based principles | `ISLAMIC_DIETARY_PRINCIPLES` |
| Certification bodies | `SOURCE_CERTIFICATION_BODIES` |
| Ingredient-specific (e.g. gelatin, soy sauce) | `INGREDIENT_SOURCES` in `halalSources.js` |
| UI component | `frontend/src/components/IngredientSources.jsx` |
| Used in | Recipe conversion results (`App.jsx`), Quick Lookup (`QuickLookup.jsx`) |

To add sourcing for another ingredient (e.g. vinegar, rennet), add an entry to `INGREDIENT_SOURCES` in `halalSources.js` with `principles` and `guidelines` arrays (each item: `{ text, reference }`).
