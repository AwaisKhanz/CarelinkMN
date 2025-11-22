"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { BEHAVIORAL_CONCERNS_OPTIONS } from "@/lib/constants";
import type { MultiSelectProps } from "@/components/ui/multi-select";

export interface BehavioralConcernsMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedConcerns?: string[];
  onConcernsChange?: (concerns: string[]) => void;
}

export function BehavioralConcernsMultiSelect({
  selectedConcerns = [],
  onConcernsChange,
  ...props
}: BehavioralConcernsMultiSelectProps) {
  const options = BEHAVIORAL_CONCERNS_OPTIONS.map((concern) => ({
    label: concern.label,
    value: concern.value,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedConcerns}
      onChange={onConcernsChange || (() => {})}
      searchPlaceholder="Search behavioral concerns..."
      emptyMessage="No behavioral concerns found"
      variant="healthcare"
      badgeDisplayLimit={0}
      {...props}
    />
  );
}

