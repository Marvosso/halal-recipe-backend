# Recipe Conversion with Monetization - Examples

## Overview
This document demonstrates how the haram-to-halal recipe conversion logic integrates affiliate monetization, with clear explanations and affiliate links ONLY on substitutes.

## Core Principles

1. **Clear Haram Explanations**: Every haram ingredient gets a clear, religious justification
2. **1-3 Halal Substitutes**: Each haram ingredient suggests 1-3 halal alternatives
3. **Affiliate Links ONLY on Substitutes**: Never attach affiliate links to haram ingredients
4. **Edge Case Handling**: Special logic for alcohol, pork, ambiguous ingredients

---

## Example 1: Gelatin (Questionable → Halal Substitute)

### Input Recipe
```
Jello Recipe:
- 1 cup water
- 1 packet gelatin
- 1/2 cup sugar
- Food coloring
```

### Conversion Output

```json
{
  "originalText": "Jello Recipe:\n- 1 cup water\n- 1 packet gelatin\n- 1/2 cup sugar\n- Food coloring",
  "convertedText": "Jello Recipe:\n- 1 cup water\n- 1 packet agar agar powder\n- 1/2 cup sugar\n- Food coloring",
  "confidenceScore": 85,
  "issues": [
    {
      "ingredient_id": "gelatin",
      "ingredient": "gelatin",
      "haram_explanation": "Gelatin is typically derived from pork or non-halal animals. Most scholars consider it haram unless halal-certified. See Quran 2:173, 5:3.",
      "explanation": "Gelatin is typically derived from pork or non-halal animals. Most scholars consider it haram unless halal-certified. See Quran 2:173, 5:3.",
      "severity": "high",
      "confidenceScore": 15,
      "quranReference": "Quran 2:173, 5:3",
      "replacement_id": "agar_agar",
      "replacement": "agar_agar",
      "replacementRatio": "1 tablespoon gelatin → 2 tablespoons agar agar powder",
      "culinaryNotes": [
        "Agar agar sets at room temperature",
        "Use 2x the amount of gelatin",
        "Works best for jellies and desserts"
      ],
      "wasReplaced": true,
      
      // MONETIZATION: Affiliate links ONLY on the substitute
      "substitute_affiliate_links": [
        {
          "id": "link_agar_agar_amazon_0",
          "platform": "amazon",
          "platform_display": "Amazon",
          "platform_color": "#FF9900",
          "url": "https://www.amazon.com/s?k=agar+agar+halal+certified&tag=halalkitchen-20",
          "search_query": "agar agar halal certified",
          "is_featured": true
        },
        {
          "id": "link_agar_agar_instacart_0",
          "platform": "instacart",
          "platform_display": "Instacart",
          "platform_color": "#00A862",
          "url": "https://www.instacart.com/store/search?q=agar+agar",
          "search_query": "agar agar",
          "is_featured": false
        },
        {
          "id": "link_agar_agar_thrivemarket_0",
          "platform": "thrivemarket",
          "platform_display": "Thrive Market",
          "platform_color": "#2E7D32",
          "url": "https://thrivemarket.com/search?q=organic+agar+agar",
          "search_query": "organic agar agar",
          "is_featured": false
        }
      ],
      
      // Additional substitutes with links (1-3 total)
      "substitutes_with_links": [
        {
          "id": "agar_agar",
          "name": "Agar Agar",
          "affiliate_links": [
            {
              "id": "link_agar_agar_amazon_0",
              "platform": "amazon",
              "platform_display": "Amazon",
              "platform_color": "#FF9900",
              "url": "https://www.amazon.com/s?k=agar+agar+halal+certified&tag=halalkitchen-20",
              "search_query": "agar agar halal certified",
              "is_featured": true
            }
          ]
        }
      ],
      
      // NEVER include affiliate links for the haram ingredient itself
      // "gelatin" has NO affiliate_links field
    }
  ]
}
```

### UI Display Logic
1. **Haram Ingredient Card**: Shows "Gelatin" with clear explanation why it's haram
2. **Substitute Card**: Shows "Agar Agar" with affiliate links (Amazon, Instacart, Thrive Market)
3. **No Links on Haram**: The "Gelatin" card has NO affiliate links

---

## Example 2: Wine (Haram → Multiple Substitutes)

### Input Recipe
```
Beef Bourguignon:
- 2 lbs beef
- 1 cup red wine
- 1 onion
- 2 carrots
```

### Conversion Output

```json
{
  "originalText": "Beef Bourguignon:\n- 2 lbs beef\n- 1 cup red wine\n- 1 onion\n- 2 carrots",
  "convertedText": "Beef Bourguignon:\n- 2 lbs beef\n- 1 cup grape juice + 1/4 cup vinegar\n- 1 onion\n- 2 carrots",
  "confidenceScore": 90,
  "issues": [
    {
      "ingredient_id": "wine",
      "ingredient": "wine",
      "haram_explanation": "Wine and all intoxicants are explicitly prohibited in Islam. See Quran 2:219, 5:90-91. The Prophet (peace be upon him) said: 'Every intoxicant is khamr (wine) and every khamr is haram.'",
      "explanation": "Wine and all intoxicants are explicitly prohibited in Islam. See Quran 2:219, 5:90-91.",
      "severity": "critical",
      "confidenceScore": 0,
      "quranReference": "Quran 2:219, 5:90-91",
      "hadithReference": "Sahih Muslim 2003",
      "replacement_id": "grape_juice",
      "replacement": "grape_juice",
      "replacementRatio": "1 cup wine → ¾ cup grape juice + ¼ cup vinegar",
      "culinaryNotes": [
        "The combination of grape juice and vinegar mimics wine's acidity and fruity notes",
        "Best for cooking applications like sauces and marinades",
        "Adjust vinegar amount based on desired acidity"
      ],
      "wasReplaced": true,
      
      // Affiliate links for grape juice substitute
      "substitute_affiliate_links": [
        {
          "id": "link_grape_juice_amazon_0",
          "platform": "amazon",
          "platform_display": "Amazon",
          "platform_color": "#FF9900",
          "url": "https://www.amazon.com/s?k=100%25+pure+grape+juice+halal&tag=halalkitchen-20",
          "search_query": "100% pure grape juice halal",
          "is_featured": true
        },
        {
          "id": "link_grape_juice_instacart_0",
          "platform": "instacart",
          "platform_display": "Instacart",
          "platform_color": "#00A862",
          "url": "https://www.instacart.com/store/search?q=pure+grape+juice",
          "search_query": "pure grape juice",
          "is_featured": false
        }
      ],
      
      // Multiple substitutes (1-3)
      "substitutes_with_links": [
        {
          "id": "grape_juice",
          "name": "Grape Juice",
          "affiliate_links": [
            {
              "id": "link_grape_juice_amazon_0",
              "platform": "amazon",
              "platform_display": "Amazon",
              "url": "https://www.amazon.com/s?k=100%25+pure+grape+juice+halal&tag=halalkitchen-20",
              "is_featured": true
            }
          ]
        },
        {
          "id": "non_alcoholic_wine",
          "name": "Non-Alcoholic Wine",
          "affiliate_links": [
            {
              "id": "link_non_alcoholic_wine_amazon_0",
              "platform": "amazon",
              "platform_display": "Amazon",
              "url": "https://www.amazon.com/s?k=halal+non+alcoholic+wine&tag=halalkitchen-20",
              "is_featured": false
            }
          ]
        }
      ]
    }
  ]
}
```

### Key Points
- **Wine** (haram) has NO affiliate links
- **Grape Juice** (substitute) has affiliate links
- **Non-Alcoholic Wine** (alternative) has affiliate links
- Clear explanation with Quran and Hadith references

---

## Example 3: Pork/Bacon (Critical Haram)

### Input Recipe
```
Breakfast:
- 4 slices bacon
- 2 eggs
- Toast
```

### Conversion Output

```json
{
  "originalText": "Breakfast:\n- 4 slices bacon\n- 2 eggs\n- Toast",
  "convertedText": "Breakfast:\n- 4 slices turkey bacon\n- 2 eggs\n- Toast",
  "confidenceScore": 95,
  "issues": [
    {
      "ingredient_id": "bacon",
      "ingredient": "bacon",
      "haram_explanation": "Pork and all pork products are explicitly prohibited in Islam. This is one of the most clearly stated prohibitions in the Quran. See Quran 2:173, 5:3, 6:145, 16:115. The Prophet (peace be upon him) said: 'Allah has forbidden the eating of dead animals, blood, the flesh of swine...'",
      "explanation": "Pork and all pork products are explicitly prohibited in Islam. See Quran 2:173, 5:3, 6:145, 16:115.",
      "severity": "critical",
      "confidenceScore": 0,
      "quranReference": "Quran 2:173, 5:3, 6:145, 16:115",
      "hadithReference": "Sahih Bukhari 5496",
      "replacement_id": "turkey_bacon",
      "replacement": "turkey_bacon",
      "replacementRatio": "1:1",
      "culinaryNotes": [
        "Turkey bacon has lower fat content than pork bacon",
        "Cook at slightly lower temperature to prevent burning",
        "May need slightly longer cooking time"
      ],
      "wasReplaced": true,
      
      // Affiliate links ONLY on turkey bacon (substitute)
      "substitute_affiliate_links": [
        {
          "id": "link_turkey_bacon_amazon_0",
          "platform": "amazon",
          "platform_display": "Amazon",
          "platform_color": "#FF9900",
          "url": "https://www.amazon.com/s?k=halal+turkey+bacon+certified&tag=halalkitchen-20",
          "search_query": "halal turkey bacon certified",
          "is_featured": true
        },
        {
          "id": "link_turkey_bacon_instacart_0",
          "platform": "instacart",
          "platform_display": "Instacart",
          "platform_color": "#00A862",
          "url": "https://www.instacart.com/store/search?q=halal+turkey+bacon",
          "search_query": "halal turkey bacon",
          "is_featured": false
        }
      ],
      
      // NO affiliate links on "bacon" (haram ingredient)
    }
  ]
}
```

### Key Points
- **Bacon** (pork, critical haram) has NO affiliate links
- **Turkey Bacon** (halal substitute) has affiliate links
- Strongest possible explanation with multiple Quran references

---

## Example 4: Ambiguous Cheese (Conditional)

### Input Recipe
```
Pasta:
- 1 lb pasta
- 1 cup parmesan cheese
- 2 tbsp butter
```

### Conversion Output

```json
{
  "originalText": "Pasta:\n- 1 lb pasta\n- 1 cup parmesan cheese\n- 2 tbsp butter",
  "convertedText": "Pasta:\n- 1 lb pasta\n- 1 cup halal-certified parmesan cheese\n- 2 tbsp butter",
  "confidenceScore": 70,
  "issues": [
    {
      "ingredient_id": "parmesan_cheese",
      "ingredient": "parmesan_cheese",
      "haram_explanation": "Parmesan cheese traditionally uses rennet from non-halal sources. It is haram unless halal-certified or made with microbial/vegetable rennet. Always check for halal certification.",
      "explanation": "Parmesan cheese traditionally uses rennet from non-halal sources. It is haram unless halal-certified.",
      "severity": "medium",
      "confidenceScore": 30,
      "quranReference": "",
      "replacement_id": "halal_parmesan_cheese",
      "replacement": "halal_parmesan_cheese",
      "replacementRatio": "1:1",
      "culinaryNotes": [
        "Look for halal-certified parmesan or cheese made with microbial rennet",
        "Flavor and texture should be identical to traditional parmesan",
        "Check ingredient label for rennet source"
      ],
      "wasReplaced": true,
      
      // Affiliate links for halal-certified parmesan
      "substitute_affiliate_links": [
        {
          "id": "link_halal_parmesan_amazon_0",
          "platform": "amazon",
          "platform_display": "Amazon",
          "platform_color": "#FF9900",
          "url": "https://www.amazon.com/s?k=halal+certified+parmesan+cheese&tag=halalkitchen-20",
          "search_query": "halal certified parmesan cheese",
          "is_featured": true
        },
        {
          "id": "link_halal_parmesan_instacart_0",
          "platform": "instacart",
          "platform_display": "Instacart",
          "platform_color": "#00A862",
          "url": "https://www.instacart.com/store/search?q=halal+parmesan",
          "search_query": "halal parmesan",
          "is_featured": false
        }
      ],
      
      // Multiple halal cheese options
      "substitutes_with_links": [
        {
          "id": "halal_parmesan_cheese",
          "name": "Halal-Certified Parmesan",
          "affiliate_links": [
            {
              "id": "link_halal_parmesan_amazon_0",
              "platform": "amazon",
              "url": "https://www.amazon.com/s?k=halal+certified+parmesan+cheese&tag=halalkitchen-20",
              "is_featured": true
            }
          ]
        },
        {
          "id": "vegetable_rennet_cheese",
          "name": "Vegetable Rennet Cheese",
          "affiliate_links": [
            {
              "id": "link_vegetable_rennet_amazon_0",
              "platform": "amazon",
              "url": "https://www.amazon.com/s?k=vegetable+rennet+parmesan&tag=halalkitchen-20",
              "is_featured": false
            }
          ]
        }
      ]
    }
  ]
}
```

### Key Points
- **Parmesan Cheese** (conditional/ambiguous) has NO affiliate links
- **Halal-Certified Parmesan** (substitute) has affiliate links
- Explanation emphasizes checking for halal certification

---

## Edge Cases

### Edge Case 1: Alcohol in Multiple Forms

**Input**: "1 cup wine, 2 tbsp brandy, 1 tsp vanilla extract"

**Handling**:
- **Wine**: Haram → Grape juice + vinegar (with affiliate links)
- **Brandy**: Haram → Non-alcoholic brandy extract (with affiliate links)
- **Vanilla Extract**: Conditional → Alcohol-free vanilla extract (with affiliate links)

**Key**: Each alcohol form gets its own substitute with affiliate links. The haram ingredients (wine, brandy) have NO affiliate links.

### Edge Case 2: Pork in Multiple Forms

**Input**: "bacon, ham, pork chops, sausage"

**Handling**:
- **Bacon**: Haram → Turkey bacon (with affiliate links)
- **Ham**: Haram → Turkey ham (with affiliate links)
- **Pork Chops**: Haram → Halal beef/lamb chops (with affiliate links)
- **Sausage**: Haram → Halal beef/turkey sausage (with affiliate links)

**Key**: Each pork product gets appropriate halal substitute with affiliate links. Pork products have NO affiliate links.

### Edge Case 3: Ambiguous Cheese (No Clear Substitute)

**Input**: "1 cup blue cheese"

**Handling**:
- **Blue Cheese**: Conditional → "Halal-certified blue cheese or alternative"
- If no clear substitute exists, show explanation: "Blue cheese typically uses non-halal rennet. Look for halal-certified options or consider [alternative cheese]."
- Only show affiliate links if halal-certified option exists

**Key**: If substitute is unclear, prioritize explanation over affiliate links.

### Edge Case 4: Multiple Substitutes (1-3 Limit)

**Input**: "1 cup wine"

**Handling**:
- Primary: Grape juice + vinegar (with affiliate links)
- Alternative 1: Non-alcoholic wine (with affiliate links)
- Alternative 2: Apple juice + vinegar (with affiliate links)
- **Limit**: Maximum 3 substitutes shown, prioritized by:
  1. Featured affiliate links
  2. Best flavor match
  3. Availability

---

## Conversion Logic Summary

### Step 1: Detect Haram Ingredients
- Scan recipe text for haram/conditional ingredients
- Evaluate using knowledge engine with user preferences

### Step 2: Convert Ingredients
- Replace haram ingredients with halal substitutes in text
- Track successful replacements

### Step 3: Fetch Affiliate Links (Monetization)
- **ONLY** fetch links for substitutes (not haram ingredients)
- Limit to 1-3 links per substitute
- Prioritize featured links

### Step 4: Build Issues with Explanations
- Clear haram explanation for each detected ingredient
- Attach affiliate links to substitutes only
- Include 1-3 substitute options with links

### Step 5: Calculate Confidence Score
- Based on replacements and unresolved ingredients

---

## UI Display Rules

1. **Haram Ingredient Card**:
   - Show ingredient name (e.g., "Gelatin")
   - Show clear explanation why it's haram
   - Show Quran/Hadith references
   - **NO affiliate links**

2. **Substitute Card**:
   - Show substitute name (e.g., "Agar Agar")
   - Show replacement ratio
   - Show culinary notes
   - **Show affiliate links** (Amazon, Instacart, Thrive Market)

3. **Multiple Substitutes**:
   - Show up to 3 substitutes
   - Each with its own affiliate links
   - Prioritize featured links

4. **Edge Cases**:
   - If no substitute: Show explanation only, no affiliate links
   - If ambiguous: Show explanation with conditional guidance
   - If multiple forms: Handle each separately

---

## Implementation Checklist

- [x] Convert function to async
- [x] Add affiliate link fetching for substitutes
- [x] Build clear haram explanations
- [x] Limit to 1-3 substitutes per ingredient
- [x] Never attach affiliate links to haram ingredients
- [x] Handle alcohol edge cases
- [x] Handle pork edge cases
- [x] Handle ambiguous cheese edge cases
- [ ] Update UI to display affiliate links on substitutes
- [ ] Add click tracking for affiliate links
- [ ] Test with real recipes
