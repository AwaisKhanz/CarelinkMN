"use client";

import { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  separator?: boolean; // Add separator before this item
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
  align?: "start" | "end" | "center";
  side?: "top" | "bottom" | "left" | "right";
  trigger?: ReactNode;
  triggerClassName?: string;
  className?: string;
}

/**
 * Reusable action menu component
 * Provides consistent dropdown menu styling for table actions and other contexts
 */
export function ActionMenu({
  actions,
  align = "end",
  side = "bottom",
  trigger,
  triggerClassName,
  className,
}: ActionMenuProps) {
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-8 w-8 p-0", triggerClassName)}
      aria-label="Actions"
    >
      <MoreVertical className="h-4 w-4" aria-hidden="true" />
    </Button>
  );

  const filteredActions = actions.filter((action) => !action.disabled);

  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className={className}>
        {filteredActions.map((action, index) => {
          const Item = action.icon ? (
            <DropdownMenuItem
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                "gap-2",
                action.variant === "destructive" && "text-destructive focus:text-destructive"
              )}
              disabled={action.disabled}
            >
              <action.icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={cn(
                action.variant === "destructive" && "text-destructive focus:text-destructive"
              )}
              disabled={action.disabled}
            >
              {action.label}
            </DropdownMenuItem>
          );

          // Add separator before this item if specified
          if (action.separator && index > 0) {
            return (
              <div key={`separator-${index}`}>
                <DropdownMenuSeparator />
                {Item}
              </div>
            );
          }

          return Item;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

