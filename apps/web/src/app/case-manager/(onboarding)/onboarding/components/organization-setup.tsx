"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone } from "lucide-react";
import { AddressForm } from "@/components/ui/address-form";
import { CaseManagerOnboardingOrganizationData } from "@carelink/types";

interface OrganizationSetupProps {
  data: CaseManagerOnboardingOrganizationData;
  onComplete: (data: CaseManagerOnboardingOrganizationData) => void | Promise<void>;
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
        console.log("🔍 OrganizationSetup: validateAndComplete called", { formData });
        const isValid = validateForm();
        console.log("🔍 OrganizationSetup: validation result", isValid);
        if (isValid) {
          console.log("✅ OrganizationSetup: calling onComplete with formData", formData);
          // Call onComplete and wait for it to complete
          await onComplete(formData);
          console.log("✅ OrganizationSetup: onComplete finished");
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

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    }
    if (!formData.county) {
      newErrors.county = "County is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate phone format
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate ZIP code
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid ZIP code (12345 or 12345-6789)";
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
            Basic information about your case management organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizationName">Organization Name *</Label>
            <Input
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) => handleInputChange("organizationName", e.target.value)}
              placeholder="Enter organization name"
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
                placeholder="contact@organization.com"
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
                placeholder="https://www.organization.com"
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
        description="Enter your organization's address"
        defaultState="MN"
      />

    </div>
  );
}

