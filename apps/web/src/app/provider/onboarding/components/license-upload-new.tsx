"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Upload,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  Eye,
  Trash2,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { onboardingService } from "@/lib/api/services/onboarding.service";
import { LICENSE_TYPES, US_STATES } from "@/lib/constants";

interface LicenseUploadProps {
  data: any;
  onComplete: (data: any) => void;
  onChange?: (data: any) => void;
}

interface License {
  id?: string;
  licenseType: string;
  licenseNumber: string;
  issuingState: string;
  issueDate: string;
  expirationDate: string;
  documentUrl?: string;
  fileName?: string;
  isUploading?: boolean;
}

export function LicenseUpload({ data, onComplete, onChange }: LicenseUploadProps) {
  const [licenses, setLicenses] = useState<License[]>(data?.licenses || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save when data changes
  useEffect(() => {
    if (onChange) {
      const timeoutId = setTimeout(() => {
        onChange({ licenses });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [licenses, onChange]);

  const addNewLicense = () => {
    const newLicense: License = {
      licenseType: "",
      licenseNumber: "",
      issuingState: "MN",
      issueDate: "",
      expirationDate: "",
    };
    setLicenses(prev => [...prev, newLicense]);
  };

  const updateLicense = (index: number, field: keyof License, value: string) => {
    setLicenses(prev =>
      prev.map((license, i) =>
        i === index ? { ...license, [field]: value } : license
      )
    );

    // Clear error when user starts typing
    const errorKey = `${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: "" }));
    }
  };

  const removeLicense = (index: number) => {
    setLicenses(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    // Validate file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file (JPEG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Set uploading state
    setLicenses(prev =>
      prev.map((license, i) =>
        i === index ? { ...license, isUploading: true } : license
      )
    );

    try {
      const result = await onboardingService.uploadDocument(file, 'license');

      setLicenses(prev =>
        prev.map((license, i) =>
          i === index ? {
            ...license,
            documentUrl: result.url,
            fileName: result.fileName,
            isUploading: false
          } : license
        )
      );

      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');

      setLicenses(prev =>
        prev.map((license, i) =>
          i === index ? { ...license, isUploading: false } : license
        )
      );
    }
  };

  const validateLicenses = () => {
    const newErrors: Record<string, string> = {};

    if (licenses.length === 0) {
      newErrors.general = "At least one license is required";
      setErrors(newErrors);
      return false;
    }

    licenses.forEach((license, index) => {
      if (!license.licenseType) {
        newErrors[`${index}_licenseType`] = "License type is required";
      }
      if (!license.licenseNumber.trim()) {
        newErrors[`${index}_licenseNumber`] = "License number is required";
      }
      if (!license.issueDate) {
        newErrors[`${index}_issueDate`] = "Issue date is required";
      }
      if (!license.expirationDate) {
        newErrors[`${index}_expirationDate`] = "Expiration date is required";
      }

      // Check if expiration date is after issue date
      if (license.issueDate && license.expirationDate) {
        const issueDate = new Date(license.issueDate);
        const expirationDate = new Date(license.expirationDate);
        if (expirationDate <= issueDate) {
          newErrors[`${index}_expirationDate`] = "Expiration date must be after issue date";
        }
      }

      // Check if license is expired
      if (license.expirationDate) {
        const expirationDate = new Date(license.expirationDate);
        const today = new Date();
        if (expirationDate < today) {
          newErrors[`${index}_expirationDate`] = "License appears to be expired";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    if (validateLicenses()) {
      onComplete({ licenses });
    }
  };

  const isFormValid = () => {
    return licenses.length > 0 &&
           licenses.every(license =>
             license.licenseType &&
             license.licenseNumber.trim() &&
             license.issueDate &&
             license.expirationDate
           );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Professional Licenses & Certifications
          </CardTitle>
          <CardDescription>
            Upload your professional licenses and certifications. All licenses will be verified by our admin team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.general && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.general}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {licenses.map((license, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">License {index + 1}</CardTitle>
                    {licenses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLicense(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>License Type *</Label>
                      <Select
                        value={license.licenseType}
                        onValueChange={(value) => updateLicense(index, 'licenseType', value)}
                      >
                        <SelectTrigger className={errors[`${index}_licenseType`] ? "border-destructive" : ""}>
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
                      {errors[`${index}_licenseType`] && (
                        <p className="text-sm text-destructive">{errors[`${index}_licenseType`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>License Number *</Label>
                      <Input
                        value={license.licenseNumber}
                        onChange={(e) => updateLicense(index, 'licenseNumber', e.target.value)}
                        placeholder="Enter license number"
                        className={errors[`${index}_licenseNumber`] ? "border-destructive" : ""}
                      />
                      {errors[`${index}_licenseNumber`] && (
                        <p className="text-sm text-destructive">{errors[`${index}_licenseNumber`]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Issuing State *</Label>
                      <Select
                        value={license.issuingState}
                        onValueChange={(value) => updateLicense(index, 'issuingState', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Issue Date *</Label>
                      <Input
                        type="date"
                        value={license.issueDate}
                        onChange={(e) => updateLicense(index, 'issueDate', e.target.value)}
                        className={errors[`${index}_issueDate`] ? "border-destructive" : ""}
                      />
                      {errors[`${index}_issueDate`] && (
                        <p className="text-sm text-destructive">{errors[`${index}_issueDate`]}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Expiration Date *</Label>
                      <Input
                        type="date"
                        value={license.expirationDate}
                        onChange={(e) => updateLicense(index, 'expirationDate', e.target.value)}
                        className={errors[`${index}_expirationDate`] ? "border-destructive" : ""}
                      />
                      {errors[`${index}_expirationDate`] && (
                        <p className="text-sm text-destructive">{errors[`${index}_expirationDate`]}</p>
                      )}
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-2">
                    <Label>License Document</Label>
                    {license.documentUrl ? (
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm text-success flex-1">
                          Document uploaded: {license.fileName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(license.documentUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="text-center">
                          {license.isUploading ? (
                            <div className="space-y-2">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                              <p className="text-sm text-muted-foreground">Uploading...</p>
                              <Progress value={50} className="w-full" />
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground mb-2">
                                Upload license document (PDF, JPEG, PNG)
                              </p>
                              <p className="text-xs text-muted-foreground mb-4">
                                Maximum file size: 10MB
                              </p>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(index, file);
                                  }
                                }}
                                className="hidden"
                                id={`file-upload-${index}`}
                              />
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                              >
                                Choose File
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={addNewLicense}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another License
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!isFormValid()}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Complete License Upload
        </Button>
      </div>
    </div>
  );
}