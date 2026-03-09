-- Provider-agnostic affiliate architecture: product_fit, sort_order, regions.
-- Enables enabling/disabling providers and ranking by product fit without code changes.
-- Instacart is not used; preferred: Amazon, Walmart, Target, Thrive Market.

BEGIN;

-- Extend affiliate_platforms for product-fit ranking and region support
ALTER TABLE affiliate_platforms
  ADD COLUMN IF NOT EXISTS product_fit TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 99,
  ADD COLUMN IF NOT EXISTS regions TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS affiliate_param_key VARCHAR(50),
  ADD COLUMN IF NOT EXISTS affiliate_param_value VARCHAR(255);

COMMENT ON COLUMN affiliate_platforms.product_fit IS 'Product-fit categories: pantry, grocery, specialty';
COMMENT ON COLUMN affiliate_platforms.sort_order IS 'Lower = higher priority when multiple providers match';
COMMENT ON COLUMN affiliate_platforms.regions IS 'Country codes where provider is available, e.g. {US}';

-- Ensure Walmart and Target exist; update Amazon/Thrive; do not rely on Instacart
INSERT INTO affiliate_platforms (
  name, display_name, base_url_template, color_hex,
  product_fit, sort_order, regions, is_active,
  affiliate_param_key, affiliate_param_value
) VALUES
  ('amazon', 'Amazon', 'https://www.amazon.com/s?k={query}', '#FF9900',
   ARRAY['pantry','specialty'], 1, ARRAY['US','CA','UK','DE','FR','IT','ES','AU'], true,
   'tag', 'halalkitchen-20'),
  ('walmart', 'Walmart', 'https://www.walmart.com/search?q={query}', '#0071CE',
   ARRAY['grocery'], 2, ARRAY['US'], true,
   NULL, NULL),
  ('target', 'Target', 'https://www.target.com/s?searchTerm={query}', '#CC0000',
   ARRAY['grocery'], 3, ARRAY['US'], true,
   NULL, NULL),
  ('thrivemarket', 'Thrive Market', 'https://thrivemarket.com/search?q={query}', '#2E7D32',
   ARRAY['pantry','specialty'], 4, ARRAY['US'], true,
   NULL, NULL)
ON CONFLICT (name) DO UPDATE SET
  product_fit = EXCLUDED.product_fit,
  sort_order = EXCLUDED.sort_order,
  regions = EXCLUDED.regions,
  affiliate_param_key = COALESCE(EXCLUDED.affiliate_param_key, affiliate_platforms.affiliate_param_key),
  affiliate_param_value = COALESCE(EXCLUDED.affiliate_param_value, affiliate_platforms.affiliate_param_value);

-- Optional: disable Instacart so backend APIs that read from DB do not return it
UPDATE affiliate_platforms SET is_active = false WHERE name = 'instacart';

COMMIT;
