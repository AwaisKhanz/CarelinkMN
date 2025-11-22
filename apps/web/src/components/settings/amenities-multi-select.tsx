"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { STANDARD_AMENITIES } from "@/lib/constants";
import type { MultiSelectProps } from "@/components/ui/multi-select";

export interface AmenitiesMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedAmenities?: string[];
  onAmenitiesChange?: (amenities: string[]) => void;
}

export function AmenitiesMultiSelect({
  selectedAmenities = [],
  onAmenitiesChange,
  ...props
}: AmenitiesMultiSelectProps) {
  const options = STANDARD_AMENITIES.map((amenity) => ({
    label: amenity,
    value: amenity,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedAmenities}
      onChange={onAmenitiesChange || (() => {})}
      searchPlaceholder="Search amenities..."
      emptyMessage="No amenities found"
      variant="healthcare"
      badgeDisplayLimit={0}
      {...props}
    />
  );
}

