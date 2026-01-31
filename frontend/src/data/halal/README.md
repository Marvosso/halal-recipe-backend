# Halal Knowledge Model (HKM)

This folder contains the source-of-truth halal decision system.

## Overview

- JSON-based
- Inheritance-aware
- Explainable (trace + ELI5)
- Supports schools of thought and strictness (future)

## Important Note

⚠️ **This engine is NOT yet active in production.**

It exists as a foundation for future enhancements but does not affect current application behavior.

## File Structure

- `sources.json` - Base animal and source definitions (pork, halal beef, etc.)
- `ingredients.json` - Ingredient definitions with dependencies and school-specific rules
- `products.json` - Product definitions that reference ingredients

## Data Model

### Sources
Define base animal/source types with default halal status.

### Ingredients
Define ingredients with:
- Default status (halal/conditional/haram/unknown)
- Dependencies (e.g., gelatin depends on source)
- School-specific rules (Hanafi, Shafi'i, etc.)
- ELI5 explanations

### Products
Define products that contain ingredients, enabling inheritance-based evaluation.

## Constraints (Important)

❌ Do not remove existing conversion logic  
❌ Do not change UI behavior  
❌ Do not add backend dependencies  

✅ Keep everything localStorage-compatible  
✅ Ensure build passes  
✅ This is foundation-only (not integrated into UI)

## Usage (Future)

When `FEATURES.HALAL_KNOWLEDGE_ENGINE` is enabled:

```javascript
import { evaluateItem } from "../lib/halalEngine";

const result = evaluateItem("gelatin");
// Returns: { status, confidence, trace, eli5 }
```

## Status Values

- `halal` - Fully permissible (score: 1.0)
- `conditional` - Depends on context (score: 0.6)
- `unknown` - Cannot determine (score: 0.4)
- `haram` - Prohibited (score: 0.0)
