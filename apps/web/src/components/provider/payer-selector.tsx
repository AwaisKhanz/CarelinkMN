"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Payer } from "@carelink/types";
import { PAYER_OPTIONS, PAYER_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PayerSelectorProps {
  selectedPayers: Payer[];
  onToggle: (payer: Payer) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  required?: boolean;
  maxSelected?: number;
  disabled?: boolean;
  className?: string;
  showDescriptions?: boolean;
}

/**
 * Reusable payer selector component
 * Provides consistent payer selection UI with proper labels
 */
export function PayerSelector({
  selectedPayers,
  onToggle,
  onSelectAll,
  onDeselectAll,
  required = false,
  maxSelected,
  disabled = false,
  className,
  showDescriptions = false,
}: PayerSelectorProps) {
  const isSelected = (payer: Payer) => {
    return selectedPayers.includes(payer);
  };

  const canSelectMore = maxSelected === undefined || selectedPayers.length < maxSelected;

  return (
    <Card variant="healthcare" className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Accepted Payers</CardTitle>
            <CardDescription>
              Select which payers this opening accepts
              {required && <span className="text-destructive ml-1">*</span>}
            </CardDescription>
          </div>
          {(onSelectAll || onDeselectAll) && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={PAYER_OPTIONS.length > 0 && PAYER_OPTIONS.every((option) => isSelected(option.value))}
                onCheckedChange={(checked) => {
                  if (checked && onSelectAll) {
                    onSelectAll();
                  } else if (!checked && onDeselectAll) {
                    onDeselectAll();
                  }
                }}
                disabled={disabled}
              />
              <span className="text-sm font-medium">Select All</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAYER_OPTIONS.map((option) => {
            const selected = isSelected(option.value);
            const canSelect = !selected && (canSelectMore || disabled);

            return (
              <div
                key={option.value}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                  disabled && !selected && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => !disabled && onToggle(option.value)}
              >
                <Checkbox
                  id={option.value}
                  checked={selected}
                  onCheckedChange={() => !disabled && onToggle(option.value)}
                  disabled={disabled || !canSelect}
                />
                <Label htmlFor={option.value} className="font-medium cursor-pointer flex-1">
                  {option.label}
                </Label>
                {selected && (
                  <Badge variant="healthcarePrimary" className="text-xs">
                    Selected
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        {selectedPayers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Selected Payers:</p>
            <div className="flex flex-wrap gap-2">
              {selectedPayers.map((payer) => (
                <Badge key={payer} variant="healthcarePrimary">
                  {PAYER_LABELS[payer]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
