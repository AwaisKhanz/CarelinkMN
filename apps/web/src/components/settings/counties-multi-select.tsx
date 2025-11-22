"use client";

import { MultiSelect, MultiSelectProps } from "@/components/ui/multi-select";
import { MINNESOTA_COUNTIES } from "@/lib/constants";

export interface CountiesMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedCounties?: string[];
  onCountiesChange?: (counties: string[]) => void;
}

export function CountiesMultiSelect({
  selectedCounties = [],
  onCountiesChange,
  ...props
}: CountiesMultiSelectProps) {
  const options = MINNESOTA_COUNTIES.map((county) => ({
    label: county,
    value: county,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedCounties}
      onChange={onCountiesChange || (() => {})}
      placeholder="Select counties..."
      searchPlaceholder="Search counties..."
      emptyMessage="No counties found."
      variant="healthcare"
      badgeDisplayLimit={Infinity}
      {...props}
    />
  );
}

