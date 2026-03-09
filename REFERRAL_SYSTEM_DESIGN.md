# Halal Kitchen Referral System Design

## Overview
A simple, ethical referral system that rewards users with free premium time for sharing Halal Kitchen with friends and family.

---

## Core Principles

1. **Simple:** One-click share, easy to understand
2. **Ethical:** No spam, no manipulation, clear value
3. **Rewarding:** Meaningful premium time for both referrer and referee
4. **Trustworthy:** Transparent terms, no hidden catches

---

## Referral Flow

### Step 1: User Initiates Referral

**Trigger Points:**
- Settings page: "Refer Friends" button
- Post-conversion: Subtle prompt after successful recipe conversion
- Profile tab: Dedicated referral section
- Premium upgrade modal: "Share with friends instead" option

**User Action:**
- Clicks "Refer Friends" or "Share Halal Kitchen"
- Sees referral dashboard with:
  - Unique referral link
  - Share count
  - Rewards earned
  - Copy link button
  - Share buttons (WhatsApp, Email, SMS, Copy link)

---

### Step 2: Share Link Generation

**Link Format:**
```
https://halalkitchen.app/signup?ref=[USER_ID]
```

**Example:**
```
https://halalkitchen.app/signup?ref=abc123xyz
```

**Link Features:**
- Short, memorable URL
- Auto-detects referrer on signup
- Works across all platforms
- Tracks referral source

---

### Step 3: Friend Signs Up

**Friend Experience:**
1. Clicks referral link
2. Lands on signup page (with referrer pre-filled)
3. Creates account
4. Sees welcome message: "You were referred by [Friend's Name]!"
5. Gets immediate reward (see Reward Logic)

**Referrer Experience:**
1. Receives notification: "[Friend's Name] signed up using your link!"
2. Reward credited to account
3. Can see referral status in dashboard

---

### Step 4: Friend Converts First Recipe

**Conversion Requirement:**
- Friend must convert at least 1 recipe within 30 days
- This prevents fake accounts and ensures genuine engagement

**Reward Unlock:**
- Both referrer and referee get full rewards after first conversion
- Prevents gaming the system
- Ensures quality referrals

---

## Reward Logic

### Reward Structure

**For Referrer (Person who shares):**
- **1 referral = 7 days free premium**
- **3 referrals = 30 days free premium** (bonus: 9 extra days)
- **5 referrals = 60 days free premium** (bonus: 5 extra days)
- **10 referrals = 90 days free premium** (bonus: 30 extra days)

**For Referee (Person who signs up):**
- **Signs up via referral = 7 days free premium**
- **Converts first recipe = Additional 7 days free premium** (total: 14 days)

### Reward Timing

**Immediate Rewards:**
- Referee gets 7 days premium immediately upon signup
- Referrer gets notification that referral was successful

**Conversion-Based Rewards:**
- After referee converts first recipe (within 30 days):
  - Referee gets additional 7 days premium
  - Referrer gets their reward (7 days, or counts toward milestone)

**Milestone Bonuses:**
- Referrer gets bonus days when hitting milestones (3, 5, 10 referrals)
- Bonus is applied immediately when milestone is reached

### Reward Limits

**Per User Limits:**
- Maximum 90 days free premium from referrals (prevents abuse)
- Rewards expire if not used within 90 days of earning
- One reward per unique referral (no duplicate rewards)

**System Limits:**
- Maximum 50 referrals per user per month (prevents spam)
- Referrals must be unique users (email/phone verification)
- No self-referrals (same email/device detection)

---

## Database Schema

### Referrals Table

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  referral_link TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, signed_up, converted, rewarded, expired
  signed_up_at TIMESTAMP,
  first_conversion_at TIMESTAMP,
  referrer_reward_days INTEGER DEFAULT 0,
  referee_reward_days INTEGER DEFAULT 0,
  referrer_reward_claimed_at TIMESTAMP,
  referee_reward_claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referrer_id, referee_id) -- Prevent duplicate referrals
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);
```

### Referral Rewards Table

```sql
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES referrals(id) ON DELETE SET NULL,
  reward_type VARCHAR(20) NOT NULL, -- signup_bonus, conversion_bonus, milestone_bonus
  premium_days INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, expired, used
  earned_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
```

---

## User Interface

### Referral Dashboard

**Location:** Profile tab → "Refer Friends" section

**Components:**
1. **Header:**
   - "Share Halal Kitchen with Friends"
   - Subtitle: "Earn free premium time for every friend who joins"

2. **Stats Card:**
   - Total referrals: X
   - Successful referrals: Y (converted at least 1 recipe)
   - Free premium earned: Z days
   - Next milestone: "3 more referrals for 30 days bonus"

3. **Referral Link:**
   - Copyable link with copy button
   - QR code for easy sharing
   - Short link option (if implemented)

4. **Share Buttons:**
   - WhatsApp
   - Email
   - SMS
   - Copy link
   - Social media (optional)

5. **Referral History:**
   - List of referrals with status
   - Shows: Name, Signup date, Conversion status, Reward status

6. **Reward History:**
   - List of rewards earned
   - Shows: Type, Days, Date earned, Status

---

### Referral Prompt (Post-Conversion)

**Location:** After successful recipe conversion

**Design:**
- Small, non-intrusive banner
- Appears only once per session
- Easy to dismiss
- Clear value proposition

**Copy:**
"Loved this conversion? Share Halal Kitchen with a friend and you both get 7 days free premium!"

**CTA:**
- "Share Now" (primary)
- "Maybe Later" (dismiss)

---

## Copy Examples

### Referral Dashboard Header

**Title:**
"Share Halal Kitchen with Friends"

**Subtitle:**
"Earn free premium time for every friend who joins and converts their first recipe. You both win!"

---

### Share Message Templates

#### WhatsApp Template

```
Hey! I've been using Halal Kitchen to convert recipes to halal - it's super helpful! 

You can check if ingredients are halal and convert any recipe instantly. 

Sign up with my link and we both get 7 days free premium:
[REFERRAL_LINK]

It's free to start and really easy to use! 🕌✨
```

#### Email Template

**Subject:** "Check out Halal Kitchen - we both get free premium!"

**Body:**
```
Hi [Friend's Name],

I've been using Halal Kitchen to convert recipes to halal, and I thought you might find it useful too!

It helps you:
- Check if ingredients are halal instantly
- Convert any recipe to halal-compliant alternatives
- Get clear Islamic guidance with Quranic references

If you sign up using my link, we both get 7 days of free premium:
[REFERRAL_LINK]

It's completely free to start, and the premium features are really helpful for unlimited conversions and advanced features.

Let me know if you have any questions!

Best,
[Your Name]
```

#### SMS Template

```
Hey! I've been using Halal Kitchen to convert recipes to halal. Sign up with my link and we both get 7 days free premium: [REFERRAL_LINK]
```

---

### Notification Messages

#### Referrer Notifications

**Friend Signed Up:**
"🎉 [Friend's Name] signed up using your referral link! They'll get 7 days free premium when they convert their first recipe, and you'll get your reward too!"

**Friend Converted First Recipe:**
"✅ [Friend's Name] converted their first recipe! You've earned 7 days free premium. Check your referral dashboard to see your rewards."

**Milestone Reached:**
"🎊 Congratulations! You've reached [X] referrals and earned a [Y] days bonus! Your total free premium: [Z] days."

#### Referee Notifications

**Welcome (via Referral):**
"Welcome to Halal Kitchen! You were referred by [Friend's Name]. You've earned 7 days free premium. Convert your first recipe to unlock an additional 7 days!"

**First Conversion:**
"🎉 You've converted your first recipe! You've earned an additional 7 days free premium (14 days total). Enjoy unlimited conversions!"

---

### Settings Page Copy

**Section Title:**
"Refer Friends"

**Description:**
"Share Halal Kitchen with friends and family. For every friend who signs up and converts their first recipe, you both get 7 days free premium."

**CTA Button:**
"Share Halal Kitchen"

**Stats (if applicable):**
- "You've referred X friends"
- "You've earned Y days free premium"

---

### Post-Conversion Prompt Copy

**Banner Text:**
"Loved this conversion? Share Halal Kitchen with a friend!"

**Subtext:**
"You both get 7 days free premium when they sign up and convert their first recipe."

**Buttons:**
- "Share Now" (primary, green)
- "Maybe Later" (secondary, dismiss)

---

### Referral Dashboard Copy

**Header:**
"Earn Free Premium by Sharing"

**Subheader:**
"For every friend who signs up and converts their first recipe, you both get 7 days free premium."

**Stats Section:**
- "Total Referrals: X"
- "Successful Referrals: Y" (converted at least 1 recipe)
- "Free Premium Earned: Z days"
- "Next Milestone: [X] more referrals for [Y] days bonus"

**Referral Link Section:**
- "Your Referral Link:"
- Copy button with feedback: "Link copied!"

**Share Buttons:**
- "Share via WhatsApp"
- "Share via Email"
- "Share via SMS"
- "Copy Link"

**Referral History:**
- "Your Referrals"
- Table columns: Name, Signed Up, Converted, Reward Status

**Reward History:**
- "Your Rewards"
- Table columns: Type, Days, Date Earned, Status

---

## Anti-Spam Measures

### Technical Measures

1. **Rate Limiting:**
   - Maximum 50 referrals per user per month
   - Maximum 10 referral links generated per day
   - Cooldown period between shares (5 minutes)

2. **Fraud Detection:**
   - Same email/phone detection (no self-referrals)
   - Same device/IP detection (flag suspicious activity)
   - Bot detection (CAPTCHA on signup)
   - Email verification required

3. **Quality Checks:**
   - Referee must convert at least 1 recipe within 30 days
   - Referee must be active (not just signup and leave)
   - Minimum account age before rewards are granted

4. **Monitoring:**
   - Track referral patterns (flag unusual activity)
   - Monitor for abuse (multiple accounts, fake referrals)
   - Automatic flagging of suspicious behavior

### User Education

**Clear Terms:**
- "Referrals must be genuine friends and family"
- "No fake accounts or self-referrals"
- "Rewards are subject to verification"
- "We reserve the right to revoke rewards for abuse"

**Transparency:**
- Show referral status clearly
- Explain why rewards might be pending
- Provide support for questions

---

## Implementation Phases

### Phase 1: Basic Referral System
- Referral link generation
- Signup tracking
- Basic rewards (7 days for referrer and referee)
- Simple dashboard

### Phase 2: Conversion Tracking
- Track first recipe conversion
- Conversion-based rewards
- Enhanced notifications

### Phase 3: Milestones & Bonuses
- Milestone tracking (3, 5, 10 referrals)
- Bonus rewards
- Enhanced dashboard with progress

### Phase 4: Advanced Features
- QR code generation
- Social sharing integration
- Referral analytics
- Leaderboard (optional, if desired)

---

## API Endpoints

### Generate Referral Link

```
POST /api/referrals/generate
Authorization: Bearer [token]

Response:
{
  "referral_code": "abc123xyz",
  "referral_link": "https://halalkitchen.app/signup?ref=abc123xyz",
  "qr_code_url": "https://halalkitchen.app/qr/abc123xyz"
}
```

### Get Referral Stats

```
GET /api/referrals/stats
Authorization: Bearer [token]

Response:
{
  "total_referrals": 5,
  "successful_referrals": 3,
  "pending_referrals": 2,
  "total_reward_days": 21,
  "available_reward_days": 14,
  "next_milestone": {
    "target": 10,
    "current": 5,
    "bonus_days": 30
  }
}
```

### Get Referral History

```
GET /api/referrals/history
Authorization: Bearer [token]

Response:
{
  "referrals": [
    {
      "id": "ref_123",
      "referee_name": "John Doe",
      "referee_email": "john@example.com",
      "status": "converted",
      "signed_up_at": "2026-01-15T10:00:00Z",
      "first_conversion_at": "2026-01-16T14:30:00Z",
      "reward_days": 7,
      "reward_status": "active"
    }
  ]
}
```

### Track Referral Signup

```
POST /api/referrals/track-signup
Body: {
  "referral_code": "abc123xyz",
  "user_id": "user_456"
}

Response:
{
  "success": true,
  "referrer_reward": {
    "days": 7,
    "status": "pending_conversion"
  },
  "referee_reward": {
    "days": 7,
    "status": "active"
  }
}
```

### Track Referral Conversion

```
POST /api/referrals/track-conversion
Body: {
  "user_id": "user_456"
}

Response:
{
  "success": true,
  "referee_reward": {
    "additional_days": 7,
    "total_days": 14,
    "status": "active"
  },
  "referrer_reward": {
    "days": 7,
    "status": "active"
  }
}
```

---

## Reward Activation Logic

### Automatic Activation

**When Rewards Are Activated:**
1. Referee signup → Referee gets 7 days immediately
2. Referee converts first recipe → Both get additional rewards
3. Referrer milestone reached → Bonus days activated immediately

**Reward Expiration:**
- Rewards expire 90 days after earning if not activated
- Active premium time extends current subscription or starts new period
- Cannot stack beyond maximum (90 days from referrals)

### Manual Activation

**User Control:**
- Users can see pending rewards in dashboard
- Rewards activate automatically when earned
- Users can see expiration dates
- Clear indication of when premium time will be applied

---

## Success Metrics

### Key Metrics to Track

1. **Referral Rate:**
   - % of users who share referral link
   - Average referrals per user
   - Conversion rate (signup → first conversion)

2. **Engagement:**
   - % of referees who convert first recipe
   - Time to first conversion
   - Long-term retention of referred users

3. **Reward Effectiveness:**
   - % of users who use earned premium time
   - Premium conversion rate after free period
   - Cost per acquisition via referrals

4. **Abuse Prevention:**
   - % of flagged referrals
   - False positive rate
   - User complaints about rewards

---

## Example User Journey

### Referrer Journey

1. **Day 1:** User converts a recipe, sees post-conversion prompt
2. **Day 1:** User clicks "Share Now", gets referral link
3. **Day 1:** User shares link via WhatsApp with 3 friends
4. **Day 2:** Friend A signs up → User gets notification
5. **Day 3:** Friend A converts first recipe → User gets 7 days premium
6. **Day 4:** Friend B signs up → User gets notification
7. **Day 5:** Friend B converts first recipe → User gets 7 days premium (total: 14 days)
8. **Day 6:** Friend C signs up and converts → User reaches 3 referrals milestone
9. **Day 6:** User gets 30 days bonus (total: 44 days free premium)

### Referee Journey

1. **Day 1:** Friend receives referral link via WhatsApp
2. **Day 1:** Friend clicks link, lands on signup page
3. **Day 1:** Friend creates account, sees welcome message with 7 days premium
4. **Day 2:** Friend converts first recipe
5. **Day 2:** Friend gets additional 7 days premium (total: 14 days)
6. **Day 2:** Friend receives notification about reward

---

## Summary

**Referral System Features:**
✅ Simple share link generation
✅ Clear reward structure (7 days per referral, milestone bonuses)
✅ Low friction (one-click share, automatic rewards)
✅ Anti-spam measures (conversion requirement, rate limiting, fraud detection)
✅ Trustworthy (transparent terms, clear communication)
✅ Ethical (no manipulation, genuine value for both parties)

**Ready for Implementation:**
- Database schema defined
- API endpoints specified
- UI components outlined
- Copy examples provided
- Anti-spam measures documented

This system balances user incentives with abuse prevention, ensuring genuine growth while maintaining trust and quality.
