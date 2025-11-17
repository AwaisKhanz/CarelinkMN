"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderLoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullHeight?: boolean;
}

/**
 * Reusable loading state component for provider pages
 * Provides consistent loading UI across the application
 */
export function ProviderLoadingState({
  message = "Loading...",
  className,
  size = "md",
  fullHeight = false,
}: ProviderLoadingStateProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullHeight ? "min-h-[400px]" : "py-12",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center space-y-4">
        <Loader2
          className={cn(
            "animate-spin text-primary",
            sizeClasses[size]
          )}
          aria-hidden="true"
        />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
