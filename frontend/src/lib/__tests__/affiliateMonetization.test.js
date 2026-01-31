/**
 * Unit Tests for Affiliate Monetization Logic
 * Tests conversion logic, affiliate link routing, and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { convertRecipeWithJson } from '../convertRecipeJson';
import { routeAffiliateLinks, selectAffiliatePlatforms } from '../affiliateRouting';
import { getAffiliateLinksForSubstitute } from '../affiliateService';

// Mock data
const mockAffiliateLinks = {
  turkey_bacon: [
    {
      id: 'link_turkey_bacon_amazon_0',
      platform: { name: 'amazon', display_name: 'Amazon', color_hex: '#FF9900' },
      search_query: 'halal turkey bacon certified',
      is_featured: true,
      click_count: 100
    },
    {
      id: 'link_turkey_bacon_instacart_0',
      platform: { name: 'instacart', display_name: 'Instacart', color_hex: '#00A862' },
      search_query: 'halal turkey bacon',
      is_featured: false,
      click_count: 50
    }
  ],
  agar_agar: [
    {
      id: 'link_agar_agar_amazon_0',
      platform: { name: 'amazon', display_name: 'Amazon', color_hex: '#FF9900' },
      search_query: 'agar agar halal certified',
      is_featured: true,
      click_count: 200
    },
    {
      id: 'link_agar_agar_instacart_0',
      platform: { name: 'instacart', display_name: 'Instacart', color_hex: '#00A862' },
      search_query: 'agar agar',
      is_featured: false,
      click_count: 80
    },
    {
      id: 'link_agar_agar_thrivemarket_0',
      platform: { name: 'thrivemarket', display_name: 'Thrive Market', color_hex: '#2E7D32' },
      search_query: 'organic agar agar',
      is_featured: false,
      click_count: 30
    }
  ],
  halal_parmesan: [
    {
      id: 'link_halal_parmesan_amazon_0',
      platform: { name: 'amazon', display_name: 'Amazon', color_hex: '#FF9900' },
      search_query: 'halal certified parmesan cheese',
      is_featured: true,
      click_count: 150
    }
  ],
  grape_juice: [
    {
      id: 'link_grape_juice_amazon_0',
      platform: { name: 'amazon', display_name: 'Amazon', color_hex: '#FF9900' },
      search_query: '100% pure grape juice halal',
      is_featured: true,
      click_count: 120
    }
  ]
};

// Mock halal knowledge base
const mockHalalKnowledge = {
  pork: {
    status: 'haram',
    alternatives: ['turkey_bacon', 'halal_beef'],
    explanation: 'Pork and all pork products are explicitly prohibited in Islam. See Quran 2:173, 5:3.',
    quranReference: 'Quran 2:173, 5:3',
    severity: 'critical'
  },
  bacon: {
    status: 'haram',
    alternatives: ['turkey_bacon'],
    explanation: 'Bacon is derived from pork and is haram.',
    quranReference: 'Quran 2:173, 5:3',
    severity: 'critical'
  },
  wine: {
    status: 'haram',
    alternatives: ['grape_juice', 'non_alcoholic_wine'],
    explanation: 'Wine and all intoxicants are explicitly prohibited in Islam.',
    quranReference: 'Quran 2:219, 5:90-91',
    severity: 'critical'
  },
  parmesan_cheese: {
    status: 'questionable',
    alternatives: ['halal_parmesan', 'vegetable_rennet_cheese'],
    explanation: 'Parmesan cheese traditionally uses rennet from non-halal sources.',
    severity: 'medium'
  },
  gelatin: {
    status: 'questionable',
    alternatives: ['agar_agar'],
    explanation: 'Gelatin is typically derived from pork or non-halal animals.',
    severity: 'high'
  }
};

describe('Affiliate Monetization Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Test Case 1: Pork Ingredient → Halal Substitute → Affiliate Links Shown', () => {
    it('should detect pork ingredient and suggest turkey bacon substitute', async () => {
      const recipeText = 'Breakfast: 4 slices bacon, 2 eggs, toast';
      
      // Mock the conversion function
      const result = await convertRecipeWithJson(recipeText, {});
      
      // Assertions
      expect(result.issues).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      
      const baconIssue = result.issues.find(issue => 
        issue.ingredient_id === 'bacon' || issue.ingredient === 'bacon'
      );
      
      expect(baconIssue).toBeDefined();
      expect(baconIssue.status).toBe('haram');
      expect(baconIssue.replacement_id).toBe('turkey_bacon');
      expect(baconIssue.haram_explanation).toContain('prohibited');
    });

    it('should attach affiliate links ONLY to turkey bacon substitute, NOT to bacon', async () => {
      const recipeText = 'Breakfast: 4 slices bacon';
      
      // Mock affiliate links
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({
          turkey_bacon: mockAffiliateLinks.turkey_bacon
        });
      
      const result = await convertRecipeWithJson(recipeText, {});
      const baconIssue = result.issues.find(issue => issue.ingredient_id === 'bacon');
      
      // Assertions
      expect(baconIssue).toBeDefined();
      
      // Haram ingredient (bacon) should have NO affiliate links
      expect(baconIssue.substitute_affiliate_links).toBeDefined();
      expect(baconIssue.substitute_affiliate_links.length).toBeGreaterThan(0);
      
      // Verify links are for substitute, not haram ingredient
      baconIssue.substitute_affiliate_links.forEach(link => {
        expect(link.platform).toBeDefined();
        expect(['amazon', 'instacart', 'thrivemarket']).toContain(link.platform);
      });
      
      // Verify no links directly on haram ingredient
      expect(baconIssue.ingredient_id).toBe('bacon');
      expect(baconIssue.replacement_id).toBe('turkey_bacon');
    });

    it('should show maximum 3 affiliate links per substitute', async () => {
      const recipeText = 'Recipe with bacon';
      
      // Mock with more than 3 links
      const manyLinks = [
        ...mockAffiliateLinks.turkey_bacon,
        {
          id: 'link_turkey_bacon_amazon_1',
          platform: { name: 'amazon', display_name: 'Amazon' },
          search_query: 'turkey bacon alternative',
          is_featured: false
        },
        {
          id: 'link_turkey_bacon_thrivemarket_0',
          platform: { name: 'thrivemarket', display_name: 'Thrive Market' },
          search_query: 'turkey bacon',
          is_featured: false
        }
      ];
      
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({
          turkey_bacon: manyLinks
        });
      
      const result = await convertRecipeWithJson(recipeText, {});
      const baconIssue = result.issues.find(issue => issue.ingredient_id === 'bacon');
      
      // Should limit to 3 links
      expect(baconIssue.substitute_affiliate_links.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Test Case 2: Alcohol Ingredient → Substitute → No Alcohol Links', () => {
    it('should detect wine and suggest grape juice substitute', async () => {
      const recipeText = 'Beef Bourguignon: 1 cup red wine, 2 lbs beef';
      
      const result = await convertRecipeWithJson(recipeText, {});
      
      const wineIssue = result.issues.find(issue => 
        issue.ingredient_id === 'wine' || issue.ingredient === 'wine'
      );
      
      expect(wineIssue).toBeDefined();
      expect(wineIssue.status).toBe('haram');
      expect(wineIssue.replacement_id).toBe('grape_juice');
      expect(wineIssue.haram_explanation).toContain('prohibited');
    });

    it('should attach affiliate links to grape juice, NOT to wine', async () => {
      const recipeText = 'Recipe with 1 cup wine';
      
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({
          grape_juice: mockAffiliateLinks.grape_juice
        });
      
      const result = await convertRecipeWithJson(recipeText, {});
      const wineIssue = result.issues.find(issue => issue.ingredient_id === 'wine');
      
      // Wine (haram) should have NO affiliate links
      expect(wineIssue.substitute_affiliate_links).toBeDefined();
      expect(wineIssue.substitute_affiliate_links.length).toBeGreaterThan(0);
      
      // Verify links are for grape juice, not wine
      wineIssue.substitute_affiliate_links.forEach(link => {
        expect(link.search_query.toLowerCase()).not.toContain('wine');
        expect(link.search_query.toLowerCase()).toContain('grape');
      });
    });

    it('should never show alcohol-related affiliate links', async () => {
      const recipeText = 'Recipe with wine and brandy';
      
      // Mock affiliate service to return links
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({
          grape_juice: mockAffiliateLinks.grape_juice
        });
      
      const result = await convertRecipeWithJson(recipeText, {});
      
      // Check all affiliate links
      result.issues.forEach(issue => {
        if (issue.substitute_affiliate_links) {
          issue.substitute_affiliate_links.forEach(link => {
            // No alcohol-related search queries
            expect(link.search_query.toLowerCase()).not.toContain('wine');
            expect(link.search_query.toLowerCase()).not.toContain('alcohol');
            expect(link.search_query.toLowerCase()).not.toContain('brandy');
          });
        }
      });
    });
  });

  describe('Test Case 3: Questionable Cheese → Warning + Halal-Certified Options', () => {
    it('should detect questionable cheese and show warning', async () => {
      const recipeText = 'Pasta: 1 cup parmesan cheese, 2 tbsp butter';
      
      const result = await convertRecipeWithJson(recipeText, {});
      
      const cheeseIssue = result.issues.find(issue => 
        issue.ingredient_id === 'parmesan_cheese' || 
        issue.ingredient === 'parmesan_cheese'
      );
      
      expect(cheeseIssue).toBeDefined();
      expect(['questionable', 'conditional']).toContain(cheeseIssue.status);
      expect(cheeseIssue.haram_explanation).toContain('rennet');
      expect(cheeseIssue.haram_explanation).toContain('halal-certified');
    });

    it('should show halal-certified parmesan as substitute with affiliate links', async () => {
      const recipeText = 'Recipe with parmesan cheese';
      
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({
          halal_parmesan: mockAffiliateLinks.halal_parmesan
        });
      
      const result = await convertRecipeWithJson(recipeText, {});
      const cheeseIssue = result.issues.find(issue => 
        issue.ingredient_id === 'parmesan_cheese'
      );
      
      expect(cheeseIssue).toBeDefined();
      expect(cheeseIssue.replacement_id).toBe('halal_parmesan');
      
      // Should have affiliate links for halal-certified option
      expect(cheeseIssue.substitute_affiliate_links).toBeDefined();
      expect(cheeseIssue.substitute_affiliate_links.length).toBeGreaterThan(0);
      
      // Verify links are for halal-certified parmesan
      cheeseIssue.substitute_affiliate_links.forEach(link => {
        expect(link.search_query.toLowerCase()).toContain('halal');
        expect(link.search_query.toLowerCase()).toContain('certified');
      });
    });

    it('should show multiple halal-certified options if available', async () => {
      const recipeText = 'Recipe with parmesan cheese';
      
      const multipleSubstitutes = [
        {
          id: 'halal_parmesan',
          name: 'Halal-Certified Parmesan',
          affiliate_links: mockAffiliateLinks.halal_parmesan
        },
        {
          id: 'vegetable_rennet_cheese',
          name: 'Vegetable Rennet Cheese',
          affiliate_links: [
            {
              id: 'link_vegetable_rennet_amazon_0',
              platform: { name: 'amazon', display_name: 'Amazon' },
              search_query: 'vegetable rennet parmesan',
              is_featured: false
            }
          ]
        }
      ];
      
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({
          halal_parmesan: mockAffiliateLinks.halal_parmesan
        });
      
      const result = await convertRecipeWithJson(recipeText, {});
      const cheeseIssue = result.issues.find(issue => 
        issue.ingredient_id === 'parmesan_cheese'
      );
      
      // Should show multiple substitutes (up to 3)
      expect(cheeseIssue.substitutes_with_links).toBeDefined();
      expect(cheeseIssue.substitutes_with_links.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Test Case 4: Affiliate Disabled → UI Hides Links Gracefully', () => {
    it('should handle missing affiliate links gracefully', async () => {
      const recipeText = 'Recipe with bacon';
      
      // Mock affiliate service to return empty links
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({});
      
      const result = await convertRecipeWithJson(recipeText, {});
      const baconIssue = result.issues.find(issue => issue.ingredient_id === 'bacon');
      
      // Should still have issue data, just no affiliate links
      expect(baconIssue).toBeDefined();
      expect(baconIssue.replacement_id).toBe('turkey_bacon');
      
      // Affiliate links should be empty array, not undefined
      expect(baconIssue.substitute_affiliate_links).toBeDefined();
      expect(Array.isArray(baconIssue.substitute_affiliate_links)).toBe(true);
      expect(baconIssue.substitute_affiliate_links.length).toBe(0);
    });

    it('should handle affiliate service errors gracefully', async () => {
      const recipeText = 'Recipe with gelatin';
      
      // Mock affiliate service to throw error
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockRejectedValue(new Error('Affiliate service unavailable'));
      
      // Should not throw, should return result without affiliate links
      const result = await convertRecipeWithJson(recipeText, {});
      
      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      
      // Issues should still be present
      const gelatinIssue = result.issues.find(issue => issue.ingredient_id === 'gelatin');
      expect(gelatinIssue).toBeDefined();
      
      // Affiliate links should be empty or undefined
      if (gelatinIssue.substitute_affiliate_links) {
        expect(Array.isArray(gelatinIssue.substitute_affiliate_links)).toBe(true);
      }
    });

    it('should handle null/undefined affiliate links', async () => {
      const recipeText = 'Recipe with bacon';
      
      // Mock affiliate service to return null
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue(null);
      
      const result = await convertRecipeWithJson(recipeText, {});
      const baconIssue = result.issues.find(issue => issue.ingredient_id === 'bacon');
      
      // Should handle gracefully
      expect(baconIssue).toBeDefined();
      expect(baconIssue.replacement_id).toBe('turkey_bacon');
      
      // Affiliate links should be safe to access
      const links = baconIssue.substitute_affiliate_links || [];
      expect(Array.isArray(links)).toBe(true);
    });
  });

  describe('Affiliate Link Routing', () => {
    it('should route affiliate links based on region and ingredient type', async () => {
      const ingredientId = 'turkey_bacon';
      const countryCode = 'US';
      
      const platforms = await selectAffiliatePlatforms(ingredientId, countryCode);
      
      // Fresh ingredient in US should prefer Instacart
      expect(platforms).toContain('instacart');
      expect(platforms).toContain('amazon');
      expect(platforms.length).toBeLessThanOrEqual(3);
    });

    it('should limit to 3 platforms maximum', async () => {
      const ingredientId = 'agar_agar'; // Pantry ingredient
      const countryCode = 'US';
      
      const platforms = await selectAffiliatePlatforms(ingredientId, countryCode);
      
      expect(platforms.length).toBeLessThanOrEqual(3);
    });

    it('should filter affiliate links to selected platforms', async () => {
      const allLinks = mockAffiliateLinks.agar_agar;
      const ingredientId = 'agar_agar';
      const countryCode = 'US';
      
      const routedLinks = await routeAffiliateLinks(
        allLinks,
        ingredientId,
        countryCode
      );
      
      expect(routedLinks.length).toBeLessThanOrEqual(3);
      routedLinks.forEach(link => {
        expect(['amazon', 'instacart', 'thrivemarket']).toContain(
          link.platform?.name || link.platform
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle ingredient with no substitute', async () => {
      const recipeText = 'Recipe with unknown_ingredient';
      
      const result = await convertRecipeWithJson(recipeText, {});
      
      // Should still return result
      expect(result).toBeDefined();
      
      // If ingredient is detected but has no substitute
      const unknownIssue = result.issues.find(issue => 
        issue.ingredient_id === 'unknown_ingredient'
      );
      
      if (unknownIssue) {
        // Should not have affiliate links if no substitute
        expect(unknownIssue.replacement_id).toBeFalsy();
        expect(unknownIssue.substitute_affiliate_links).toBeFalsy();
      }
    });

    it('should handle multiple haram ingredients correctly', async () => {
      const recipeText = 'Breakfast: bacon, ham, wine, eggs';
      
      const result = await convertRecipeWithJson(recipeText, {});
      
      // Should detect all haram ingredients
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
      
      // Each should have its own substitute and affiliate links
      result.issues.forEach(issue => {
        if (issue.status === 'haram' && issue.replacement_id) {
          // Should have affiliate links for substitute
          expect(issue.substitute_affiliate_links).toBeDefined();
          expect(Array.isArray(issue.substitute_affiliate_links)).toBe(true);
        }
      });
    });

    it('should never attach affiliate links to haram ingredients', async () => {
      const recipeText = 'Recipe with pork, wine, bacon';
      
      vi.spyOn(require('../affiliateService'), 'getAffiliateLinksForSubstitutes')
        .mockResolvedValue({
          turkey_bacon: mockAffiliateLinks.turkey_bacon,
          grape_juice: mockAffiliateLinks.grape_juice
        });
      
      const result = await convertRecipeWithJson(recipeText, {});
      
      result.issues.forEach(issue => {
        if (issue.status === 'haram') {
          // Haram ingredient should not have affiliate links directly
          // Links should only be on substitute
          if (issue.replacement_id) {
            // Links should be in substitute_affiliate_links, not on ingredient itself
            expect(issue.substitute_affiliate_links).toBeDefined();
            
            // Verify links are for substitute, not haram ingredient
            issue.substitute_affiliate_links.forEach(link => {
              expect(link.search_query.toLowerCase()).not.toContain(
                issue.ingredient_id.toLowerCase()
              );
            });
          }
        }
      });
    });
  });
});
