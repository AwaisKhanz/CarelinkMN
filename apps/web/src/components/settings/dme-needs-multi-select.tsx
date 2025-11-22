"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { DME_NEEDS_OPTIONS } from "@/lib/constants";
import type { MultiSelectProps } from "@/components/ui/multi-select";

export interface DMENeedsMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedNeeds?: string[];
  onNeedsChange?: (needs: string[]) => void;
}

export function DMENeedsMultiSelect({
  selectedNeeds = [],
  onNeedsChange,
  ...props
}: DMENeedsMultiSelectProps) {
  const options = DME_NEEDS_OPTIONS.map((need) => ({
    label: need.label,
    value: need.value,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedNeeds}
      onChange={onNeedsChange || (() => {})}
      searchPlaceholder="Search DME needs..."
      emptyMessage="No DME needs found"
      variant="healthcare"
      badgeDisplayLimit={0}
      {...props}
    />
  );
}

