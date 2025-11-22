"use client";

import { AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "healthcare"
    | "healthcareSecondary"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

interface ErrorStateProps {
  title?: string;
  message: string;
  description?: string;
  action?: ErrorStateAction;
  secondaryAction?: ErrorStateAction;
  fullHeight?: boolean;
  variant?: "default" | "healthcare";
  className?: string;
}

/**
 * Reusable error state component
 * Provides consistent error handling UI across all dashboards and pages
 */
export function ErrorState({
  title = "Error",
  message,
  description,
  action,
  secondaryAction,
  fullHeight = false,
  variant = "healthcare",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullHeight ? "min-h-[60vh]" : "py-12",
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <Card variant={variant} className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle
              className="h-5 w-5 text-destructive shrink-0"
              aria-hidden="true"
            />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
          {description && (
            <CardDescription className="text-sm mt-1">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        {(action || secondaryAction) && (
          <CardContent className="space-y-2">
            {action && (
              <Button
                variant={action.variant || "healthcare"}
                onClick={action.onClick}
                className="w-full"
                aria-label={action.label}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || "outline"}
                onClick={secondaryAction.onClick}
                className="w-full"
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </Button>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

