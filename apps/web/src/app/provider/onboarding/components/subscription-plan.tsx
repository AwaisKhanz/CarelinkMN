"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, CheckCircle } from "lucide-react";
import { SUBSCRIPTION_PLANS as BASE_PLANS } from "@/lib/constants";

// Map icons to plans (since subscription-plan.tsx uses a different structure)
const PLAN_ICONS: Record<string, typeof Check> = {
  FREE: Check,
  BASIC: Star,
  PRO: Star,
  PREMIUM: Zap,
  ENTERPRISE: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "default",
  BASIC: "healthcare",
  PRO: "healthcare",
  PREMIUM: "healthcareSuccess",
  ENTERPRISE: "healthcareWarning",
};

// Transform base plans to include icons and colors for this component
const SUBSCRIPTION_PLANS = BASE_PLANS.map((plan) => ({
  ...plan,
  icon: PLAN_ICONS[plan.id] || Check,
  color: PLAN_COLORS[plan.id] || "default",
  // Handle price conversion (some plans have "$49", others have numbers)
  price:
    typeof plan.price === "string" && plan.price.startsWith("$")
      ? parseInt(plan.price.replace("$", "")) || 0
      : plan.price,
  // Map PRO to BASIC for backward compatibility
  id: plan.id === "PRO" ? "BASIC" : plan.id,
})).map((plan) => {
  // Add custom flag for ENTERPRISE
  if (plan.id === "ENTERPRISE") {
    return { ...plan, custom: true };
  }
  return plan;
});

interface SubscriptionPlanProps {
  data: {
    subscriptionTier: string;
  };
  onComplete: (data: any) => void;
  onValidateRequest?: (validate: () => boolean) => void;
}

export function SubscriptionPlan({
  data,
  onComplete,
  onValidateRequest,
}: SubscriptionPlanProps) {
  const [selectedPlan, setSelectedPlan] = useState(data.subscriptionTier);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const onCompleteRef = useRef(onComplete);
  const onValidateRequestRef = useRef(onValidateRequest);

  // Sync selectedPlan with data prop when it changes
  useEffect(() => {
    setSelectedPlan(data.subscriptionTier);
  }, [data.subscriptionTier]);

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onValidateRequestRef.current = onValidateRequest;
  }, [onComplete, onValidateRequest]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedPlan) {
      newErrors.subscriptionTier = "Please select a subscription plan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);

    // Clear error when user selects a plan
    if (errors.subscriptionTier) {
      setErrors((prev) => ({ ...prev, subscriptionTier: "" }));
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete({ subscriptionTier: selectedPlan });
    }
  };

  // Expose validation function to parent
  useEffect(() => {
    if (onValidateRequestRef.current) {
      onValidateRequestRef.current(() => {
        if (validateForm()) {
          onCompleteRef.current({ subscriptionTier: selectedPlan });
          return true;
        }
        return false;
      });
    }
  }, [selectedPlan]); // Only re-register when selectedPlan changes

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Choose Your Plan
          </CardTitle>
          <CardDescription>
            Select the subscription plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                } ${plan.popular ? "border-primary/20" : ""}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <CardHeader className="text-center">
                  {plan.popular && (
                    <Badge
                      variant="healthcarePrimary"
                      className="mb-2 w-fit mx-auto"
                    >
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex justify-center mb-2">
                    <plan.icon
                      className={`w-8 h-8 ${
                        plan.color === "healthcare"
                          ? "text-primary"
                          : plan.color === "healthcareSuccess"
                            ? "text-success"
                            : plan.color === "healthcareWarning"
                              ? "text-warning"
                              : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    {plan.custom ? (
                      <div className="text-2xl font-bold">Custom</div>
                    ) : (
                      <div className="text-2xl font-bold">
                        ${plan.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.period}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Limitations:
                      </h4>
                      <ul className="space-y-1">
                        {plan.limitations.map((limitation, index) => (
                          <li
                            key={index}
                            className="text-xs text-muted-foreground"
                          >
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {errors.subscriptionTier && (
            <p className="text-sm text-destructive mt-4">
              {errors.subscriptionTier}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
          <CardDescription>Compare features across all plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Features</th>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <th key={plan.id} className="text-center py-2 font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Number of Homes</td>
                  <td className="text-center py-2">2</td>
                  <td className="text-center py-2">10</td>
                  <td className="text-center py-2">Unlimited</td>
                  <td className="text-center py-2">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Provider Profile</td>
                  <td className="text-center py-2">Basic</td>
                  <td className="text-center py-2">Enhanced</td>
                  <td className="text-center py-2">Premium</td>
                  <td className="text-center py-2">Premium</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Search Placement</td>
                  <td className="text-center py-2">Standard</td>
                  <td className="text-center py-2">Priority</td>
                  <td className="text-center py-2">Top</td>
                  <td className="text-center py-2">Top</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Support</td>
                  <td className="text-center py-2">Email</td>
                  <td className="text-center py-2">Phone & Email</td>
                  <td className="text-center py-2">24/7 Priority</td>
                  <td className="text-center py-2">Dedicated Manager</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Analytics</td>
                  <td className="text-center py-2">Basic</td>
                  <td className="text-center py-2">Advanced</td>
                  <td className="text-center py-2">Advanced</td>
                  <td className="text-center py-2">Custom</td>
                </tr>
                <tr>
                  <td className="py-2">API Access</td>
                  <td className="text-center py-2">-</td>
                  <td className="text-center py-2">-</td>
                  <td className="text-center py-2">✓</td>
                  <td className="text-center py-2">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Your subscription will be billed monthly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• All plans include a 14-day free trial</p>
            <p>• You can upgrade or downgrade at any time</p>
            <p>• No setup fees or long-term contracts</p>
            <p>• Cancel anytime with 30 days notice</p>
            <p>• Enterprise plans include custom pricing and features</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
