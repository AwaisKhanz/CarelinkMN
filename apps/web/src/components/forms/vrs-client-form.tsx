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
import { Save, Loader2 } from "lucide-react";
import { VRSClientStatus } from "@carelink/types";
import { ServicesNeededMultiSelect } from "@/components/settings/services-needed-multi-select";
import { FormError } from "@/components/ui/form-error";
import type {
  VRSClient,
  CreateClientData,
  UpdateClientData,
} from "@/lib/api/services/vrs.service";

// Base schema for creating a VRS client
const createVRSClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  eligibilityType: z.string().min(1, "Eligibility type is required"),
  servicesNeeded: z.array(z.string()).default([]),
  workHistory: z.string().optional().or(z.literal("")),
  skills: z.string().optional().default(""),
  interests: z.string().optional().default(""),
  status: z.nativeEnum(VRSClientStatus).default(VRSClientStatus.INTAKE),
  assignedSpecialistId: z.string().optional().or(z.literal("")),
});

// Edit schema - all fields optional except status
const editVRSClientSchema = createVRSClientSchema.partial().extend({
  status: z.nativeEnum(VRSClientStatus),
});

export type VRSClientFormFields = z.infer<typeof createVRSClientSchema>;

interface VRSClientFormProps {
  mode: "create" | "edit";
  initialData?: VRSClient | Partial<CreateClientData>;
  onSubmit: (data: CreateClientData | UpdateClientData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function VRSClientForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: VRSClientFormProps) {
  const schema =
    mode === "create" ? createVRSClientSchema : editVRSClientSchema;

  // Format date for date input (YYYY-MM-DD)
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  };

  // Format skills/interests array for textarea
  const formatArrayForTextarea = (
    arr: string[] | string | undefined
  ): string => {
    if (!arr) return "";
    if (typeof arr === "string") return arr;
    if (Array.isArray(arr)) return arr.join("\n");
    return "";
  };

  // Format workHistory JSON for textarea
  const formatWorkHistory = (workHistory: unknown): string => {
    if (!workHistory) return "";
    if (typeof workHistory === "string") return workHistory;
    try {
      return JSON.stringify(workHistory, null, 2);
    } catch {
      return "";
    }
  };

  const form = useForm<VRSClientFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      dateOfBirth: formatDateForInput(initialData?.dateOfBirth),
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      eligibilityType: initialData?.eligibilityType || "",
      servicesNeeded: Array.isArray(initialData?.servicesNeeded)
        ? initialData.servicesNeeded
        : [],
      workHistory: formatWorkHistory(initialData?.workHistory),
      skills: formatArrayForTextarea(initialData?.skills),
      interests: formatArrayForTextarea(initialData?.interests),
      status: initialData?.status || VRSClientStatus.INTAKE,
      assignedSpecialistId: initialData?.assignedSpecialistId || "",
    },
  });

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === "edit") {
      form.reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        dateOfBirth: formatDateForInput(initialData.dateOfBirth),
        email: initialData.email || "",
        phone: initialData.phone || "",
        eligibilityType: initialData.eligibilityType || "",
        servicesNeeded: Array.isArray(initialData.servicesNeeded)
          ? initialData.servicesNeeded
          : [],
        workHistory: formatWorkHistory(initialData.workHistory),
        skills: formatArrayForTextarea(initialData.skills),
        interests: formatArrayForTextarea(initialData.interests),
        status: initialData.status || VRSClientStatus.INTAKE,
        assignedSpecialistId: initialData.assignedSpecialistId || "",
      });
    }
  }, [initialData, mode, form]);

  const handleFormSubmit = async (data: VRSClientFormFields) => {
    try {
      // Parse workHistory JSON if provided
      let workHistoryJson: unknown = [];
      if (data.workHistory && data.workHistory.trim()) {
        try {
          workHistoryJson = JSON.parse(data.workHistory);
        } catch {
          // If not valid JSON, wrap in array
          workHistoryJson = [data.workHistory];
        }
      }

      // Parse skills and interests from textarea to array
      const skillsArray = data.skills
        ? data.skills
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const interestsArray = data.interests
        ? data.interests
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // Transform form data to match API types
      const submitData: CreateClientData | UpdateClientData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        email: data.email || undefined,
        phone: data.phone || undefined,
        eligibilityType: data.eligibilityType,
        servicesNeeded: data.servicesNeeded || [],
        workHistory: workHistoryJson,
        skills: skillsArray,
        interests: interestsArray,
        status: data.status,
        assignedSpecialistId: data.assignedSpecialistId || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting VRS client form:", error);
      throw error;
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Demographics */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
          <CardDescription>Basic client information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                className={
                  form.formState.errors.firstName ? "border-destructive" : ""
                }
              />
              <FormError error={form.formState.errors.firstName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                className={
                  form.formState.errors.lastName ? "border-destructive" : ""
                }
              />
              <FormError error={form.formState.errors.lastName} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...form.register("dateOfBirth")}
              className={
                form.formState.errors.dateOfBirth ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.dateOfBirth} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className={
                  form.formState.errors.email ? "border-destructive" : ""
                }
              />
              <FormError error={form.formState.errors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                className={
                  form.formState.errors.phone ? "border-destructive" : ""
                }
              />
              <FormError error={form.formState.errors.phone} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VRS Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>VRS Information</CardTitle>
          <CardDescription>VRS-specific client details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eligibilityType">
              Eligibility Type <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eligibilityType"
              placeholder="e.g., DISABILITY, VETERAN"
              {...form.register("eligibilityType")}
              className={
                form.formState.errors.eligibilityType
                  ? "border-destructive"
                  : ""
              }
            />
            <FormError error={form.formState.errors.eligibilityType} />
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
                    {Object.values(VRSClientStatus).map((status) => (
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

          <div className="space-y-2">
            <Label htmlFor="assignedSpecialistId">Assigned Specialist ID</Label>
            <Input
              id="assignedSpecialistId"
              placeholder="Specialist user ID"
              {...form.register("assignedSpecialistId")}
              className={
                form.formState.errors.assignedSpecialistId
                  ? "border-destructive"
                  : ""
              }
            />
            <FormError error={form.formState.errors.assignedSpecialistId} />
          </div>

          <div className="space-y-2">
            <Label>Services Needed</Label>
            <Controller
              name="servicesNeeded"
              control={form.control}
              render={({ field }) => (
                <ServicesNeededMultiSelect
                  selectedServices={field.value || []}
                  onServicesChange={(values) => field.onChange(values)}
                  name="servicesNeeded"
                  helperText={
                    mode === "create"
                      ? "Select all services this client needs support with."
                      : "Select all services this client requires."
                  }
                  error={form.formState.errors.servicesNeeded?.message}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills (one per line)</Label>
            <Textarea
              id="skills"
              rows={3}
              placeholder="Customer service&#10;Data entry&#10;Microsoft Office"
              {...form.register("skills")}
              className={
                form.formState.errors.skills ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.skills} />
            <p className="text-xs text-muted-foreground">
              Enter one skill per line
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interests (one per line)</Label>
            <Textarea
              id="interests"
              rows={3}
              placeholder="Technology&#10;Healthcare&#10;Education"
              {...form.register("interests")}
              className={
                form.formState.errors.interests ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.interests} />
            <p className="text-xs text-muted-foreground">
              Enter one interest per line
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workHistory">Work History (JSON)</Label>
            <Textarea
              id="workHistory"
              placeholder='[{"company": "ABC Corp", "position": "Assistant", "duration": "2 years"}]'
              {...form.register("workHistory")}
              rows={4}
              className={
                form.formState.errors.workHistory ? "border-destructive" : ""
              }
            />
            <FormError error={form.formState.errors.workHistory} />
            <p className="text-xs text-muted-foreground">
              Enter work history as JSON array or plain text
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
              {submitLabel ||
                (mode === "create" ? "Create Client" : "Update Client")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
