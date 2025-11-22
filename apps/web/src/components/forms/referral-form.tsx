"use client";

import React from "react";
import { useForm, type FieldError } from "react-hook-form";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Gender, Payer, Urgency, ReferralStatus } from "@carelink/types";
import {
  MOBILITY_STATUS_OPTIONS,
  PAYER_OPTIONS,
  GENDER_OPTIONS,
  URGENCY_CONFIG,
  REFERRAL_STATUS_CONFIG,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FormError } from "@/components/ui/form-error";
import type {
  CreateReferralData,
  UpdateReferralData,
  Referral,
} from "@/lib/api";
import { CareLevelsMultiSelect } from "@/components/settings/care-levels-multi-select";
import { ServicesNeededMultiSelect } from "@/components/settings/services-needed-multi-select";
import { CountiesMultiSelect } from "@/components/settings/counties-multi-select";
import { BehavioralNeedsMultiSelect } from "@/components/settings/behavioral-needs-multi-select";
import { MedicalNeedsMultiSelect } from "@/components/settings/medical-needs-multi-select";

// Base schema for creating a referral
const createReferralSchema = z.object({
  // Client Information
  clientInitials: z
    .string()
    .min(2, "Client initials must be at least 2 characters")
    .max(2, "Client initials must be exactly 2 characters")
    .regex(/^[A-Z]{2}$/, "Client initials must be 2 uppercase letters"),
  clientAge: z
    .number({
      required_error: "Client age is required",
      invalid_type_error: "Client age must be a number",
    })
    .int("Client age must be a whole number")
    .min(18, "Client age must be at least 18")
    .max(120, "Client age cannot exceed 120"),
  clientGender: z.nativeEnum(Gender, {
    required_error: "Client gender is required",
    invalid_type_error: "Please select a valid gender",
  }),

  // Care Needs
  careLevels: z.array(z.string()).min(1, "At least one care level is required"),
  servicesNeeded: z
    .array(z.string())
    .min(1, "At least one service is required"),
  mobilityLevel: z.string().optional(),
  behavioralNeeds: z.array(z.string()).optional().default([]),
  medicalNeeds: z.array(z.string()).optional().default([]),

  // Location Preferences
  preferredCounties: z
    .array(z.string())
    .min(1, "At least one preferred county is required"),
  preferredCities: z.array(z.string()).optional().default([]),
  maxDistance: z
    .number({
      invalid_type_error: "Max distance must be a number",
    })
    .min(0, "Max distance cannot be negative")
    .max(500, "Max distance cannot exceed 500 miles")
    .optional(),

  // Payer Information
  primaryPayer: z.nativeEnum(Payer, {
    required_error: "Primary payer is required",
    invalid_type_error: "Please select a valid primary payer",
  }),
  secondaryPayer: z.nativeEnum(Payer).optional(),

  // Timeline
  targetMoveDate: z
    .date({
      invalid_type_error: "Please select a valid date",
    })
    .optional(),
  urgency: z.nativeEnum(Urgency).optional().default(Urgency.ROUTINE),

  // Notes
  internalNotes: z.string().optional().default(""),

  // Initial Shortlist (optional)
  providerIds: z.array(z.string()).optional().default([]),
});

// Edit schema - all fields optional except for status (which is only for edit)
const editReferralSchema = createReferralSchema.partial().extend({
  status: z.nativeEnum(ReferralStatus).optional(),
});

export type ReferralFormFields = z.infer<typeof createReferralSchema> & {
  status?: ReferralStatus;
};

interface ReferralFormProps {
  mode: "create" | "edit";
  initialData?: Referral | Partial<CreateReferralData>;
  onSubmit: (data: CreateReferralData | UpdateReferralData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ReferralForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: ReferralFormProps) {
  const schema = mode === "create" ? createReferralSchema : editReferralSchema;

  const form = useForm<ReferralFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientInitials: initialData?.clientInitials || "",
      clientAge: initialData?.clientAge || undefined,
      clientGender: initialData?.clientGender || Gender.NO_PREFERENCE,
      careLevels: initialData?.careLevels || [],
      servicesNeeded: initialData?.servicesNeeded || [],
      mobilityLevel: initialData?.mobilityLevel || "",
      behavioralNeeds: initialData?.behavioralNeeds || [],
      medicalNeeds: initialData?.medicalNeeds || [],
      preferredCounties: initialData?.preferredCounties || [],
      preferredCities: initialData?.preferredCities || [],
      maxDistance: initialData?.maxDistance ?? undefined,
      primaryPayer: initialData?.primaryPayer ?? undefined,
      secondaryPayer: initialData?.secondaryPayer ?? undefined,
      targetMoveDate: initialData?.targetMoveDate
        ? new Date(initialData.targetMoveDate)
        : undefined,
      urgency: initialData?.urgency || Urgency.ROUTINE,
      internalNotes: initialData?.internalNotes || "",
      providerIds:
        (initialData && "providerIds" in initialData
          ? initialData.providerIds
          : undefined) || [],
      ...(mode === "edit" && initialData && "status" in initialData
        ? { status: initialData.status }
        : {}),
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = form;

  // Update form when initialData changes (for edit mode)
  React.useEffect(() => {
    if (initialData && mode === "edit") {
      reset({
        clientInitials: initialData.clientInitials || "",
        clientAge: initialData.clientAge || undefined,
        clientGender: initialData.clientGender || Gender.NO_PREFERENCE,
        careLevels: initialData.careLevels || [],
        servicesNeeded: initialData.servicesNeeded || [],
        mobilityLevel: initialData.mobilityLevel || "",
        behavioralNeeds: initialData.behavioralNeeds || [],
        medicalNeeds: initialData.medicalNeeds || [],
        preferredCounties: initialData.preferredCounties || [],
        preferredCities: initialData.preferredCities || [],
        maxDistance: initialData.maxDistance ?? undefined,
        primaryPayer: initialData.primaryPayer ?? undefined,
        secondaryPayer: initialData.secondaryPayer ?? undefined,
        targetMoveDate: initialData.targetMoveDate
          ? new Date(initialData.targetMoveDate)
          : undefined,
        urgency: initialData.urgency || Urgency.ROUTINE,
        internalNotes: initialData.internalNotes || "",
        providerIds:
          ("providerIds" in initialData
            ? initialData.providerIds
            : undefined) || [],
        ...(initialData && "status" in initialData
          ? { status: initialData.status }
          : {}),
      });
    }
  }, [initialData, mode, reset]);

  const selectedCareLevels = watch("careLevels") || [];
  const selectedServicesNeeded = watch("servicesNeeded") || [];
  const selectedBehavioralNeeds = watch("behavioralNeeds") || [];
  const selectedMedicalNeeds = watch("medicalNeeds") || [];
  const selectedCounties = watch("preferredCounties") || [];
  const targetMoveDate = watch("targetMoveDate");
  const primaryPayer = watch("primaryPayer");
  const urgency = watch("urgency");

  const extractFieldError = (error: unknown): FieldError | undefined => {
    if (!error || typeof error !== "object") return undefined;
    if ("message" in error && typeof (error as any).message === "string") {
      return error as FieldError;
    }
    return undefined;
  };

  const careLevelsFieldError = extractFieldError(
    (errors.careLevels as any)?.root || (errors.careLevels as any)
  );
  const servicesNeededFieldError = extractFieldError(
    (errors.servicesNeeded as any)?.root || (errors.servicesNeeded as any)
  );
  const preferredCountiesFieldError = extractFieldError(
    (errors.preferredCounties as any)?.root || (errors.preferredCounties as any)
  );

  const handleFormSubmit = async (data: ReferralFormFields) => {
    try {
      // Transform form data to match shared types exactly
      // Convert null to undefined, dates to ISO strings
      const submitData: CreateReferralData | UpdateReferralData = {
        ...data,
        // Convert null maxDistance to undefined
        maxDistance: data.maxDistance ?? undefined,
        // Convert null targetMoveDate to undefined, then to ISO string if present
        targetMoveDate: data.targetMoveDate
          ? data.targetMoveDate.toISOString()
          : undefined,
        // Convert null secondaryPayer to undefined
        secondaryPayer: data.secondaryPayer ?? undefined,
        // Remove providerIds if not in create mode
        ...(mode === "create" && data.providerIds
          ? { providerIds: data.providerIds }
          : {}),
        // Handle status field - only for update mode
        ...(mode === "edit" && "status" in data && data.status
          ? { status: data.status }
          : {}),
      };

      // Remove status from create data if present
      if (mode === "create" && "status" in submitData) {
        delete (submitData as any).status;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting referral form:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit referral"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Client Information Section */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>
            De-identified client information (HIPAA compliant)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="clientInitials">
                Client Initials <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientInitials"
                {...register("clientInitials")}
                placeholder="AB"
                maxLength={2}
                className={cn(errors.clientInitials && "border-destructive")}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "");
                  setValue("clientInitials", value, { shouldValidate: true });
                }}
              />
              <FormError error={errors.clientInitials} />
            </div>

            <div>
              <Label htmlFor="clientAge">
                Age <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientAge"
                type="number"
                {...register("clientAge", { valueAsNumber: true })}
                placeholder="65"
                min={18}
                max={120}
                className={cn(errors.clientAge && "border-destructive")}
              />
              <FormError error={errors.clientAge} />
            </div>

            <div>
              <Label htmlFor="clientGender">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch("clientGender")}
                onValueChange={(value) =>
                  setValue("clientGender", value as Gender, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  id="clientGender"
                  className={cn(errors.clientGender && "border-destructive")}
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
              <FormError error={errors.clientGender} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Needs Section */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Care Needs</CardTitle>
          <CardDescription>
            Select the care levels and services needed for this client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>
              Care Levels <span className="text-destructive">*</span>
            </Label>
            <CareLevelsMultiSelect
              selectedCareLevels={selectedCareLevels}
              onCareLevelsChange={(values) =>
                setValue("careLevels", values, { shouldValidate: true })
              }
              name="careLevels"
              helperText="Select all levels of care required for this client."
              error={careLevelsFieldError?.message}
              badgeDisplayLimit={Infinity}
            />
          </div>

          <div>
            <Label>
              Services Needed <span className="text-destructive">*</span>
            </Label>
            <ServicesNeededMultiSelect
              selectedServices={selectedServicesNeeded}
              onServicesChange={(values) =>
                setValue("servicesNeeded", values, { shouldValidate: true })
              }
              name="servicesNeeded"
              helperText="Select all applicable service needs."
              error={servicesNeededFieldError?.message}
              badgeDisplayLimit={Infinity}
            />
          </div>

          <div>
            <Label htmlFor="mobilityLevel">Mobility Level</Label>
            <Select
              value={watch("mobilityLevel") || "__NONE__"}
              onValueChange={(value) =>
                setValue(
                  "mobilityLevel",
                  value === "__NONE__" ? undefined : value,
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger id="mobilityLevel">
                <SelectValue placeholder="Select mobility level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">None</SelectItem>
                {MOBILITY_STATUS_OPTIONS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Behavioral Needs</Label>
            <BehavioralNeedsMultiSelect
              selectedNeeds={selectedBehavioralNeeds}
              onNeedsChange={(values) =>
                setValue("behavioralNeeds", values, { shouldValidate: true })
              }
              name="behavioralNeeds"
              helperText="Select any behavioral supports that apply."
              badgeDisplayLimit={Infinity}
            />
          </div>

          <div>
            <Label>Medical Needs</Label>
            <MedicalNeedsMultiSelect
              selectedNeeds={selectedMedicalNeeds}
              onNeedsChange={(values) =>
                setValue("medicalNeeds", values, { shouldValidate: true })
              }
              name="medicalNeeds"
              helperText="Select the medical needs that require attention."
              badgeDisplayLimit={Infinity}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Preferences Section */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Location Preferences</CardTitle>
          <CardDescription>
            Select preferred locations for placement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>
              Preferred Counties <span className="text-destructive">*</span>
            </Label>
            <CountiesMultiSelect
              selectedCounties={selectedCounties}
              onCountiesChange={(values) =>
                setValue("preferredCounties", values, { shouldValidate: true })
              }
              name="preferredCounties"
              helperText="Select all counties that match the client's preferences."
              error={preferredCountiesFieldError?.message}
              badgeDisplayLimit={Infinity}
            />
          </div>

          <div>
            <Label htmlFor="maxDistance">Max Distance (miles)</Label>
            <Input
              id="maxDistance"
              type="number"
              {...register("maxDistance", { valueAsNumber: true })}
              placeholder="50"
              min={0}
              max={500}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payer Information Section */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Payer Information</CardTitle>
          <CardDescription>Select primary and secondary payers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryPayer">
                Primary Payer <span className="text-destructive">*</span>
              </Label>
              <Select
                value={primaryPayer}
                onValueChange={(value) =>
                  setValue("primaryPayer", value as Payer, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger
                  id="primaryPayer"
                  className={cn(errors.primaryPayer && "border-destructive")}
                >
                  <SelectValue placeholder="Select primary payer" />
                </SelectTrigger>
                <SelectContent>
                  {PAYER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={errors.primaryPayer} />
            </div>

            <div>
              <Label htmlFor="secondaryPayer">Secondary Payer</Label>
              <Select
                value={watch("secondaryPayer") || "__NONE__"}
                onValueChange={(value) =>
                  setValue(
                    "secondaryPayer",
                    value === "__NONE__" ? undefined : (value as Payer),
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger id="secondaryPayer">
                  <SelectValue placeholder="Select secondary payer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">None</SelectItem>
                  {PAYER_OPTIONS.filter(
                    (option) => option.value !== primaryPayer
                  ).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            Set target move date and urgency level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetMoveDate">Target Move Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="targetMoveDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetMoveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetMoveDate ? (
                      format(targetMoveDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetMoveDate || undefined}
                    onSelect={(date) =>
                      setValue("targetMoveDate", date || undefined, {
                        shouldValidate: true,
                      })
                    }
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select
                value={urgency}
                onValueChange={(value) =>
                  setValue("urgency", value as Urgency, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(URGENCY_CONFIG).map(([value, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes Section */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
          <CardDescription>
            Add any internal notes about this referral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("internalNotes")}
            placeholder="Add internal notes..."
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Status (Edit Mode Only) */}
      {mode === "edit" && (
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Update referral status</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={watch("status") || ""}
              onValueChange={(value) =>
                setValue("status", value as ReferralStatus, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REFERRAL_STATUS_CONFIG).map(
                  ([value, config]) => (
                    <SelectItem key={value} value={value}>
                      {config.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="healthcare" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {submitLabel || "Saving..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel ||
                (mode === "create" ? "Create Referral" : "Update Referral")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
