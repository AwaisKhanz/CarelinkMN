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
import { CheckCircle, Star, Crown, Zap, Check } from "lucide-react";
import { billingService } from "@/lib/services/billing.service";
import { toast } from "sonner";
import { SUBSCRIPTION_PLANS as BASE_PLANS } from "@/lib/constants";

// Map icons to plans
const PLAN_ICONS: Record<string, typeof Star> = {
  FREE: Star,
  PRO: CheckCircle,
  PREMIUM: Crown,
  ENTERPRISE: Zap,
};

// Transform base plans to include icons
const SUBSCRIPTION_PLANS = BASE_PLANS.map((plan) => ({
  ...plan,
  icon: PLAN_ICONS[plan.id] || Star,
}));

interface SubscriptionPlanProps {
  data: any;
  onComplete: (data: any) => void;
  onChange?: (data: any) => void;
}

export function SubscriptionPlan({
  data,
  onComplete,
  onChange,
}: SubscriptionPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>(
    data?.subscriptionTier || "FREE"
  );

  // Auto-save when data changes
  useEffect(() => {
    if (onChange) {
      const timeoutId = setTimeout(() => {
        onChange({ subscriptionTier: selectedPlan });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedPlan, onChange]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleComplete = async () => {
    // Free and Enterprise do not require checkout
    if (selectedPlan === "FREE" || selectedPlan === "ENTERPRISE") {
      onComplete({ subscriptionTier: selectedPlan });
      toast.success("Subscription selection saved");
      return;
    }

    // Paid tiers go to Stripe Checkout
    try {
      const tier = selectedPlan as "PRO" | "PREMIUM";
      // Persist the selection locally so we can complete the step after redirect
      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding_selected_plan", tier);
      }
      const url = await billingService.createCheckoutSession(tier, "onboarding");
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to start checkout");
    }
  };

  const selectedPlanDetails = SUBSCRIPTION_PLANS.find(
    (plan) => plan.id === selectedPlan
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Subscription Plan</CardTitle>
          <CardDescription>
            Select a plan that best fits your organization's needs. You can
            upgrade or downgrade at any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const IconComponent = plan.icon || Star; // Default to Star if icon is undefined

              return (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary/60 bg-primary/5 border-2 shadow-lg"
                      : "border-border bg-background hover:shadow-md"
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      <IconComponent
                        className={`h-8 w-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period !== "pricing" && (
                        <span className="text-muted-foreground ml-1">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="mt-2">
                        <Badge variant="healthcareSuccess">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Features included:
                        </h4>
                        <ul className="space-y-1">
                          {plan.features.map((feature, index) => (
                            <li
                              key={index}
                              className="text-sm flex items-start gap-2"
                            >
                              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {plan.limitations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                            Limitations:
                          </h4>
                          <ul className="space-y-1">
                            {plan.limitations.map((limitation, index) => (
                              <li
                                key={index}
                                className="text-sm text-muted-foreground"
                              >
                                • {limitation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {isSelected ? "Selected" : `Choose ${plan.name}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Plan Summary */}
      {selectedPlanDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Plan Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedPlanDetails.name}
                </h3>
                <p className="text-muted-foreground">
                  {selectedPlanDetails.description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {selectedPlanDetails.price}
                  {selectedPlanDetails.period !== "pricing" && (
                    <span className="text-sm text-muted-foreground ml-1">
                      /{selectedPlanDetails.period}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedPlanDetails.id === "FREE" && (
              <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm text-info">
                  <strong>Note:</strong> You can upgrade to a paid plan at any
                  time to unlock more features and unlimited referrals.
                </p>
              </div>
            )}

            {selectedPlanDetails.id === "ENTERPRISE" && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning">
                  <strong>Enterprise Plan:</strong> Our team will contact you
                  within 24 hours to discuss custom pricing and implementation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Free trial period:</span>
              <span>30 days (all paid plans)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Billing cycle:</span>
              <span>Monthly (annual discounts available)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment methods:</span>
              <span>Credit card, ACH, check</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cancellation:</span>
              <span>Cancel anytime, no contracts</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> Billing will begin after your provider
              profile is approved and you start receiving referrals. The free
              plan has no billing requirements.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button onClick={handleComplete} className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          Complete Subscription Selection
        </Button>
      </div>
    </div>
  );
}
