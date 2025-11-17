"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  separator?: boolean; // Add separator before this item
}

interface ProviderActionMenuProps {
  actions: ActionItem[];
  trigger?: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

/**
 * Reusable action menu component for provider pages
 * Provides consistent action dropdown UI
 */
export function ProviderActionMenu({
  actions,
  trigger,
  align = "end",
  className,
}: ProviderActionMenuProps) {
  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <MoreVertical className="h-4 w-4" />
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={className}>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        {actions.map((action, index) => (
          <div key={index}>
            {action.separator && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                action.variant === "destructive" && "text-destructive focus:text-destructive"
              )}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
