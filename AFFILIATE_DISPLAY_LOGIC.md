# Affiliate Link Display Logic - Frontend Design

## Overview
This document defines the frontend logic for displaying affiliate links in Halal Kitchen, ensuring they appear only in appropriate contexts and feel helpful, not salesy.

## Display Rules

### ✅ Where Affiliate Links Appear

1. **Ingredient Detail Screens** (Quick Lookup)
   - When user looks up a specific ingredient
   - Shows affiliate links for halal substitutes only
   - Maximum 3 buttons per substitute

2. **Conversion Results Screens**
   - After recipe conversion
   - In expanded ingredient cards
   - Only on halal replacement ingredients
   - Never on haram ingredients themselves

### ❌ Where Affiliate Links NEVER Appear

1. **Home Screen**
   - No affiliate links on homepage
   - No promotional content

2. **Recipe Browse Grid**
   - No affiliate links in recipe listings
   - No affiliate links in recipe cards

3. **Haram Ingredient Cards**
   - Never show affiliate links on haram ingredients
   - Only show on their halal substitutes

---

## Component Structure

### 1. AffiliateLinkGroup Component

**Purpose**: Display up to 3 affiliate links for a halal substitute ingredient

**Props**:
```typescript
interface AffiliateLinkGroupProps {
  affiliateLinks: AffiliateLink[]; // Array from conversion result
  ingredientName: string; // Name of substitute ingredient
  variant?: 'card' | 'inline'; // Display style
  showDisclosure?: boolean; // Show commission disclosure
}
```

**Variants**:
- **`card`** (default): Full card layout with buttons grid
- **`inline`**: Compact inline buttons

**Usage**:
```jsx
<AffiliateLinkGroup
  affiliateLinks={issue.substitute_affiliate_links}
  ingredientName={formatIngredientName(issue.replacement_id)}
  variant="card"
  showDisclosure={true}
/>
```

### 2. IngredientDetailCard Component

**Purpose**: Complete ingredient detail view with affiliate links

**Features**:
- Expandable/collapsible card
- Status badge (halal/haram/conditional)
- Explanation section
- Halal substitutes with affiliate links
- Islamic references

**Usage**:
```jsx
<IngredientDetailCard
  ingredient={lookupResult}
  isExpanded={false}
  onToggle={(expanded) => {}}
/>
```

### 3. Integration Points

#### Conversion Results (`App.jsx`)
```jsx
// In ingredient card expansion
{issue?.substitute_affiliate_links && 
 issue.substitute_affiliate_links.length > 0 && (
  <div className="ingredient-detail-row">
    <AffiliateLinkGroup
      affiliateLinks={issue.substitute_affiliate_links}
      ingredientName={formatIngredientName(issue.replacement_id)}
      variant="card"
    />
  </div>
)}
```

#### Quick Lookup (`QuickLookup.jsx`)
```jsx
// After ingredient lookup result
{result.alternatives && result.alternatives.length > 0 && (
  <IngredientDetailCard
    ingredient={result}
    isExpanded={true}
  />
)}
```

---

## Button Hierarchy

### Priority Order (Maximum 3)

1. **Featured Links First**
   - Links marked `is_featured: true` appear first
   - Visual distinction with "Featured" badge

2. **Platform Priority**
   - Amazon (most trusted, widest selection)
   - Instacart (same-day delivery appeal)
   - Thrive Market (organic/halal focus)

3. **Click Performance**
   - Higher click count links prioritized
   - Better conversion rates shown first

### Visual Hierarchy

```
┌─────────────────────────────────────┐
│ Find Agar Agar                      │
├─────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│ │ Shop on  │ │ Shop on  │ │ Shop │ │
│ │ Amazon   │ │Instacart │ │Thrive│ │
│ │ Featured │ │          │ │Market│ │
│ └──────────┘ └──────────┘ └──────┘ │
├─────────────────────────────────────┤
│ 💚 We may earn a small commission  │
│    at no extra cost to you.        │
└─────────────────────────────────────┘
```

---

## UX Copy Examples

### Button Labels

**Primary Buttons** (Card variant):
- "Shop on Amazon"
- "Shop on Instacart"
- "Shop on Thrive Market"

**Inline Buttons**:
- "Find on Amazon"
- "Find on Instacart"
- "Find on Thrive Market"

### Section Headers

**Conversion Results**:
- "Find [Ingredient Name]"
- "Shop Halal Ingredients"
- "Halal Alternatives"

**Quick Lookup**:
- "Halal Alternatives"
- "Where to Buy"
- "Recommended Substitutes"

### Disclosure Text

**Full Disclosure** (Card variant):
```
💚 We may earn a small commission at no extra cost to you. 
This helps keep Halal Kitchen free.
```

**Short Disclosure** (Inline variant):
```
💚 We may earn a small commission (no extra cost to you)
```

### Helpful Messaging

**When showing substitutes**:
- "Recommended: [Substitute Name]"
- "Option 1: [Substitute Name]"
- "Find halal-certified [ingredient]"

**When no substitute available**:
- "No halal substitute found. Please consult a qualified Islamic scholar."
- "Check for halal-certified options in your area."

---

## Button Styling

### Card Variant (Default)

**Layout**:
- Grid: 3 columns (desktop), 1 column (mobile)
- Button size: ~140px minimum width
- Padding: 0.75rem 1rem
- Border radius: 8px

**Colors**:
- Background: White (#ffffff)
- Border: Light gray (#e0e0e0)
- Hover border: Platform color (Amazon orange, Instacart green, etc.)
- Featured badge: Platform color background

**Typography**:
- Label: 0.75rem, medium weight, secondary color
- Platform: 0.875rem, semibold, primary color
- Font: Inter

### Inline Variant

**Layout**:
- Horizontal flex layout
- Compact buttons
- Gap: 0.5rem between buttons

**Colors**:
- Background: White
- Border: Light gray
- Hover: Platform color tint

**Typography**:
- Font size: 0.8125rem
- Font weight: 500

---

## Data Flow

### Conversion Result → UI

```
convertRecipeWithJson()
  ↓
issues[].substitute_affiliate_links[]
  ↓
AffiliateLinkGroup component
  ↓
Rendered in ingredient card
```

### Quick Lookup → UI

```
lookupIngredient()
  ↓
result.alternatives[]
  ↓
IngredientDetailCard component
  ↓
AffiliateLinkGroup for each substitute
```

---

## Edge Cases

### Case 1: No Affiliate Links Available

**Behavior**: Don't show affiliate section at all
```jsx
{affiliateLinks.length > 0 && (
  <AffiliateLinkGroup ... />
)}
```

### Case 2: More Than 3 Links

**Behavior**: Show only first 3 (prioritized)
```jsx
const displayLinks = affiliateLinks.slice(0, 3);
```

### Case 3: Haram Ingredient with No Substitute

**Behavior**: Show explanation only, no affiliate links
```jsx
{hasSubstitute ? (
  <AffiliateLinkGroup ... />
) : (
  <p>No halal substitute available. Please consult a scholar.</p>
)}
```

### Case 4: Multiple Substitutes (1-3)

**Behavior**: Show primary substitute with links, then additional options
```jsx
{substitutesWithLinks.map((substitute, idx) => (
  <div key={idx}>
    <p>Option {idx + 1}: {substitute.name}</p>
    <AffiliateLinkGroup 
      affiliateLinks={substitute.affiliate_links}
      variant="inline"
    />
  </div>
))}
```

---

## Accessibility

### ARIA Labels

```jsx
<a
  aria-label={`Shop for ${ingredientName} on ${platformName}`}
  ...
>
```

### Keyboard Navigation

- Tab through buttons
- Enter/Space to activate
- Focus visible on all interactive elements

### Screen Reader Support

- Clear button labels
- Disclosure text announced
- Platform names clearly stated

---

## Analytics Tracking

### Click Events

```javascript
window.plausible('Affiliate Click', {
  props: {
    platform: 'amazon',
    ingredient: 'agar_agar',
    link_id: 'link_123'
  }
});
```

### Metrics to Track

- Click-through rate per platform
- Click-through rate per ingredient
- Featured vs. non-featured performance
- Conversion rate (if available from platform)

---

## Implementation Checklist

- [x] Create AffiliateLinkGroup component
- [x] Create IngredientDetailCard component
- [x] Integrate into conversion results
- [ ] Integrate into Quick Lookup
- [ ] Add analytics tracking
- [ ] Test with real affiliate links
- [ ] Verify no links on home/browse screens
- [ ] Verify maximum 3 buttons
- [ ] Verify helpful, not salesy tone
- [ ] Accessibility testing

---

## Files Created/Modified

### New Components
- `frontend/src/components/AffiliateLinkGroup.jsx`
- `frontend/src/components/AffiliateLinkGroup.css`
- `frontend/src/components/IngredientDetailCard.jsx`
- `frontend/src/components/IngredientDetailCard.css`

### Modified Files
- `frontend/src/App.jsx` - Integration in conversion results
- `frontend/src/components/QuickLookup.jsx` - (To be updated)

### Documentation
- `AFFILIATE_DISPLAY_LOGIC.md` - This file
