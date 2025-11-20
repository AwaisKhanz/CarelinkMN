"use client";

import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminErrorStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "healthcare" | "healthcareSecondary" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  fullHeight?: boolean;
}

export function AdminErrorState({
  title = "Error",
  message,
  action,
  fullHeight = false,
}: AdminErrorStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullHeight ? "min-h-[60vh]" : "py-12"
      )}
    >
      <Card variant="healthcare" className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {action && (
          <CardContent>
            <Button
              variant={action.variant || "healthcare"}
              onClick={action.onClick}
              className="w-full"
            >
              {action.label}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

