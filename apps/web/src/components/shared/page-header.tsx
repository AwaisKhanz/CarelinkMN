"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
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
  disabled?: boolean;
  loading?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: PageHeaderAction[];
  className?: string;
  children?: ReactNode;
}

/**
 * Reusable page header component
 * Provides consistent header styling with title, description, and action buttons
 */
export function PageHeader({
  title,
  description,
  actions = [],
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
        {children}
      </div>
      {actions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "healthcare"}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="gap-2"
                aria-label={action.label}
              >
                {action.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {action.label}
                  </>
                ) : (
                  <>
                    {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                    {action.label}
                  </>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

