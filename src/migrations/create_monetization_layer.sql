-- Monetization layer: provider-agnostic affiliate_providers + ingredient_substitute_links.
-- No dependency on ingredients table; supports enabling/disabling providers and future direct halal sponsors.

BEGIN;

-- 1. Affiliate providers (retailers + future direct halal brands)
CREATE TABLE IF NOT EXISTS affiliate_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  url_template TEXT NOT NULL,
  color_hex VARCHAR(7),
  product_fit TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 99,
  regions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  affiliate_param_key VARCHAR(50),
  affiliate_param_value VARCHAR(255),
  sponsorship_type VARCHAR(30) DEFAULT 'standard' CHECK (sponsorship_type IN ('standard', 'direct_halal_brand')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_providers_name ON affiliate_providers(name);
CREATE INDEX IF NOT EXISTS idx_affiliate_providers_active ON affiliate_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_providers_sort ON affiliate_providers(sort_order);

COMMENT ON COLUMN affiliate_providers.product_fit IS 'Categories this provider is preferred for: pantry, grocery, specialty';
COMMENT ON COLUMN affiliate_providers.regions IS 'Country codes where provider is available, e.g. {US,CA}';
COMMENT ON COLUMN affiliate_providers.sponsorship_type IS 'standard = retailer; direct_halal_brand = future halal brand partner';

-- 2. Ingredient substitute links (substitute_slug = normalized id, no FK to ingredients)
CREATE TABLE IF NOT EXISTS ingredient_substitute_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  substitute_slug VARCHAR(100) NOT NULL,
  provider_id UUID NOT NULL REFERENCES affiliate_providers(id) ON DELETE CASCADE,
  region_code VARCHAR(10),
  search_query TEXT NOT NULL,
  custom_url TEXT,
  affiliate_param_key VARCHAR(50),
  affiliate_param_value VARCHAR(255),
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(substitute_slug, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_substitute_links_slug ON ingredient_substitute_links(substitute_slug);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitute_links_provider ON ingredient_substitute_links(provider_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitute_links_active ON ingredient_substitute_links(is_active);

COMMENT ON COLUMN ingredient_substitute_links.substitute_slug IS 'Normalized ingredient id e.g. agar_agar, halal_beef_bacon';
COMMENT ON COLUMN ingredient_substitute_links.region_code IS 'NULL = all regions; otherwise e.g. US, CA';

COMMIT;
