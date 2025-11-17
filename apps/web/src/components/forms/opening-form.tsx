"use client";

import React from "react";
import {
  useForm,
  type FieldErrors,
  type FieldError,
  Controller,
} from "react-hook-form";
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
import { Save, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Gender, Payer, OpeningStatus, Home } from "@/lib/api";
import {
  CARE_LEVELS,
  SUPPORTED_NEEDS,
  PAYER_OPTIONS,
  GENDER_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FormError } from "@/components/ui/form-error";

export const STATUS_OPTIONS: Array<{ value: OpeningStatus; label: string }> = [
  { value: OpeningStatus.OPEN, label: "Open" },
  { value: OpeningStatus.PENDING, label: "Pending" },
  { value: OpeningStatus.FILLED, label: "Filled" },
  { value: OpeningStatus.EXPIRED, label: "Expired" },
];

// Base schema object (without refinements)
const baseOpeningSchema = z.object({
  homeId: z.string().min(1, "Home is required").uuid("Invalid home ID format"),
  spotsAvailable: z.preprocess(
    (val) => {
      if (
        val === "" ||
        val === null ||
        val === undefined ||
        (typeof val === "number" && isNaN(val))
      ) {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z
      .number({
        required_error: "Spots available is required",
        invalid_type_error: "Spots available must be a number",
      })
      .int("Spots available must be a whole number")
      .min(1, "At least 1 spot is required")
      .max(100, "Maximum 100 spots allowed")
  ),
  availableFrom: z
    .date({
      required_error: "Available from date is required",
      invalid_type_error: "Please select a valid date",
    })
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      {
        message: "Available from date cannot be in the past",
      }
    ),
  availableUntil: z
    .date({
      invalid_type_error: "Please select a valid date",
    })
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true;
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 10);
        return date <= maxDate;
      },
      {
        message:
          "Available until date cannot be more than 10 years in the future",
      }
    ),
  ageMin: z
    .union([
      z
        .number({
          invalid_type_error: "Minimum age must be a number",
        })
        .int("Minimum age must be a whole number")
        .min(0, "Minimum age cannot be negative")
        .max(150, "Minimum age cannot exceed 150"),
      z.nan(),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable()
    .transform((val) => {
      if (
        val === "" ||
        val === null ||
        val === undefined ||
        isNaN(val as number)
      ) {
        return undefined;
      }
      return val;
    }),
  ageMax: z
    .union([
      z
        .number({
          invalid_type_error: "Maximum age must be a number",
        })
        .int("Maximum age must be a whole number")
        .min(0, "Maximum age cannot be negative")
        .max(150, "Maximum age cannot exceed 150"),
      z.nan(),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable()
    .transform((val) => {
      if (
        val === "" ||
        val === null ||
        val === undefined ||
        isNaN(val as number)
      ) {
        return undefined;
      }
      return val;
    }),
  genderPreference: z
    .nativeEnum(Gender, {
      errorMap: () => ({ message: "Please select a valid gender preference" }),
    })
    .optional()
    .default(Gender.NO_PREFERENCE),
  careLevels: z
    .array(z.string().min(1, "Care level cannot be empty"))
    .min(1, "At least one care level is required")
    .default([]),
  supportedNeeds: z
    .array(z.string().min(1, "Supported need cannot be empty"))
    .default([]),
  acceptedPayers: z
    .array(
      z.nativeEnum(Payer, {
        errorMap: () => ({ message: "Invalid payer type selected" }),
      })
    )
    .min(1, "At least one accepted payer is required")
    .max(10, "Maximum 10 payers allowed"),
  privatePayRate: z
    .union([
      z
        .number({
          invalid_type_error: "Private pay rate must be a number",
        })
        .min(0, "Private pay rate cannot be negative")
        .max(999999.99, "Private pay rate is too high")
        .refine(
          (val) => {
            // Check if it has more than 2 decimal places
            const decimalPlaces = (val.toString().split(".")[1] || "").length;
            return decimalPlaces <= 2;
          },
          {
            message: "Private pay rate can have at most 2 decimal places",
          }
        ),
      z.literal(""),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable()
    .transform((val) => (val === "" ? undefined : val)),
});

// Create schema with refinements
const createOpeningSchema = baseOpeningSchema
  .refine(
    (data) => {
      if (
        data.ageMin !== null &&
        data.ageMin !== undefined &&
        data.ageMax !== null &&
        data.ageMax !== undefined
      ) {
        return data.ageMax >= data.ageMin;
      }
      return true;
    },
    {
      message: "Maximum age must be greater than or equal to minimum age",
      path: ["ageMax"],
    }
  )
  .refine(
    (data) => {
      if (data.availableUntil && data.availableFrom) {
        // Compare dates without time
        const until = new Date(data.availableUntil);
        until.setHours(0, 0, 0, 0);
        const from = new Date(data.availableFrom);
        from.setHours(0, 0, 0, 0);
        return until >= from;
      }
      return true;
    },
    {
      message:
        "Available until date must be after or equal to available from date",
      path: ["availableUntil"],
    }
  );

// Edit schema extends base (without homeId) and adds status, then applies refinements
const editOpeningSchema = baseOpeningSchema
  .omit({ homeId: true })
  .extend({
    status: z
      .nativeEnum(OpeningStatus, {
        errorMap: () => ({ message: "Please select a valid status" }),
      })
      .default(OpeningStatus.OPEN),
  })
  .refine(
    (data) => {
      if (
        data.ageMin !== null &&
        data.ageMin !== undefined &&
        data.ageMax !== null &&
        data.ageMax !== undefined
      ) {
        return data.ageMax >= data.ageMin;
      }
      return true;
    },
    {
      message: "Maximum age must be greater than or equal to minimum age",
      path: ["ageMax"],
    }
  )
  .refine(
    (data) => {
      if (data.availableUntil && data.availableFrom) {
        // Compare dates without time
        const until = new Date(data.availableUntil);
        until.setHours(0, 0, 0, 0);
        const from = new Date(data.availableFrom);
        from.setHours(0, 0, 0, 0);
        return until >= from;
      }
      return true;
    },
    {
      message:
        "Available until date must be after or equal to available from date",
      path: ["availableUntil"],
    }
  );

export type CreateOpeningFormData = z.infer<typeof createOpeningSchema>;
export type EditOpeningFormData = z.infer<typeof editOpeningSchema>;

// Union type for all possible form fields
export type OpeningFormFields = CreateOpeningFormData &
  Partial<EditOpeningFormData>;

interface OpeningFormProps {
  mode: "create" | "edit";
  homes?: Home[];
  home?: { name: string; city: string; state: string } | null;
  initialData?: Partial<OpeningFormFields>;
  onSubmit: (data: OpeningFormFields) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function OpeningForm({
  mode,
  homes = [],
  home,
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: OpeningFormProps) {
  const schema = mode === "create" ? createOpeningSchema : editOpeningSchema;
  const formData = useForm<OpeningFormFields>({
    resolver: zodResolver(schema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      genderPreference: Gender.NO_PREFERENCE,
      careLevels: [],
      supportedNeeds: [],
      acceptedPayers: [],
      homeId: mode === "create" ? (initialData?.homeId ?? "") : undefined,
      status:
        mode === "edit"
          ? (initialData?.status ?? OpeningStatus.OPEN)
          : undefined,
      ...initialData,
    } as OpeningFormFields,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
    trigger,
  } = formData;

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData && mode === "edit") {
      reset({
        genderPreference: Gender.NO_PREFERENCE,
        careLevels: [],
        supportedNeeds: [],
        acceptedPayers: [],
        status: OpeningStatus.OPEN,
        ...initialData,
      });
    }
  }, [initialData, mode, reset]);

  const selectedCareLevels = watch("careLevels");
  const selectedSupportedNeeds = watch("supportedNeeds");
  const selectedPayers = watch("acceptedPayers");
  const availableFrom = watch("availableFrom");
  const availableUntil = watch("availableUntil");

  const toggleCareLevel = (level: string) => {
    const current = selectedCareLevels || [];
    if (current.includes(level)) {
      setValue(
        "careLevels",
        current.filter((l) => l !== level),
        { shouldValidate: true }
      );
    } else {
      setValue("careLevels", [...current, level], { shouldValidate: true });
    }
  };

  const toggleSupportedNeed = (need: string) => {
    const current = selectedSupportedNeeds || [];
    if (current.includes(need)) {
      setValue(
        "supportedNeeds",
        current.filter((n) => n !== need),
        { shouldValidate: true }
      );
    } else {
      setValue("supportedNeeds", [...current, need], { shouldValidate: true });
    }
  };

  const togglePayer = (payer: Payer) => {
    const current = selectedPayers || [];
    if (current.includes(payer)) {
      setValue(
        "acceptedPayers",
        current.filter((p) => p !== payer),
        { shouldValidate: true }
      );
    } else {
      setValue("acceptedPayers", [...current, payer], { shouldValidate: true });
    }
  };

  const onFormSubmit = async (data: OpeningFormFields) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is handled by parent component
    }
  };

  const onError = (submissionErrors: FieldErrors<OpeningFormFields>) => {
    console.error("Opening form validation errors", submissionErrors);
    toast.error("Please fix the highlighted fields and try again.");
  };

  // Type-safe error access helper
  const getError = (field: keyof OpeningFormFields): FieldError | undefined => {
    return errors[field] as FieldError | undefined;
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit, onError)} className="space-y-6">
      {/* Status (Edit mode only) */}
      {mode === "edit" && (
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Current status of this opening</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || OpeningStatus.OPEN}
                    onValueChange={(value) => {
                      field.onChange(value as OpeningStatus);
                      trigger("status");
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        mode === "edit" &&
                          getError("status") &&
                          "border-destructive"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {mode === "edit" && <FormError error={getError("status")} />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Select the home and specify availability details"
              : "Update availability details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Home Selection (Create mode) or Display (Edit mode) */}
          {mode === "create" ? (
            <div className="space-y-2">
              <Label htmlFor="homeId">Home *</Label>
              <Controller
                name="homeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      trigger("homeId");
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        mode === "create" &&
                          getError("homeId") &&
                          "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select a home" />
                    </SelectTrigger>
                    <SelectContent>
                      {homes.map((home) => (
                        <SelectItem key={home.id} value={home.id}>
                          {home.name} - {home.city}, {home.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {mode === "create" && <FormError error={getError("homeId")} />}
            </div>
          ) : (
            home && (
              <div className="space-y-2">
                <Label>Home</Label>
                <div className="px-3 py-2 bg-muted rounded-md border">
                  <p className="text-sm font-medium text-foreground">
                    {home.name} - {home.city}, {home.state}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Home cannot be changed after opening is created
                  </p>
                </div>
              </div>
            )
          )}

          {/* Spots Available */}
          <div className="space-y-2">
            <Label htmlFor="spotsAvailable">Spots Available *</Label>
            <Input
              id="spotsAvailable"
              type="number"
              min="1"
              max="100"
              {...register("spotsAvailable", {
                valueAsNumber: true,
                validate: (value) => {
                  if (value === undefined || value === null || isNaN(value)) {
                    return "Spots available is required";
                  }
                  return true;
                },
              })}
              className={cn(getError("spotsAvailable") && "border-destructive")}
            />
            <FormError error={getError("spotsAvailable")} />
          </div>

          {/* Available From */}
          <div className="space-y-2">
            <Label>Available From *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !availableFrom && "text-muted-foreground",
                    getError("availableFrom") && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {availableFrom ? (
                    format(availableFrom, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={availableFrom}
                  onSelect={(date) => {
                    if (date) {
                      setValue("availableFrom", date, {
                        shouldValidate: true,
                      });

                      // If availableUntil is set and is now invalid, clear it
                      if (availableUntil) {
                        const untilDate = new Date(availableUntil);
                        untilDate.setHours(0, 0, 0, 0);
                        const fromDate = new Date(date);
                        fromDate.setHours(0, 0, 0, 0);

                        if (untilDate < fromDate) {
                          setValue("availableUntil", null, {
                            shouldValidate: true,
                          });
                          toast.error(
                            "Available until date was cleared because it was before the new available from date"
                          );
                        }
                      }

                      // Trigger validation for availableUntil when availableFrom changes
                      formData.trigger("availableUntil");
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormError error={getError("availableFrom")} />
          </div>

          {/* Available Until */}
          <div className="space-y-2">
            <Label>Available Until (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !availableUntil && "text-muted-foreground",
                    getError("availableUntil") && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {availableUntil ? (
                    format(availableUntil, "PPP")
                  ) : (
                    <span>Pick a date (optional)</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={availableUntil || undefined}
                  fromDate={availableFrom || undefined}
                  disabled={(date) => {
                    if (!availableFrom) return false;
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    const fromDate = new Date(availableFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    return checkDate < fromDate;
                  }}
                  onSelect={(date) => {
                    if (date) {
                      // Validate that the selected date is not before availableFrom
                      if (availableFrom) {
                        const selectedDate = new Date(date);
                        selectedDate.setHours(0, 0, 0, 0);
                        const fromDate = new Date(availableFrom);
                        fromDate.setHours(0, 0, 0, 0);

                        if (selectedDate < fromDate) {
                          // Don't set the value if it's invalid
                          toast.error(
                            "Available until date must be after or equal to available from date"
                          );
                          return;
                        }
                      }
                      setValue("availableUntil", date, {
                        shouldValidate: true,
                      });
                    } else {
                      setValue("availableUntil", null, {
                        shouldValidate: true,
                      });
                    }
                    // Trigger validation for availableFrom when availableUntil changes
                    formData.trigger("availableFrom");
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormError error={getError("availableUntil")} />
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
          <CardDescription>
            Specify age range and gender preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Age Min */}
            <div className="space-y-2">
              <Label htmlFor="ageMin">Minimum Age</Label>
              <Input
                id="ageMin"
                type="number"
                min="0"
                max="150"
                {...register("ageMin", {
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === "" || v === null || v === undefined)
                      return undefined;
                    const num = Number(v);
                    return isNaN(num) ? undefined : num;
                  },
                  onChange: () => {
                    // Trigger validation for ageMax when ageMin changes
                    formData.trigger("ageMax");
                  },
                })}
                placeholder="No minimum"
                className={cn(getError("ageMin") && "border-destructive")}
              />
              <FormError error={getError("ageMin")} />
            </div>

            {/* Age Max */}
            <div className="space-y-2">
              <Label htmlFor="ageMax">Maximum Age</Label>
              <Input
                id="ageMax"
                type="number"
                min="0"
                max="150"
                {...register("ageMax", {
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === "" || v === null || v === undefined)
                      return undefined;
                    const num = Number(v);
                    return isNaN(num) ? undefined : num;
                  },
                  onChange: () => {
                    // Trigger validation for ageMin when ageMax changes
                    formData.trigger("ageMin");
                  },
                })}
                placeholder="No maximum"
                className={cn(getError("ageMax") && "border-destructive")}
              />
              <FormError error={getError("ageMax")} />
            </div>

            {/* Gender Preference */}
            <div className="space-y-2">
              <Label htmlFor="genderPreference">Gender Preference</Label>
              <Controller
                name="genderPreference"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || Gender.NO_PREFERENCE}
                    onValueChange={(value) => {
                      field.onChange(value as Gender);
                      trigger("genderPreference");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Levels */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Care Levels</CardTitle>
          <CardDescription>
            Select the care levels this opening supports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CARE_LEVELS.map((level) => (
              <div
                key={level.value}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  id={`care-level-${level.value}`}
                  checked={selectedCareLevels?.includes(level.value) || false}
                  onCheckedChange={() => toggleCareLevel(level.value)}
                />
                <Label
                  htmlFor={`care-level-${level.value}`}
                  className="cursor-pointer flex-1"
                >
                  {level.label}
                </Label>
              </div>
            ))}
          </div>
          <FormError error={getError("careLevels")} className="mt-2" />
        </CardContent>
      </Card>

      {/* Supported Needs */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Supported Needs</CardTitle>
          <CardDescription>
            Select the specific needs this opening can accommodate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUPPORTED_NEEDS.map((need) => (
              <div
                key={need.value}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50"
              >
                <Checkbox
                  id={`supported-need-${need.value}`}
                  checked={
                    selectedSupportedNeeds?.includes(need.value) || false
                  }
                  onCheckedChange={() => toggleSupportedNeed(need.value)}
                />
                <Label
                  htmlFor={`supported-need-${need.value}`}
                  className="cursor-pointer flex-1"
                >
                  {need.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payers */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Accepted Payers *</CardTitle>
          <CardDescription>
            Select all payers accepted for this opening
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAYER_OPTIONS.map((payer) => (
              <div
                key={payer.value}
                className={cn(
                  "flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50",
                  selectedPayers?.includes(payer.value) &&
                    "border-primary bg-primary/5"
                )}
              >
                <Checkbox
                  id={`payer-${payer.value}`}
                  checked={selectedPayers?.includes(payer.value) || false}
                  onCheckedChange={() => togglePayer(payer.value)}
                />
                <Label
                  htmlFor={`payer-${payer.value}`}
                  className="cursor-pointer flex-1"
                >
                  {payer.label}
                </Label>
              </div>
            ))}
          </div>
          <FormError error={getError("acceptedPayers")} className="mt-2" />
        </CardContent>
      </Card>

      {/* Private Pay Rate */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Private Pay Rate</CardTitle>
          <CardDescription>
            Optional rate for private pay residents (per month)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="privatePayRate">Monthly Rate ($)</Label>
            <Input
              id="privatePayRate"
              type="number"
              min="0"
              step="0.01"
              {...register("privatePayRate", {
                valueAsNumber: true,
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              placeholder="0.00"
              className={cn(getError("privatePayRate") && "border-destructive")}
            />
            <FormError error={getError("privatePayRate")} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {submitLabel ||
                (mode === "create" ? "Creating..." : "Updating...")}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {submitLabel ||
                (mode === "create" ? "Create Opening" : "Update Opening")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
