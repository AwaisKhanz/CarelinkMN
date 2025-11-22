"use client";

import { MultiSelect, MultiSelectProps } from "@/components/ui/multi-select";
import { SUPPORTED_NEEDS } from "@/lib/constants";

export interface ServicesNeededMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "selected" | "onChange"
  > {
  selectedServices?: string[];
  onServicesChange?: (services: string[]) => void;
}

export function ServicesNeededMultiSelect({
  selectedServices = [],
  onServicesChange,
  ...props
}: ServicesNeededMultiSelectProps) {
  const options = SUPPORTED_NEEDS.map((service) => ({
    label: service.label,
    value: service.value,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedServices}
      onChange={onServicesChange || (() => {})}
      placeholder="Select services..."
      searchPlaceholder="Search services..."
      emptyMessage="No services found."
      variant="healthcare"
      badgeDisplayLimit={Infinity}
      {...props}
    />
  );
}

