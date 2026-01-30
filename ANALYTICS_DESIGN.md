# Anonymous Analytics for Affiliate Monetization

## Overview
GDPR-friendly, lightweight analytics system for tracking affiliate monetization performance without collecting personal data.

## Principles

1. **No Personal Data**
   - No names, emails, phone numbers
   - No IP addresses stored
   - No cross-site tracking
   - Session-based only (not persistent)

2. **GDPR Compliant**
   - User consent required
   - Opt-out anytime
   - Transparent data collection
   - Right to deletion

3. **Lightweight**
   - Minimal data points
   - Efficient storage
   - Fast queries
   - No heavy processing

## Event Schema

### Event Structure

```typescript
interface AnalyticsEvent {
  event: string;              // Event name
  props: {                   // Event properties (anonymized)
    ingredient_id?: string;   // Normalized ingredient ID
    substitute_id?: string;   // Substitute ingredient ID
    platform?: string;        // 'amazon' | 'instacart' | 'thrivemarket'
    source?: string;          // 'quick_lookup' | 'conversion_result' | 'seo_page'
    status?: string;          // 'halal' | 'haram' | 'conditional'
    region?: string;          // Country code (e.g., 'US')
    ingredient_type?: string; // 'fresh' | 'pantry' | 'specialty'
    link_id?: string;         // Affiliate link ID
    is_featured?: boolean;    // Whether link was featured
    step?: string;            // Funnel step
    // ... other anonymized props
  };
  timestamp: number;          // Unix timestamp
  session_id: string;        // Anonymous session ID
}
```

## Event Types

### 1. `ingredient_view`

**Triggered**: When user views an ingredient detail

**Properties**:
```json
{
  "ingredient_id": "gelatin",
  "source": "quick_lookup",
  "status": "questionable",
  "region": "US"
}
```

**Use Cases**:
- Track most viewed ingredients
- Identify popular ingredients by region
- Measure engagement with ingredient details

---

### 2. `substitute_click`

**Triggered**: When user clicks to view/expand a substitute option

**Properties**:
```json
{
  "ingredient_id": "gelatin",
  "substitute_id": "agar_agar",
  "source": "conversion_result",
  "region": "US"
}
```

**Use Cases**:
- Track substitute interest
- Measure conversion from haram → halal substitute
- Identify popular substitute pairings

---

### 3. `affiliate_click`

**Triggered**: When user clicks an affiliate link

**Properties**:
```json
{
  "ingredient_id": "gelatin",
  "substitute_id": "agar_agar",
  "platform": "amazon",
  "link_id": "link_agar_agar_amazon_0",
  "is_featured": true,
  "ingredient_type": "pantry",
  "region": "US"
}
```

**Use Cases**:
- Track affiliate link performance
- Measure platform preferences
- Identify featured link effectiveness
- Regional platform preferences

---

### 4. `conversion_funnel`

**Triggered**: At each step of the conversion funnel

**Properties**:
```json
{
  "step": "affiliate_click",
  "ingredient_id": "gelatin",
  "region": "US"
}
```

**Steps**:
- `view`: Ingredient viewed
- `substitute_view`: Substitute clicked
- `affiliate_click`: Affiliate link clicked

**Use Cases**:
- Funnel analysis
- Drop-off points
- Conversion rate optimization

---

### 5. `recipe_conversion`

**Triggered**: When recipe is converted and affiliate links are shown

**Properties**:
```json
{
  "total_ingredients": 10,
  "haram_ingredients": 2,
  "substitutes_shown": 2,
  "affiliate_links_shown": 6,
  "region": "US"
}
```

**Use Cases**:
- Recipe conversion metrics
- Average ingredients per recipe
- Affiliate link display rate
- Regional recipe patterns

---

## Naming Conventions

### Event Names

- **Format**: `snake_case`
- **Pattern**: `{entity}_{action}`
- **Examples**:
  - `ingredient_view`
  - `substitute_click`
  - `affiliate_click`
  - `conversion_funnel`
  - `recipe_conversion`

### Property Names

- **Format**: `snake_case`
- **Pattern**: Descriptive and specific
- **Examples**:
  - `ingredient_id` (not `ingredient`)
  - `substitute_id` (not `substitute`)
  - `is_featured` (boolean prefix)
  - `ingredient_type` (not `type`)

### Session IDs

- **Format**: `sess_{timestamp}_{random}`
- **Example**: `sess_1704067200000_a3f9k2m`
- **Storage**: `sessionStorage` (not persistent)
- **Lifetime**: Browser session only

---

## Key Metrics Dashboard

### Overview Metrics

```typescript
interface DashboardMetrics {
  // Total events
  total_events: number;
  
  // Ingredient views
  ingredient_views: {
    count: number;
    ingredient_id: string;
    source: string;
    status: string;
  }[];
  
  // Substitute clicks
  substitute_clicks: {
    count: number;
    ingredient_id: string;
    substitute_id: string;
  }[];
  
  // Affiliate clicks
  affiliate_clicks: {
    count: number;
    platform: string;
    ingredient_id: string;
    substitute_id: string;
    is_featured: boolean;
  }[];
  
  // Conversion funnel
  conversion_funnel: {
    step: string;
    count: number;
  }[];
  
  // Recipe conversions
  recipe_conversions: {
    avg_total: number;
    avg_haram: number;
    avg_substitutes: number;
    avg_links: number;
    total_conversions: number;
  };
  
  // Top ingredients
  top_ingredients: {
    ingredient_id: string;
    views: number;
  }[];
  
  // Top platforms
  top_platforms: {
    platform: string;
    clicks: number;
  }[];
  
  // Regional breakdown
  regional_breakdown: {
    region: string;
    events: number;
  }[];
}
```

### Key Performance Indicators (KPIs)

1. **Ingredient View Rate**
   - Total ingredient views / Total sessions
   - Target: > 50%

2. **Substitute Click-Through Rate (CTR)**
   - Substitute clicks / Ingredient views
   - Target: > 30%

3. **Affiliate Click-Through Rate (CTR)**
   - Affiliate clicks / Substitute clicks
   - Target: > 20%

4. **Conversion Funnel Completion**
   - Affiliate clicks / Ingredient views
   - Target: > 10%

5. **Platform Distribution**
   - Clicks per platform / Total affiliate clicks
   - Track: Amazon vs. Instacart vs. Thrive Market

6. **Featured Link Performance**
   - Featured link clicks / Total affiliate clicks
   - Target: > 40%

7. **Regional Performance**
   - Events per region / Total events
   - Identify top markets

---

## Dashboard Views

### 1. Overview Dashboard

**Metrics**:
- Total events (last 30 days)
- Ingredient views
- Affiliate clicks
- Conversion rate
- Top 5 ingredients
- Top 3 platforms

**Visualization**:
- Line chart: Events over time
- Bar chart: Top ingredients
- Pie chart: Platform distribution
- Funnel chart: Conversion funnel

---

### 2. Ingredient Analytics

**Metrics**:
- Most viewed ingredients
- Most clicked substitutes
- Ingredient → Substitute conversion rate
- Regional ingredient preferences

**Visualization**:
- Table: Top ingredients with views/clicks
- Heatmap: Ingredient → Substitute pairs
- Bar chart: Regional breakdown

---

### 3. Affiliate Performance

**Metrics**:
- Platform performance (Amazon, Instacart, Thrive)
- Featured vs. non-featured link performance
- Click-through rates by platform
- Regional platform preferences

**Visualization**:
- Bar chart: Platform clicks
- Comparison chart: Featured vs. non-featured
- Map: Regional platform distribution

---

### 4. Conversion Funnel

**Metrics**:
- Funnel steps: View → Substitute → Affiliate Click
- Drop-off rates at each step
- Conversion rate by ingredient type
- Conversion rate by region

**Visualization**:
- Funnel chart: Step-by-step conversion
- Line chart: Drop-off rates
- Bar chart: Conversion by type/region

---

### 5. Recipe Analytics

**Metrics**:
- Average ingredients per recipe
- Average haram ingredients per recipe
- Average substitutes shown
- Average affiliate links shown
- Recipe conversion rate

**Visualization**:
- Metrics cards: Averages
- Line chart: Recipe conversions over time
- Bar chart: Affiliate links per recipe

---

## Privacy & Compliance

### GDPR Compliance

1. **Consent Required**
   - Banner on first visit
   - Clear explanation of data collection
   - Opt-out option

2. **No Personal Data**
   - No IP addresses stored
   - No user identifiers
   - Session-based only

3. **Data Retention**
   - Events deleted after 2 years
   - Aggregate data only
   - No individual tracking

4. **User Rights**
   - Right to access (dashboard view)
   - Right to deletion (opt-out)
   - Right to portability (export)

### Data Minimization

- Only collect necessary data
- Aggregate immediately
- No cross-site tracking
- No third-party sharing

---

## Implementation

### Frontend

```javascript
import { 
  trackIngredientView,
  trackSubstituteClick,
  trackAffiliateClick,
  trackConversionFunnel,
  trackRecipeConversion
} from './lib/affiliateAnalytics';

// Track ingredient view
await trackIngredientView('gelatin', 'quick_lookup', 'questionable');

// Track substitute click
await trackSubstituteClick('gelatin', 'agar_agar', 'conversion_result');

// Track affiliate click
await trackAffiliateClick('gelatin', 'agar_agar', 'amazon', 'link_123', true, 'pantry');

// Track conversion funnel
await trackConversionFunnel('affiliate_click', 'gelatin');

// Track recipe conversion
await trackRecipeConversion(10, 2, 2, 6);
```

### Backend

```javascript
// Store event
POST /api/analytics/event
{
  "event": "affiliate_click",
  "props": {
    "ingredient_id": "gelatin",
    "platform": "amazon",
    "region": "US"
  },
  "session_id": "sess_123",
  "timestamp": 1704067200000
}

// Get dashboard metrics
GET /api/analytics/dashboard?start_date=2024-01-01&end_date=2024-01-31&region=US
```

---

## Files Created

1. **Frontend**:
   - `frontend/src/lib/affiliateAnalytics.js` - Analytics tracking functions
   - `frontend/src/components/AnalyticsConsent.jsx` - GDPR consent banner
   - `frontend/src/components/AnalyticsConsent.css` - Consent banner styles

2. **Backend**:
   - `backend/src/routes/analytics.js` - Analytics API routes
   - `backend/src/migrations/create_analytics_tables.sql` - Database schema

3. **Documentation**:
   - `ANALYTICS_DESIGN.md` - This file

---

## Next Steps

1. **Integration**:
   - Add analytics tracking to conversion results
   - Add analytics tracking to Quick Lookup
   - Add analytics tracking to affiliate links

2. **Dashboard**:
   - Create admin dashboard UI
   - Implement data visualization
   - Add export functionality

3. **Testing**:
   - Test event tracking
   - Test GDPR compliance
   - Test dashboard queries

4. **Optimization**:
   - Add caching for dashboard queries
   - Implement data aggregation jobs
   - Add alerting for anomalies
