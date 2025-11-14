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

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string | ReactNode;
  variant?: "default" | "healthcare";
  valueClassName?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  variant = "healthcare",
  valueClassName,
  className,
}: StatsCardProps) {
  return (
    <Card variant={variant} className={className}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={cn("text-2xl", valueClassName)}>{value}</CardTitle>
        {description && (
          <CardDescription className="text-xs mt-1">
            {typeof description === "string" ? description : description}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}

