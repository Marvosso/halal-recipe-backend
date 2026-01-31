# Upgrade Copy Guide for Halal Kitchen Premium

## Tone Principles

1. **Respectful**: Never pressure or manipulate
2. **Value-based**: Focus on benefits, not features
3. **Not pushy**: Soft suggestions, easy dismissal
4. **Transparent**: Clear pricing, no hidden costs
5. **Mission-aligned**: Connect to halal cooking mission

---

## Upgrade Modal Copy

### Header
- **Title**: "Unlock Premium Features"
- **Subtitle**: "Support Halal Kitchen and get advanced tools for your halal cooking journey"

### Value Proposition
- **Headline**: "Everything you need for confident halal cooking"
- **Description**: "Premium helps you make informed decisions with advanced verification, unlimited saves, and priority support."

### Features (6 key features)

1. **All Halal Alternatives**
   - Icon: 🔍
   - Title: "All Halal Alternatives"
   - Description: "See every halal substitute option, not just the top 2. Find the perfect match for your recipe."

2. **Strict Halal Mode**
   - Icon: 🛡️
   - Title: "Strict Halal Mode"
   - Description: "Enhanced verification with stricter rules for maximum confidence in your halal choices."

3. **Unlimited Recipe Saves**
   - Icon: 💾
   - Title: "Unlimited Recipe Saves"
   - Description: "Save as many converted recipes as you need. Organize your halal recipe collection."

4. **PDF & JSON Export**
   - Icon: 📄
   - Title: "PDF & JSON Export"
   - Description: "Export recipes in professional formats. Share with family or import to meal planning apps."

5. **Brand-Level Verification**
   - Icon: 🏷️
   - Title: "Brand-Level Verification"
   - Description: "Check if specific brands are halal-certified. Know exactly what you're buying."

6. **Conversion History**
   - Icon: 📊
   - Title: "Conversion History"
   - Description: "Access your past conversions. Review substitutions and build your halal recipe library."

### Pricing
- **Monthly**: "$2.99 per month" - "Cancel anytime"
- **Yearly**: "$29.99 per year" - "Save 17%" - "Billed annually"

### Trust Elements
- ✅ 30-day money-back guarantee
- ✅ Priority email support
- ✅ Cancel anytime, no questions asked

### Footer
- **Why**: "Your subscription helps us maintain and expand the halal knowledge base, keeping Halal Kitchen free for everyone."
- **Thanks**: "Thank you for supporting halal cooking! 🙏"

---

## Settings Page Copy

### Free User
- **Title**: "Free Plan"
- **Description**: "You're using the free plan with basic features."
- **CTA**: "Upgrade to Premium"

### Premium User
- **Title**: "Premium Active"
- **Description**: "Thank you for supporting Halal Kitchen!"
- **Expires**: "Renews on {date}"
- **CTA**: "Manage Subscription"

### Expired User
- **Title**: "Premium Expired"
- **Description**: "Your premium subscription has ended. Upgrade to restore premium features."
- **CTA**: "Renew Premium"

### Benefits List
- All halal substitution alternatives
- Strict Halal Mode verification
- Unlimited recipe saves
- PDF and JSON export formats
- Brand-level halal verification
- Full conversion history
- Priority email support

---

## Post-Conversion Upgrade Nudges

### Limited Alternatives
**When**: User sees only 2 alternatives, but more exist

- **Title**: "See All Halal Alternatives"
- **Message**: "You're seeing the top 2 substitutes. Premium shows all {total} alternatives with flavor and texture match details."
- **CTA**: "Upgrade to See All"
- **Dismiss**: "Maybe Later"

### Saved Recipe Limit
**When**: User tries to save 11th recipe

- **Title**: "Save This Recipe?"
- **Message**: "You've saved {count} of 10 free recipes. Upgrade for unlimited saves and recipe collections."
- **CTA**: "Upgrade for Unlimited Saves"
- **Dismiss**: "Continue Free"

### Export Prompt
**When**: User wants to export to PDF/JSON

- **Title**: "Export Recipe"
- **Message**: "Text export is free. Upgrade to export as PDF (formatted) or JSON (for meal planning apps)."
- **CTA**: "Upgrade for PDF/JSON Export"
- **Dismiss**: "Export as Text"

---

## Feature-Specific Prompts

### Strict Halal Mode
- **Title**: "Strict Halal Mode"
- **Message**: "Enhanced halal verification with stricter rules for maximum confidence. Premium feature."
- **CTA**: "Upgrade to Enable"
- **Dismiss**: "Use Standard Mode"

### Brand Verification
- **Title**: "Brand-Level Verification"
- **Message**: "Check if specific brands are halal-certified. Know exactly what you're buying. Premium feature."
- **CTA**: "Upgrade to Verify Brands"
- **Dismiss**: "Continue Free"

### Batch Conversion
- **Title**: "Batch Conversion"
- **Message**: "Convert up to 5 recipes at once. Save time when planning meals. Premium feature."
- **CTA**: "Upgrade for Batch Conversion"
- **Dismiss**: "Convert One at a Time"

### Conversion History
- **Title**: "Conversion History"
- **Message**: "View and manage your past conversions. Build your halal recipe library. Premium feature."
- **CTA**: "Upgrade to View History"
- **Dismiss**: "Continue Free"

---

## Copy Guidelines

### Do's ✅
- Focus on value and benefits
- Use respectful, warm language
- Make it easy to dismiss
- Connect to halal cooking mission
- Be transparent about pricing
- Show gratitude for support

### Don'ts ❌
- Use urgency or scarcity tactics
- Pressure or manipulate
- Hide pricing or terms
- Make it hard to dismiss
- Use aggressive language
- Create false urgency

---

## Implementation

All copy is centralized in `frontend/src/lib/upgradeCopy.js` for easy maintenance and consistency.

### Usage Example

```javascript
import { UPGRADE_COPY, getUpgradeCopy } from '../lib/upgradeCopy';

// Get copy for specific feature
const copy = getUpgradeCopy('strictHalalMode');
// Returns: { title, message, cta, dismiss }

// Access modal copy
const modalCopy = UPGRADE_COPY.modal;
```

---

## Testing Checklist

- [ ] Modal copy is respectful and value-based
- [ ] Settings page shows correct status
- [ ] Post-conversion nudges appear at right times
- [ ] Feature prompts are contextually relevant
- [ ] All CTAs are clear and actionable
- [ ] Dismiss options are easy to find
- [ ] Pricing is transparent
- [ ] Trust elements are visible
- [ ] Footer message is warm and mission-aligned
