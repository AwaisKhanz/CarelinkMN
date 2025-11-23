"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useProviderData } from "@/hooks/use-provider-data";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { billingService } from "@/lib/services/billing.service";
import { useSubscriptionContext } from "@/contexts/subscription-context";
import { SubscriptionTier } from "@carelink/types";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";

export function SubscriptionTab() {
  const { user } = useAuth();
  const { subscription, refetch } = useSubscriptionContext();
  const { provider, refetch: refetchProvider } = useProviderData();
  
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [isCancellingDowngrade, setIsCancellingDowngrade] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);

  // Refresh subscription data
  const refreshSubscriptionData = async () => {
    try {
      // Refresh provider data from context
      await refetchProvider();

      // Refresh subscription from context
      await refetch();
    } catch (err) {
      console.error("Error refreshing subscription data:", err);
    }
  };

  const handleDowngrade = async () => {
    setIsDowngrading(true);
    try {
      const result = await billingService.scheduleDowngrade();
      const effectiveDate =
        result?.cancelAt || result?.currentPeriodEnd || null;
      toast.success(
        effectiveDate
          ? `Your subscription will end on ${format(
              new Date(effectiveDate),
              "MMM dd, yyyy"
            )}. You'll move to the Free plan after that date.`
          : "Your subscription will end at the end of the current billing period. You'll move to the Free plan afterwards."
      );
      await refreshSubscriptionData();
    } catch (err) {
      console.error("Error scheduling downgrade:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to schedule downgrade"
      );
    } finally {
      setIsDowngrading(false);
    }
  };

  const handleCancelDowngrade = async () => {
    setIsCancellingDowngrade(true);
    try {
      await billingService.cancelScheduledDowngrade();
      toast.success("Scheduled downgrade cancelled. Your plan remains active.");
      await refreshSubscriptionData();
    } catch (err) {
      console.error("Error cancelling downgrade:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel downgrade"
      );
    } finally {
      setIsCancellingDowngrade(false);
    }
  };

  // Handle upgrade success/cancel from Stripe redirect
  useEffect(() => {
    const handleStripeRedirect = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const upgrade = searchParams.get("upgrade");

      if (upgrade === "success") {
        toast.success(
          "🎉 Subscription updated successfully! Your changes are now active."
        );
        // Wait a moment for webhooks to process
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Refresh subscription data to get latest status
        await refreshSubscriptionData();
        // Clean up URL
        window.history.replaceState({}, "", "/provider/settings");
      } else if (upgrade === "cancel") {
        toast.error(
          "Subscription update was cancelled. You can try again anytime."
        );
        // Clean up URL
        window.history.replaceState({}, "", "/provider/settings");
      }
    };

    handleStripeRedirect();
  }, [user?.id, refetch]);

  const handleUpgrade = async (tier: SubscriptionTier.PRO | SubscriptionTier.PREMIUM) => {
    setIsUpgrading(true);
    try {
      const url = await billingService.createCheckoutSession(tier);

      // If URL contains our domain, it's a direct redirect (subscription was updated)
      if (url.includes(window.location.origin)) {
        toast.success("🎉 Subscription updated successfully!");
        // Wait for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Refresh data
        await refreshSubscriptionData();
        setIsUpgrading(false);
      } else {
        // It's a Stripe checkout URL
        window.location.href = url;
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update subscription"
      );
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManagingBilling(true);
    try {
      const url = await billingService.createPortalSession();
      window.location.href = url;
    } catch (err) {
      console.error("Error creating portal session:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
      setIsManagingBilling(false);
    }
  };

  if (!provider) return null;

  return (
    <div className="space-y-6">
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Subscription Management
          </CardTitle>
          <CardDescription>
            Manage your subscription plan and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-lg capitalize">
                  {provider.subscriptionTier || SubscriptionTier.FREE} Plan
                </p>
                <p className="text-sm text-muted-foreground">
                  Current subscription tier
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="healthcarePrimary"
                  className="capitalize text-sm px-3 py-1"
                >
                  {provider.subscriptionTier || SubscriptionTier.FREE}
                </Badge>
                {subscription && (
                  <Badge
                    variant={
                      subscription.status === "ACTIVE"
                        ? "healthcareSuccess"
                        : subscription.status === "CANCELLED"
                          ? "healthcareWarning"
                          : "destructive"
                    }
                    className="text-sm px-3 py-1"
                  >
                    {subscription.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Subscription Details */}
            {subscription && (
              <div className="pt-3 border-t border-border space-y-2">
                {subscription.status === "CANCELLED" &&
                  subscription.canceledAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <span className="text-muted-foreground">
                        Cancelled on{" "}
                        <span className="font-medium text-foreground">
                          {format(
                            new Date(subscription.canceledAt),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </span>
                    </div>
                  )}
                {subscription.status === "CANCELLED" &&
                  subscription.currentPeriodEnd && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Access until{" "}
                        <span className="font-medium text-foreground">
                          {format(
                            new Date(subscription.currentPeriodEnd),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </span>
                    </div>
                  )}
                {subscription.status === "ACTIVE" &&
                  subscription.cancelAt && (
                    <div className="flex flex-col gap-3 text-sm rounded-md bg-warning/10 border border-warning/30 px-3 py-3">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-warning mt-0.5" />
                        <span className="text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Scheduled to end on{" "}
                            {format(
                              new Date(subscription.cancelAt),
                              "MMM dd, yyyy"
                            )}
                          </span>
                          . You’ll continue to have{" "}
                          {provider.subscriptionTier?.toLowerCase() ??
                            "paid"}{" "}
                          features until this date, then automatically move
                          to the Free plan.
                        </span>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelDowngrade}
                          disabled={isCancellingDowngrade}
                        >
                          {isCancellingDowngrade ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            "Cancel Downgrade"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                {subscription.status === "ACTIVE" &&
                  !subscription.cancelAt &&
                  subscription.currentPeriodEnd && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-muted-foreground">
                        Renews on{" "}
                        <span className="font-medium text-foreground">
                          {format(
                            new Date(subscription.currentPeriodEnd),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </span>
                    </div>
                  )}
                {subscription.status === "ACTIVE" &&
                  provider.subscriptionTier !== SubscriptionTier.FREE &&
                  !subscription.cancelAt && (
                    <div className="pt-3 flex flex-wrap gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDowngrade}
                        disabled={isDowngrading}
                      >
                        {isDowngrading ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Cancel Subscription"
                        )}
                      </Button>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Renew Cancelled Subscription */}
          {subscription?.status === "CANCELLED" && (
            <>
              <Separator />
              <div className="p-4 rounded-lg border-2 border-destructive bg-destructive/5">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-base mb-1">
                      Your subscription has been cancelled
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You'll have access to {provider.subscriptionTier}{" "}
                      features until{" "}
                      {format(
                        new Date(subscription.currentPeriodEnd),
                        "MMMM dd, yyyy"
                      )}
                      . Renew now to continue enjoying premium features.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    handleUpgrade(
                      provider.subscriptionTier as SubscriptionTier.PRO | SubscriptionTier.PREMIUM
                    )
                  }
                  disabled={isUpgrading}
                  className="w-full"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Renew {provider.subscriptionTier} Plan</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Available Plans */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              {subscription?.status === "CANCELLED"
                ? "Other Plans"
                : provider.subscriptionTier === SubscriptionTier.FREE
                  ? "Available Plans"
                  : "Upgrade or Change Plan"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBSCRIPTION_PLANS.filter(
                (plan) =>
                  plan.id === SubscriptionTier.PRO ||
                  plan.id === SubscriptionTier.PREMIUM ||
                  plan.id === SubscriptionTier.FREE
              ).map((plan) => {
                const isFreePlan = plan.id === SubscriptionTier.FREE;
                const currentTier = provider.subscriptionTier || SubscriptionTier.FREE;
                const isCurrentPlan = plan.id === currentTier;
                const downgradeScheduled = !!subscription?.cancelAt;
                const canDowngrade =
                  isFreePlan &&
                  provider.subscriptionTier &&
                  provider.subscriptionTier !== SubscriptionTier.FREE &&
                  subscription?.status === "ACTIVE" &&
                  !downgradeScheduled;

                const buttonDisabled = isFreePlan
                  ? downgradeScheduled
                    ? isCancellingDowngrade
                    : !canDowngrade || isDowngrading
                  : isUpgrading || isCurrentPlan;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all",
                      isCurrentPlan && !isFreePlan
                        ? "border-success bg-success/5"
                        : plan.recommended && !isFreePlan
                          ? "border-primary bg-primary/5"
                          : isFreePlan && downgradeScheduled
                            ? "border-warning bg-warning/10"
                            : "border-border bg-background",
                      isCurrentPlan && !isFreePlan && "opacity-75"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-base">
                          {plan.name}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {isCurrentPlan && (
                          <Badge
                            variant="healthcareSuccess"
                            className="text-xs"
                          >
                            Current Plan
                          </Badge>
                        )}
                        {!isCurrentPlan && plan.recommended && (
                          <Badge
                            variant="healthcarePrimary"
                            className="text-xs"
                          >
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-2xl font-bold mb-4">
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </p>
                    <ul className="space-y-2 mb-4">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-xs flex items-start gap-2"
                        >
                          <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => {
                        if (isFreePlan) {
                          if (downgradeScheduled) {
                            handleCancelDowngrade();
                          } else {
                            handleDowngrade();
                          }
                        } else {
                          handleUpgrade(plan.id as SubscriptionTier.PRO | SubscriptionTier.PREMIUM);
                        }
                      }}
                      disabled={buttonDisabled}
                      size="sm"
                      className="w-full"
                      variant={
                        isCurrentPlan && !isFreePlan
                          ? "outline"
                          : plan.recommended && !isFreePlan
                            ? "default"
                            : "outline"
                      }
                    >
                      {isFreePlan ? (
                        provider.subscriptionTier === SubscriptionTier.FREE ? (
                          "Current Plan"
                        ) : downgradeScheduled ? (
                          isCancellingDowngrade ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            "Cancel Downgrade"
                          )
                        ) : isDowngrading ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          "Schedule Downgrade"
                        )
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : isUpgrading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : subscription?.status === "CANCELLED" ? (
                        `Renew ${plan.name}`
                      ) : (
                        `Change to ${plan.name}`
                      )}
                    </Button>
                    {isFreePlan &&
                      downgradeScheduled &&
                      subscription?.cancelAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Downgrade takes effect on{" "}
                          <span className="font-medium text-foreground">
                            {format(
                              new Date(subscription.cancelAt),
                              "MMM dd, yyyy"
                            )}
                          </span>
                          .
                        </p>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manage Billing Button */}
          {(provider.subscriptionTier === SubscriptionTier.PRO ||
            provider.subscriptionTier === SubscriptionTier.PREMIUM) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Billing Portal</p>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.status === "CANCELLED"
                        ? "View invoices and reactivate subscription"
                        : "Manage payment methods, view invoices, and cancel subscription"}
                    </p>
                  </div>
                  <Button
                    onClick={handleManageBilling}
                    disabled={isManagingBilling}
                    variant="outline"
                    size="sm"
                  >
                    {isManagingBilling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        {subscription?.status === "CANCELLED"
                          ? "Reactivate Subscription"
                          : "Manage Billing"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
