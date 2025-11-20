"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface VRSDetailHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?:
      | "default"
      | "healthcarePrimary"
      | "healthcareSecondary"
      | "healthcareSuccess"
      | "healthcareWarning"
      | "healthcareError"
      | "healthcareInfo"
      | "destructive"
      | "outline"
      | "secondary";
  };
  backHref?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?:
      | "default"
      | "healthcare"
      | "healthcareSecondary"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    icon?: ReactNode;
  }>;
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    destructive?: boolean;
  }>;
}

export function VRSDetailHeader({
  title,
  subtitle,
  badge,
  backHref,
  actions = [],
  menuItems = [],
}: VRSDetailHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(backHref)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {badge && (
            <Badge variant={badge.variant || "outline"}>{badge.label}</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "healthcare"}
            onClick={action.onClick}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
        {menuItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={item.onClick}
                  className={item.destructive ? "text-destructive" : ""}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
