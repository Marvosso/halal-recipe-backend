# Test Scenarios for Monetization Logic

## Overview
Comprehensive test scenarios for affiliate monetization logic in Halal Kitchen.

## Test Case 1: Pork Ingredient → Halal Substitute → Affiliate Links Shown

### Scenario
User converts a recipe containing bacon (pork product).

### Input
```javascript
recipeText: "Breakfast: 4 slices bacon, 2 eggs, toast"
```

### Mock Data
```javascript
{
  ingredient: "bacon",
  status: "haram",
  replacement: "turkey_bacon",
  affiliateLinks: [
    {
      id: "link_turkey_bacon_amazon_0",
      platform: "amazon",
      search_query: "halal turkey bacon certified",
      is_featured: true
    },
    {
      id: "link_turkey_bacon_instacart_0",
      platform: "instacart",
      search_query: "halal turkey bacon",
      is_featured: false
    }
  ]
}
```

### Expected Output
```javascript
{
  issues: [
    {
      ingredient_id: "bacon",
      ingredient: "bacon",
      status: "haram",
      haram_explanation: "Pork and all pork products are explicitly prohibited...",
      replacement_id: "turkey_bacon",
      replacement: "turkey_bacon",
      
      // Affiliate links ONLY on substitute, NOT on bacon
      substitute_affiliate_links: [
        {
          id: "link_turkey_bacon_amazon_0",
          platform: "amazon",
          platform_display: "Amazon",
          url: "https://www.amazon.com/s?k=halal+turkey+bacon+certified&tag=halalkitchen-20",
          search_query: "halal turkey bacon certified",
          is_featured: true
        },
        {
          id: "link_turkey_bacon_instacart_0",
          platform: "instacart",
          platform_display: "Instacart",
          url: "https://www.instacart.com/store/search?q=halal+turkey+bacon",
          search_query: "halal turkey bacon",
          is_featured: false
        }
      ],
      
      // NO affiliate_links field on bacon itself
      // affiliate_links: undefined ❌
    }
  ]
}
```

### Assertions
- ✅ Bacon (haram) has NO affiliate links
- ✅ Turkey bacon (substitute) has affiliate links
- ✅ Maximum 3 affiliate links shown
- ✅ Featured links appear first
- ✅ Links contain "turkey bacon", not "bacon" or "pork"

---

## Test Case 2: Alcohol Ingredient → Substitute → No Alcohol Links

### Scenario
User converts a recipe containing wine (alcohol).

### Input
```javascript
recipeText: "Beef Bourguignon: 1 cup red wine, 2 lbs beef"
```

### Mock Data
```javascript
{
  ingredient: "wine",
  status: "haram",
  replacement: "grape_juice",
  affiliateLinks: [
    {
      id: "link_grape_juice_amazon_0",
      platform: "amazon",
      search_query: "100% pure grape juice halal",
      is_featured: true
    }
  ]
}
```

### Expected Output
```javascript
{
  issues: [
    {
      ingredient_id: "wine",
      status: "haram",
      haram_explanation: "Wine and all intoxicants are explicitly prohibited...",
      replacement_id: "grape_juice",
      
      substitute_affiliate_links: [
        {
          id: "link_grape_juice_amazon_0",
          platform: "amazon",
          search_query: "100% pure grape juice halal",
          // NO "wine" or "alcohol" in search query ✅
        }
      ]
    }
  ]
}
```

### Assertions
- ✅ Wine (haram) has NO affiliate links
- ✅ Grape juice (substitute) has affiliate links
- ✅ Search queries do NOT contain "wine" or "alcohol"
- ✅ Links are for halal alternatives only

---

## Test Case 3: Questionable Cheese → Warning + Halal-Certified Options

### Scenario
User converts a recipe containing parmesan cheese (questionable due to rennet).

### Input
```javascript
recipeText: "Pasta: 1 cup parmesan cheese, 2 tbsp butter"
```

### Mock Data
```javascript
{
  ingredient: "parmesan_cheese",
  status: "questionable",
  replacement: "halal_parmesan",
  alternatives: ["halal_parmesan", "vegetable_rennet_cheese"],
  affiliateLinks: [
    {
      id: "link_halal_parmesan_amazon_0",
      platform: "amazon",
      search_query: "halal certified parmesan cheese",
      is_featured: true
    }
  ]
}
```

### Expected Output
```javascript
{
  issues: [
    {
      ingredient_id: "parmesan_cheese",
      status: "questionable",
      haram_explanation: "Parmesan cheese traditionally uses rennet from non-halal sources. It is haram unless halal-certified...",
      replacement_id: "halal_parmesan",
      
      substitute_affiliate_links: [
        {
          id: "link_halal_parmesan_amazon_0",
          platform: "amazon",
          search_query: "halal certified parmesan cheese",
          is_featured: true
        }
      ],
      
      substitutes_with_links: [
        {
          id: "halal_parmesan",
          name: "Halal-Certified Parmesan",
          affiliate_links: [...]
        },
        {
          id: "vegetable_rennet_cheese",
          name: "Vegetable Rennet Cheese",
          affiliate_links: [...]
        }
      ]
    }
  ]
}
```

### Assertions
- ✅ Status is "questionable" or "conditional"
- ✅ Explanation contains warning about rennet
- ✅ Explanation mentions "halal-certified" option
- ✅ Substitute is halal-certified parmesan
- ✅ Affiliate links contain "halal certified"
- ✅ Multiple substitutes shown (up to 3)

---

## Test Case 4: Affiliate Disabled → UI Hides Links Gracefully

### Scenario
Affiliate service is unavailable or disabled.

### Input
```javascript
recipeText: "Recipe: bacon"
affiliateService: null // or throws error
```

### Mock Data
```javascript
// Service returns empty object
getAffiliateLinksForSubstitutes.mockResolvedValue({});

// OR service throws error
getAffiliateLinksForSubstitutes.mockRejectedValue(new Error('Service unavailable'));
```

### Expected Output
```javascript
{
  issues: [
    {
      ingredient_id: "bacon",
      replacement_id: "turkey_bacon",
      
      // Empty array, not undefined
      substitute_affiliate_links: [], // ✅ Empty array
      // NOT: substitute_affiliate_links: undefined ❌
    }
  ]
}
```

### UI Behavior
```jsx
// Component should handle gracefully
{issue.substitute_affiliate_links && issue.substitute_affiliate_links.length > 0 ? (
  <AffiliateLinkGroup links={issue.substitute_affiliate_links} />
) : null}
// No error, no broken UI
```

### Assertions
- ✅ Conversion still works without affiliate links
- ✅ `substitute_affiliate_links` is always an array (never undefined)
- ✅ UI components handle empty arrays gracefully
- ✅ No errors thrown when affiliate service fails
- ✅ User can still see substitute information

---

## Additional Test Scenarios

### Scenario 5: Multiple Haram Ingredients

**Input**: `"Breakfast: bacon, ham, wine, eggs"`

**Expected**:
- Each haram ingredient detected separately
- Each has its own substitute with affiliate links
- No affiliate links on haram ingredients themselves

### Scenario 6: Ingredient with No Substitute

**Input**: `"Recipe: unknown_haram_ingredient"`

**Expected**:
- Ingredient detected as haram
- No replacement_id
- No affiliate links
- Clear explanation why no substitute available

### Scenario 7: Maximum 3 Links Limit

**Input**: Ingredient with 5 available affiliate links

**Expected**:
- Only top 3 links shown
- Prioritized by: featured → platform → click count
- No more than 3 links per substitute

### Scenario 8: Region-Aware Routing

**Input**: `"Recipe: bacon"` (US region)

**Expected**:
- Instacart + Amazon links (fresh ingredient in US)
- Links filtered to available platforms
- Maximum 3 platforms

**Input**: `"Recipe: bacon"` (UK region)

**Expected**:
- Amazon only (no Instacart in UK)
- Fallback to Amazon

---

## Mock Data Structures

### Complete Mock Affiliate Link
```javascript
{
  id: "link_agar_agar_amazon_0",
  platform: {
    name: "amazon",
    display_name: "Amazon",
    base_url_template: "https://www.amazon.com/s?k={query}",
    color_hex: "#FF9900"
  },
  search_query: "agar agar halal certified",
  affiliate_tag: "halalkitchen-20",
  is_featured: true,
  click_count: 200,
  conversion_count: 10,
  region_code: "US"
}
```

### Complete Issue Object (with Monetization)
```javascript
{
  ingredient_id: "gelatin",
  ingredient: "gelatin",
  status: "questionable",
  haram_explanation: "Gelatin is typically derived from pork...",
  replacement_id: "agar_agar",
  replacement: "agar_agar",
  replacementRatio: "1 tablespoon gelatin → 2 tablespoons agar agar powder",
  culinaryNotes: ["Agar agar sets at room temperature", ...],
  
  // MONETIZATION
  substitute_affiliate_links: [
    {
      id: "link_agar_agar_amazon_0",
      platform: "amazon",
      platform_display: "Amazon",
      url: "https://www.amazon.com/s?k=agar+agar+halal+certified&tag=halalkitchen-20",
      is_featured: true
    }
  ],
  
  substitutes_with_links: [
    {
      id: "agar_agar",
      name: "Agar Agar",
      affiliate_links: [...]
    }
  ],
  
  // Other fields...
  severity: "high",
  confidenceScore: 15,
  wasReplaced: true
}
```

---

## Test Coverage Checklist

- [x] Pork ingredient → halal substitute → affiliate links
- [x] Alcohol ingredient → substitute → no alcohol links
- [x] Questionable cheese → warning + halal options
- [x] Affiliate disabled → graceful handling
- [x] Multiple haram ingredients
- [x] Ingredient with no substitute
- [x] Maximum 3 links limit
- [x] Region-aware routing
- [x] Featured link prioritization
- [x] Empty affiliate links array
- [x] Affiliate service errors
- [x] UI component rendering
- [x] Click tracking
- [x] Platform filtering

---

## Running Tests

```bash
# Run all monetization tests
npm test affiliateMonetization

# Run specific test file
npm test affiliateRouting

# Run with coverage
npm test -- --coverage
```
