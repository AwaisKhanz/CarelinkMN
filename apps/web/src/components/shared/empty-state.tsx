"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "healthcare"
    | "healthcareSecondary"
    | "healthcareSuccess"
    | "healthcareWarning"
    | "healthcareError"
    | "healthcareInfo";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string | ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: "default" | "healthcare";
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable empty state component
 * Provides consistent empty state UI across all dashboards and pages
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "healthcare",
  className,
  size = "md",
}: EmptyStateProps) {
  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <Card
      variant={variant}
      className={cn("max-w-full mx-auto", className)}
    >
      <CardContent className="pt-6">
        <div className="text-center py-8 space-y-4">
          <Icon
            className={cn(
              "mx-auto text-muted-foreground opacity-50",
              iconSizes[size]
            )}
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm">
              {typeof description === "string" ? description : description}
            </p>
          </div>
          {(action || secondaryAction) && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              {action && (
                <Button
                  onClick={action.onClick}
                  variant={action.variant || "healthcare"}
                  className="gap-2"
                  aria-label={action.label}
                >
                  {action.icon && (
                    <action.icon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {action.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant={secondaryAction.variant || "outline"}
                  className="gap-2"
                  aria-label={secondaryAction.label}
                >
                  {secondaryAction.icon && (
                    <secondaryAction.icon
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
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

