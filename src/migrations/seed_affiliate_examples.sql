-- Example Seed Data for Affiliate Monetization Schema
-- Demonstrates how to populate the tables with real-world data

BEGIN;

-- Example: Gelatin with Agar Agar substitute
-- (Assuming ingredients table already has these entries)
-- If not, you would insert them first:
-- INSERT INTO ingredients (name, normalized_name, aliases, halal_status, description, explanation, severity) VALUES
-- ('Gelatin', 'gelatin', ARRAY['gelatine'], 'questionable', 'Protein derived from animal collagen', 'Typically derived from pork or non-halal animals', 'high'),
-- ('Agar Agar', 'agar_agar', ARRAY['agar'], 'halal', 'Plant-based gelatin substitute', 'Derived from seaweed, completely halal', 'low');

-- Create substitute relationship
INSERT INTO ingredient_substitutes (
  ingredient_id,
  substitute_id,
  replacement_ratio,
  culinary_notes,
  best_for,
  is_primary,
  display_order
) 
SELECT 
  (SELECT id FROM ingredients WHERE normalized_name = 'gelatin'),
  (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
  '1 tablespoon gelatin → 2 tablespoons agar agar powder',
  ARRAY['Agar agar sets at room temperature', 'Use 2x the amount of gelatin', 'Works best for jellies and desserts'],
  ARRAY['desserts', 'jellies', 'puddings'],
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM ingredient_substitutes 
  WHERE ingredient_id = (SELECT id FROM ingredients WHERE normalized_name = 'gelatin')
    AND substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar')
);

-- Create affiliate links for Agar Agar
-- Amazon US
INSERT INTO affiliate_links (
  substitute_id,
  platform_id,
  region_id,
  search_query,
  affiliate_tag,
  product_name,
  price_range,
  rating,
  review_count,
  is_active,
  is_featured
)
SELECT 
  (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
  (SELECT id FROM affiliate_platforms WHERE name = 'amazon'),
  (SELECT id FROM regions WHERE code = 'US'),
  'agar agar halal certified',
  'halalkitchen-20', -- Replace with your actual Amazon affiliate tag
  'Premium Agar Agar Powder',
  '$8-12',
  4.5,
  1250,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate_links
  WHERE substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar')
    AND platform_id = (SELECT id FROM affiliate_platforms WHERE name = 'amazon')
    AND region_id = (SELECT id FROM regions WHERE code = 'US')
);

-- Instacart US
INSERT INTO affiliate_links (
  substitute_id,
  platform_id,
  region_id,
  search_query,
  is_active
)
SELECT 
  (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
  (SELECT id FROM affiliate_platforms WHERE name = 'instacart'),
  (SELECT id FROM regions WHERE code = 'US'),
  'agar agar',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate_links
  WHERE substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar')
    AND platform_id = (SELECT id FROM affiliate_platforms WHERE name = 'instacart')
    AND region_id = (SELECT id FROM regions WHERE code = 'US')
);

-- Thrive Market US
INSERT INTO affiliate_links (
  substitute_id,
  platform_id,
  region_id,
  search_query,
  is_active,
  is_featured
)
SELECT 
  (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
  (SELECT id FROM affiliate_platforms WHERE name = 'thrivemarket'),
  (SELECT id FROM regions WHERE code = 'US'),
  'organic agar agar',
  true,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate_links
  WHERE substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar')
    AND platform_id = (SELECT id FROM affiliate_platforms WHERE name = 'thrivemarket')
    AND region_id = (SELECT id FROM regions WHERE code = 'US')
);

-- Example: Wine with Grape Juice + Vinegar substitute
-- (Assuming 'wine' and 'grape_juice' exist in ingredients table)
INSERT INTO ingredient_substitutes (
  ingredient_id,
  substitute_id,
  replacement_ratio,
  culinary_notes,
  best_for,
  is_primary,
  display_order
) 
SELECT 
  (SELECT id FROM ingredients WHERE normalized_name = 'wine'),
  (SELECT id FROM ingredients WHERE normalized_name = 'grape_juice'),
  '1 cup wine → ¾ cup grape juice + ¼ cup vinegar',
  ARRAY['Mimics wine acidity and fruity notes', 'Best for cooking applications'],
  ARRAY['cooking', 'sauces', 'marinades'],
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM ingredient_substitutes 
  WHERE ingredient_id = (SELECT id FROM ingredients WHERE normalized_name = 'wine')
    AND substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'grape_juice')
);

-- Affiliate links for Grape Juice
INSERT INTO affiliate_links (
  substitute_id,
  platform_id,
  region_id,
  search_query,
  affiliate_tag,
  is_active,
  is_featured
)
SELECT 
  (SELECT id FROM ingredients WHERE normalized_name = 'grape_juice'),
  (SELECT id FROM affiliate_platforms WHERE name = 'amazon'),
  (SELECT id FROM regions WHERE code = 'US'),
  '100% pure grape juice halal',
  'halalkitchen-20',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate_links
  WHERE substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'grape_juice')
    AND platform_id = (SELECT id FROM affiliate_platforms WHERE name = 'amazon')
    AND region_id = (SELECT id FROM regions WHERE code = 'US')
);

-- Example: Sponsored Brand
INSERT INTO sponsored_brands (
  name,
  description,
  halal_certification_authority,
  is_verified,
  sponsorship_tier,
  contract_start_date,
  contract_end_date
) VALUES (
  'Halal Valley Foods',
  'Premium halal-certified ingredients and substitutes',
  'IFANCA',
  true,
  'premium',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year'
) ON CONFLICT DO NOTHING;

-- Example: Sponsored affiliate link (using sponsored brand)
INSERT INTO affiliate_links (
  substitute_id,
  platform_id,
  region_id,
  sponsored_brand_id,
  search_query,
  custom_url,
  affiliate_tag,
  product_name,
  is_active,
  is_featured
)
SELECT 
  (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
  (SELECT id FROM affiliate_platforms WHERE name = 'amazon'),
  (SELECT id FROM regions WHERE code = 'US'),
  (SELECT id FROM sponsored_brands WHERE name = 'Halal Valley Foods'),
  'Halal Valley agar agar',
  'https://www.amazon.com/dp/B00EXAMPLE', -- Direct product URL
  'halalkitchen-20',
  'Halal Valley Premium Agar Agar',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate_links
  WHERE substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar')
    AND platform_id = (SELECT id FROM affiliate_platforms WHERE name = 'amazon')
    AND region_id = (SELECT id FROM regions WHERE code = 'US')
    AND sponsored_brand_id = (SELECT id FROM sponsored_brands WHERE name = 'Halal Valley Foods')
);

COMMIT;
