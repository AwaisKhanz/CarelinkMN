"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailHeaderAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "healthcare" | "destructive" | "ghost";
  icon?: ReactNode;
  disabled?: boolean;
}

interface ProviderDetailHeaderProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  backPath?: string;
  onBack?: () => void;
  badges?: ReactNode;
  actions?: ReactNode;
  actionButtons?: DetailHeaderAction[];
  className?: string;
}

/**
 * Reusable detail page header component for provider pages
 * Provides consistent header UI with back button, title, badges, and actions
 */
export function ProviderDetailHeader({
  title,
  subtitle,
  backLabel = "Back",
  backPath,
  onBack,
  badges,
  actions,
  actionButtons,
  className,
}: ProviderDetailHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={handleBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {backLabel}
      </Button>

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Badges and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {badges}
          {actionButtons?.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || "healthcare"}
              disabled={action.disabled}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
          {actions}
        </div>
      </div>
    </div>
  );
}
