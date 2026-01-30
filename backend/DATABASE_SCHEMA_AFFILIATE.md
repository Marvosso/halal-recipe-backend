# Affiliate Monetization Database Schema

## Overview
Scalable PostgreSQL schema for managing ingredients, halal substitutes, and affiliate links with region support and brand sponsorship capabilities.

## Tables

### 1. `ingredients`
Core ingredient catalog with halal status.

```sql
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL UNIQUE, -- snake_case for matching
  aliases TEXT[], -- Array of alternative names/spellings
  halal_status VARCHAR(50) NOT NULL CHECK (halal_status IN ('halal', 'haram', 'questionable', 'conditional')),
  description TEXT,
  quran_reference TEXT,
  hadith_reference TEXT,
  explanation TEXT, -- Religious justification
  severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ingredients_normalized_name ON ingredients(normalized_name);
CREATE INDEX idx_ingredients_halal_status ON ingredients(halal_status);
CREATE INDEX idx_ingredients_is_active ON ingredients(is_active);
```

**Example Records:**
```sql
INSERT INTO ingredients (name, normalized_name, aliases, halal_status, description, explanation, severity) VALUES
('Pork', 'pork', ARRAY['pig', 'swine', 'bacon', 'ham'], 'haram', 'Pork and all pork products', 'Explicitly prohibited in Quran 2:173, 5:3, 6:145, 16:115', 'critical'),
('Gelatin', 'gelatin', ARRAY['gelatine'], 'questionable', 'Protein derived from animal collagen', 'Typically derived from pork or non-halal animals. Halal-certified gelatin is permissible.', 'high'),
('Wine', 'wine', ARRAY['alcohol', 'vino'], 'haram', 'Alcoholic beverage made from grapes', 'Prohibited in Quran 2:219, 5:90-91', 'critical'),
('Agar Agar', 'agar_agar', ARRAY['agar'], 'halal', 'Plant-based gelatin substitute from seaweed', 'Derived from seaweed, completely halal', 'low');
```

### 2. `ingredient_substitutes`
Many-to-many relationship between ingredients and their halal substitutes.

```sql
CREATE TABLE ingredient_substitutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  substitute_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  replacement_ratio VARCHAR(100), -- e.g., "1:1", "1 cup → ¾ cup + ¼ cup vinegar"
  culinary_notes TEXT[], -- Array of cooking tips
  best_for TEXT[], -- Array of use cases: "baking", "savory", "desserts", etc.
  flavor_match_score INTEGER DEFAULT 50 CHECK (flavor_match_score >= 0 AND flavor_match_score <= 100),
  texture_match_score INTEGER DEFAULT 50 CHECK (texture_match_score >= 0 AND texture_match_score <= 100),
  is_primary BOOLEAN DEFAULT false, -- Primary recommended substitute
  display_order INTEGER DEFAULT 0, -- For sorting substitutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ingredient_id, substitute_id)
);

CREATE INDEX idx_substitutes_ingredient ON ingredient_substitutes(ingredient_id);
CREATE INDEX idx_substitutes_substitute ON ingredient_substitutes(substitute_id);
CREATE INDEX idx_substitutes_is_active ON ingredient_substitutes(is_active);
CREATE INDEX idx_substitutes_display_order ON ingredient_substitutes(display_order);
```

**Example Records:**
```sql
INSERT INTO ingredient_substitutes (ingredient_id, substitute_id, replacement_ratio, culinary_notes, best_for, is_primary, display_order) VALUES
-- Gelatin → Agar Agar
((SELECT id FROM ingredients WHERE normalized_name = 'gelatin'), 
 (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
 '1 tablespoon gelatin → 2 tablespoons agar agar powder',
 ARRAY['Agar agar sets at room temperature', 'Use 2x the amount of gelatin', 'Works best for jellies and desserts'],
 ARRAY['desserts', 'jellies', 'puddings'],
 true, 1),

-- Wine → Grape Juice + Vinegar
((SELECT id FROM ingredients WHERE normalized_name = 'wine'),
 (SELECT id FROM ingredients WHERE normalized_name = 'grape_juice'),
 '1 cup wine → ¾ cup grape juice + ¼ cup vinegar',
 ARRAY['Mimics wine acidity and fruity notes', 'Best for cooking applications'],
 ARRAY['cooking', 'sauces', 'marinades'],
 true, 1);
```

### 3. `regions`
Geographic regions for region-aware affiliate links.

```sql
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) NOT NULL UNIQUE, -- ISO country code or custom: 'US', 'CA', 'UK', 'AU', etc.
  name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(3) NOT NULL, -- ISO 4217: USD, CAD, GBP, AUD
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_regions_code ON regions(code);
CREATE INDEX idx_regions_is_active ON regions(is_active);
```

**Example Records:**
```sql
INSERT INTO regions (code, name, currency_code) VALUES
('US', 'United States', 'USD'),
('CA', 'Canada', 'CAD'),
('UK', 'United Kingdom', 'GBP'),
('AU', 'Australia', 'AUD'),
('SA', 'Saudi Arabia', 'SAR'),
('AE', 'United Arab Emirates', 'AED');
```

### 4. `affiliate_platforms`
Supported affiliate platforms.

```sql
CREATE TABLE affiliate_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'amazon', 'instacart', 'thrivemarket'
  display_name VARCHAR(100) NOT NULL, -- 'Amazon', 'Instacart', 'Thrive Market'
  base_url_template TEXT NOT NULL, -- URL pattern with {query} placeholder
  icon_url TEXT,
  color_hex VARCHAR(7), -- Brand color for UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platforms_name ON affiliate_platforms(name);
CREATE INDEX idx_platforms_is_active ON affiliate_platforms(is_active);
```

**Example Records:**
```sql
INSERT INTO affiliate_platforms (name, display_name, base_url_template, color_hex) VALUES
('amazon', 'Amazon', 'https://www.amazon.com/s?k={query}', '#FF9900'),
('instacart', 'Instacart', 'https://www.instacart.com/store/search?q={query}', '#00A862'),
('thrivemarket', 'Thrive Market', 'https://thrivemarket.com/search?q={query}', '#2E7D32');
```

### 5. `affiliate_links`
Affiliate links for substitutes, region-aware and brand-aware.

```sql
CREATE TABLE affiliate_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  substitute_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES affiliate_platforms(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL, -- NULL = global/default
  sponsored_brand_id UUID REFERENCES sponsored_brands(id) ON DELETE SET NULL, -- NULL = organic
  
  -- Link configuration
  search_query TEXT NOT NULL, -- Search term for affiliate link
  custom_url TEXT, -- Optional: direct product URL (overrides search)
  affiliate_tag VARCHAR(255), -- Platform-specific affiliate tag/ID
  
  -- Metadata
  product_name VARCHAR(255), -- Specific product name if known
  product_image_url TEXT,
  price_range VARCHAR(50), -- e.g., "$5-10", "£3-5"
  rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  
  -- Control flags
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Featured/promoted link
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optional expiration date
  
  -- Constraints
  UNIQUE(substitute_id, platform_id, region_id, sponsored_brand_id) -- Prevent duplicates
);

CREATE INDEX idx_affiliate_links_substitute ON affiliate_links(substitute_id);
CREATE INDEX idx_affiliate_links_platform ON affiliate_links(platform_id);
CREATE INDEX idx_affiliate_links_region ON affiliate_links(region_id);
CREATE INDEX idx_affiliate_links_brand ON affiliate_links(sponsored_brand_id);
CREATE INDEX idx_affiliate_links_active ON affiliate_links(is_active);
CREATE INDEX idx_affiliate_links_featured ON affiliate_links(is_featured);
```

**Example Records:**
```sql
INSERT INTO affiliate_links (substitute_id, platform_id, region_id, search_query, affiliate_tag, is_active, is_featured) VALUES
-- Agar Agar on Amazon US
((SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
 (SELECT id FROM affiliate_platforms WHERE name = 'amazon'),
 (SELECT id FROM regions WHERE code = 'US'),
 'agar agar halal certified',
 'halalkitchen-20',
 true, true),

-- Agar Agar on Instacart US
((SELECT id FROM ingredients WHERE normalized_name = 'agar_agar'),
 (SELECT id FROM affiliate_platforms WHERE name = 'instacart'),
 (SELECT id FROM regions WHERE code = 'US'),
 'agar agar',
 NULL,
 true, false),

-- Turkey Bacon on Amazon US (for pork substitute)
((SELECT id FROM ingredients WHERE normalized_name = 'turkey_bacon'),
 (SELECT id FROM affiliate_platforms WHERE name = 'amazon'),
 (SELECT id FROM regions WHERE code = 'US'),
 'halal turkey bacon certified',
 'halalkitchen-20',
 true, true);
```

### 6. `sponsored_brands`
Future sponsored halal brands/products.

```sql
CREATE TABLE sponsored_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  halal_certification_authority VARCHAR(255), -- e.g., "IFANCA", "HFSAA"
  certification_number VARCHAR(100),
  is_verified BOOLEAN DEFAULT false, -- Verified halal certification
  is_active BOOLEAN DEFAULT true,
  sponsorship_tier VARCHAR(50) DEFAULT 'standard' CHECK (sponsorship_tier IN ('standard', 'premium', 'featured')),
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brands_name ON sponsored_brands(name);
CREATE INDEX idx_brands_is_active ON sponsored_brands(is_active);
CREATE INDEX idx_brands_verified ON sponsored_brands(is_verified);
```

**Example Records:**
```sql
INSERT INTO sponsored_brands (name, description, halal_certification_authority, is_verified, sponsorship_tier) VALUES
('Halal Valley Foods', 'Premium halal-certified ingredients', 'IFANCA', true, 'premium'),
('Pure Halal Co', 'Organic halal-certified products', 'HFSAA', true, 'standard');
```

### 7. `affiliate_link_clicks`
Analytics table for tracking affiliate link performance.

```sql
CREATE TABLE affiliate_link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_link_id UUID NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous
  session_id VARCHAR(255), -- For anonymous tracking
  ip_address INET, -- For fraud detection (optional, consider privacy)
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP DEFAULT NOW(),
  
  -- Conversion tracking (if available from platform)
  converted_at TIMESTAMP, -- When purchase occurred
  conversion_value DECIMAL(10,2), -- Revenue from conversion
  commission_amount DECIMAL(10,2) -- Our commission
);

CREATE INDEX idx_clicks_link ON affiliate_link_clicks(affiliate_link_id);
CREATE INDEX idx_clicks_user ON affiliate_link_clicks(user_id);
CREATE INDEX idx_clicks_clicked_at ON affiliate_link_clicks(clicked_at);
CREATE INDEX idx_clicks_converted ON affiliate_link_clicks(converted_at) WHERE converted_at IS NOT NULL;
```

## Relationships Diagram

```
ingredients (1) ──< (many) ingredient_substitutes (many) >── (1) ingredients
                                                                    │
                                                                    │ (substitute)
                                                                    ▼
                                                          affiliate_links (many)
                                                                    │
                    ┌───────────────────────────────────────────────┼──────────────┐
                    │                                               │              │
                    ▼                                               ▼              ▼
          affiliate_platforms (1)                          regions (1)    sponsored_brands (1)
```

## Useful Queries

### Get all substitutes for an ingredient with affiliate links
```sql
SELECT 
  i.name AS ingredient_name,
  s.name AS substitute_name,
  isub.replacement_ratio,
  isub.culinary_notes,
  ap.display_name AS platform,
  r.name AS region,
  al.search_query,
  al.is_active AS link_active,
  sb.name AS sponsored_brand
FROM ingredients i
JOIN ingredient_substitutes isub ON i.id = isub.ingredient_id
JOIN ingredients s ON isub.substitute_id = s.id
LEFT JOIN affiliate_links al ON s.id = al.substitute_id AND al.is_active = true
LEFT JOIN affiliate_platforms ap ON al.platform_id = ap.id
LEFT JOIN regions r ON al.region_id = r.id
LEFT JOIN sponsored_brands sb ON al.sponsored_brand_id = sb.id
WHERE i.normalized_name = 'gelatin'
  AND isub.is_active = true
ORDER BY isub.display_order, isub.is_primary DESC, ap.display_name;
```

### Get active affiliate links for a substitute in a specific region
```sql
SELECT 
  al.*,
  ap.display_name AS platform_name,
  ap.base_url_template,
  r.code AS region_code,
  sb.name AS brand_name
FROM affiliate_links al
JOIN affiliate_platforms ap ON al.platform_id = ap.id
LEFT JOIN regions r ON al.region_id = r.id
LEFT JOIN sponsored_brands sb ON al.sponsored_brand_id = sb.id
WHERE al.substitute_id = (SELECT id FROM ingredients WHERE normalized_name = 'agar_agar')
  AND al.is_active = true
  AND ap.is_active = true
  AND (al.region_id = (SELECT id FROM regions WHERE code = 'US') OR al.region_id IS NULL)
ORDER BY al.is_featured DESC, sb.sponsorship_tier DESC, al.click_count DESC;
```

### Get top-performing affiliate links
```sql
SELECT 
  i.name AS substitute_name,
  ap.display_name AS platform,
  r.name AS region,
  al.click_count,
  al.conversion_count,
  CASE 
    WHEN al.conversion_count > 0 THEN ROUND((al.conversion_count::DECIMAL / al.click_count) * 100, 2)
    ELSE 0
  END AS conversion_rate
FROM affiliate_links al
JOIN ingredients i ON al.substitute_id = i.id
JOIN affiliate_platforms ap ON al.platform_id = ap.id
LEFT JOIN regions r ON al.region_id = r.id
WHERE al.is_active = true
  AND al.click_count > 0
ORDER BY al.conversion_count DESC, al.click_count DESC
LIMIT 20;
```

## Migration Strategy

### Phase 1: Core Tables
1. Create `ingredients` table (if not exists)
2. Create `ingredient_substitutes` table
3. Create `regions` table
4. Create `affiliate_platforms` table

### Phase 2: Affiliate Links
5. Create `affiliate_links` table
6. Migrate existing ingredient data
7. Create affiliate links for existing substitutes

### Phase 3: Advanced Features
8. Create `sponsored_brands` table
9. Create `affiliate_link_clicks` table
10. Add analytics views

## Notes

- **Normalization**: Fully normalized to prevent data duplication
- **Scalability**: Indexes on all foreign keys and frequently queried fields
- **Flexibility**: Supports multiple regions, platforms, and future brand sponsorships
- **Performance**: Composite indexes for common query patterns
- **Data Integrity**: Foreign key constraints with appropriate CASCADE/SET NULL actions
- **Privacy**: IP addresses optional, consider GDPR compliance
- **Audit Trail**: `created_at` and `updated_at` on all tables
