"use client";

import { AlertCircle, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface UpgradeBannerProps {
  feature: string;
  currentPlan: string;
  requiredPlan: "PRO" | "PREMIUM" | "ENTERPRISE";
  description?: string;
  className?: string;
  compact?: boolean;
}

const PLAN_COLORS = {
  PRO: "bg-primary/10 border-primary text-primary",
  PREMIUM: "bg-accent/10 border-accent text-accent",
  ENTERPRISE: "bg-destructive/10 border-destructive text-destructive",
};

const PLAN_PRICES = {
  PRO: "$49/month",
  PREMIUM: "$99/month",
  ENTERPRISE: "Custom pricing",
};

export function UpgradeBanner({
  feature,
  currentPlan,
  requiredPlan,
  description,
  className,
  compact = false,
}: UpgradeBannerProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/provider/settings?tab=subscription");
  };

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 border border-border",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {feature} requires{" "}
              <Badge variant="healthcarePrimary" className="ml-1 capitalize">
                {requiredPlan}
              </Badge>
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="shrink-0 whitespace-nowrap"
        >
          Upgrade
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card
      variant="healthcare"
      className={cn("border-2", PLAN_COLORS[requiredPlan], className)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-background/50 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1">
              Upgrade to {requiredPlan} Plan
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {description ||
                `${feature} is only available on the ${requiredPlan} plan. Upgrade now to unlock this feature and more.`}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="healthcarePrimary" className="capitalize">
                Your Plan: {currentPlan}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="healthcareSuccess" className="capitalize">
                Upgrade to: {requiredPlan}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{PLAN_PRICES[requiredPlan]}</p>
              <Button onClick={handleUpgrade} size="sm">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
