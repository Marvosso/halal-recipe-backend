-- Seed data for monetization layer: affiliate_providers + ingredient_substitute_links.
-- Run after create_monetization_layer.sql.

BEGIN;

-- Ensure uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Affiliate providers (enable/disable via is_active; priority via sort_order and product_fit)
INSERT INTO affiliate_providers (
  name, display_name, url_template, color_hex,
  product_fit, sort_order, regions, is_active,
  affiliate_param_key, affiliate_param_value, sponsorship_type
) VALUES
  ('amazon', 'Amazon', 'https://www.amazon.com/s?k={query}', '#FF9900',
   ARRAY['pantry', 'specialty'], 1, ARRAY['US', 'CA', 'UK', 'DE', 'FR', 'IT', 'ES', 'AU'], true,
   'tag', 'halalkitchen-20', 'standard'),
  ('walmart', 'Walmart', 'https://www.walmart.com/search?q={query}', '#0071CE',
   ARRAY['grocery'], 2, ARRAY['US'], true,
   NULL, NULL, 'standard'),
  ('target', 'Target', 'https://www.target.com/s?searchTerm={query}', '#CC0000',
   ARRAY['grocery'], 3, ARRAY['US'], true,
   NULL, NULL, 'standard'),
  ('thrivemarket', 'Thrive Market', 'https://thrivemarket.com/search?q={query}', '#2E7D32',
   ARRAY['pantry', 'specialty'], 4, ARRAY['US'], true,
   NULL, NULL, 'standard')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  url_template = EXCLUDED.url_template,
  color_hex = EXCLUDED.color_hex,
  product_fit = EXCLUDED.product_fit,
  sort_order = EXCLUDED.sort_order,
  regions = EXCLUDED.regions,
  is_active = EXCLUDED.is_active,
  affiliate_param_key = EXCLUDED.affiliate_param_key,
  affiliate_param_value = EXCLUDED.affiliate_param_value,
  sponsorship_type = EXCLUDED.sponsorship_type,
  updated_at = NOW();

-- Placeholder for future direct halal brand (disabled by default)
INSERT INTO affiliate_providers (
  name, display_name, url_template, color_hex,
  product_fit, sort_order, regions, is_active,
  sponsorship_type
) VALUES
  ('halal_brand_partner', 'Halal Brand Partner', 'https://example.com/search?q={query}', '#1B5E20',
   ARRAY['specialty'], 0, ARRAY['US'], false,
   'direct_halal_brand')
ON CONFLICT (name) DO UPDATE SET
  product_fit = EXCLUDED.product_fit,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Ingredient substitute links (substitute_slug = normalized id from frontend/knowledge base)
-- Get provider UUIDs for FK (use name lookup in application or subquery)
DO $$
DECLARE
  pid_amazon UUID;
  pid_walmart UUID;
  pid_target UUID;
  pid_thrive UUID;
BEGIN
  SELECT id INTO pid_amazon FROM affiliate_providers WHERE name = 'amazon' LIMIT 1;
  SELECT id INTO pid_walmart FROM affiliate_providers WHERE name = 'walmart' LIMIT 1;
  SELECT id INTO pid_target FROM affiliate_providers WHERE name = 'target' LIMIT 1;
  SELECT id INTO pid_thrive FROM affiliate_providers WHERE name = 'thrivemarket' LIMIT 1;

  -- Agar agar
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('agar_agar', pid_amazon, 'agar agar halal certified', true, true, 1)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, is_featured = EXCLUDED.is_featured, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('agar_agar', pid_walmart, 'agar agar', false, true, 2)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('agar_agar', pid_thrive, 'organic agar agar', false, true, 3)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();

  -- Halal beef bacon / turkey bacon
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('halal_beef_bacon', pid_amazon, 'halal beef bacon certified', true, true, 1)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, is_featured = EXCLUDED.is_featured, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('halal_beef_bacon', pid_walmart, 'halal beef bacon', false, true, 2)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('halal_beef_bacon', pid_target, 'halal beef bacon', false, true, 3)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();

  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('beef_bacon', pid_amazon, 'halal beef bacon certified', true, true, 1)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('beef_bacon', pid_walmart, 'halal beef bacon', false, true, 2)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();

  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('turkey_bacon', pid_amazon, 'halal turkey bacon certified', true, true, 1)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('turkey_bacon', pid_walmart, 'halal turkey bacon', false, true, 2)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('turkey_bacon', pid_target, 'halal turkey bacon', false, true, 3)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();

  -- Grape juice
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('grape_juice', pid_amazon, '100% pure grape juice halal', true, true, 1)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('grape_juice', pid_walmart, 'pure grape juice', false, true, 2)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('grape_juice', pid_thrive, 'grape juice', false, true, 3)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();

  -- Halal vanilla extract
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('halal_vanilla_extract', pid_amazon, 'alcohol free vanilla extract halal', true, true, 1)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('halal_vanilla_extract', pid_thrive, 'alcohol free vanilla', false, true, 2)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();

  -- White wine vinegar (halal substitute)
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('white_wine_vinegar_halal', pid_amazon, 'halal white wine vinegar', true, true, 1)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
  INSERT INTO ingredient_substitute_links (substitute_slug, provider_id, search_query, is_featured, is_active, display_order)
  VALUES ('white_wine_vinegar_halal', pid_walmart, 'white wine vinegar', false, true, 2)
  ON CONFLICT (substitute_slug, provider_id) DO UPDATE SET search_query = EXCLUDED.search_query, updated_at = NOW();
END $$;

COMMIT;
