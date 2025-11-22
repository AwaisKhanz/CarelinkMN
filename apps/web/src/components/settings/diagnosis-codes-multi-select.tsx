"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import type { MultiSelectProps } from "@/components/ui/multi-select";

// Diagnosis codes - in a real app, this would come from ICD-10 database
const DIAGNOSIS_CODE_OPTIONS = [
  "E11.9 - Type 2 diabetes without complications",
  "I10 - Essential hypertension",
  "F03.90 - Unspecified dementia without behavioral disturbance",
  "M79.3 - Panniculitis, unspecified",
  "Z99.3 - Dependence on wheelchair",
  "I50.9 - Heart failure, unspecified",
  "E78.5 - Hyperlipidemia, unspecified",
  "N18.6 - End stage renal disease",
  "G30.9 - Alzheimer's disease, unspecified",
  "I25.10 - Atherosclerotic heart disease",
];

export interface DiagnosisCodesMultiSelectProps
  extends Omit<
    MultiSelectProps,
    "options" | "searchPlaceholder" | "emptyMessage" | "selected" | "onChange"
  > {
  selectedCodes?: string[];
  onCodesChange?: (codes: string[]) => void;
}

export function DiagnosisCodesMultiSelect({
  selectedCodes = [],
  onCodesChange,
  ...props
}: DiagnosisCodesMultiSelectProps) {
  const options = DIAGNOSIS_CODE_OPTIONS.map((code) => ({
    label: code,
    value: code,
  }));

  return (
    <MultiSelect
      options={options}
      selected={selectedCodes}
      onChange={onCodesChange || (() => {})}
      searchPlaceholder="Search diagnosis codes..."
      emptyMessage="No diagnosis codes found"
      variant="healthcare"
      badgeDisplayLimit={0}
      {...props}
    />
  );
}

