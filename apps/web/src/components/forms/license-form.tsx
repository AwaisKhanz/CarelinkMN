"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { License, CreateLicenseData, UpdateLicenseData } from "@carelink/types";
import { LICENSE_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const licenseSchema = z
  .object({
    licenseType: z.string().min(1, "License type is required"),
    licenseNumber: z
      .string()
      .min(1, "License number is required")
      .max(100, "License number must be less than 100 characters")
      .regex(
        /^[A-Za-z0-9\s\-_]+$/,
        "License number can only contain letters, numbers, spaces, hyphens, and underscores"
      ),
    issueDate: z
      .string()
      .min(1, "Issue date is required")
      .refine(
        (date) => {
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime());
        },
        {
          message: "Please select a valid issue date",
        }
      )
      .refine(
        (date) => {
          const parsedDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return parsedDate <= today;
        },
        {
          message: "Issue date cannot be in the future",
        }
      ),
    expirationDate: z
      .string()
      .min(1, "Expiration date is required")
      .refine(
        (date) => {
          const parsedDate = new Date(date);
          return !isNaN(parsedDate.getTime());
        },
        {
          message: "Please select a valid expiration date",
        }
      ),
    documentUrl: z
      .union([
        z.string().url("Document URL must be a valid URL"),
        z.literal(""),
        z.null(),
        z.undefined(),
      ])
      .optional()
      .nullable()
      .refine(
        (url) => {
          // If URL is provided, it must be a valid URL
          if (url && url !== "") {
            try {
              new URL(url);
              return true;
            } catch {
              return false;
            }
          }
          return true; // Empty/null/undefined is allowed
        },
        {
          message: "Document URL must be a valid URL",
        }
      ),
  })
  .refine(
    (data) => {
      const issueDate = new Date(data.issueDate);
      const expirationDate = new Date(data.expirationDate);
      return expirationDate > issueDate;
    },
    {
      message: "Expiration date must be after issue date",
      path: ["expirationDate"],
    }
  );

export type LicenseFormData = z.infer<typeof licenseSchema>;

interface LicenseFormProps {
  mode: "create" | "edit";
  initialData?: Partial<License>;
  onSubmit: (data: CreateLicenseData | UpdateLicenseData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function LicenseForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: LicenseFormProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LicenseFormData>({
    resolver: zodResolver(licenseSchema),
    defaultValues: initialData
      ? {
          licenseType: initialData.licenseType || "",
          licenseNumber: initialData.licenseNumber || "",
          issueDate: initialData.issueDate
            ? new Date(initialData.issueDate).toISOString().split("T")[0]
            : "",
          expirationDate: initialData.expirationDate
            ? new Date(initialData.expirationDate).toISOString().split("T")[0]
            : "",
          documentUrl: initialData.documentUrl || "",
        }
      : {
          documentUrl: "",
        },
  });

  useEffect(() => {
    if (initialData?.documentUrl) {
      setUploadedFiles([
        {
          url: initialData.documentUrl,
          fileName: "License Document",
        },
      ]);
    }
  }, [initialData]);

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    if (files.length > 0 && files[0].url) {
      setValue("documentUrl", files[0].url);
    } else {
      setValue("documentUrl", "");
    }
  };

  const onFormSubmit = async (data: LicenseFormData) => {
    const submitData: CreateLicenseData | UpdateLicenseData = {
      licenseType: data.licenseType,
      licenseNumber: data.licenseNumber,
      issueDate: data.issueDate,
      expirationDate: data.expirationDate,
      documentUrl: data.documentUrl || "",
    };

    await onSubmit(submitData);
  };

  const licenseType = watch("licenseType");
  const issueDate = watch("issueDate");
  const expirationDate = watch("expirationDate");

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Add New License" : "Edit License"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Add a new license for your provider organization"
              : "Update license information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* License Type */}
          <div className="space-y-2">
            <Label htmlFor="licenseType">
              License Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={licenseType}
              onValueChange={(value) => setValue("licenseType", value)}
            >
              <SelectTrigger
                id="licenseType"
                className={cn(errors.licenseType && "border-destructive")}
              >
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.licenseType && (
              <p className="text-sm text-destructive">
                {errors.licenseType.message}
              </p>
            )}
          </div>

          {/* License Number */}
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">
              License Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="licenseNumber"
              {...register("licenseNumber")}
              placeholder="Enter license number"
              className={cn(errors.licenseNumber && "border-destructive")}
            />
            {errors.licenseNumber && (
              <p className="text-sm text-destructive">
                {errors.licenseNumber.message}
              </p>
            )}
          </div>

          {/* Issue Date and Expiration Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">
                Issue Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="issueDate"
                type="date"
                {...register("issueDate")}
                className={cn(errors.issueDate && "border-destructive")}
              />
              {errors.issueDate && (
                <p className="text-sm text-destructive">
                  {errors.issueDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">
                Expiration Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expirationDate"
                type="date"
                {...register("expirationDate")}
                className={cn(errors.expirationDate && "border-destructive")}
              />
              {errors.expirationDate && (
                <p className="text-sm text-destructive">
                  {errors.expirationDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>
              License Document <span className="text-destructive">*</span>
            </Label>
            <FileUploader
              documentType="license"
              folder="licenses"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={10 * 1024 * 1024} // 10MB
              maxFiles={1}
              multiple={false}
              files={uploadedFiles}
              onFilesChange={handleFilesChange}
              label="Upload License Document"
              description="Upload a copy of your license document (PDF, JPG, PNG)"
              showPreview={true}
              variant="healthcare"
            />
            {errors.documentUrl && (
              <p className="text-sm text-destructive">
                {errors.documentUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {submitLabel || "Saving..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {submitLabel ||
                (mode === "create" ? "Add License" : "Update License")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
