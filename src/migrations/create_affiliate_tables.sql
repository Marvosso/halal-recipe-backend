-- Affiliate Monetization Database Schema Migration
-- Run this migration to create all affiliate-related tables

BEGIN;

-- 1. Regions table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_is_active ON regions(is_active);

-- 2. Affiliate Platforms table
CREATE TABLE IF NOT EXISTS affiliate_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  base_url_template TEXT NOT NULL,
  icon_url TEXT,
  color_hex VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platforms_name ON affiliate_platforms(name);
CREATE INDEX IF NOT EXISTS idx_platforms_is_active ON affiliate_platforms(is_active);

-- 3. Sponsored Brands table
CREATE TABLE IF NOT EXISTS sponsored_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  halal_certification_authority VARCHAR(255),
  certification_number VARCHAR(100),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sponsorship_tier VARCHAR(50) DEFAULT 'standard' CHECK (sponsorship_tier IN ('standard', 'premium', 'featured')),
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_name ON sponsored_brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON sponsored_brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_verified ON sponsored_brands(is_verified);

-- 4. Ingredient Substitutes table (if ingredients table exists)
-- Note: Assumes ingredients table already exists
CREATE TABLE IF NOT EXISTS ingredient_substitutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  substitute_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  replacement_ratio VARCHAR(100),
  culinary_notes TEXT[],
  best_for TEXT[],
  flavor_match_score INTEGER DEFAULT 50 CHECK (flavor_match_score >= 0 AND flavor_match_score <= 100),
  texture_match_score INTEGER DEFAULT 50 CHECK (texture_match_score >= 0 AND texture_match_score <= 100),
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ingredient_id, substitute_id)
);

CREATE INDEX IF NOT EXISTS idx_substitutes_ingredient ON ingredient_substitutes(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_substitutes_substitute ON ingredient_substitutes(substitute_id);
CREATE INDEX IF NOT EXISTS idx_substitutes_is_active ON ingredient_substitutes(is_active);
CREATE INDEX IF NOT EXISTS idx_substitutes_display_order ON ingredient_substitutes(display_order);

-- 5. Affiliate Links table
CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  substitute_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES affiliate_platforms(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  sponsored_brand_id UUID REFERENCES sponsored_brands(id) ON DELETE SET NULL,
  
  search_query TEXT NOT NULL,
  custom_url TEXT,
  affiliate_tag VARCHAR(255),
  
  product_name VARCHAR(255),
  product_image_url TEXT,
  price_range VARCHAR(50),
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  UNIQUE(substitute_id, platform_id, region_id, sponsored_brand_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_substitute ON affiliate_links(substitute_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_platform ON affiliate_links(platform_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_region ON affiliate_links(region_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_brand ON affiliate_links(sponsored_brand_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON affiliate_links(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_featured ON affiliate_links(is_featured);

-- 6. Affiliate Link Clicks table (analytics)
CREATE TABLE IF NOT EXISTS affiliate_link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP DEFAULT NOW(),
  converted_at TIMESTAMP,
  conversion_value DECIMAL(10,2),
  commission_amount DECIMAL(10,2)
);

CREATE INDEX IF NOT EXISTS idx_clicks_link ON affiliate_link_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user ON affiliate_link_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON affiliate_link_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_converted ON affiliate_link_clicks(converted_at) WHERE converted_at IS NOT NULL;

-- Insert default regions
INSERT INTO regions (code, name, currency_code) VALUES
('US', 'United States', 'USD'),
('CA', 'Canada', 'CAD'),
('UK', 'United Kingdom', 'GBP'),
('AU', 'Australia', 'AUD'),
('SA', 'Saudi Arabia', 'SAR'),
('AE', 'United Arab Emirates', 'AED')
ON CONFLICT (code) DO NOTHING;

-- Insert default affiliate platforms
INSERT INTO affiliate_platforms (name, display_name, base_url_template, color_hex) VALUES
('amazon', 'Amazon', 'https://www.amazon.com/s?k={query}', '#FF9900'),
('instacart', 'Instacart', 'https://www.instacart.com/store/search?q={query}', '#00A862'),
('thrivemarket', 'Thrive Market', 'https://thrivemarket.com/search?q={query}', '#2E7D32')
ON CONFLICT (name) DO NOTHING;

COMMIT;
