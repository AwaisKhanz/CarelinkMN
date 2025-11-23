/**
 * Pricing page constants
 * Defines subscription tiers, features, and pricing information
 */

import { SubscriptionTier } from "@carelink/types";
import type { LucideIcon } from "lucide-react";
import { Heart, Zap, Crown } from "lucide-react";

export interface PricingFeature {
  name: string;
  included: boolean;
}

export interface PricingTier {
  name: SubscriptionTier;
  displayName: string;
  price: string;
  period: string;
  description: string;
  icon: LucideIcon;
  variant: "healthcare" | "healthcareSuccess" | "healthcareInfo" | "healthcareWarning";
  features: PricingFeature[];
  cta: string;
  popular: boolean;
}

export interface PricingAddon {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: LucideIcon;
}

// Subscription Tiers Configuration
export const PRICING_TIERS: PricingTier[] = [
  {
    name: SubscriptionTier.FREE,
    displayName: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    icon: Heart,
    variant: "healthcare",
    features: [
      { name: "Basic listing", included: true },
      { name: "1 photo", included: true },
      { name: "Up to 10 services", included: true },
      { name: "Public search visibility", included: true },
      { name: "Basic analytics", included: true },
      { name: "Email support", included: true },
      { name: "Enhanced visibility", included: false },
      { name: "Priority placement", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: SubscriptionTier.PRO,
    displayName: "Pro",
    price: "$99",
    period: "per month",
    description: "Enhanced visibility and analytics",
    icon: Zap,
    variant: "healthcare",
    features: [
      { name: "Everything in Free", included: true },
      { name: "Up to 5 photos", included: true },
      { name: "Unlimited services", included: true },
      { name: "Enhanced visibility", included: true },
      { name: "Advanced analytics dashboard", included: true },
      { name: "Referral tracking", included: true },
      { name: "Performance insights", included: true },
      { name: "Priority email support", included: true },
      { name: "Maximum boost", included: false },
      { name: "Dedicated account manager", included: false },
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: SubscriptionTier.PREMIUM,
    displayName: "Premium",
    price: "$299",
    period: "per month",
    description: "Maximum exposure and priority support",
    icon: Crown,
    variant: "healthcareSuccess",
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Unlimited photos", included: true },
      { name: "Maximum boost ranking", included: true },
      { name: "Featured placement", included: true },
      { name: "Custom analytics reports", included: true },
      { name: "API access", included: true },
      { name: "White-label options", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Priority phone support", included: true },
      { name: "Custom integrations", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

// Optional Add-ons Configuration
export const PRICING_ADDONS: PricingAddon[] = [
  {
    name: "Additional Homes",
    price: "$29",
    period: "per home/month",
    description: "Add more facilities to your account",
    icon: Heart,
  },
  {
    name: "Advanced Analytics",
    price: "$49",
    period: "per month",
    description: "Deep insights and custom reports",
    icon: Zap,
  },
  {
    name: "Priority Support",
    price: "$99",
    period: "per month",
    description: "24/7 phone and email support",
    icon: Crown,
  },
];

// Pricing FAQ Configuration
export interface PricingFAQ {
  question: string;
  answer: string;
}

export const PRICING_FAQS: PricingFAQ[] = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! Pro and Premium plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, Amex) and ACH transfers for annual plans.",
  },
  {
    question: "Do you offer annual billing?",
    answer:
      "Yes! Save 20% with annual billing. Contact our sales team for annual pricing options.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "You can cancel anytime. Your account will remain active until the end of your billing period, then downgrade to Free.",
  },
  {
    question: "Is there a setup fee?",
    answer:
      "No setup fees! All plans are ready to use immediately with no hidden costs or onboarding charges.",
  },
];

// Pricing Display Configuration
export const PRICING_CONFIG = {
  showAnnualDiscount: true,
  annualDiscountPercent: 20,
  trialDays: 14,
  currency: "USD",
  currencySymbol: "$",
} as const;
