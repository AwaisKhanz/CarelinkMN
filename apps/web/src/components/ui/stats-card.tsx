"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string | ReactNode;
  variant?: "default" | "healthcare";
  valueClassName?: string;
  className?: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  variant = "healthcare",
  valueClassName,
  className,
  isLoading = false,
}: StatsCardProps) {
  return (
    <Card variant={variant} className={className}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <CardTitle className={cn("text-2xl", valueClassName)}>{value}</CardTitle>
        )}
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-3 w-32" />
            ) : (
              typeof description === "string" ? description : description
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

