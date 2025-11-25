"use client";

import { useEffect, useState } from "react";
import { usePageMetadata } from "../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Eye, MessageSquare, Users, Calendar, AlertCircle } from "lucide-react";
import { boostService } from "@/lib/services/boost.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { BoostTier, BoostStatus } from "@carelink/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

function BoostPageContent() {
  const { setTitle, setDescription } = usePageMetadata();
  const { user } = useAuth();
  const [boostStatus, setBoostStatus] = useState<BoostStatus | null>(null);
  const [boostTiers, setBoostTiers] = useState<BoostTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    setTitle("Boost Your Visibility");
    setDescription("Increase your provider visibility in search results");
  }, [setTitle, setDescription]);

  useEffect(() => {
    loadBoostData();
  }, [user]);

  const loadBoostData = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      const [status, tiers] = await Promise.all([
        boostService.getStatus(user.organizationId),
        boostService.getPricing(),
      ]);
      setBoostStatus(status);
      setBoostTiers(tiers);
    } catch (error) {
      console.error("Error loading boost data:", error);
      toast.error("Failed to load boost information");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (boostLevel: number, isRecurring: boolean) => {
    if (!user?.organizationId) return;

    try {
      setPurchasing(true);
      const session = await boostService.createCheckoutSession({
        providerId: user.organizationId,
        boostLevel,
        isRecurring,
      });

      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to start checkout process");
      setPurchasing(false);
    }
  };

  const handleCancelBoost = async () => {
    if (!user?.organizationId) return;

    try {
      await boostService.cancelBoost({ providerId: user.organizationId });
      toast.success("Boost cancelled successfully");
      loadBoostData();
    } catch (error) {
      console.error("Error cancelling boost:", error);
      toast.error("Failed to cancel boost");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const isActive = boostStatus?.isActive || false;
  const currentTier = boostStatus?.tier;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-amber-500" />
            Boost Your Visibility
          </h1>
          <p className="text-muted-foreground mt-1">
            Increase your ranking in search results and get more inquiries
          </p>
        </div>
      </div>

      {/* Current Status */}
      {isActive && currentTier && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Active Boost
            </CardTitle>
            <CardDescription>Your current boost subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-900">{currentTier.name}</p>
                <p className="text-sm text-amber-700">
                  +{currentTier.influence}% ranking influence
                </p>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                ${(currentTier.monthlyPrice / 100).toFixed(0)}/month
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {boostStatus.metrics.views}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inquiries</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {boostStatus.metrics.inquiries}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placements</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {boostStatus.metrics.placements}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {boostStatus.expiresAt
                    ? new Date(boostStatus.expiresAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {boostStatus.isRecurring && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCancelBoost}
                  className="w-full sm:w-auto"
                >
                  Cancel Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Boosted providers appear higher in search results. Your quality and relevance still matter - boosts provide up to 30% ranking influence.
        </AlertDescription>
      </Alert>

      {/* Boost Tiers */}
      <div className="grid gap-6 md:grid-cols-3">
        {boostTiers.map((tier) => {
          const isCurrent = currentTier?.level === tier.level;
          const isUpgrade = isActive && tier.level > (currentTier?.level || 0);
          const isDowngrade = isActive && tier.level < (currentTier?.level || 0);

          return (
            <Card
              key={tier.level}
              className={`relative ${
                isCurrent
                  ? "border-amber-400 shadow-lg"
                  : tier.level === 3
                  ? "border-blue-200"
                  : ""
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-500 text-white">Current Plan</Badge>
                </div>
              )}
              {tier.level === 3 && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  {tier.name}
                </CardTitle>
                <CardDescription>
                  Level {tier.level} Boost
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-4xl font-bold">
                    ${(tier.monthlyPrice / 100).toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">+{tier.influence}% ranking boost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Increased visibility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-sm">More inquiries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Higher placement rate</span>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  {!isCurrent && (
                    <>
                      <Button
                        className="w-full"
                        variant={tier.level === 3 ? "default" : "outline"}
                        onClick={() => handlePurchase(tier.level, true)}
                        disabled={purchasing}
                      >
                        {isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Subscribe"} Monthly
                      </Button>
                      <Button
                        className="w-full"
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePurchase(tier.level, false)}
                        disabled={purchasing}
                      >
                        One-time (30 days)
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>How Boost Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">What is a boost?</h4>
            <p className="text-sm text-muted-foreground">
              Boosts increase your provider's ranking in search results, making you more visible to case managers and families searching for care.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">How much influence does it have?</h4>
            <p className="text-sm text-muted-foreground">
              Boosts provide up to 30% ranking influence. Your quality, services, and availability still matter significantly in search rankings.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! Monthly subscriptions can be cancelled at any time. Your boost will remain active until the end of your billing period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BoostPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.SETTINGS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage boosts. Only provider owners can purchase boosts."
    >
      <BoostPageContent />
    </RequirePermission>
  );
}
