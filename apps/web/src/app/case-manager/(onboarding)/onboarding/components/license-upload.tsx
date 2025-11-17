"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { CaseManagerOnboardingLicenseData } from "@carelink/types";

interface LicenseUploadProps {
  data: CaseManagerOnboardingLicenseData;
  onComplete: (data: CaseManagerOnboardingLicenseData) => void | Promise<void>;
  onValidate?: (validateFn: () => Promise<boolean>) => void; // Callback to expose validation function
}

// Internal component state type - matches the license object structure
type License = NonNullable<CaseManagerOnboardingLicenseData['license']>;

export function LicenseUpload({
  data,
  onComplete,
  onValidate,
}: LicenseUploadProps) {
  const [license, setLicense] = useState<License>(
    data?.license || {
      licenseNumber: "",
      expirationDate: "",
    }
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    data?.license?.documentUrl
      ? [
          {
            url: data.license.documentUrl,
            fileName: data.license.fileName || "License document",
          },
        ]
      : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isInitialMount = useRef(true);
  const isSyncingFromProps = useRef(false);

  // Sync license data with data prop when it changes (e.g., after loading existing data)
  useEffect(() => {
    if (data?.license && !isInitialMount.current) {
      isSyncingFromProps.current = true;
      setLicense({
        licenseNumber: data.license.licenseNumber || "",
        expirationDate: data.license.expirationDate || "",
        documentUrl: data.license.documentUrl,
        fileName: data.license.fileName,
      });

      if (data.license.documentUrl) {
        setUploadedFiles([
          {
            url: data.license.documentUrl,
            fileName: data.license.fileName || "License document",
          },
        ]);
      }
      // Reset flag after sync
      setTimeout(() => {
        isSyncingFromProps.current = false;
      }, 100);
    }
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [data]);

  // Expose validation function to parent
  useEffect(() => {
    if (onValidate) {
      const validateAndComplete = async () => {
        const isValid = validateLicense();
        if (isValid) {
          // Call onComplete and wait for it to complete
          await onComplete({
            license: {
              ...license,
              documentUrl: uploadedFiles[0]?.url,
              fileName: uploadedFiles[0]?.fileName,
            },
          });
        }
        return isValid;
      };
      onValidate(validateAndComplete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [license, uploadedFiles, onComplete]);

  const updateLicense = (field: keyof License, value: string) => {
    setLicense((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  const validateLicense = () => {
    const newErrors: Record<string, string> = {};

    if (!license.licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
    }
    if (!license.expirationDate) {
      newErrors.expirationDate = "Expiration date is required";
    }

    // Check if license is expired
    if (license.expirationDate) {
      const expirationDate = new Date(license.expirationDate);
      const today = new Date();
      if (expirationDate < today) {
        newErrors.expirationDate = "License appears to be expired";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    if (validateLicense()) {
      onComplete({ license });
    }
  };

  const isFormValid = () => {
    return license.licenseNumber.trim() && license.expirationDate;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Professional License
          </CardTitle>
          <CardDescription>
            Upload your professional case management license. This will be
            verified by our admin team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>License Number *</Label>
              <Input
                value={license.licenseNumber}
                onChange={(e) => updateLicense("licenseNumber", e.target.value)}
                placeholder="Enter license number (e.g., SW123456)"
                className={errors.licenseNumber ? "border-destructive" : ""}
              />
              {errors.licenseNumber && (
                <p className="text-sm text-destructive">
                  {errors.licenseNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Expiration Date *</Label>
              <Input
                type="date"
                value={license.expirationDate}
                onChange={(e) =>
                  updateLicense("expirationDate", e.target.value)
                }
                className={errors.expirationDate ? "border-destructive" : ""}
              />
              {errors.expirationDate && (
                <p className="text-sm text-destructive">
                  {errors.expirationDate}
                </p>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <Label>License Document</Label>
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
              description="Upload a copy of your professional license document (PDF, JPG, PNG)"
              showPreview={true}
              variant="healthcare"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
