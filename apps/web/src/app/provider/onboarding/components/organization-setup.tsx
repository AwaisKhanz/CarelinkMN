"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Phone, Mail, Globe } from "lucide-react";
import { ORGANIZATION_TYPES, MINNESOTA_COUNTIES } from "@/lib/constants";

interface OrganizationSetupProps {
  data: {
    organizationName: string;
    organizationType: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    phone: string;
    email: string;
    website?: string;
  };
  onComplete: (data: any) => void;
  onValidateRequest?: (validate: () => boolean) => void;
}

export function OrganizationSetup({ data, onComplete, onValidateRequest }: OrganizationSetupProps) {
  const [formData, setFormData] = useState(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const onCompleteRef = useRef(onComplete);
  const onValidateRequestRef = useRef(onValidateRequest);
  
  // Sync formData with data prop when it changes (e.g., after fetching organization data)
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
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid ZIP code";
    }

    if (!formData.county) {
      newErrors.county = "County is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Please enter a valid website URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Format phone number as (XXX) XXX-XXXX
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    
    if (match) {
      const formatted = match[1] + (match[2] ? `) ${match[2]}` : "") + (match[3] ? `-${match[3]}` : "");
      const final = match[1] ? `(${formatted}` : formatted;
      handleInputChange("phone", final);
    } else {
      handleInputChange("phone", value);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Organization Information
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => handleInputChange("organizationName", e.target.value)}
                placeholder="Enter organization name"
                className={errors.organizationName ? "border-destructive" : ""}
              />
              {errors.organizationName && (
                <p className="text-sm text-destructive mt-1">{errors.organizationName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="organizationType">Organization Type *</Label>
              <Select
                value={formData.organizationType}
                onValueChange={(value) => handleInputChange("organizationType", value)}
              >
                <SelectTrigger className={errors.organizationType ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organizationType && (
                <p className="text-sm text-destructive mt-1">{errors.organizationType}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              How people can reach your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(555) 123-4567"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
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
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://www.organization.com"
                className={errors.website ? "border-destructive" : ""}
              />
              {errors.website && (
                <p className="text-sm text-destructive mt-1">{errors.website}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address Information
          </CardTitle>
          <CardDescription>
            Physical location of your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="addressLine1">Street Address *</Label>
            <Input
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => handleInputChange("addressLine1", e.target.value)}
              placeholder="123 Main Street"
              className={errors.addressLine1 ? "border-destructive" : ""}
            />
            {errors.addressLine1 && (
              <p className="text-sm text-destructive mt-1">{errors.addressLine1}</p>
            )}
          </div>

          <div>
            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => handleInputChange("addressLine2", e.target.value)}
              placeholder="Suite 100, Floor 2, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Minneapolis"
                className={errors.city ? "border-destructive" : ""}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleInputChange("state", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MN">Minnesota</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                placeholder="55401"
                className={errors.zipCode ? "border-destructive" : ""}
              />
              {errors.zipCode && (
                <p className="text-sm text-destructive mt-1">{errors.zipCode}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="county">County *</Label>
            <Select
              value={formData.county}
              onValueChange={(value) => handleInputChange("county", value)}
            >
              <SelectTrigger className={errors.county ? "border-destructive" : ""}>
                <SelectValue placeholder="Select county" />
              </SelectTrigger>
              <SelectContent>
                {MINNESOTA_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.county && (
              <p className="text-sm text-destructive mt-1">{errors.county}</p>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
