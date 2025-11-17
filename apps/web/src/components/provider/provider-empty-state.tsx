"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "healthcare" | "destructive" | "ghost" | "link" | "secondary" | "healthcareSecondary" | "healthcareSuccess" | "healthcareWarning" | "healthcareError" | "healthcareInfo";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "healthcare" | "destructive" | "ghost" | "link" | "secondary" | "healthcareSecondary" | "healthcareSuccess" | "healthcareWarning" | "healthcareError" | "healthcareInfo";
  };
  className?: string;
}

/**
 * Reusable empty state component for provider pages
 * Provides consistent empty state UI across the application
 */
export function ProviderEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: ProviderEmptyStateProps) {
  return (
    <Card variant="healthcare" className={cn("max-w-md mx-auto", className)}>
      <CardContent className="pt-6">
        <div className="text-center py-8 space-y-4">
          <Icon className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {(action || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {action && (
                <Button onClick={action.onClick} variant={action.variant || "healthcare"}>
                  {action.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant={secondaryAction.variant || "outline"}
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
