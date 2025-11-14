"use client";

import { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { onboardingService } from "@/lib/api";
import { LICENSE_TYPES, STATES } from "@/lib/constants";

interface LicenseUploadProps {
  data: {
    primaryLicenseType: string;
    licenses: Array<{
      licenseType: string;
      licenseNumber: string;
      issuingState: string;
      issueDate: string;
      expirationDate: string;
      documentUrl: string;
    }>;
  };
  onComplete: (data: any) => void;
  onValidateRequest?: (validate: () => boolean) => void;
}

export function LicenseUpload({ data, onComplete, onValidateRequest }: LicenseUploadProps) {
  const [formData, setFormData] = useState(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const onValidateRequestRef = useRef(onValidateRequest);
  
  // Sync formData with data prop when it changes
  useEffect(() => {
    setFormData(data);
  }, [data]);
  
  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onValidateRequestRef.current = onValidateRequest;
  }, [onComplete, onValidateRequest]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.primaryLicenseType) {
      newErrors.primaryLicenseType = "Primary license type is required";
    }

    if (formData.licenses.length === 0) {
      newErrors.licenses = "At least one license is required";
    }

    formData.licenses.forEach((license, index) => {
      if (!license.licenseType) {
        newErrors[`license_${index}_type`] = "License type is required";
      }
      if (!license.licenseNumber) {
        newErrors[`license_${index}_number`] = "License number is required";
      }
      if (!license.issueDate) {
        newErrors[`license_${index}_issue`] = "Issue date is required";
      }
      if (!license.expirationDate) {
        newErrors[`license_${index}_expiration`] =
          "Expiration date is required";
      }
      if (!license.documentUrl) {
        newErrors[`license_${index}_document`] = "Document upload is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLicenseChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      licenses: prev.licenses.map((license, i) =>
        i === index ? { ...license, [field]: value } : license
      ),
    }));

    // Clear error when user starts typing
    const errorKey = `license_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const addLicense = () => {
    setFormData((prev) => ({
      ...prev,
      licenses: [
        ...prev.licenses,
        {
          licenseType: "",
          licenseNumber: "",
          issuingState: "MN",
          issueDate: "",
          expirationDate: "",
          documentUrl: "",
        },
      ],
    }));
  };

  const removeLicense = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      licenses: prev.licenses.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (file: File, index: number) => {
    setUploading(true);

    try {
      // Upload to Supabase via backend API
      const result = await onboardingService.uploadDocument(
        file,
        "license",
        "licenses"
      );

      // Update the license with the uploaded document URL
      handleLicenseChange(index, "documentUrl", result.url);
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete(formData);
    }
  };

  // Expose validation function to parent
  useEffect(() => {
    if (onValidateRequestRef.current) {
      onValidateRequestRef.current(() => {
        if (validateForm()) {
          onCompleteRef.current(formData);
          return true;
        }
        return false;
      });
    }
  }, [formData]); // Only re-register when formData changes

  return (
    <div className="space-y-6">
      {/* Primary License Type */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Primary License Type
          </CardTitle>
          <CardDescription>
            Select your primary license type for this provider profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="primaryLicenseType">Primary License Type *</Label>
            <Select
              value={formData.primaryLicenseType}
              onValueChange={(value) =>
                handleInputChange("primaryLicenseType", value)
              }
            >
              <SelectTrigger
                className={
                  errors.primaryLicenseType ? "border-destructive" : ""
                }
              >
                <SelectValue placeholder="Select your primary license type" />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_TYPES.map((license) => (
                  <SelectItem key={license.value} value={license.value}>
                    <div className="flex flex-col">
                      <span>{license.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {license.category}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.primaryLicenseType && (
              <p className="text-sm text-destructive mt-1">
                {errors.primaryLicenseType}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* License Documents */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            License Documents
          </CardTitle>
          <CardDescription>
            Upload copies of your licenses and certifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.licenses.map((license, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">License {index + 1}</h4>
                {formData.licenses.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeLicense(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`license_${index}_type`}>
                    License Type *
                  </Label>
                  <Select
                    value={license.licenseType}
                    onValueChange={(value) =>
                      handleLicenseChange(index, "licenseType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        errors[`license_${index}_type`]
                          ? "border-destructive"
                          : ""
                      }
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
                  {errors[`license_${index}_type`] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors[`license_${index}_type`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`license_${index}_number`}>
                    License Number *
                  </Label>
                  <Input
                    id={`license_${index}_number`}
                    value={license.licenseNumber}
                    onChange={(e) =>
                      handleLicenseChange(
                        index,
                        "licenseNumber",
                        e.target.value
                      )
                    }
                    placeholder="Enter license number"
                    className={
                      errors[`license_${index}_number`]
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {errors[`license_${index}_number`] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors[`license_${index}_number`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`license_${index}_state`}>
                    Issuing State *
                  </Label>
                  <Select
                    value={license.issuingState}
                    onValueChange={(value) =>
                      handleLicenseChange(index, "issuingState", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`license_${index}_issue`}>Issue Date *</Label>
                  <Input
                    id={`license_${index}_issue`}
                    type="date"
                    value={license.issueDate}
                    onChange={(e) =>
                      handleLicenseChange(index, "issueDate", e.target.value)
                    }
                    className={
                      errors[`license_${index}_issue`]
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {errors[`license_${index}_issue`] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors[`license_${index}_issue`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`license_${index}_expiration`}>
                    Expiration Date *
                  </Label>
                  <Input
                    id={`license_${index}_expiration`}
                    type="date"
                    value={license.expirationDate}
                    onChange={(e) =>
                      handleLicenseChange(
                        index,
                        "expirationDate",
                        e.target.value
                      )
                    }
                    className={
                      errors[`license_${index}_expiration`]
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {errors[`license_${index}_expiration`] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors[`license_${index}_expiration`]}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`license_${index}_document`}>
                    Document Upload *
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, index);
                        }
                      }}
                      disabled={uploading}
                      className={
                        errors[`license_${index}_document`]
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {license.documentUrl && (
                      <Badge variant="healthcareSuccess" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  {errors[`license_${index}_document`] && (
                    <p className="text-sm text-destructive mt-1">
                      {errors[`license_${index}_document`]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: PDF, JPG, PNG (Max 10MB)
                  </p>
                </div>
              </div>
            </div>
          ))}

          {errors.licenses && (
            <p className="text-sm text-destructive">{errors.licenses}</p>
          )}

          <Button variant="outline" onClick={addLicense} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Another License
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
