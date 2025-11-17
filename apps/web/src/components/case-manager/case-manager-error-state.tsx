"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CaseManagerErrorStateProps {
  title?: string;
  message: string;
  description?: string;
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
  onBack?: boolean;
  backLabel?: string;
  backPath?: string;
  className?: string;
  icon?: ReactNode;
}

/**
 * Reusable error state component for case manager pages
 * Provides consistent error UI across the application
 */
export function CaseManagerErrorState({
  title = "Error",
  message,
  description,
  action,
  secondaryAction,
  onBack = false,
  backLabel = "Go Back",
  backPath,
  className,
  icon,
}: CaseManagerErrorStateProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        className || "py-12"
      )}
    >
      <Card variant="healthcare" className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon || (
              <AlertCircle
                className="h-5 w-5 text-destructive"
                aria-hidden="true"
              />
            )}
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex flex-col gap-2">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || "healthcare"}
                className="w-full"
              >
                {action.label}
              </Button>
            )}
            {(secondaryAction || onBack) && (
              <Button
                onClick={secondaryAction?.onClick || handleBack}
                variant={secondaryAction?.variant || "outline"}
                className="w-full"
              >
                {secondaryAction?.label || backLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

