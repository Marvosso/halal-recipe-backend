# Region-Aware Affiliate Link Routing

## Overview
Intelligent routing of affiliate links based on user location and ingredient type, prioritizing local delivery when available.

## Decision Logic

### Platform Selection Rules

```
IF ingredient_type == 'fresh' THEN
  IF instacart_available THEN
    platforms = [instacart, amazon]
  ELSE
    platforms = [amazon]
  END IF

ELSE IF ingredient_type == 'pantry' THEN
  IF instacart_available THEN
    platforms = [instacart, amazon]
  END IF
  IF country == 'US' THEN
    platforms += [thrivemarket]
  END IF
  IF amazon_available THEN
    platforms += [amazon]
  END IF

ELSE IF ingredient_type == 'specialty' THEN
  platforms = [amazon]
  IF instacart_available THEN
    platforms += [instacart]
  END IF

ELSE
  platforms = [amazon]
  IF instacart_available THEN
    platforms += [instacart]
  END IF
END IF

RETURN platforms.slice(0, 3) // Max 3 platforms
```

## Pseudocode

### Main Routing Function

```pseudocode
FUNCTION routeAffiliateLinks(affiliateLinks, ingredientId, countryCode, zipCode):
  // Step 1: Categorize ingredient
  ingredientType = categorizeIngredient(ingredientId)
  
  // Step 2: Check platform availability
  instacartAvailable = isInstacartAvailable(countryCode, zipCode)
  amazonAvailable = isAmazonAvailable(countryCode)
  thriveAvailable = isThriveMarketAvailable(countryCode)
  
  // Step 3: Select platforms based on rules
  preferredPlatforms = []
  
  IF ingredientType == 'fresh':
    IF instacartAvailable:
      preferredPlatforms.append('instacart')
    IF amazonAvailable:
      preferredPlatforms.append('amazon')
  
  ELSE IF ingredientType == 'pantry':
    IF instacartAvailable:
      preferredPlatforms.append('instacart')
    IF amazonAvailable:
      preferredPlatforms.append('amazon')
    IF thriveAvailable:
      preferredPlatforms.append('thrivemarket')
  
  ELSE:
    IF amazonAvailable:
      preferredPlatforms.append('amazon')
    IF instacartAvailable:
      preferredPlatforms.append('instacart')
  
  // Step 4: Filter links to preferred platforms
  filteredLinks = affiliateLinks.filter(link => 
    preferredPlatforms.contains(link.platform)
  )
  
  // Step 5: Sort by priority
  sortedLinks = filteredLinks.sort((a, b) => {
    // Featured first
    IF a.is_featured AND NOT b.is_featured:
      RETURN -1
    IF NOT a.is_featured AND b.is_featured:
      RETURN 1
    
    // Platform priority
    priorityA = preferredPlatforms.indexOf(a.platform)
    priorityB = preferredPlatforms.indexOf(b.platform)
    IF priorityA != priorityB:
      RETURN priorityA - priorityB
    
    // Click count
    RETURN b.click_count - a.click_count
  })
  
  // Step 6: Return max 3 links
  RETURN sortedLinks.slice(0, 3)
END FUNCTION
```

### Region Detection

```pseudocode
FUNCTION detectUserRegion():
  // Priority 1: User preferences (localStorage)
  userRegion = localStorage.getItem('userRegion')
  IF userRegion:
    RETURN parseJSON(userRegion)
  
  // Priority 2: Geolocation API
  TRY:
    position = getGeolocation()
    countryCode = reverseGeocode(position)
    IF countryCode:
      RETURN {countryCode, zipCode: null}
  CATCH:
    // Continue to next method
  
  // Priority 3: Browser locale
  locale = navigator.language
  countryCode = extractCountryCode(locale)
  IF countryCode:
    RETURN {countryCode, zipCode: null}
  
  // Priority 4: Default to US
  RETURN {countryCode: 'US', zipCode: null}
END FUNCTION
```

### Ingredient Categorization

```pseudocode
FUNCTION categorizeIngredient(ingredientId):
  ingredient = ingredientId.toLowerCase()
  
  freshIngredients = [
    'turkey_bacon', 'halal_beef', 'halal_chicken', 
    'fresh_herbs', 'vegetables', 'fruits', 'dairy'
  ]
  
  pantryIngredients = [
    'agar_agar', 'grape_juice', 'vanilla_extract',
    'spices', 'flour', 'sugar', 'oil', 'vinegar'
  ]
  
  specialtyIngredients = [
    'halal_gelatin', 'halal_cheese', 'halal_parmesan'
  ]
  
  IF ingredient.containsAny(freshIngredients):
    RETURN 'fresh'
  
  IF ingredient.containsAny(pantryIngredients):
    RETURN 'pantry'
  
  IF ingredient.containsAny(specialtyIngredients):
    RETURN 'specialty'
  
  RETURN 'unknown'
END FUNCTION
```

## Example Outputs

### Example 1: Fresh Ingredient (US - Instacart Available)

**Input:**
- Ingredient: `turkey_bacon`
- Region: `US` (zip: `10001`)
- Available Links: Amazon, Instacart, Thrive Market

**Processing:**
1. Categorize: `turkey_bacon` → `fresh`
2. Check platforms: Instacart ✅, Amazon ✅, Thrive ❌ (fresh, not pantry)
3. Select: `[instacart, amazon]`
4. Filter & Sort: Featured Instacart first, then Amazon

**Output:**
```json
[
  {
    "id": "link_turkey_bacon_instacart_0",
    "platform": "instacart",
    "platform_display": "Instacart",
    "url": "https://www.instacart.com/store/search?q=halal+turkey+bacon",
    "is_featured": true
  },
  {
    "id": "link_turkey_bacon_amazon_0",
    "platform": "amazon",
    "platform_display": "Amazon",
    "url": "https://www.amazon.com/s?k=halal+turkey+bacon&tag=halalkitchen-20",
    "is_featured": false
  }
]
```

**Reasoning**: Fresh ingredients benefit from local delivery (Instacart), with Amazon as fallback.

---

### Example 2: Pantry Ingredient (US - All Platforms Available)

**Input:**
- Ingredient: `agar_agar`
- Region: `US` (zip: `90210`)
- Available Links: Amazon, Instacart, Thrive Market

**Processing:**
1. Categorize: `agar_agar` → `pantry`
2. Check platforms: Instacart ✅, Amazon ✅, Thrive ✅ (US + pantry)
3. Select: `[instacart, amazon, thrivemarket]`
4. Filter & Sort: Featured Amazon first, then Instacart, then Thrive

**Output:**
```json
[
  {
    "id": "link_agar_agar_amazon_0",
    "platform": "amazon",
    "platform_display": "Amazon",
    "url": "https://www.amazon.com/s?k=agar+agar+halal+certified&tag=halalkitchen-20",
    "is_featured": true
  },
  {
    "id": "link_agar_agar_instacart_0",
    "platform": "instacart",
    "platform_display": "Instacart",
    "url": "https://www.instacart.com/store/search?q=agar+agar",
    "is_featured": false
  },
  {
    "id": "link_agar_agar_thrivemarket_0",
    "platform": "thrivemarket",
    "platform_display": "Thrive Market",
    "url": "https://thrivemarket.com/search?q=organic+agar+agar",
    "is_featured": false
  }
]
```

**Reasoning**: Pantry goods can ship, so show all options. Thrive Market only for US.

---

### Example 3: Pantry Ingredient (Canada - No Thrive Market)

**Input:**
- Ingredient: `grape_juice`
- Region: `CA` (zip: `M5H 2N2`)
- Available Links: Amazon, Instacart, Thrive Market

**Processing:**
1. Categorize: `grape_juice` → `pantry`
2. Check platforms: Instacart ✅, Amazon ✅, Thrive ❌ (not US)
3. Select: `[instacart, amazon]`
4. Filter & Sort: Featured Amazon first, then Instacart

**Output:**
```json
[
  {
    "id": "link_grape_juice_amazon_0",
    "platform": "amazon",
    "platform_display": "Amazon",
    "url": "https://www.amazon.ca/s?k=100%25+pure+grape+juice+halal&tag=halalkitchen-ca",
    "is_featured": true
  },
  {
    "id": "link_grape_juice_instacart_0",
    "platform": "instacart",
    "platform_display": "Instacart",
    "url": "https://www.instacart.com/store/search?q=pure+grape+juice",
    "is_featured": false
  }
]
```

**Reasoning**: Canada has Instacart and Amazon, but not Thrive Market.

---

### Example 4: Fresh Ingredient (UK - No Instacart)

**Input:**
- Ingredient: `halal_chicken`
- Region: `UK`
- Available Links: Amazon, Instacart, Thrive Market

**Processing:**
1. Categorize: `halal_chicken` → `fresh`
2. Check platforms: Instacart ❌ (not available in UK), Amazon ✅, Thrive ❌
3. Select: `[amazon]`
4. Filter & Sort: Amazon only

**Output:**
```json
[
  {
    "id": "link_halal_chicken_amazon_0",
    "platform": "amazon",
    "platform_display": "Amazon",
    "url": "https://www.amazon.co.uk/s?k=halal+chicken+certified&tag=halalkitchen-uk",
    "is_featured": true
  }
]
```

**Reasoning**: UK doesn't have Instacart, so fall back to Amazon.

---

### Example 5: Specialty Ingredient (Saudi Arabia - Amazon Only)

**Input:**
- Ingredient: `halal_parmesan_cheese`
- Region: `SA`
- Available Links: Amazon, Instacart, Thrive Market

**Processing:**
1. Categorize: `halal_parmesan_cheese` → `specialty`
2. Check platforms: Instacart ❌, Amazon ✅, Thrive ❌
3. Select: `[amazon]`
4. Filter & Sort: Amazon only

**Output:**
```json
[
  {
    "id": "link_halal_parmesan_amazon_0",
    "platform": "amazon",
    "platform_display": "Amazon",
    "url": "https://www.amazon.sa/s?k=halal+certified+parmesan+cheese&tag=halalkitchen-sa",
    "is_featured": true
  }
]
```

**Reasoning**: Saudi Arabia only has Amazon available.

---

### Example 6: Unknown Ingredient (US - Default Behavior)

**Input:**
- Ingredient: `unknown_ingredient`
- Region: `US`
- Available Links: Amazon, Instacart, Thrive Market

**Processing:**
1. Categorize: `unknown_ingredient` → `unknown`
2. Check platforms: Instacart ✅, Amazon ✅, Thrive ✅
3. Select: `[amazon, instacart]` (default behavior)
4. Filter & Sort: Featured Amazon first, then Instacart

**Output:**
```json
[
  {
    "id": "link_unknown_amazon_0",
    "platform": "amazon",
    "platform_display": "Amazon",
    "url": "https://www.amazon.com/s?k=unknown+ingredient+halal&tag=halalkitchen-20",
    "is_featured": true
  },
  {
    "id": "link_unknown_instacart_0",
    "platform": "instacart",
    "platform_display": "Instacart",
    "url": "https://www.instacart.com/store/search?q=unknown+ingredient",
    "is_featured": false
  }
]
```

**Reasoning**: Unknown ingredients default to Amazon + Instacart (if available).

---

## Platform Availability Matrix

| Country | Amazon | Instacart | Thrive Market |
|---------|--------|-----------|---------------|
| US      | ✅     | ✅        | ✅            |
| CA      | ✅     | ✅        | ❌            |
| UK      | ✅     | ❌        | ❌            |
| AU      | ✅     | ❌        | ❌            |
| SA      | ✅     | ❌        | ❌            |
| AE      | ✅     | ❌        | ❌            |
| MY      | ✅     | ❌        | ❌            |
| ID      | ✅     | ❌        | ❌            |

---

## Ingredient Type Matrix

| Type      | Examples                          | Instacart | Amazon | Thrive |
|-----------|-----------------------------------|-----------|--------|--------|
| Fresh     | Turkey bacon, halal chicken       | ✅ Prefer | ✅     | ❌     |
| Pantry    | Agar agar, grape juice, spices   | ✅        | ✅     | ✅ US  |
| Specialty | Halal cheese, halal gelatin       | ✅        | ✅     | ❌     |
| Unknown   | Unclassified ingredients         | ✅        | ✅     | ❌     |

---

## Implementation Files

### Core Logic
- `frontend/src/lib/regionDetection.js` - Region detection and platform availability
- `frontend/src/lib/affiliateRouting.js` - Routing decision logic
- `frontend/src/lib/affiliateService.js` - Updated to use routing

### Usage
```javascript
import { autoRouteAffiliateLinks } from './lib/affiliateRouting';

// Auto-detect region and route links
const routedLinks = await autoRouteAffiliateLinks(affiliateLinks, ingredientId);
```

---

## Testing Scenarios

1. **US User, Fresh Ingredient** → Instacart + Amazon
2. **US User, Pantry Ingredient** → Instacart + Amazon + Thrive
3. **CA User, Pantry Ingredient** → Instacart + Amazon (no Thrive)
4. **UK User, Fresh Ingredient** → Amazon only (no Instacart)
5. **SA User, Any Ingredient** → Amazon only
6. **Unknown Region** → Default to US behavior

---

## Future Enhancements

1. **Zip Code Validation**: Check Instacart coverage by zip code
2. **User Preferences**: Allow manual platform selection
3. **A/B Testing**: Test different platform combinations
4. **Performance Metrics**: Track conversion rates by platform/region
5. **Dynamic Availability**: Real-time platform availability checks
