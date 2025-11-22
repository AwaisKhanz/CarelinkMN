"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { PAYER_OPTIONS } from "@/lib/constants";
import type { MultiSelectProps } from "@/components/ui/multi-select";
import { Payer } from "@carelink/types";

export interface PayersMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedPayers?: Payer[];
  onPayersChange?: (payers: Payer[]) => void;
}

export function PayersMultiSelect({
  selectedPayers = [],
  onPayersChange,
  ...props
}: PayersMultiSelectProps) {
  const options = PAYER_OPTIONS.map((payer) => ({
    label: payer.label,
    value: payer.value.toString(), // Convert enum to string for MultiSelect
  }));

  const handleChange = (values: string[]) => {
    if (onPayersChange) {
      // Convert string values back to Payer enum
      onPayersChange(values.map((v) => v as Payer));
    }
  };

  return (
    <MultiSelect
      options={options}
      selected={selectedPayers.map((p) => p.toString())} // Convert Payer enum to string
      onChange={handleChange}
      searchPlaceholder="Search payers..."
      emptyMessage="No payers found"
      variant="healthcare"
      badgeDisplayLimit={0}
      {...props}
    />
  );
}
