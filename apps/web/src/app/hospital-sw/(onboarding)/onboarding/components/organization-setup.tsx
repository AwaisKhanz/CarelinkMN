"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone } from "lucide-react";
import { AddressForm } from "@/components/ui/address-form";
import { HospitalSWOnboardingOrganizationData } from "@carelink/types";

interface OrganizationSetupProps {
  data: HospitalSWOnboardingOrganizationData;
  onComplete: (data: HospitalSWOnboardingOrganizationData) => void | Promise<void>;
  onValidate?: (validateFn: () => Promise<boolean>) => void; // Callback to expose validation function
}

export function OrganizationSetup({ data, onComplete, onValidate }: OrganizationSetupProps) {
  const [formData, setFormData] = useState({
    organizationName: data?.organizationName || "",
    addressLine1: data?.addressLine1 || "",
    addressLine2: data?.addressLine2 || "",
    city: data?.city || "",
    state: data?.state || "MN",
    zipCode: data?.zipCode || "",
    county: data?.county || "",
    phone: data?.phone || "",
    email: data?.email || "",
    website: data?.website || "",
    ein: data?.ein || "",
    fax: data?.fax || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isInitialMount = useRef(true);
  const isSyncingFromProps = useRef(false);

  // Sync formData with data prop when it changes (e.g., after loading existing data)
  useEffect(() => {
    if (data && !isInitialMount.current) {
      isSyncingFromProps.current = true;
      setFormData({
        organizationName: data?.organizationName || "",
        addressLine1: data?.addressLine1 || "",
        addressLine2: data?.addressLine2 || "",
        city: data?.city || "",
        state: data?.state || "MN",
        zipCode: data?.zipCode || "",
        county: data?.county || "",
        phone: data?.phone || "",
        email: data?.email || "",
        website: data?.website || "",
        ein: data?.ein || "",
        fax: data?.fax || "",
      });
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
        const isValid = validateForm();
        if (isValid) {
          // Call onComplete and wait for it to complete
          await onComplete(formData);
        }
        return isValid;
      };
      onValidate(validateAndComplete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, onComplete]);


  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Helper function to check if value is a placeholder
    const isPlaceholder = (value: string | null | undefined): boolean => {
      if (!value) return false;
      const placeholders = [
        "to be provided",
        "pending setup",
        "pending",
        "tbd",
        "00000",
      ];
      return placeholders.some((p) =>
        value.toLowerCase().includes(p.toLowerCase())
      );
    };

    if (!formData.organizationName.trim() || isPlaceholder(formData.organizationName)) {
      newErrors.organizationName = "Organization name is required";
    }
    if (!formData.addressLine1.trim() || isPlaceholder(formData.addressLine1)) {
      newErrors.addressLine1 = "Address is required";
    }
    if (!formData.city.trim() || isPlaceholder(formData.city)) {
      newErrors.city = "City is required";
    }
    if (!formData.zipCode.trim() || isPlaceholder(formData.zipCode) || formData.zipCode === "00000") {
      newErrors.zipCode = "ZIP code is required";
    }
    if (!formData.county || isPlaceholder(formData.county)) {
      newErrors.county = "County is required";
    }
    if (!formData.phone.trim() || isPlaceholder(formData.phone)) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.email.trim() || isPlaceholder(formData.email)) {
      newErrors.email = "Email is required";
    }

    // Validate email format (only if email is provided and not placeholder)
    if (formData.email && !isPlaceholder(formData.email)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Validate phone format (only if phone is provided and not placeholder)
    if (formData.phone && !isPlaceholder(formData.phone)) {
      if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    // Validate ZIP code (only if zipCode is provided and not placeholder)
    if (formData.zipCode && !isPlaceholder(formData.zipCode) && formData.zipCode !== "00000") {
      if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
        newErrors.zipCode = "Please enter a valid ZIP code (12345 or 12345-6789)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = () => {
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const isFormValid = () => {
    return formData.organizationName.trim() &&
           formData.addressLine1.trim() &&
           formData.city.trim() &&
           formData.zipCode.trim() &&
           formData.county &&
           formData.phone.trim() &&
           formData.email.trim();
  };

  return (
    <div className="space-y-6">
      {/* Organization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Basic information about your hospital organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Hospital Name *</Label>
            <Input
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) => handleInputChange("organizationName", e.target.value)}
              placeholder="Enter hospital name"
              className={errors.organizationName ? "border-destructive" : ""}
            />
            {errors.organizationName && (
              <p className="text-sm text-destructive">{errors.organizationName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ein">EIN (Tax ID)</Label>
              <Input
                id="ein"
                value={formData.ein}
                onChange={(e) => handleInputChange("ein", e.target.value)}
                placeholder="12-3456789"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(555) 123-4567"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">Fax Number</Label>
              <Input
                id="fax"
                value={formData.fax}
                onChange={(e) => handleInputChange("fax", e.target.value)}
                placeholder="(555) 123-4568"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="contact@hospital.com"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://www.hospital.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <AddressForm
        value={{
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          county: formData.county,
        }}
        onChange={(addressData) => {
          handleInputChange("addressLine1", addressData.addressLine1);
          handleInputChange("addressLine2", addressData.addressLine2 || "");
          handleInputChange("city", addressData.city);
          handleInputChange("state", addressData.state);
          handleInputChange("zipCode", addressData.zipCode);
          handleInputChange("county", addressData.county);
        }}
        fieldErrors={{
          addressLine1: errors.addressLine1,
          city: errors.city,
          zipCode: errors.zipCode,
          county: errors.county,
        }}
        showCard={true}
        title="Address Information"
        description="Enter your hospital's address"
        defaultState="MN"
      />

    </div>
  );
}

