"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { COUNTRIES } from "@/lib/constants";
import type { MultiSelectProps } from "@/components/ui/multi-select";

export interface CountriesMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedCountries?: string[];
  onCountriesChange?: (countries: string[]) => void;
}

export function CountriesMultiSelect({
  selectedCountries = [],
  onCountriesChange,
  ...props
}: CountriesMultiSelectProps) {
  const options = COUNTRIES.map((country) => ({
    label: country.name,
    value: country.code, // Using ISO code as value
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedCountries}
      onChange={onCountriesChange || (() => {})}
      searchPlaceholder="Search countries..."
      emptyMessage="No countries found"
      variant="healthcare"
      badgeDisplayLimit={0}
      {...props}
    />
  );
}

