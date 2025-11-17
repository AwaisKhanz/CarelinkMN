"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone } from "lucide-react";
import { AddressForm, AddressFormData } from "@/components/ui/address-form";

interface OrganizationSetupProps {
  data: any;
  onComplete: (data: any) => void | Promise<void>;
  onValidate?: (validateFn: () => Promise<boolean>) => void; // Callback to expose validation function
}

export function OrganizationSetup({ data, onComplete, onValidate }: OrganizationSetupProps) {
  const [formData, setFormData] = useState({
    organizationName: data?.organizationName || "",
    // organizationType is NOT editable - it's set during registration based on user role
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
    npi: data?.npi || "",
    fax: data?.fax || "",
    // primaryLicenseType is in Step 2 (License Upload) - it's a Provider field, not Organization
    acceptsReferrals: data?.acceptsReferrals ?? true,
    responseTimeHours: data?.responseTimeHours || 24,
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
        // organizationType is NOT editable - it's set during registration based on user role
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
        npi: data?.npi || "",
        fax: data?.fax || "",
        // primaryLicenseType is in Step 2 (License Upload) - it's a Provider field, not Organization
        acceptsReferrals: data?.acceptsReferrals ?? true,
        responseTimeHours: data?.responseTimeHours || 24,
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
          await onComplete(formData);
        }
        return isValid;
      };
      onValidate(validateAndComplete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, onComplete]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
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
    // primaryLicenseType validation is in Step 2 (License Upload)

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
            Basic information about your healthcare organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="ein">EIN (Tax ID)</Label>
              <Input
                id="ein"
                value={formData.ein}
                onChange={(e) => handleInputChange("ein", e.target.value)}
                placeholder="12-3456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="npi">NPI Number</Label>
              <Input
                id="npi"
                value={formData.npi}
                onChange={(e) => handleInputChange("npi", e.target.value)}
                placeholder="1234567890"
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

      {/* Provider Information */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Information</CardTitle>
          <CardDescription>
            Provider-specific settings. Primary License Type will be set in the License Upload step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responseTimeHours">Average Response Time (Hours)</Label>
              <Input
                id="responseTimeHours"
                type="number"
                value={formData.responseTimeHours}
                onChange={(e) => handleInputChange("responseTimeHours", parseInt(e.target.value) || 24)}
                placeholder="24"
                min="1"
                max="168"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acceptsReferrals">Accepts Referrals</Label>
              <Select
                value={formData.acceptsReferrals.toString()}
                onValueChange={(value) => handleInputChange("acceptsReferrals", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}