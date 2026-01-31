/**
 * Unit Tests for AffiliateLinkGroup Component
 * Tests UI component behavior with affiliate links
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AffiliateLinkGroup from '../AffiliateLinkGroup';

describe('AffiliateLinkGroup Component', () => {
  const mockAffiliateLinks = [
    {
      id: 'link_1',
      platform: 'amazon',
      platform_display: 'Amazon',
      platform_color: '#FF9900',
      url: 'https://www.amazon.com/s?k=test&tag=halalkitchen-20',
      search_query: 'test ingredient',
      is_featured: true
    },
    {
      id: 'link_2',
      platform: 'instacart',
      platform_display: 'Instacart',
      platform_color: '#00A862',
      url: 'https://www.instacart.com/store/search?q=test',
      search_query: 'test ingredient',
      is_featured: false
    }
  ];

  beforeEach(() => {
    // Mock window.open
    global.window.open = vi.fn();
    
    // Mock Plausible analytics
    global.window.plausible = vi.fn();
  });

  describe('Rendering', () => {
    it('should render affiliate links when provided', () => {
      render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Agar Agar"
        />
      );

      expect(screen.getByText('Find Agar Agar')).toBeInTheDocument();
      expect(screen.getByText('Shop on Amazon')).toBeInTheDocument();
      expect(screen.getByText('Shop on Instacart')).toBeInTheDocument();
    });

    it('should not render when no links provided', () => {
      const { container } = render(
        <AffiliateLinkGroup
          affiliateLinks={[]}
          ingredientName="Test"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should limit to maximum 3 links', () => {
      const manyLinks = [
        ...mockAffiliateLinks,
        {
          id: 'link_3',
          platform: 'thrivemarket',
          platform_display: 'Thrive Market',
          platform_color: '#2E7D32',
          url: 'https://thrivemarket.com/search?q=test',
          search_query: 'test',
          is_featured: false
        },
        {
          id: 'link_4',
          platform: 'amazon',
          platform_display: 'Amazon',
          platform_color: '#FF9900',
          url: 'https://www.amazon.com/s?k=test2',
          search_query: 'test2',
          is_featured: false
        }
      ];

      render(
        <AffiliateLinkGroup
          affiliateLinks={manyLinks}
          ingredientName="Test"
        />
      );

      // Should only show 3 links
      const links = screen.getAllByText(/Shop on/i);
      expect(links.length).toBeLessThanOrEqual(3);
    });

    it('should show disclosure text by default', () => {
      render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Test"
        />
      );

      expect(screen.getByText(/We may earn a small commission/i)).toBeInTheDocument();
    });

    it('should hide disclosure when showDisclosure is false', () => {
      render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Test"
          showDisclosure={false}
        />
      );

      expect(screen.queryByText(/We may earn a small commission/i)).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should open affiliate link in new tab when clicked', () => {
      render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Test"
        />
      );

      const amazonLink = screen.getByText('Shop on Amazon').closest('a');
      fireEvent.click(amazonLink);

      expect(window.open).toHaveBeenCalledWith(
        'https://www.amazon.com/s?k=test&tag=halalkitchen-20',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should track affiliate click with analytics', () => {
      render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Agar Agar"
        />
      );

      const amazonLink = screen.getByText('Shop on Amazon').closest('a');
      fireEvent.click(amazonLink);

      expect(window.plausible).toHaveBeenCalledWith('Affiliate Click', {
        props: expect.objectContaining({
          platform: 'amazon',
          ingredient: 'Agar Agar',
          link_id: 'link_1'
        })
      });
    });

    it('should prioritize featured links', () => {
      render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Test"
        />
      );

      // Featured link should appear first
      const links = screen.getAllByText(/Shop on/i);
      expect(links[0].textContent).toContain('Amazon'); // Featured
    });
  });

  describe('Variant Styles', () => {
    it('should render card variant by default', () => {
      const { container } = render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Test"
        />
      );

      expect(container.querySelector('.affiliate-link-group')).toBeInTheDocument();
      expect(container.querySelector('.affiliate-buttons-grid')).toBeInTheDocument();
    });

    it('should render inline variant when specified', () => {
      const { container } = render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName="Test"
          variant="inline"
        />
      );

      expect(container.querySelector('.affiliate-link-group-inline')).toBeInTheDocument();
      expect(container.querySelector('.affiliate-buttons-inline')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing platform data gracefully', () => {
      const incompleteLinks = [
        {
          id: 'link_1',
          platform: 'amazon',
          url: 'https://amazon.com/test'
        }
      ];

      render(
        <AffiliateLinkGroup
          affiliateLinks={incompleteLinks}
          ingredientName="Test"
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Find Test')).toBeInTheDocument();
    });

    it('should handle null/undefined links gracefully', () => {
      const { container } = render(
        <AffiliateLinkGroup
          affiliateLinks={null}
          ingredientName="Test"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should handle empty ingredient name', () => {
      render(
        <AffiliateLinkGroup
          affiliateLinks={mockAffiliateLinks}
          ingredientName=""
        />
      );

      expect(screen.getByText('Find this ingredient')).toBeInTheDocument();
    });
  });
});
