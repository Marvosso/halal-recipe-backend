# Ingredient Intelligence Database Schema

Scalable schema for Halal Kitchen’s ingredient system: thousands of ingredients, aliases/misspellings, modifier rules, SEO pages, substitutions, references, and last-reviewed dates.

---

## 1. Schema overview

| Table | Purpose |
|-------|--------|
| **ingredients** | Canonical ingredient (one row per ingredient; slug stable for URLs/API). |
| **ingredient_aliases** | Aliases and misspellings for matching user/OCR input to an ingredient. |
| **ingredient_modifiers** | Modifier definitions (e.g. pork, halal_certified) and their effect. |
| **ingredient_rule_overrides** | (ingredient + modifier) → verdict override (replaces category default). |
| **ingredient_references** | Source references (Quran, hadith, scholarly) per ingredient. |
| **ingredient_substitutions** | Halal substitutes (by ingredient_id or slug + display name). |
| **ingredient_pages** | SEO pages: one per ingredient per locale (slug, meta, content). |

---

## 2. Field definitions

### 2.1 ingredients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | UUID | PK, default uuid_generate_v4() | Surrogate key; stable for FKs. |
| **slug** | TEXT | UNIQUE, NOT NULL | Canonical slug (e.g. `gelatin`, `soy_sauce`). Used in URLs and API. |
| **display_name** | TEXT | NOT NULL | Human-readable name (e.g. "Gelatin", "Soy sauce"). |
| **category** | TEXT | NOT NULL, CHECK | One of: `plain_plant`, `meat`, `animal_byproduct`, `dairy`, `cheese`, `flavoring_extract`, `alcohol`, `pork`, `other`. |
| **default_verdict** | TEXT | NOT NULL, CHECK | Default when no override matches: `halal`, `usually_halal`, `conditional`, `usually_haram`, `haram`, `unknown`. |
| **default_confidence** | TEXT | NOT NULL, CHECK | `high`, `medium`, `low`. |
| **notes_summary** | TEXT | | Short summary for tooltips/UI. |
| **is_active** | BOOLEAN | DEFAULT true | Soft delete / hide from UI. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Row creation time. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Last update time. |
| **last_reviewed_at** | TIMESTAMPTZ | | When the ingredient was last reviewed for accuracy. |

### 2.2 ingredient_aliases

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | SERIAL | PK | Surrogate key. |
| **ingredient_id** | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient this alias refers to. |
| **alias_normalized** | TEXT | UNIQUE, NOT NULL | Normalized form for matching (lowercase, no extra spaces). |
| **alias_display** | TEXT | | Optional display form (e.g. "Soy Sauce"). |
| **is_misspelling** | BOOLEAN | DEFAULT false | True if this is a common misspelling. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Row creation time. |

### 2.3 ingredient_modifiers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | SERIAL | PK | Surrogate key. |
| **slug** | TEXT | UNIQUE, NOT NULL | Modifier slug (e.g. `pork`, `halal_certified`, `plant`). |
| **display_name** | TEXT | NOT NULL | Human-readable name. |
| **effect** | TEXT | NOT NULL, CHECK | One of: `override_halal`, `override_haram`, `strengthen`, `weaken`, `context`. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Row creation time. |

### 2.4 ingredient_rule_overrides

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | SERIAL | PK | Surrogate key. |
| **ingredient_id** | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient. |
| **modifier_id** | INTEGER | NOT NULL, FK → ingredient_modifiers(id) ON DELETE CASCADE | Modifier. |
| **verdict** | TEXT | NOT NULL, CHECK | `halal`, `usually_halal`, `conditional`, `usually_haram`, `haram`. |
| **confidence_level** | TEXT | NOT NULL, CHECK | `high`, `medium`, `low`. |
| **notes** | TEXT | | Override-specific note. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Row creation time. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Last update time. |
| | | UNIQUE(ingredient_id, modifier_id) | At most one override per (ingredient, modifier). |

### 2.5 ingredient_references

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | SERIAL | PK | Surrogate key. |
| **ingredient_id** | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient. |
| **ref_type** | TEXT | NOT NULL, CHECK | `quran`, `hadith`, `scholarly`, `other`. |
| **ref_text** | TEXT | NOT NULL | e.g. "Surah Al-Baqarah 2:173", "Sahih Bukhari 7:67:400". |
| **ref_url** | TEXT | | Optional URL to source. |
| **sort_order** | INTEGER | DEFAULT 0 | Display order. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Row creation time. |

### 2.6 ingredient_substitutions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | SERIAL | PK | Surrogate key. |
| **ingredient_id** | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient being substituted. |
| **substitute_ingredient_id** | UUID | FK → ingredients(id) ON DELETE SET NULL | Optional link to another ingredient. |
| **substitute_slug** | TEXT | | Slug or key when not in ingredients table. |
| **substitute_display_name** | TEXT | | Display name for the substitute. |
| **sort_order** | INTEGER | DEFAULT 0 | Display order. |
| **notes** | TEXT | | Usage note (e.g. ratio). |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Row creation time. |
| | | CHECK | At least one of substitute_ingredient_id or (substitute_slug AND substitute_slug <> ''). |

### 2.7 ingredient_pages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| **id** | SERIAL | PK | Surrogate key. |
| **ingredient_id** | UUID | NOT NULL, FK → ingredients(id) ON DELETE CASCADE | Ingredient. |
| **locale** | TEXT | NOT NULL, DEFAULT 'en' | Locale (e.g. en, ar). |
| **slug** | TEXT | NOT NULL | URL path (e.g. `is-gelatin-halal`). |
| **meta_title** | TEXT | | SEO title. |
| **meta_description** | TEXT | | SEO description. |
| **h1** | TEXT | | Page heading. |
| **content_html** | TEXT | | Optional HTML body. |
| **is_published** | BOOLEAN | DEFAULT false | Whether the page is live. |
| **published_at** | TIMESTAMPTZ | | When the page was first published. |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | Row creation time. |
| **updated_at** | TIMESTAMPTZ | DEFAULT NOW() | Last update time. |
| | | UNIQUE(ingredient_id, locale) | One page per ingredient per locale. |

---

## 3. Relationships

```
ingredients (1) ──< ingredient_aliases         (N aliases per ingredient)
ingredients (1) ──< ingredient_rule_overrides (N) >── (1) ingredient_modifiers
ingredients (1) ──< ingredient_references     (N references per ingredient)
ingredients (1) ──< ingredient_substitutions  (N; substitute can FK back to ingredients)
ingredients (1) ──< ingredient_pages          (1 per locale, N locales)
```

- **ingredients** is the central table; all others reference it by **ingredient_id** (UUID).
- **ingredient_rule_overrides** references **ingredient_modifiers**; (ingredient_id, modifier_id) is unique.
- **ingredient_substitutions** can point to another row in **ingredients** via **substitute_ingredient_id**, or to an external slug via **substitute_slug** + **substitute_display_name**.

---

## 4. Example seed data (summary)

Migration `12_ingredient_intelligence_schema.sql` seeds:

| Ingredient | Slug | Category | Default verdict | Aliases (normalized) | Overrides (modifier → verdict) | References | Substitutions | SEO page slug |
|------------|------|----------|------------------|----------------------|---------------------------------|------------|---------------|----------------|
| Gelatin | gelatin | animal_byproduct | conditional | gelatin, gelatine, gelatn | pork→haram, beef→conditional, halal_certified→halal, plant→halal | Quran 2:173, Bukhari | agar_agar, halal_beef_gelatin, pectin | is-gelatin-halal |
| Cheese | cheese | cheese | conditional | cheese | — | scholarly (rennet) | halal_cheese, vegan_cheese | is-cheese-halal |
| Soy sauce | soy_sauce | flavoring_extract | conditional | soy sauce, soy_sauce, shoyu | halal_certified→halal, alcohol_free→halal | Quran 5:90, Muslim | halal_soy_sauce, tamari_alcohol_free | is-soy-sauce-halal |
| Vanilla extract | vanilla_extract | flavoring_extract | conditional | vanilla extract, vanilla_extract, pure vanilla extract | alcohol_free→halal, plant→halal | Quran 5:90, Muslim | alcohol_free_vanilla, vanilla_powder, vanilla_bean_paste | is-vanilla-extract-halal |
| Rice | rice | plain_plant | halal | rice, rices | — | Quran 2:172 | — | is-rice-halal |

---

## 5. Migration

Run after core and (if present) ingredient_rule migrations:

```bash
psql $DATABASE_URL -f backend/src/migrations/12_ingredient_intelligence_schema.sql
```

This creates the seven tables, indexes, and seed data for gelatin, cheese, soy sauce, vanilla extract, and rice.

---

## 6. File reference

| File | Purpose |
|------|--------|
| `backend/src/migrations/12_ingredient_intelligence_schema.sql` | DDL + seed for all seven tables. |
| `docs/INGREDIENT_INTELLIGENCE_SCHEMA.md` | This document. |
