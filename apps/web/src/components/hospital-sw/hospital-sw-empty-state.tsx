"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HospitalSWEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "healthcare" | "destructive";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "healthcare" | "destructive";
  };
  className?: string;
}

/**
 * Reusable empty state component for Hospital SW pages
 * Provides consistent empty state UI across the application
 */
export function HospitalSWEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: HospitalSWEmptyStateProps) {
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

