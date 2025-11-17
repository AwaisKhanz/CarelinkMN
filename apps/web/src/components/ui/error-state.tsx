"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  variant?: "default" | "compact" | "full";
}

/**
 * Standardized error state component
 * Use this for consistent error display across the application
 */
export function ErrorState({
  title = "Error",
  message,
  onRetry,
  retryLabel = "Retry",
  className = "",
  variant = "default",
}: ErrorStateProps) {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/5 ${className}`}>
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-foreground mb-1">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button size="sm" onClick={onRetry} variant="outline">
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-background p-4 ${className}`}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>{title}</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          {onRetry && (
            <CardContent>
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryLabel}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Default variant
  return (
    <Card variant="healthcare" className={`border-destructive/50 bg-destructive/5 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-foreground mb-1">{title}</p>
            <p className="text-sm text-muted-foreground mb-3">{message}</p>
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryLabel}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

