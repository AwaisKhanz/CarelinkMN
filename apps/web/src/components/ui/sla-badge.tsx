"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SLABadgeProps {
  /**
   * Response time in hours
   * If null/undefined, indicates no response yet
   */
  responseTimeHours?: number | null;
  
  /**
   * Time since thread creation in hours (for pending responses)
   */
  hoursSinceCreation?: number;
  
  /**
   * Whether the thread is closed
   */
  isClosed?: boolean;
  
  /**
   * Custom thresholds (in hours)
   * Default: Good < 2h, Warning 2-24h, Critical > 24h
   */
  thresholds?: {
    good: number; // Default: 2
    warning: number; // Default: 24
  };
  
  /**
   * Show detailed time in badge
   */
  showTime?: boolean;
  
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  
  className?: string;
}

/**
 * SLA Badge Component
 * 
 * Displays response time status with color-coded badges:
 * - Good: < 2 hours (green)
 * - Warning: 2-24 hours (yellow)
 * - Critical: > 24 hours (red)
 * 
 * For pending responses, shows time since creation.
 */
export function SLABadge({
  responseTimeHours,
  hoursSinceCreation,
  isClosed = false,
  thresholds = { good: 2, warning: 24 },
  showTime = true,
  size = "md",
  className,
}: SLABadgeProps) {
  // If closed, don't show SLA badge
  if (isClosed) {
    return null;
  }

  // No response yet - show time since creation
  if (responseTimeHours === null || responseTimeHours === undefined) {
    if (hoursSinceCreation === undefined || hoursSinceCreation === null) {
      return null;
    }

    const getStatus = () => {
      if (hoursSinceCreation < thresholds.good) {
        return {
          variant: "healthcareSuccess" as const,
          icon: Timer,
          label: "Within SLA",
          text: showTime ? `${Math.round(hoursSinceCreation * 10) / 10}h` : undefined,
        };
      } else if (hoursSinceCreation < thresholds.warning) {
        return {
          variant: "healthcareWarning" as const,
          icon: AlertCircle,
          label: "SLA Warning",
          text: showTime ? `${Math.round(hoursSinceCreation * 10) / 10}h` : undefined,
        };
      } else {
        return {
          variant: "healthcareError" as const,
          icon: XCircle,
          label: "SLA Breached",
          text: showTime ? `${Math.round(hoursSinceCreation * 10) / 10}h` : undefined,
        };
      }
    };

    const status = getStatus();
    const Icon = status.icon;

    return (
      <Badge
        variant={status.variant}
        className={cn(
          "whitespace-nowrap gap-1",
          size === "sm" && "text-xs px-1.5 py-0.5",
          size === "md" && "text-xs px-2 py-1",
          size === "lg" && "text-sm px-2.5 py-1.5",
          className
        )}
      >
        <Icon className={cn(
          size === "sm" && "h-3 w-3",
          size === "md" && "h-3 w-3",
          size === "lg" && "h-4 w-4"
        )} />
        <span>{status.label}</span>
        {status.text && <span>({status.text})</span>}
      </Badge>
    );
  }

  // Has response - show response time
  const getStatus = () => {
    if (responseTimeHours < thresholds.good) {
      return {
        variant: "healthcareSuccess" as const,
        icon: CheckCircle2,
        label: "Responded",
        text: showTime ? `${Math.round(responseTimeHours * 10) / 10}h` : undefined,
      };
    } else if (responseTimeHours < thresholds.warning) {
      return {
        variant: "healthcareWarning" as const,
        icon: Clock,
        label: "Responded",
        text: showTime ? `${Math.round(responseTimeHours * 10) / 10}h` : undefined,
      };
    } else {
      return {
        variant: "healthcareError" as const,
        icon: XCircle,
        label: "Responded",
        text: showTime ? `${Math.round(responseTimeHours * 10) / 10}h` : undefined,
      };
    }
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <Badge
      variant={status.variant}
      className={cn(
        "whitespace-nowrap gap-1",
        size === "sm" && "text-xs px-1.5 py-0.5",
        size === "md" && "text-xs px-2 py-1",
        size === "lg" && "text-sm px-2.5 py-1.5",
        className
      )}
    >
      <Icon className={cn(
        size === "sm" && "h-3 w-3",
        size === "md" && "h-3 w-3",
        size === "lg" && "h-4 w-4"
      )} />
      <span>{status.label}</span>
      {status.text && <span>: {status.text}</span>}
    </Badge>
  );
}

/**
 * Helper function to calculate hours since creation
 */
export function calculateHoursSince(date: Date | string): number {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
}

/**
 * Helper function to convert response time from minutes to hours
 */
export function minutesToHours(minutes: number | null | undefined): number | null {
  if (minutes === null || minutes === undefined) return null;
  return minutes / 60;
}

