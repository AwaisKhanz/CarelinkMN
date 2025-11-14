"use client";

import React from "react";
import { useForm } from "react-hook-form";
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
import { Save, Loader2, Calendar as CalendarIcon, X } from "lucide-react";
import { Opening, Placement } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const placementSchema = z
  .object({
    openingId: z.string().min(1, "Opening is required"),
    referralId: z.string().optional(),
    dischargeCaseId: z.string().optional(),
    placementDate: z.date({
      required_error: "Placement date is required",
      invalid_type_error: "Please select a valid date",
    }),
    moveInDate: z
      .date({
        invalid_type_error: "Please select a valid date",
      })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // At least one of referralId or dischargeCaseId must be provided
      return !!(data.referralId || data.dischargeCaseId);
    },
    {
      message: "Either referral ID or discharge case ID must be provided",
      path: ["referralId"],
    }
  )
  .refine(
    (data) => {
      // Move-in date must be after or equal to placement date
      if (data.moveInDate) {
        return data.moveInDate >= data.placementDate;
      }
      return true;
    },
    {
      message: "Move-in date must be after or equal to placement date",
      path: ["moveInDate"],
    }
  );

export type PlacementFormData = z.infer<typeof placementSchema>;

interface PlacementFormProps {
  mode: "create" | "edit";
  openings: Opening[];
  initialData?: Placement;
  onSubmit: (data: PlacementFormData) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function PlacementForm({
  mode,
  openings,
  initialData,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: PlacementFormProps) {
  const form = useForm<PlacementFormData>({
    resolver: zodResolver(placementSchema),
    defaultValues: {
      openingId: initialData?.openingId || "",
      referralId: initialData?.referralId || "",
      dischargeCaseId: initialData?.dischargeCaseId || "",
      placementDate: initialData?.placementDate
        ? new Date(initialData.placementDate)
        : new Date(),
      moveInDate: initialData?.moveInDate
        ? new Date(initialData.moveInDate)
        : null,
    },
  });

  const selectedOpeningId = form.watch("openingId");
  const selectedOpening = openings.find((o) => o.id === selectedOpeningId);

  const handleSubmit = (data: PlacementFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>
              {mode === "create" ? "Create Placement" : "Edit Placement"}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Create a new placement for a resident"
                : "Update placement information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Opening Selection */}
            <FormField
              control={form.control}
              name="openingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={mode === "edit"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an opening" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {openings
                        .filter(
                          (opening) =>
                            opening.status === "OPEN" ||
                            opening.id === initialData?.openingId ||
                            opening.id === selectedOpeningId
                        )
                        .map((opening) => (
                          <SelectItem key={opening.id} value={opening.id}>
                            {opening.home?.name || "Unknown Home"} -{" "}
                            {opening.spotsAvailable} spot
                            {opening.spotsAvailable !== 1 ? "s" : ""} available
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedOpening && (
                    <FormDescription>
                      {selectedOpening.home?.name} - {selectedOpening.home?.city},{" "}
                      {selectedOpening.home?.state}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Referral ID */}
            <FormField
              control={form.control}
              name="referralId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter referral ID (optional)"
                      {...field}
                      disabled={mode === "edit"}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the referral ID if this placement is for a referral
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discharge Case ID */}
            <FormField
              control={form.control}
              name="dischargeCaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discharge Case ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter discharge case ID (optional)"
                      {...field}
                      disabled={mode === "edit"}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the discharge case ID if this placement is for a hospital discharge
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Placement Date */}
            <FormField
              control={form.control}
              name="placementDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Placement Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The date when the placement is confirmed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Move-In Date */}
            <FormField
              control={form.control}
              name="moveInDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Move-In Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date (optional)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const placementDate = form.getValues("placementDate");
                          return (
                            date < new Date("1900-01-01") ||
                            (placementDate && date < placementDate)
                          );
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The actual move-in date (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="healthcare"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Create Placement" : "Update Placement"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

