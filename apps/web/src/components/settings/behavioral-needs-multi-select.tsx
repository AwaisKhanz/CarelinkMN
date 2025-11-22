"use client";

import { MultiSelect, type MultiSelectProps } from "@/components/ui/multi-select";
import { BEHAVIORAL_NEEDS } from "@/lib/constants";

export interface BehavioralNeedsMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedNeeds?: string[];
  onNeedsChange?: (needs: string[]) => void;
}

export function BehavioralNeedsMultiSelect({
  selectedNeeds = [],
  onNeedsChange,
  ...props
}: BehavioralNeedsMultiSelectProps) {
  const options = BEHAVIORAL_NEEDS.map((need) => ({
    label: need.label,
    value: need.value,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedNeeds}
      onChange={onNeedsChange || (() => {})}
      placeholder="Select behavioral needs..."
      searchPlaceholder="Search behavioral needs..."
      emptyMessage="No behavioral needs found."
      variant="healthcare"
      badgeDisplayLimit={Infinity}
      {...props}
    />
  );
}

