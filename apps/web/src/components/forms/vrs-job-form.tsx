"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2 } from "lucide-react";
import { JobStatus } from "@carelink/types";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/utils";
import type {
  VRSJob,
  CreateJobData,
  UpdateJobData,
  VRSEmployer,
} from "@/lib/api/services/vrs.service";

// Base schema for creating a VRS job
const createVRSJobSchema = z.object({
  employerId: z.string().min(1, "Employer is required"),
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(1, "Description is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  schedule: z.string().optional().default(""),
  wage: z.string().min(1, "Wage is required"),
  wageType: z.string().min(1, "Wage type is required"),
  requirements: z.string().optional().default(""),
  preferredSkills: z.string().optional().default(""),
  isRemote: z.boolean().default(false),
  location: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(JobStatus).default(JobStatus.DRAFT),
  expiresAt: z.string().optional().or(z.literal("")),
});

// Edit schema - all fields optional except status
const editVRSJobSchema = createVRSJobSchema.partial().extend({
  status: z.nativeEnum(JobStatus),
});

export type VRSJobFormFields = z.infer<typeof createVRSJobSchema>;

interface VRSJobFormProps {
  mode: "create" | "edit";
  employers: Array<{ id: string; companyName: string }>;
  isLoadingEmployers?: boolean;
  initialData?: VRSJob | Partial<CreateJobData>;
  initialEmployerId?: string;
  onSubmit: (data: CreateJobData | UpdateJobData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

const WAGE_TYPES = [
  { value: "HOURLY", label: "Hourly" },
  { value: "SALARY", label: "Salary" },
] as const;

export function VRSJobForm({
  mode,
  employers,
  isLoadingEmployers = false,
  initialData,
  initialEmployerId,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: VRSJobFormProps) {
  const schema = mode === "create" ? createVRSJobSchema : editVRSJobSchema;

  // Format date for date input (YYYY-MM-DD)
  const formatDateForInput = (
    date: string | Date | null | undefined
  ): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  };

  // Format array for textarea
  const formatArrayForTextarea = (arr: string[] | undefined): string => {
    if (!arr || arr.length === 0) return "";
    if (Array.isArray(arr)) return arr.join("\n");
    return "";
  };

  const form = useForm<VRSJobFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      employerId: initialEmployerId || initialData?.employerId || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      employmentType: initialData?.employmentType || "",
      schedule: formatArrayForTextarea(
        Array.isArray(initialData?.schedule) ? initialData.schedule : []
      ),
      wage:
        typeof initialData?.wage === "number"
          ? String(initialData.wage)
          : initialData?.wage || "",
      wageType: initialData?.wageType || "HOURLY",
      requirements: formatArrayForTextarea(initialData?.requirements),
      preferredSkills: formatArrayForTextarea(initialData?.preferredSkills),
      isRemote: initialData?.isRemote ?? false,
      location: initialData?.location || "",
      status: initialData?.status || JobStatus.DRAFT,
      expiresAt: formatDateForInput(initialData?.expiresAt),
    },
  });

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === "edit") {
      form.reset({
        employerId: initialData.employerId || "",
        title: initialData.title || "",
        description: initialData.description || "",
        employmentType: initialData.employmentType || "",
        schedule: formatArrayForTextarea(
          Array.isArray(initialData.schedule) ? initialData.schedule : []
        ),
        wage:
          typeof initialData.wage === "number"
            ? String(initialData.wage)
            : initialData.wage || "",
        wageType: initialData.wageType || "HOURLY",
        requirements: formatArrayForTextarea(initialData.requirements),
        preferredSkills: formatArrayForTextarea(initialData.preferredSkills),
        isRemote: initialData.isRemote ?? false,
        location: initialData.location || "",
        status: initialData.status || JobStatus.DRAFT,
        expiresAt: formatDateForInput(initialData.expiresAt),
      });
    }
  }, [initialData, mode, form]);

  const handleFormSubmit = async (data: VRSJobFormFields) => {
    try {
      // Parse schedule, requirements, and preferredSkills from textarea to array
      const scheduleArray = data.schedule
        ? data.schedule
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const requirementsArray = data.requirements
        ? data.requirements
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const preferredSkillsArray = data.preferredSkills
        ? data.preferredSkills
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // Transform form data to match API types
      const submitData: CreateJobData | UpdateJobData = {
        employerId: data.employerId,
        title: data.title,
        description: data.description,
        employmentType: data.employmentType,
        schedule: scheduleArray,
        wage: parseFloat(data.wage) || 0,
        wageType: data.wageType,
        requirements: requirementsArray,
        preferredSkills: preferredSkillsArray,
        isRemote: data.isRemote,
        location: data.location || undefined,
        status: data.status,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting VRS job form:", error);
      throw error;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Job Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
          <CardDescription>Basic job details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employerId">
              Employer <span className="text-destructive">*</span>
            </Label>
            {isLoadingEmployers ? (
              <div className="text-sm text-muted-foreground">
                Loading employers...
              </div>
            ) : (
              <Controller
                name="employerId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === "edit"}
                  >
                    <SelectTrigger
                      className={cn(
                        form.formState.errors.employerId && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select employer" />
                    </SelectTrigger>
                    <SelectContent>
                      {employers.map((employer) => (
                        <SelectItem key={employer.id} value={employer.id}>
                          {employer.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            <FormError error={form.formState.errors.employerId} />
            {mode === "edit" && (
              <p className="text-xs text-muted-foreground mt-1">
                Employer cannot be changed after job is created
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...form.register("title")}
              className={
                form.formState.errors.title ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              rows={6}
              {...form.register("description")}
              className={
                form.formState.errors.description ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.description} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employmentType">
                Employment Type <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employmentType"
                placeholder="e.g., FULL_TIME, PART_TIME, CONTRACT"
                {...form.register("employmentType")}
                className={
                  form.formState.errors.employmentType
                    ? "border-destructive"
                    : ""
                }
              />
              <FormError error={form.formState.errors.employmentType} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(JobStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError error={form.formState.errors.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation & Schedule */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Compensation & Schedule</CardTitle>
          <CardDescription>
            Wage, schedule, and location details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wage">
                Wage <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wage"
                type="number"
                step="0.01"
                min="0"
                {...form.register("wage")}
                className={
                  form.formState.errors.wage ? "border-destructive" : ""
                }
              />
              <FormError error={form.formState.errors.wage} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wageType">
                Wage Type <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="wageType"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={
                        form.formState.errors.wageType
                          ? "border-destructive"
                          : ""
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WAGE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormError error={form.formState.errors.wageType} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule (one per line)</Label>
            <Textarea
              id="schedule"
              rows={3}
              placeholder="WEEKDAYS&#10;EVENINGS&#10;WEEKENDS"
              {...form.register("schedule")}
              className={
                form.formState.errors.schedule ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.schedule} />
            <p className="text-xs text-muted-foreground">
              Enter one schedule item per line
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="isRemote"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="isRemote"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label
              htmlFor="isRemote"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remote work available
            </Label>
          </div>

          {!form.watch("isRemote") && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Minneapolis, MN"
                {...form.register("location")}
                className={
                  form.formState.errors.location ? "border-destructive" : ""
                }
              />
              <FormError error={form.formState.errors.location} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirements & Skills */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Requirements & Skills</CardTitle>
          <CardDescription>
            Job requirements and preferred skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements (one per line)</Label>
            <Textarea
              id="requirements"
              rows={4}
              placeholder="High school diploma&#10;2+ years experience&#10;Valid driver's license"
              {...form.register("requirements")}
              className={
                form.formState.errors.requirements ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.requirements} />
            <p className="text-xs text-muted-foreground">
              Enter one requirement per line
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredSkills">
              Preferred Skills (one per line)
            </Label>
            <Textarea
              id="preferredSkills"
              rows={4}
              placeholder="Customer service&#10;Microsoft Office&#10;Bilingual (Spanish)"
              {...form.register("preferredSkills")}
              className={
                form.formState.errors.preferredSkills
                  ? "border-destructive"
                  : ""
              }
            />
            <FormError error={form.formState.errors.preferredSkills} />
            <p className="text-xs text-muted-foreground">
              Enter one skill per line
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Expiration */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Expiration</CardTitle>
          <CardDescription>Set job posting expiration date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              {...form.register("expiresAt")}
              className={
                form.formState.errors.expiresAt ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.expiresAt} />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for no expiration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
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
              {submitLabel ||
                (mode === "create" ? "Creating..." : "Updating...")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel || (mode === "create" ? "Create Job" : "Update Job")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
