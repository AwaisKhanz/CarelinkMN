"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import type { BadgeProps } from "@/components/ui/badge";

interface VendorDetailHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  badge?: {
    label: string;
    variant: BadgeProps["variant"];
  };
  actions?: ReactNode[];
}

export function VendorDetailHeader({
  title,
  subtitle,
  backHref,
  badge,
  actions = [],
}: VendorDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {backHref && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{title}</h1>
            {badge && (
              <Badge variant={badge.variant}>{badge.label}</Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions.length > 0 && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

