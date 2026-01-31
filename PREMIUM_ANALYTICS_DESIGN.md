# Premium Analytics Design for Halal Kitchen

## Overview
Comprehensive analytics to measure premium subscription success, track conversion funnel, and monitor feature usage.

---

## Events

### 1. Conversion Limit Hits

#### `conversion_limit_hit`
**When**: Free user hits daily conversion limit

**Properties**:
- `current_count` (number): Current conversions today
- `limit` (number): Conversion limit (Infinity for premium)
- `user_tier` (string): 'free'
- `action_taken` (string): 'limit_reached'

**Example**:
```javascript
trackConversionLimitHit(10, 10);
```

#### `conversion_limit_approach`
**When**: Free user approaches limit (2 or fewer remaining)

**Properties**:
- `current_count` (number): Current conversions today
- `limit` (number): Conversion limit
- `remaining` (number): Remaining conversions
- `user_tier` (string): 'free'

**Example**:
```javascript
trackConversionLimitApproach(8, 10, 2);
```

---

### 2. Upgrade Attempts

#### `upgrade_modal_view`
**When**: User views upgrade modal

**Properties**:
- `trigger_feature` (string): Feature that triggered upgrade (optional)
- `source` (string): Where upgrade was triggered ('modal', 'prompt', 'settings')
- `user_tier` (string): 'free'

**Example**:
```javascript
trackUpgradeModalView('strict_halal_mode', 'prompt');
```

#### `upgrade_attempt`
**When**: User clicks upgrade CTA

**Properties**:
- `plan` (string): 'monthly' or 'yearly'
- `trigger_feature` (string): Feature that triggered upgrade (optional)
- `source` (string): Where upgrade was triggered
- `user_tier` (string): 'free'

**Example**:
```javascript
trackUpgradeAttempt('monthly', 'strict_halal_mode', 'modal');
```

#### `checkout_start`
**When**: User starts Stripe checkout

**Properties**:
- `plan` (string): 'monthly' or 'yearly'
- `session_id` (string): Stripe checkout session ID
- `user_tier` (string): 'free'

**Example**:
```javascript
trackCheckoutStart('monthly', 'cs_1234567890');
```

#### `checkout_abandoned`
**When**: User abandons checkout

**Properties**:
- `plan` (string): 'monthly' or 'yearly'
- `session_id` (string): Stripe checkout session ID
- `reason` (string): Reason for abandonment (optional)
- `user_tier` (string): 'free'

**Example**:
```javascript
trackCheckoutAbandoned('monthly', 'cs_1234567890', 'closed_window');
```

---

### 3. Successful Subscriptions

#### `subscription_success`
**When**: User successfully subscribes

**Properties**:
- `plan` (string): 'monthly' or 'yearly'
- `subscription_id` (string): Stripe subscription ID
- `session_id` (string): Stripe checkout session ID
- `user_tier` (string): 'premium'
- `revenue` (number): Revenue amount (2.99 or 29.99)

**Example**:
```javascript
trackSubscriptionSuccess('monthly', 'sub_1234567890', 'cs_1234567890');
```

#### `subscription_activated`
**When**: Subscription is activated

**Properties**:
- `plan` (string): 'monthly' or 'yearly'
- `subscription_id` (string): Stripe subscription ID
- `user_tier` (string): 'premium'

**Example**:
```javascript
trackSubscriptionActivated('monthly', 'sub_1234567890');
```

#### `subscription_cancelled`
**When**: User cancels subscription

**Properties**:
- `plan` (string): 'monthly' or 'yearly'
- `subscription_id` (string): Stripe subscription ID
- `reason` (string): Cancellation reason (optional)
- `user_tier` (string): 'premium'

**Example**:
```javascript
trackSubscriptionCancelled('monthly', 'sub_1234567890', 'too_expensive');
```

#### `subscription_renewed`
**When**: Subscription renews

**Properties**:
- `plan` (string): 'monthly' or 'yearly'
- `subscription_id` (string): Stripe subscription ID
- `user_tier` (string): 'premium'
- `revenue` (number): Revenue amount (2.99 or 29.99)

**Example**:
```javascript
trackSubscriptionRenewed('monthly', 'sub_1234567890');
```

---

### 4. Feature Usage by Premium Users

#### `premium_feature_usage`
**When**: Premium user uses a premium feature

**Properties**:
- `feature` (string): Feature name
- `action` (string): Action taken ('enabled', 'used', 'viewed')
- `user_tier` (string): 'premium'
- Additional context properties

**Example**:
```javascript
trackPremiumFeatureUsage('strict_halal_mode', 'enabled');
```

#### Specific Feature Events

**Strict Halal Mode**:
```javascript
trackStrictHalalModeUsage(true); // enabled
```

**All Alternatives View**:
```javascript
trackAllAlternativesView(5, 'gelatin');
```

**Brand Verification**:
```javascript
trackBrandVerificationUsage('IFANCA Certified', 'gelatin');
```

**PDF Export**:
```javascript
trackPDFExportUsage(3); // 3 recipes exported
```

**Batch Conversion**:
```javascript
trackBatchConversionUsage(5); // 5 recipes converted
```

**Conversion History**:
```javascript
trackConversionHistoryView(25); // 25 conversions in history
```

**Unlimited Recipe Save**:
```javascript
trackUnlimitedRecipeSave(15); // 15th recipe saved
```

---

### 5. Upgrade Funnel Tracking

#### `upgrade_funnel`
**When**: User progresses through upgrade funnel

**Properties**:
- `step` (string): Funnel step ('awareness', 'interest', 'consideration', 'purchase')
- `user_tier` (string): 'free'
- Additional context properties

**Example**:
```javascript
trackUpgradeFunnel('interest', { trigger_feature: 'strict_halal_mode' });
```

#### `upgrade_prompt_dismissed`
**When**: User dismisses upgrade prompt

**Properties**:
- `trigger_feature` (string): Feature that triggered prompt
- `dismissal_reason` (string): Why user dismissed (optional)
- `user_tier` (string): 'free'

**Example**:
```javascript
trackUpgradePromptDismissal('strict_halal_mode', 'maybe_later');
```

---

### 6. Premium User Engagement

#### `premium_engagement`
**When**: Premium user engages with app

**Properties**:
- `engagement_type` (string): Type of engagement ('daily_active', 'feature_used', 'recipe_saved')
- `user_tier` (string): 'premium'
- Additional context properties

**Example**:
```javascript
trackPremiumEngagement('daily_active', { features_used: 3 });
```

#### `premium_retention`
**When**: Track premium user retention

**Properties**:
- `days_since_subscription` (number): Days since subscription started
- `plan` (string): 'monthly' or 'yearly'
- `user_tier` (string): 'premium'

**Example**:
```javascript
trackPremiumRetention(30, 'monthly');
```

---

## Metrics

### Conversion Metrics

1. **Conversion Limit Hit Rate**
   - Formula: `(conversion_limit_hit events / total free users) * 100`
   - Target: < 5% of free users hit limit daily

2. **Conversion Limit Approach Rate**
   - Formula: `(conversion_limit_approach events / total free users) * 100`
   - Target: < 10% of free users approach limit daily

3. **Upgrade Intent Rate**
   - Formula: `(upgrade_attempt events / upgrade_modal_view events) * 100`
   - Target: > 30%

---

### Upgrade Funnel Metrics

1. **Upgrade Modal View Rate**
   - Formula: `(upgrade_modal_view events / total free users) * 100`
   - Target: Track by trigger feature

2. **Upgrade Attempt Rate**
   - Formula: `(upgrade_attempt events / upgrade_modal_view events) * 100`
   - Target: > 30%

3. **Checkout Start Rate**
   - Formula: `(checkout_start events / upgrade_attempt events) * 100`
   - Target: > 80%

4. **Checkout Abandonment Rate**
   - Formula: `(checkout_abandoned events / checkout_start events) * 100`
   - Target: < 50%

5. **Conversion Rate**
   - Formula: `(subscription_success events / checkout_start events) * 100`
   - Target: > 50%

---

### Subscription Metrics

1. **Monthly Recurring Revenue (MRR)**
   - Formula: `(monthly subscribers * $2.99) + (yearly subscribers * $29.99 / 12)`
   - Target: Track growth month-over-month

2. **Annual Recurring Revenue (ARR)**
   - Formula: `MRR * 12`
   - Target: Track growth year-over-year

3. **Average Revenue Per User (ARPU)**
   - Formula: `MRR / total premium subscribers`
   - Target: $2.99 - $2.50 (weighted average)

4. **Churn Rate**
   - Formula: `(subscription_cancelled events / total premium subscribers) * 100`
   - Target: < 5% monthly

5. **Renewal Rate**
   - Formula: `(subscription_renewed events / subscriptions due) * 100`
   - Target: > 95%

6. **Lifetime Value (LTV)**
   - Formula: `ARPU / churn_rate`
   - Target: > $60

---

### Feature Usage Metrics

1. **Feature Adoption Rate**
   - Formula: `(premium_feature_usage events / total premium subscribers) * 100`
   - Target: Track by feature

2. **Most Used Features**
   - Rank features by usage count
   - Target: Identify top 3 features

3. **Feature Retention**
   - Formula: `(users who used feature in period 2 / users who used feature in period 1) * 100`
   - Target: > 70%

---

### Engagement Metrics

1. **Premium Daily Active Users (DAU)**
   - Formula: `Count of unique premium users per day`
   - Target: Track growth

2. **Premium Monthly Active Users (MAU)**
   - Formula: `Count of unique premium users per month`
   - Target: Track growth

3. **Premium Engagement Rate**
   - Formula: `(premium_engagement events / total premium subscribers) * 100`
   - Target: > 60% daily

4. **Premium Retention Rate**
   - Formula: `(premium users active in period 2 / premium users active in period 1) * 100`
   - Target: > 80% monthly

---

## KPIs

### Primary KPIs

1. **Premium Conversion Rate**
   - Definition: Percentage of free users who convert to premium
   - Formula: `(subscription_success events / total free users) * 100`
   - Target: > 2% monthly
   - Frequency: Daily, Weekly, Monthly

2. **Revenue Growth Rate**
   - Definition: Month-over-month MRR growth
   - Formula: `((MRR_current - MRR_previous) / MRR_previous) * 100`
   - Target: > 10% monthly
   - Frequency: Monthly

3. **Churn Rate**
   - Definition: Percentage of premium users who cancel
   - Formula: `(subscription_cancelled events / total premium subscribers) * 100`
   - Target: < 5% monthly
   - Frequency: Daily, Weekly, Monthly

4. **Customer Lifetime Value (LTV)**
   - Definition: Average revenue per premium user over lifetime
   - Formula: `ARPU / churn_rate`
   - Target: > $60
   - Frequency: Monthly

5. **LTV:CAC Ratio**
   - Definition: Lifetime value to customer acquisition cost ratio
   - Formula: `LTV / CAC`
   - Target: > 3:1
   - Frequency: Monthly

---

### Secondary KPIs

1. **Upgrade Funnel Conversion Rate**
   - Definition: Percentage of users who complete upgrade funnel
   - Formula: `(subscription_success events / upgrade_modal_view events) * 100`
   - Target: > 5%
   - Frequency: Daily, Weekly

2. **Feature Adoption Rate**
   - Definition: Percentage of premium users using premium features
   - Formula: `(premium_feature_usage events / total premium subscribers) * 100`
   - Target: > 50%
   - Frequency: Weekly, Monthly

3. **Premium Engagement Rate**
   - Definition: Percentage of premium users actively using app
   - Formula: `(premium_engagement events / total premium subscribers) * 100`
   - Target: > 60% daily
   - Frequency: Daily, Weekly

4. **Upgrade Prompt Effectiveness**
   - Definition: Percentage of upgrade prompts leading to upgrade attempts
   - Formula: `(upgrade_attempt events / upgrade_modal_view events) * 100`
   - Target: > 30%
   - Frequency: Weekly

5. **Checkout Completion Rate**
   - Definition: Percentage of checkout starts that complete
   - Formula: `(subscription_success events / checkout_start events) * 100`
   - Target: > 50%
   - Frequency: Daily, Weekly

---

### Leading Indicators

1. **Conversion Limit Approach Rate**
   - Indicates potential upgrade intent
   - Target: Track trend

2. **Upgrade Modal View Rate**
   - Indicates awareness of premium features
   - Target: Track by trigger feature

3. **Upgrade Prompt Dismissal Rate**
   - Indicates user resistance
   - Target: < 70%

4. **Feature Usage Frequency**
   - Indicates premium value perception
   - Target: Track trend

---

## Dashboard Structure

### Overview Dashboard

1. **Revenue Metrics**
   - MRR (current, growth %)
   - ARR (current, growth %)
   - ARPU (current, trend)

2. **Conversion Metrics**
   - Premium conversion rate
   - Upgrade funnel conversion rate
   - Checkout completion rate

3. **Retention Metrics**
   - Churn rate
   - Renewal rate
   - Premium retention rate

4. **Engagement Metrics**
   - Premium DAU/MAU
   - Feature adoption rate
   - Premium engagement rate

---

### Funnel Dashboard

1. **Upgrade Funnel**
   - Awareness (upgrade_modal_view)
   - Interest (upgrade_attempt)
   - Consideration (checkout_start)
   - Purchase (subscription_success)

2. **Conversion Rates**
   - Modal view → Attempt
   - Attempt → Checkout start
   - Checkout start → Success

3. **Abandonment Points**
   - Checkout abandonment rate
   - Upgrade prompt dismissal rate

---

### Feature Usage Dashboard

1. **Feature Adoption**
   - Adoption rate by feature
   - Most used features
   - Feature usage trends

2. **Feature Retention**
   - Feature retention rate
   - Feature churn rate

3. **Feature Value**
   - Features correlated with retention
   - Features correlated with upgrades

---

### Cohort Analysis

1. **Subscription Cohorts**
   - Monthly cohorts
   - Retention by cohort
   - Revenue by cohort

2. **Feature Cohorts**
   - Feature adoption by cohort
   - Feature retention by cohort

---

## Implementation

### Frontend Integration

```javascript
import {
  trackConversionLimitHit,
  trackUpgradeAttempt,
  trackSubscriptionSuccess,
  trackPremiumFeatureUsage
} from './lib/premiumAnalytics';

// Track conversion limit hit
if (conversionsToday >= limit) {
  trackConversionLimitHit(conversionsToday, limit);
}

// Track upgrade attempt
trackUpgradeAttempt('monthly', 'strict_halal_mode', 'modal');

// Track subscription success
trackSubscriptionSuccess('monthly', subscriptionId, sessionId);

// Track feature usage
trackStrictHalalModeUsage(true);
```

### Backend Integration

```javascript
// Webhook handler for Stripe events
router.post('/webhook', async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Track subscription success
      await trackSubscriptionSuccess(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      // Track cancellation
      await trackSubscriptionCancelled(event.data.object);
      break;
  }
});
```

---

## Reporting Frequency

- **Daily**: Conversion rates, engagement metrics, funnel metrics
- **Weekly**: Feature usage, upgrade funnel, retention metrics
- **Monthly**: Revenue metrics, churn rate, LTV, cohort analysis

---

## Success Criteria

### Month 1
- Premium conversion rate: > 1%
- MRR: > $100
- Churn rate: < 10%

### Month 3
- Premium conversion rate: > 2%
- MRR: > $500
- Churn rate: < 5%
- Feature adoption: > 40%

### Month 6
- Premium conversion rate: > 3%
- MRR: > $1,500
- Churn rate: < 5%
- Feature adoption: > 50%
- LTV: > $60

---

## Files Created

1. **`frontend/src/lib/premiumAnalytics.js`** - Analytics tracking functions
2. **`PREMIUM_ANALYTICS_DESIGN.md`** - This documentation

---

## Next Steps

1. Integrate analytics into components
2. Set up backend event aggregation
3. Create analytics dashboard
4. Set up alerts for key metrics
5. Implement cohort analysis
