"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullHeight?: boolean;
  variant?: "default" | "healthcare";
  children?: ReactNode;
}

/**
 * Reusable loading state component
 * Provides consistent loading UI across all dashboards and pages
 */
export function LoadingState({
  message = "Loading...",
  className,
  size = "md",
  fullHeight = false,
  variant = "default",
  children,
}: LoadingStateProps) {
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
        {message && (
          <p className="text-muted-foreground text-sm">{message}</p>
        )}
        {children}
      </div>
    </div>
  );
}

