# Stripe Setup Guide

This guide will help you set up Stripe for the CareLinkMN provider onboarding flow.

## Required Environment Variables

Add these to your `.env` file (root directory) or `packages/api/.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"
STRIPE_PRICE_ID_PRO="price_your-pro-price-id"
STRIPE_PRICE_ID_PREMIUM="price_your-premium-price-id"

# Frontend URL (for redirects after Stripe checkout)
FRONTEND_URL="http://localhost:3000"
```

## Step-by-Step Setup

### 1. Get Your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)
4. Add it to `.env` as `STRIPE_SECRET_KEY`

### 2. Create Products and Prices

You need to create two products in Stripe for PRO and PREMIUM tiers:

1. Go to **Products** in Stripe Dashboard
2. Click **+ Add product**
3. Create **PRO** product:
   - Name: "CareLinkMN Pro"
   - Description: "Professional tier subscription"
   - Pricing: Set your monthly/yearly price
   - Copy the **Price ID** (starts with `price_`)
   - Add to `.env` as `STRIPE_PRICE_ID_PRO`
4. Create **PREMIUM** product:
   - Name: "CareLinkMN Premium"
   - Description: "Premium tier subscription"
   - Pricing: Set your monthly/yearly price
   - Copy the **Price ID** (starts with `price_`)
   - Add to `.env` as `STRIPE_PRICE_ID_PREMIUM`

### 3. Set Up Webhook Endpoint

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **+ Add endpoint**
3. Set the endpoint URL:
   - **Development**: `http://localhost:3001/api/webhooks/stripe`
   - **Production**: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add it to `.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Test Mode vs Production Mode

**Test Mode** (Development):

- Use test API keys (`sk_test_...`)
- Use test webhook secret (`whsec_...`)
- Use Stripe test cards (e.g., `4242 4242 4242 4242`)

**Production Mode**:

- Use live API keys (`sk_live_...`)
- Create a new webhook endpoint for production URL
- Use real payment cards

## Testing the Integration

### Test Cards

Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date, any CVC, and any ZIP code.

### Testing Webhooks Locally

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

This will give you a webhook signing secret that you can use for local testing.

## Environment Variables Summary

| Variable                  | Description                | Where to Get It                                 |
| ------------------------- | -------------------------- | ----------------------------------------------- |
| `STRIPE_SECRET_KEY`       | Stripe API secret key      | Dashboard → Developers → API keys               |
| `STRIPE_WEBHOOK_SECRET`   | Webhook signing secret     | Dashboard → Developers → Webhooks               |
| `STRIPE_PRICE_ID_PRO`     | PRO tier price ID          | Dashboard → Products → Copy Price ID            |
| `STRIPE_PRICE_ID_PREMIUM` | PREMIUM tier price ID      | Dashboard → Products → Copy Price ID            |
| `FRONTEND_URL`            | Frontend URL for redirects | Your app URL (default: `http://localhost:3000`) |

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook endpoint URL is correct
2. Verify webhook secret matches
3. Check API server logs for errors
4. Use Stripe Dashboard → Webhooks → View logs to see delivery attempts

### Checkout Session Not Creating

1. Verify `STRIPE_SECRET_KEY` is set correctly
2. Check `STRIPE_PRICE_ID_PRO` or `STRIPE_PRICE_ID_PREMIUM` are valid
3. Ensure prices are active in Stripe Dashboard

### Subscription Not Updating

1. Verify webhook events are being received
2. Check webhook handler logs
3. Ensure metadata is being passed correctly in checkout session

## Next Steps

After setting up Stripe:

1. Test the onboarding flow end-to-end
2. Verify subscriptions are created correctly
3. Test webhook events are processed
4. Set up production webhook endpoint before going live
