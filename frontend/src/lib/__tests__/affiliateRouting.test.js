/**
 * Unit Tests for Affiliate Routing Logic
 * Tests region-aware platform selection and link routing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  selectAffiliatePlatforms,
  routeAffiliateLinks,
  categorizeIngredient
} from '../affiliateRouting';

describe('Affiliate Routing Logic', () => {
  describe('Platform Selection', () => {
    it('should prefer Instacart for fresh ingredients in US', async () => {
      const platforms = await selectAffiliatePlatforms('turkey_bacon', 'US');
      
      expect(platforms).toContain('instacart');
      expect(platforms).toContain('amazon');
      expect(platforms[0]).toBe('instacart'); // Instacart first for fresh
    });

    it('should include Thrive Market for pantry goods in US', async () => {
      const platforms = await selectAffiliatePlatforms('agar_agar', 'US');
      
      expect(platforms).toContain('amazon');
      expect(platforms).toContain('thrivemarket');
    });

    it('should not include Thrive Market for non-US regions', async () => {
      const platforms = await selectAffiliatePlatforms('agar_agar', 'CA');
      
      expect(platforms).not.toContain('thrivemarket');
      expect(platforms).toContain('amazon');
    });

    it('should fallback to Amazon when Instacart unavailable', async () => {
      const platforms = await selectAffiliatePlatforms('turkey_bacon', 'UK');
      
      expect(platforms).not.toContain('instacart');
      expect(platforms).toContain('amazon');
    });

    it('should limit to maximum 3 platforms', async () => {
      const platforms = await selectAffiliatePlatforms('agar_agar', 'US');
      
      expect(platforms.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Link Routing', () => {
    const mockLinks = [
      {
        id: 'link_1',
        platform: { name: 'amazon', display_name: 'Amazon' },
        search_query: 'test',
        is_featured: true,
        click_count: 100
      },
      {
        id: 'link_2',
        platform: { name: 'instacart', display_name: 'Instacart' },
        search_query: 'test',
        is_featured: false,
        click_count: 50
      },
      {
        id: 'link_3',
        platform: { name: 'thrivemarket', display_name: 'Thrive Market' },
        search_query: 'test',
        is_featured: false,
        click_count: 30
      }
    ];

    it('should filter links to selected platforms', async () => {
      const routed = await routeAffiliateLinks(mockLinks, 'agar_agar', 'US');
      
      // Should only include links from selected platforms
      routed.forEach(link => {
        const platformName = link.platform?.name || link.platform;
        expect(['amazon', 'instacart', 'thrivemarket']).toContain(platformName);
      });
    });

    it('should prioritize featured links', async () => {
      const routed = await routeAffiliateLinks(mockLinks, 'agar_agar', 'US');
      
      // Featured link should be first
      expect(routed[0].is_featured).toBe(true);
    });

    it('should limit to 3 links maximum', async () => {
      const manyLinks = [
        ...mockLinks,
        {
          id: 'link_4',
          platform: { name: 'amazon', display_name: 'Amazon' },
          search_query: 'test2',
          is_featured: false
        }
      ];
      
      const routed = await routeAffiliateLinks(manyLinks, 'agar_agar', 'US');
      
      expect(routed.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty links array', async () => {
      const routed = await routeAffiliateLinks([], 'test', 'US');
      
      expect(routed).toEqual([]);
    });
  });

  describe('Ingredient Categorization', () => {
    it('should categorize fresh ingredients correctly', () => {
      expect(categorizeIngredient('turkey_bacon')).toBe('fresh');
      expect(categorizeIngredient('halal_chicken')).toBe('fresh');
    });

    it('should categorize pantry ingredients correctly', () => {
      expect(categorizeIngredient('agar_agar')).toBe('pantry');
      expect(categorizeIngredient('grape_juice')).toBe('pantry');
      expect(categorizeIngredient('vanilla_extract')).toBe('pantry');
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
