"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/use-subscription";
import { useSubscriptionContext } from "@/contexts/subscription-context";
import { SubscriptionTier } from "@carelink/types";
import { Loader2, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { PLAN_HIERARCHY } from "@/lib/constants/subscription";

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredPlan?: SubscriptionTier;
  feature?: string;
  featureDescription?: string;
  showLoading?: boolean;
  showError?: boolean;
  redirectOnFail?: boolean;
  redirectPath?: string;
}

/**
 * Guard component that checks subscription tier before allowing access
 * Can be used at layout or page level to gate features based on subscription
 */
export function SubscriptionGuard({
  children,
  requiredPlan = SubscriptionTier.FREE,
  feature,
  featureDescription,
  showLoading = true,
  showError = true,
  redirectOnFail = false,
  redirectPath,
}: SubscriptionGuardProps) {
  const router = useRouter();
  const { tier, isLoading: tierLoading } = useSubscription();
  const { subscription, isLoading: subscriptionLoading } = useSubscriptionContext();
  const [isChecking, setIsChecking] = useState(true);

  const isLoading = tierLoading || subscriptionLoading;

  useEffect(() => {
    if (isLoading) return;

    const hasAccess = PLAN_HIERARCHY[tier] >= PLAN_HIERARCHY[requiredPlan];

    if (!hasAccess && redirectOnFail) {
      const path = redirectPath || "/provider/settings";
      router.push(path);
      return;
    }

    setIsChecking(false);
  }, [tier, requiredPlan, isLoading, redirectOnFail, redirectPath, router]);

  // Show loading state
  if (isLoading || isChecking) {
    if (!showLoading) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking subscription access...</p>
        </div>
      </div>
    );
  }

  // Check access
  const hasAccess = PLAN_HIERARCHY[tier] >= PLAN_HIERARCHY[requiredPlan];

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show error/upgrade state
  if (!showError) return null;

  // If feature is specified, show upgrade banner
  if (feature) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl">
          <UpgradeBanner
            feature={feature}
            currentPlan={tier as "FREE" | "PRO" | "PREMIUM" | "ENTERPRISE"}
            requiredPlan={requiredPlan as "PRO" | "PREMIUM" | "ENTERPRISE"}
            description={featureDescription}
          />
        </div>
      </div>
    );
  }

  // Generic subscription required message
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="h-12 w-12 text-warning mx-auto mb-4" />
          <CardTitle>Subscription Required</CardTitle>
          <CardDescription>
            This feature requires a {requiredPlan} subscription or higher.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Plan</span>
              <Badge variant="outline">{tier}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Required Plan</span>
              <Badge variant="healthcareWarning">{requiredPlan}</Badge>
            </div>
          </div>

          {subscription && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade your subscription to access this feature.
              </p>
            </div>
          )}

          <Button
            onClick={() => router.push("/provider/settings")}
            className="w-full"
          >
            View Subscription Options
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

