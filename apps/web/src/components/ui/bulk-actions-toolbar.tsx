"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions?: BulkAction[];
  className?: string;
  showSelectAll?: boolean;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  actions = [],
  className,
  showSelectAll = true,
}: BulkActionsToolbarProps) {
  const isAllSelected = selectedCount > 0 && selectedCount === totalCount;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/50",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {showSelectAll && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSelectAll();
                } else {
                  onDeselectAll();
                }
              }}
            />
            <span className="text-sm font-medium">
              {selectedCount} of {totalCount} selected
            </span>
          </div>
        )}
        {!showSelectAll && (
          <Badge variant="healthcareSecondary" className="text-sm">
            {selectedCount} selected
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || "outline"}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className="gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}

