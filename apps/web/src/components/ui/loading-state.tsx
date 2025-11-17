"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
  variant?: "spinner" | "skeleton" | "compact" | "full";
  className?: string;
  skeletonCount?: number;
}

/**
 * Standardized loading state component
 * Use this for consistent loading display across the application
 */
export function LoadingState({
  message = "Loading...",
  variant = "spinner",
  className = "",
  skeletonCount = 3,
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i} variant="healthcare">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-background ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

