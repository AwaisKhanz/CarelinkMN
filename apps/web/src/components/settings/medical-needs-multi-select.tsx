"use client";

import { MultiSelect, type MultiSelectProps } from "@/components/ui/multi-select";
import { MEDICAL_NEEDS } from "@/lib/constants";

export interface MedicalNeedsMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedNeeds?: string[];
  onNeedsChange?: (needs: string[]) => void;
}

export function MedicalNeedsMultiSelect({
  selectedNeeds = [],
  onNeedsChange,
  ...props
}: MedicalNeedsMultiSelectProps) {
  const options = MEDICAL_NEEDS.map((need) => ({
    label: need.label,
    value: need.value,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedNeeds}
      onChange={onNeedsChange || (() => {})}
      placeholder="Select medical needs..."
      searchPlaceholder="Search medical needs..."
      emptyMessage="No medical needs found."
      variant="healthcare"
      badgeDisplayLimit={Infinity}
      {...props}
    />
  );
}

