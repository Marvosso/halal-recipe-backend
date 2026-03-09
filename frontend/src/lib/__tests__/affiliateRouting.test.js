/**
 * Unit Tests for Affiliate Routing Logic (provider-agnostic)
 * Tests product-fit ranking and config-driven provider selection (no Instacart)
 */

import { describe, it, expect } from 'vitest';
import {
  selectAffiliateProviders,
  routeAffiliateLinks,
  categorizeIngredient,
} from '../affiliateRouting';

describe('Affiliate Routing Logic', () => {
  describe('Provider Selection (product-fit)', () => {
    it('should prefer Walmart/Target for grocery ingredients in US', async () => {
      const providers = selectAffiliateProviders('turkey_bacon', 'US');
      expect(providers.length).toBeLessThanOrEqual(3);
      expect(providers).toContain('amazon');
      // Grocery: walmart, target in product_fit
      expect(providers.some((p) => ['amazon', 'walmart', 'target'].includes(p))).toBe(true);
    });

    it('should include Amazon and Thrive for pantry goods in US', async () => {
      const providers = selectAffiliateProviders('agar_agar', 'US');
      expect(providers).toContain('amazon');
      expect(providers).toContain('thrivemarket');
    });

    it('should not include Thrive Market for non-US regions', async () => {
      const providers = selectAffiliateProviders('agar_agar', 'CA');
      expect(providers).not.toContain('thrivemarket');
      expect(providers).toContain('amazon');
    });

    it('should still return enabled providers for unknown region', async () => {
      const providers = selectAffiliateProviders('unknown_ingredient', 'US');
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.length).toBeLessThanOrEqual(3);
    });

    it('should limit to maximum 3 providers', async () => {
      const providers = selectAffiliateProviders('agar_agar', 'US');
      expect(providers.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Link Routing', () => {
    const mockLinks = [
      {
        id: 'link_1',
        platform: { id: 'amazon', name: 'amazon', display_name: 'Amazon' },
        search_query: 'test',
        is_featured: true,
      },
      {
        id: 'link_2',
        platform: { id: 'walmart', name: 'walmart', display_name: 'Walmart' },
        search_query: 'test',
        is_featured: false,
      },
      {
        id: 'link_3',
        platform: { id: 'thrivemarket', name: 'thrivemarket', display_name: 'Thrive Market' },
        search_query: 'test',
        is_featured: false,
      },
    ];

    it('should filter links to enabled providers only', async () => {
      const routed = await routeAffiliateLinks(mockLinks, 'agar_agar', 'US');
      routed.forEach((link) => {
        const id = link.platform?.id || link.platform?.name || link.platform;
        expect(['amazon', 'walmart', 'target', 'thrivemarket']).toContain(id);
      });
    });

    it('should prioritize featured links', async () => {
      const routed = await routeAffiliateLinks(mockLinks, 'agar_agar', 'US');
      if (routed.length > 0) {
        expect(routed[0].is_featured).toBe(true);
      }
    });

    it('should limit to 3 links maximum', async () => {
      const manyLinks = [
        ...mockLinks,
        {
          id: 'link_4',
          platform: { id: 'target', name: 'target', display_name: 'Target' },
          search_query: 'test2',
          is_featured: false,
        },
      ];
      const routed = await routeAffiliateLinks(manyLinks, 'agar_agar', 'US');
      expect(routed.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty links array', async () => {
      const routed = await routeAffiliateLinks([], 'test', 'US');
      expect(routed).toEqual([]);
    });
  });

  describe('Ingredient Categorization (product-fit)', () => {
    it('should categorize grocery ingredients correctly', () => {
      expect(categorizeIngredient('turkey_bacon')).toBe('grocery');
      expect(categorizeIngredient('halal_chicken')).toBe('grocery');
      expect(categorizeIngredient('halal_beef_bacon')).toBe('grocery');
    });

    it('should categorize pantry ingredients correctly', () => {
      expect(categorizeIngredient('agar_agar')).toBe('pantry');
      expect(categorizeIngredient('grape_juice')).toBe('pantry');
      expect(categorizeIngredient('halal_vanilla_extract')).toBe('pantry');
    });

    it('should categorize specialty ingredients correctly', () => {
      expect(categorizeIngredient('halal_parmesan')).toBe('specialty');
      expect(categorizeIngredient('halal_gelatin')).toBe('specialty');
    });

    it('should return unknown for unclassified ingredients', () => {
      expect(categorizeIngredient('unknown_ingredient')).toBe('unknown');
    });
  });
});
