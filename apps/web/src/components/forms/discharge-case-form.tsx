"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Save, Loader2, Calendar as CalendarIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Gender, Payer } from "@carelink/types";
import {
  PAYER_OPTIONS,
  GENDER_OPTIONS,
  MINNESOTA_COUNTIES,
  DME_NEEDS_OPTIONS,
  BEHAVIORAL_CONCERNS_OPTIONS,
  MOBILITY_STATUS_OPTIONS,
  COGNITIVE_STATUS_OPTIONS,
  TRANSPORT_TYPES,
  HOSPITAL_LOCATIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FormError } from "@/components/ui/form-error";
import { Badge } from "@/components/ui/badge";
import type {
  CreateDischargeCaseData,
  UpdateDischargeCaseData,
} from "@carelink/types";

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

const dischargeCaseSchema = z
  .object({
    // hospitalId is handled by backend from user context, not required in form
    patientInitials: z
      .string()
      .min(2, "Patient initials must be exactly 2 characters")
      .max(2, "Patient initials must be exactly 2 characters")
      .regex(
        /^[A-Z]{2}$/,
        "Patient initials must be exactly 2 uppercase letters"
      ),
    patientAge: z
      .number({
        required_error: "Patient age is required",
        invalid_type_error: "Patient age must be a number",
      })
      .int("Patient age must be a whole number")
      .min(0, "Patient age cannot be negative")
      .max(150, "Patient age cannot exceed 150"),
    patientGender: z.nativeEnum(Gender, {
      required_error: "Patient gender is required",
      invalid_type_error: "Please select a valid gender",
    }),
    diagnosisCodes: z
      .array(z.string())
      .min(1, "At least one diagnosis code is required"),
    mobilityStatus: z.string().min(1, "Mobility status is required"),
    cognitiveStatus: z.string().optional(),
    behavioralConcerns: z.array(z.string()).default([]),
    dmeNeeds: z.array(z.string()).default([]),
    medicationManagement: z.boolean().default(false),
    currentLocation: z.string().min(1, "Current location is required"),
    targetDischargeDate: z
      .date({
        required_error: "Target discharge date is required",
        invalid_type_error: "Please select a valid date",
      })
      .refine(
        (date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
        {
          message: "Target discharge date cannot be in the past",
        }
      ),
    preferredCounties: z
      .array(z.string())
      .min(1, "At least one preferred county is required"),
    preferredCities: z.array(z.string()).default([]),
    requiresProximity: z.boolean().default(false),
    proximityZipCode: z.string().optional(),
    maxDistanceMiles: z
      .number({
        invalid_type_error: "Max distance must be a number",
      })
      .int("Max distance must be a whole number")
      .min(1, "Max distance must be at least 1 mile")
      .max(500, "Max distance cannot exceed 500 miles")
      .optional(),
    primaryInsurance: z.nativeEnum(Payer, {
      required_error: "Primary insurance is required",
      invalid_type_error: "Please select a valid primary insurance",
    }),
    secondaryInsurance: z.nativeEnum(Payer).optional(),
    needsTransport: z.boolean().default(false),
    transportType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate proximityZipCode when requiresProximity is true
    if (
      data.requiresProximity &&
      data.proximityZipCode &&
      data.proximityZipCode.trim() !== ""
    ) {
      if (!/^\d{5}$/.test(data.proximityZipCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Zip code must be exactly 5 digits",
          path: ["proximityZipCode"],
        });
      }
    }

    // Validate transportType when needsTransport is true
    if (
      data.needsTransport &&
      data.transportType &&
      data.transportType.trim() !== ""
    ) {
      const validTransportTypes = TRANSPORT_TYPES.map((t) => t.value);
      if (!validTransportTypes.includes(data.transportType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid transport type",
          path: ["transportType"],
        });
      }
    }

    // Validate mobilityStatus is from valid options
    if (data.mobilityStatus) {
      const validMobilityStatuses = MOBILITY_STATUS_OPTIONS.map((s) => s.value);
      if (!validMobilityStatuses.includes(data.mobilityStatus)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid mobility status",
          path: ["mobilityStatus"],
        });
      }
    }

    // Validate cognitiveStatus is from valid options if provided
    if (data.cognitiveStatus && data.cognitiveStatus.trim() !== "") {
      const validCognitiveStatuses = COGNITIVE_STATUS_OPTIONS.map(
        (s) => s.value
      );
      if (!validCognitiveStatuses.includes(data.cognitiveStatus)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid cognitive status",
          path: ["cognitiveStatus"],
        });
      }
    }

    // Validate currentLocation is from valid options
    if (data.currentLocation) {
      const validLocations = HOSPITAL_LOCATIONS.map((l) => l.value);
      if (!validLocations.includes(data.currentLocation)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid hospital location",
          path: ["currentLocation"],
        });
      }
    }
  });

type DischargeCaseFormData = z.infer<typeof dischargeCaseSchema>;

interface DischargeCaseFormProps {
  initialData?: Partial<CreateDischargeCaseData>;
  onSubmit: (
    data: CreateDischargeCaseData | UpdateDischargeCaseData
  ) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  mode?: "create" | "edit";
}

export function DischargeCaseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = "create",
}: DischargeCaseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DischargeCaseFormData>({
    resolver: zodResolver(dischargeCaseSchema),
    defaultValues: {
      // hospitalId is handled by backend, not in form
      patientInitials: initialData?.patientInitials || "",
      patientAge: initialData?.patientAge,
      patientGender: initialData?.patientGender,
      diagnosisCodes: initialData?.diagnosisCodes || [],
      mobilityStatus: initialData?.mobilityStatus || "",
      cognitiveStatus: initialData?.cognitiveStatus || "",
      behavioralConcerns: initialData?.behavioralConcerns || [],
      dmeNeeds: initialData?.dmeNeeds || [],
      medicationManagement: initialData?.medicationManagement || false,
      currentLocation: initialData?.currentLocation || "",
      targetDischargeDate: initialData?.targetDischargeDate
        ? typeof initialData.targetDischargeDate === "string"
          ? new Date(initialData.targetDischargeDate)
          : initialData.targetDischargeDate
        : undefined,
      preferredCounties: initialData?.preferredCounties || [],
      preferredCities: initialData?.preferredCities || [],
      requiresProximity: initialData?.requiresProximity || false,
      proximityZipCode: initialData?.proximityZipCode || "",
      maxDistanceMiles: initialData?.maxDistanceMiles,
      primaryInsurance: initialData?.primaryInsurance,
      secondaryInsurance: initialData?.secondaryInsurance,
      needsTransport: initialData?.needsTransport || false,
      transportType: initialData?.transportType || "",
    },
    mode: "onChange",
  });

  const requiresProximity = watch("requiresProximity");
  const needsTransport = watch("needsTransport");
  const selectedDiagnosisCodes = watch("diagnosisCodes") || [];
  const selectedBehavioralConcerns = watch("behavioralConcerns") || [];
  const selectedDmeNeeds = watch("dmeNeeds") || [];
  const selectedCounties = watch("preferredCounties") || [];
  const selectedCities = watch("preferredCities") || [];

  const handleFormSubmit = (data: DischargeCaseFormData) => {
    // Clean up optional fields - convert empty strings to undefined
    const cleanData = {
      ...data,
      // Ensure boolean values are explicitly set (not undefined)
      medicationManagement: data.medicationManagement ?? false,
      requiresProximity: data.requiresProximity ?? false,
      needsTransport: data.needsTransport ?? false,
      // Ensure arrays are always arrays (never undefined)
      preferredCities: data.preferredCities || [],
      // Only include proximityZipCode if requiresProximity is true and value is not empty
      proximityZipCode:
        data.requiresProximity && data.proximityZipCode?.trim()
          ? data.proximityZipCode.trim()
          : undefined,
      // Only include maxDistanceMiles if requiresProximity is true
      maxDistanceMiles:
        data.requiresProximity && data.maxDistanceMiles
          ? data.maxDistanceMiles
          : undefined,
      // Only include transportType if needsTransport is true and value is not empty
      transportType:
        data.needsTransport && data.transportType?.trim()
          ? data.transportType.trim()
          : undefined,
      // Only include secondaryInsurance if it's provided
      secondaryInsurance: data.secondaryInsurance || undefined,
      // Only include cognitiveStatus if it's provided
      cognitiveStatus: data.cognitiveStatus?.trim() || undefined,
    };

    // hospitalId will be set by backend from user context, but we need to provide it for type compatibility
    const submitData: CreateDischargeCaseData | UpdateDischargeCaseData =
      mode === "edit"
        ? ({
            // For edit mode, all fields are optional
            patientInitials: cleanData.patientInitials,
            patientAge: cleanData.patientAge,
            patientGender: cleanData.patientGender,
            diagnosisCodes: cleanData.diagnosisCodes,
            mobilityStatus: cleanData.mobilityStatus,
            cognitiveStatus: cleanData.cognitiveStatus,
            behavioralConcerns: cleanData.behavioralConcerns,
            dmeNeeds: cleanData.dmeNeeds,
            medicationManagement: cleanData.medicationManagement,
            currentLocation: cleanData.currentLocation,
            targetDischargeDate: cleanData.targetDischargeDate,
            preferredCounties: cleanData.preferredCounties,
            preferredCities: cleanData.preferredCities,
            requiresProximity: cleanData.requiresProximity,
            proximityZipCode: cleanData.proximityZipCode,
            maxDistanceMiles: cleanData.maxDistanceMiles,
            primaryInsurance: cleanData.primaryInsurance,
            secondaryInsurance: cleanData.secondaryInsurance,
            needsTransport: cleanData.needsTransport,
            transportType: cleanData.transportType,
          } as UpdateDischargeCaseData)
        : ({
            // For create mode, all required fields
            // Note: hospitalId is not included here - it will be added by the create page from user's organization
            patientInitials: cleanData.patientInitials,
            patientAge: cleanData.patientAge,
            patientGender: cleanData.patientGender,
            diagnosisCodes: cleanData.diagnosisCodes,
            mobilityStatus: cleanData.mobilityStatus,
            cognitiveStatus: cleanData.cognitiveStatus,
            behavioralConcerns: cleanData.behavioralConcerns,
            dmeNeeds: cleanData.dmeNeeds,
            medicationManagement: cleanData.medicationManagement,
            currentLocation: cleanData.currentLocation,
            targetDischargeDate: cleanData.targetDischargeDate,
            preferredCounties: cleanData.preferredCounties,
            preferredCities: cleanData.preferredCities,
            requiresProximity: cleanData.requiresProximity,
            proximityZipCode: cleanData.proximityZipCode,
            maxDistanceMiles: cleanData.maxDistanceMiles,
            primaryInsurance: cleanData.primaryInsurance,
            secondaryInsurance: cleanData.secondaryInsurance,
            needsTransport: cleanData.needsTransport,
            transportType: cleanData.transportType,
          } as CreateDischargeCaseData);
    onSubmit(submitData);
  };

  const toggleArrayItem = (
    array: string[],
    item: string,
    fieldName:
      | "diagnosisCodes"
      | "behavioralConcerns"
      | "dmeNeeds"
      | "preferredCounties"
      | "preferredCities"
  ) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
    setValue(fieldName, newArray, { shouldValidate: true });
  };

  const addCity = (city: string) => {
    if (city.trim() && !selectedCities.includes(city.trim())) {
      setValue("preferredCities", [...selectedCities, city.trim()], {
        shouldValidate: true,
      });
    }
  };

  const removeCity = (city: string) => {
    setValue(
      "preferredCities",
      selectedCities.filter((c) => c !== city),
      { shouldValidate: true }
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Patient Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>Basic patient demographics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="patientInitials">
                Patient Initials <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="patientInitials"
                control={control}
                render={({ field }) => (
                  <Input
                    id="patientInitials"
                    {...field}
                    onChange={(e) => {
                      // Auto-uppercase and limit to 2 characters
                      const value = e.target.value.toUpperCase().slice(0, 2);
                      field.onChange(value);
                    }}
                    placeholder="AB"
                    className={cn(
                      errors.patientInitials && "border-destructive"
                    )}
                    maxLength={2}
                  />
                )}
              />
              <FormError error={errors.patientInitials} />
            </div>
            <div>
              <Label htmlFor="patientAge">
                Age <span className="text-destructive">*</span>
              </Label>
              <Input
                id="patientAge"
                type="number"
                {...register("patientAge", { valueAsNumber: true })}
                className={cn(errors.patientAge && "border-destructive")}
                min={0}
                max={150}
              />
              <FormError error={errors.patientAge} />
            </div>
            <div>
              <Label htmlFor="patientGender">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="patientGender"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="patientGender"
                      className={cn(
                        errors.patientGender && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError error={errors.patientGender} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
          <CardDescription>
            Diagnosis, mobility, and cognitive status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>
              Diagnosis Codes <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
              {DIAGNOSIS_CODE_OPTIONS.map((code) => (
                <div key={code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`diagnosis-${code}`}
                    checked={selectedDiagnosisCodes.includes(code)}
                    onCheckedChange={() =>
                      toggleArrayItem(
                        selectedDiagnosisCodes,
                        code,
                        "diagnosisCodes"
                      )
                    }
                  />
                  <label
                    htmlFor={`diagnosis-${code}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {code}
                  </label>
                </div>
              ))}
            </div>
            {errors.diagnosisCodes && (
              <p className="text-sm text-destructive mt-1">
                {errors.diagnosisCodes.message ||
                  "At least one diagnosis code is required"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobilityStatus">
                Mobility Status <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="mobilityStatus"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="mobilityStatus"
                      className={cn(
                        errors.mobilityStatus && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select mobility status" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOBILITY_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError error={errors.mobilityStatus} />
            </div>

            <div>
              <Label htmlFor="cognitiveStatus">Cognitive Status</Label>
              <Controller
                name="cognitiveStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="cognitiveStatus">
                      <SelectValue placeholder="Select cognitive status" />
                    </SelectTrigger>
                    <SelectContent>
                      {COGNITIVE_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <Label>Behavioral Concerns</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
              {BEHAVIORAL_CONCERNS_OPTIONS.map((concern) => (
                <div
                  key={concern.value}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`behavioral-${concern.value}`}
                    checked={selectedBehavioralConcerns.includes(concern.value)}
                    onCheckedChange={() =>
                      toggleArrayItem(
                        selectedBehavioralConcerns,
                        concern.value,
                        "behavioralConcerns"
                      )
                    }
                  />
                  <label
                    htmlFor={`behavioral-${concern.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {concern.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment & Medication */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Equipment & Medication</CardTitle>
          <CardDescription>DME needs and medication management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>DME Needs</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
              {DME_NEEDS_OPTIONS.map((dme) => (
                <div key={dme.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dme-${dme.value}`}
                    checked={selectedDmeNeeds.includes(dme.value)}
                    onCheckedChange={() =>
                      toggleArrayItem(selectedDmeNeeds, dme.value, "dmeNeeds")
                    }
                  />
                  <label
                    htmlFor={`dme-${dme.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {dme.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="medicationManagement"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="medicationManagement"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label
              htmlFor="medicationManagement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Medication Management Required
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Discharge Planning */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Discharge Planning</CardTitle>
          <CardDescription>Location and timeline information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentLocation">
              Current Location <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="currentLocation"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="currentLocation"
                    className={cn(
                      errors.currentLocation && "border-destructive"
                    )}
                  >
                    <SelectValue placeholder="Select current location" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOSPITAL_LOCATIONS.map((location) => (
                      <SelectItem key={location.value} value={location.value}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormError error={errors.currentLocation} />
          </div>

          <div>
            <Label>
              Target Discharge Date <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="targetDischargeDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                        errors.targetDischargeDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <FormError error={errors.targetDischargeDate} />
          </div>
        </CardContent>
      </Card>

      {/* Location Preferences */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Location Preferences</CardTitle>
          <CardDescription>
            Preferred counties and cities for placement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>
              Preferred Counties <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto border rounded-md p-4">
              {MINNESOTA_COUNTIES.map((county) => (
                <div key={county} className="flex items-center space-x-2">
                  <Checkbox
                    id={`county-${county}`}
                    checked={selectedCounties.includes(county)}
                    onCheckedChange={() =>
                      toggleArrayItem(
                        selectedCounties,
                        county,
                        "preferredCounties"
                      )
                    }
                  />
                  <label
                    htmlFor={`county-${county}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {county}
                  </label>
                </div>
              ))}
            </div>
            {errors.preferredCounties && (
              <p className="text-sm text-destructive mt-1">
                {errors.preferredCounties.message ||
                  "At least one preferred county is required"}
              </p>
            )}
          </div>

          <div>
            <Label>Preferred Cities</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Enter city name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const input = e.currentTarget;
                    addCity(input.value);
                    input.value = "";
                  }
                }}
              />
            </div>
            {selectedCities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCities.map((city) => (
                  <Badge
                    key={city}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {city}
                    <button
                      type="button"
                      onClick={() => removeCity(city)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="requiresProximity"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="requiresProximity"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label
              htmlFor="requiresProximity"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Requires Proximity to Specific Location
            </label>
          </div>

          {requiresProximity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2">
              <div>
                <Label htmlFor="proximityZipCode">Zip Code</Label>
                <Controller
                  name="proximityZipCode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="proximityZipCode"
                      {...field}
                      onChange={(e) => {
                        // Only allow digits, max 5
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 5);
                        field.onChange(value || "");
                      }}
                      placeholder="55401"
                      maxLength={5}
                      className={cn(
                        errors.proximityZipCode && "border-destructive"
                      )}
                    />
                  )}
                />
                <FormError error={errors.proximityZipCode} />
              </div>
              <div>
                <Label htmlFor="maxDistanceMiles">Max Distance (miles)</Label>
                <Input
                  id="maxDistanceMiles"
                  type="number"
                  {...register("maxDistanceMiles", { valueAsNumber: true })}
                  placeholder="25"
                  min={0}
                  max={500}
                />
                <FormError error={errors.maxDistanceMiles} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Insurance Information</CardTitle>
          <CardDescription>Primary and secondary insurance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryInsurance">
                Primary Insurance <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="primaryInsurance"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="primaryInsurance"
                      className={cn(
                        errors.primaryInsurance && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select primary insurance" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError error={errors.primaryInsurance} />
            </div>

            <div>
              <Label htmlFor="secondaryInsurance">Secondary Insurance</Label>
              <Controller
                name="secondaryInsurance"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "NONE"}
                    onValueChange={(value) => {
                      // Convert "NONE" back to undefined
                      field.onChange(value === "NONE" ? undefined : value);
                    }}
                  >
                    <SelectTrigger id="secondaryInsurance">
                      <SelectValue placeholder="Select secondary insurance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {PAYER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Transport</CardTitle>
          <CardDescription>Transportation needs for discharge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Controller
              name="needsTransport"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="needsTransport"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label
              htmlFor="needsTransport"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Patient Needs Transport
            </label>
          </div>

          {needsTransport && (
            <div className="pl-6 border-l-2">
              <Label htmlFor="transportType">Transport Type</Label>
              <Controller
                name="transportType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="transportType"
                      className={cn(
                        errors.transportType && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select transport type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError error={errors.transportType} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="healthcare" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Create Discharge Case" : "Save Changes"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
