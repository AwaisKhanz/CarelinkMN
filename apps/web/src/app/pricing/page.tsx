"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Heart,
  Star,
  Sparkles,
  BarChart3,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SubscriptionTier } from "@carelink/types";
import {
  PRICING_TIERS,
  PRICING_ADDONS,
  PRICING_FAQS,
} from "@/lib/constants/pricing";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="healthcare-container py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">CareLinkMN</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button size="sm" variant="healthcare" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="healthcare-container">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge variant="healthcarePrimary" className="mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Choose the plan that's right for your organization. All plans
              include our core features with no hidden fees.
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {PRICING_TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card
                  key={tier.name}
                  variant={tier.variant}
                  className={`relative ${
                    tier.popular ? "ring-2 ring-primary shadow-2xl scale-105" : ""
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge variant="healthcarePrimary" className="px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{tier.displayName}</CardTitle>
                    <CardDescription className="mb-4">
                      {tier.description}
                    </CardDescription>
                    <div className="space-y-1">
                      <div className="text-4xl font-bold text-foreground">
                        {tier.price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tier.period}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Button
                      variant={tier.popular ? "healthcare" : "outline"}
                      className="w-full"
                      size="lg"
                      asChild
                    >
                      <Link
                        href={
                          tier.name === SubscriptionTier.PREMIUM
                            ? "/contact"
                            : "/auth/signup"
                        }
                      >
                        {tier.cta}
                      </Link>
                    </Button>
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <span
                            className={
                              feature.included
                                ? "text-sm"
                                : "text-sm text-muted-foreground"
                            }
                          >
                            {feature.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add-ons */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Optional Add-ons
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Enhance your subscription with these optional add-ons
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {PRICING_ADDONS.map((addon) => {
                const Icon = addon.icon;
                return (
                  <Card key={addon.name} variant="healthcare">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{addon.name}</CardTitle>
                      <CardDescription>{addon.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 mb-4">
                        <div className="text-2xl font-bold text-foreground">
                          {addon.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {addon.period}
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/contact">Learn More</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
            </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {PRICING_FAQS.map((faq, idx) => (
              <Card key={idx} variant="healthcare">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          </div>

          {/* CTA */}
          <Card variant="healthcare" className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team is here to help you find the perfect plan for your
              organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="healthcare" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="healthcare-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                © 2025 CareLinkMN. All rights reserved.
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
