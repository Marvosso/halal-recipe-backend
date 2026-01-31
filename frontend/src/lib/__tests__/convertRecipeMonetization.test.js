/**
 * Unit Tests for Recipe Conversion with Monetization
 * Tests that affiliate links are correctly attached to substitutes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertRecipeWithJson } from '../convertRecipeJson';

// Mock affiliate service
vi.mock('../affiliateService', () => ({
  getAffiliateLinksForSubstitutes: vi.fn()
}));

describe('Recipe Conversion with Monetization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pork Ingredient → Halal Substitute → Affiliate Links', () => {
    it('should attach affiliate links to turkey bacon, not bacon', async () => {
      const { getAffiliateLinksForSubstitutes } = await import('../affiliateService');
      
      getAffiliateLinksForSubstitutes.mockResolvedValue({
        turkey_bacon: [
          {
            id: 'link_1',
            platform: { name: 'amazon', display_name: 'Amazon' },
            search_query: 'halal turkey bacon',
            is_featured: true
          }
        ]
      });

      const recipeText = 'Breakfast: 4 slices bacon';
      const result = await convertRecipeWithJson(recipeText, {});

      const baconIssue = result.issues.find(issue => 
        issue.ingredient_id === 'bacon' || issue.ingredient === 'bacon'
      );

      expect(baconIssue).toBeDefined();
      expect(baconIssue.replacement_id).toBe('turkey_bacon');
      
      // Should have affiliate links for substitute
      expect(baconIssue.substitute_affiliate_links).toBeDefined();
      expect(baconIssue.substitute_affiliate_links.length).toBeGreaterThan(0);
      
      // Links should be for turkey bacon, not bacon
      baconIssue.substitute_affiliate_links.forEach(link => {
        expect(link.search_query.toLowerCase()).toContain('turkey');
        expect(link.search_query.toLowerCase()).not.toContain('pork');
      });
    });
  });

  describe('Alcohol Ingredient → Substitute → No Alcohol Links', () => {
    it('should attach affiliate links to grape juice, not wine', async () => {
      const { getAffiliateLinksForSubstitutes } = await import('../affiliateService');
      
      getAffiliateLinksForSubstitutes.mockResolvedValue({
        grape_juice: [
          {
            id: 'link_1',
            platform: { name: 'amazon', display_name: 'Amazon' },
            search_query: '100% pure grape juice halal',
            is_featured: true
          }
        ]
      });

      const recipeText = 'Recipe: 1 cup red wine';
      const result = await convertRecipeWithJson(recipeText, {});

      const wineIssue = result.issues.find(issue => 
        issue.ingredient_id === 'wine' || issue.ingredient === 'wine'
      );

      expect(wineIssue).toBeDefined();
      expect(wineIssue.replacement_id).toBe('grape_juice');
      
      // Should have affiliate links for grape juice
      expect(wineIssue.substitute_affiliate_links).toBeDefined();
      
      // Links should NOT contain wine or alcohol
      wineIssue.substitute_affiliate_links.forEach(link => {
        expect(link.search_query.toLowerCase()).not.toContain('wine');
        expect(link.search_query.toLowerCase()).not.toContain('alcohol');
      });
    });
  });

  describe('Questionable Cheese → Warning + Halal Options', () => {
    it('should show warning and halal-certified options', async () => {
      const { getAffiliateLinksForSubstitutes } = await import('../affiliateService');
      
      getAffiliateLinksForSubstitutes.mockResolvedValue({
        halal_parmesan: [
          {
            id: 'link_1',
            platform: { name: 'amazon', display_name: 'Amazon' },
            search_query: 'halal certified parmesan cheese',
            is_featured: true
          }
        ]
      });

      const recipeText = 'Pasta: 1 cup parmesan cheese';
      const result = await convertRecipeWithJson(recipeText, {});

      const cheeseIssue = result.issues.find(issue => 
        issue.ingredient_id === 'parmesan_cheese'
      );

      expect(cheeseIssue).toBeDefined();
      expect(['questionable', 'conditional']).toContain(cheeseIssue.status);
      
      // Should have warning/explanation
      expect(cheeseIssue.haram_explanation).toBeDefined();
      expect(cheeseIssue.haram_explanation.toLowerCase()).toContain('rennet');
      
      // Should have halal-certified substitute
      expect(cheeseIssue.replacement_id).toBe('halal_parmesan');
      
      // Should have affiliate links for halal option
      expect(cheeseIssue.substitute_affiliate_links).toBeDefined();
      cheeseIssue.substitute_affiliate_links.forEach(link => {
        expect(link.search_query.toLowerCase()).toContain('halal');
        expect(link.search_query.toLowerCase()).toContain('certified');
      });
    });
  });

  describe('Affiliate Disabled → Graceful Handling', () => {
    it('should handle missing affiliate links gracefully', async () => {
      const { getAffiliateLinksForSubstitutes } = await import('../affiliateService');
      
      getAffiliateLinksForSubstitutes.mockResolvedValue({});

      const recipeText = 'Recipe: bacon';
      const result = await convertRecipeWithJson(recipeText, {});

      const baconIssue = result.issues.find(issue => issue.ingredient_id === 'bacon');

      expect(baconIssue).toBeDefined();
      expect(baconIssue.replacement_id).toBe('turkey_bacon');
      
      // Should have empty array, not undefined
      expect(baconIssue.substitute_affiliate_links).toBeDefined();
      expect(Array.isArray(baconIssue.substitute_affiliate_links)).toBe(true);
    });

    it('should handle affiliate service errors gracefully', async () => {
      const { getAffiliateLinksForSubstitutes } = await import('../affiliateService');
      
      getAffiliateLinksForSubstitutes.mockRejectedValue(new Error('Service unavailable'));

      const recipeText = 'Recipe: gelatin';
      const result = await convertRecipeWithJson(recipeText, {});

      // Should still return conversion result
      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      
      // Issues should be present
      const gelatinIssue = result.issues.find(issue => issue.ingredient_id === 'gelatin');
      expect(gelatinIssue).toBeDefined();
    });
  });

  describe('Multiple Substitutes', () => {
    it('should show up to 3 substitutes with affiliate links', async () => {
      const { getAffiliateLinksForSubstitutes } = await import('../affiliateService');
      
      getAffiliateLinksForSubstitutes.mockResolvedValue({
        grape_juice: [
          {
            id: 'link_1',
            platform: { name: 'amazon', display_name: 'Amazon' },
            search_query: 'grape juice',
            is_featured: true
          }
        ],
        non_alcoholic_wine: [
          {
            id: 'link_2',
            platform: { name: 'amazon', display_name: 'Amazon' },
            search_query: 'non alcoholic wine',
            is_featured: false
          }
        ]
      });

      const recipeText = 'Recipe: 1 cup wine';
      const result = await convertRecipeWithJson(recipeText, {});

      const wineIssue = result.issues.find(issue => issue.ingredient_id === 'wine');

      expect(wineIssue.substitutes_with_links).toBeDefined();
      expect(wineIssue.substitutes_with_links.length).toBeLessThanOrEqual(3);
    });
  });
});
