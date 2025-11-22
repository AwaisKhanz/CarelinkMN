"use client";

import { MultiSelect, MultiSelectProps } from "@/components/ui/multi-select";
import { CARE_LEVELS } from "@/lib/constants";

export interface CareLevelsMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedCareLevels?: string[];
  onCareLevelsChange?: (careLevels: string[]) => void;
}

export function CareLevelsMultiSelect({
  selectedCareLevels = [],
  onCareLevelsChange,
  ...props
}: CareLevelsMultiSelectProps) {
  const options = CARE_LEVELS.map((level) => ({
    label: level.label,
    value: level.value,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedCareLevels}
      onChange={onCareLevelsChange || (() => {})}
      placeholder="Select care levels..."
      searchPlaceholder="Search care levels..."
      emptyMessage="No care levels found."
      variant="healthcare"
      badgeDisplayLimit={Infinity}
      {...props}
    />
  );
}
