"use client";

import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SmartDateProps {
  date: string | Date | null | undefined;
  format?:
    | "relative"
    | "short"
    | "long"
    | "dateOnly"
    | "timeOnly"
    | "dateTime"
    | "full";
  className?: string;
  fallback?: string;
}

/**
 * Smart date component for consistent date formatting across the application
 * Supports multiple format options and handles null/undefined gracefully
 */
export function SmartDate({
  date,
  format: formatType = "short",
  className,
  fallback = "N/A",
}: SmartDateProps) {
  if (!date) {
    return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  }

  let formattedDate: string;

  switch (formatType) {
    case "relative":
      formattedDate = formatDistanceToNow(dateObj, { addSuffix: true });
      break;
    case "short":
      formattedDate = format(dateObj, "MMM d, yyyy");
      break;
    case "long":
      formattedDate = format(dateObj, "MMMM d, yyyy");
      break;
    case "dateOnly":
      formattedDate = format(dateObj, "MMM d, yyyy");
      break;
    case "timeOnly":
      formattedDate = format(dateObj, "h:mm a");
      break;
    case "dateTime":
      formattedDate = format(dateObj, "MMM d, yyyy 'at' h:mm a");
      break;
    case "full":
      formattedDate = format(dateObj, "PPPP");
      break;
    default:
      formattedDate = format(dateObj, "MMM d, yyyy");
  }

  return (
    <time
      dateTime={dateObj.toISOString()}
      className={className}
      title={format(dateObj, "PPpp")} // Full date/time as tooltip
    >
      {formattedDate}
    </time>
  );
}

