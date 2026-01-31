/**
 * Stripe Setup Verification Script
 * Run this to verify your Stripe integration is configured correctly
 * 
 * Usage: node test-stripe.js
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripe() {
  console.log('🔍 Testing Stripe Integration...\n');
  
  let allTestsPassed = true;
  
  // Test 1: API Key
  console.log('1. Testing Stripe API Key...');
  try {
    await stripe.customers.list({ limit: 1 });
    console.log('   ✅ Stripe API key is valid\n');
  } catch (err) {
    console.error('   ❌ Stripe API key error:', err.message);
    console.error('   💡 Check your STRIPE_SECRET_KEY in .env file\n');
    allTestsPassed = false;
    return;
  }
  
  // Test 2: Monthly Price
  console.log('2. Testing Monthly Price...');
  if (!process.env.STRIPE_PRICE_MONTHLY) {
    console.error('   ❌ STRIPE_PRICE_MONTHLY is not set in .env');
    allTestsPassed = false;
  } else {
    try {
      const monthlyPrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY);
      const amount = monthlyPrice.unit_amount / 100;
      const currency = monthlyPrice.currency.toUpperCase();
      console.log(`   ✅ Monthly price found: ${currency} $${amount}/month`);
      console.log(`   📋 Price ID: ${process.env.STRIPE_PRICE_MONTHLY}`);
      if (amount !== 2.99) {
        console.warn(`   ⚠️  Expected $2.99, but price is $${amount}`);
      } else {
        console.log('   ✅ Price amount is correct ($2.99)');
      }
      console.log('');
    } catch (err) {
      console.error('   ❌ Monthly price error:', err.message);
      console.error('   💡 Check your STRIPE_PRICE_MONTHLY in .env file');
      console.error(`   💡 Expected: price_1SvQyCAkaSYomILsLqkxsF6X\n`);
      allTestsPassed = false;
    }
  }
  
  // Test 3: Yearly Price
  console.log('3. Testing Yearly Price...');
  if (!process.env.STRIPE_PRICE_YEARLY) {
    console.error('   ❌ STRIPE_PRICE_YEARLY is not set in .env');
    allTestsPassed = false;
  } else {
    try {
      const yearlyPrice = await stripe.prices.retrieve(process.env.STRIPE_PRICE_YEARLY);
      const amount = yearlyPrice.unit_amount / 100;
      const currency = yearlyPrice.currency.toUpperCase();
      console.log(`   ✅ Yearly price found: ${currency} $${amount}/year`);
      console.log(`   📋 Price ID: ${process.env.STRIPE_PRICE_YEARLY}`);
      if (amount !== 29.99) {
        console.warn(`   ⚠️  Expected $29.99, but price is $${amount}`);
      } else {
        console.log('   ✅ Price amount is correct ($29.99)');
      }
      console.log('');
    } catch (err) {
      console.error('   ❌ Yearly price error:', err.message);
      console.error('   💡 Check your STRIPE_PRICE_YEARLY in .env file');
      console.error(`   💡 Expected: price_1SvQyCAkaSYomILs1iILQygW\n`);
      allTestsPassed = false;
    }
  }
  
  // Test 4: Webhook Secret
  console.log('4. Testing Webhook Secret...');
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('   ❌ STRIPE_WEBHOOK_SECRET is not set in .env');
    console.error('   💡 Get this from Stripe Dashboard → Developers → Webhooks\n');
    allTestsPassed = false;
  } else {
    if (process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
      console.log('   ✅ Webhook secret is set and formatted correctly\n');
    } else {
      console.warn('   ⚠️  Webhook secret should start with "whsec_"\n');
    }
  }
  
  // Test 5: Frontend URL
  console.log('5. Testing Frontend URL...');
  if (!process.env.FRONTEND_URL) {
    console.error('   ❌ FRONTEND_URL is not set in .env');
    console.error('   💡 Set this to your frontend URL (e.g., http://localhost:5173)\n');
    allTestsPassed = false;
  } else {
    console.log(`   ✅ Frontend URL: ${process.env.FRONTEND_URL}\n`);
  }
  
  // Test 6: Test Checkout Session Creation
  console.log('6. Testing Checkout Session Creation...');
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_MONTHLY,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    });
    console.log('   ✅ Checkout session created successfully');
    console.log(`   📋 Session ID: ${session.id}\n`);
  } catch (err) {
    console.error('   ❌ Checkout session error:', err.message);
    console.error('   💡 Check your price IDs and frontend URL\n');
    allTestsPassed = false;
  }
  
  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allTestsPassed) {
    console.log('✅ All Stripe tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test checkout flow in your app');
    console.log('   2. Set up webhook endpoint in Stripe dashboard');
    console.log('   3. Test webhook with Stripe CLI or test payment');
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.');
    console.log('\n📚 Resources:');
    console.log('   - Stripe Dashboard: https://dashboard.stripe.com/test');
    console.log('   - Stripe Docs: https://stripe.com/docs');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run tests
testStripe().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
