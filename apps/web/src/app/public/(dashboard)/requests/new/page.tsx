"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  publicReferralRequestService,
  type CreateReferralRequestData,
} from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

const MINNESOTA_COUNTIES = [
  "Aitkin", "Anoka", "Becker", "Beltrami", "Benton", "Big Stone", "Blue Earth",
  "Brown", "Carlton", "Carver", "Cass", "Chippewa", "Chisago", "Clay",
  "Clearwater", "Cook", "Cottonwood", "Crow Wing", "Dakota", "Dodge",
  "Douglas", "Faribault", "Fillmore", "Freeborn", "Goodhue", "Grant",
  "Hennepin", "Houston", "Hubbard", "Isanti", "Itasca", "Jackson", "Kanabec",
  "Kandiyohi", "Kittson", "Koochiching", "Lac qui Parle", "Lake", "Lake of the Woods",
  "Le Sueur", "Lincoln", "Lyon", "Mahnomen", "Marshall", "Martin", "McLeod",
  "Meeker", "Mille Lacs", "Morrison", "Mower", "Murray", "Nicollet", "Nobles",
  "Norman", "Olmsted", "Otter Tail", "Pennington", "Pine", "Pipestone", "Polk",
  "Pope", "Ramsey", "Red Lake", "Redwood", "Renville", "Rice", "Rock",
  "Roseau", "Scott", "Sherburne", "Sibley", "St. Louis", "Stearns", "Steele",
  "Stevens", "Swift", "Todd", "Traverse", "Wabasha", "Wadena", "Waseca",
  "Washington", "Watonwan", "Wilkin", "Winona", "Wright", "Yellow Medicine"
];

const COUNTY_OPTIONS = MINNESOTA_COUNTIES.map((county) => ({
  value: county,
  label: county,
}));

const PAYER_OPTIONS = [
  { value: "MA", label: "Medical Assistance (MA)" },
  { value: "MEDICARE", label: "Medicare" },
  { value: "PRIVATE", label: "Private Pay" },
  { value: "CADI", label: "CADI Waiver" },
  { value: "BI_TBI", label: "BI/TBI Waiver" },
  { value: "EW", label: "Elderly Waiver (EW)" },
  { value: "DD", label: "Developmental Disabilities (DD)" },
];

const URGENCY_OPTIONS = [
  { value: "URGENT", label: "Urgent (< 48 hours)" },
  { value: "HIGH", label: "High (< 1 week)" },
  { value: "ROUTINE", label: "Routine (> 1 week)" },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "NO_PREFERENCE", label: "Prefer not to say" },
];

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get providerId from URL if coming from provider page
  const providerIdFromUrl = searchParams?.get("providerId");

  const [formData, setFormData] = useState<CreateReferralRequestData>({
    contactName: user ? `${user.firstName} ${user.lastName}` : "",
    contactEmail: user?.email || "",
    contactPhone: user?.phone || "",
    recipientAge: 0,
    recipientGender: "",
    recipientInitials: "",
    careNeeds: "",
    urgency: "ROUTINE",
    preferredCounties: [],
    primaryPayer: "",
    secondaryPayer: "",
    interestedProviderIds: providerIdFromUrl ? [providerIdFromUrl] : [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contactName || formData.contactName.length < 2) {
      newErrors.contactName = "Contact name is required (min 2 characters)";
    }

    if (!formData.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Valid email is required";
    }

    if (formData.recipientAge < 0 || formData.recipientAge > 120) {
      newErrors.recipientAge = "Age must be between 0 and 120";
    }

    if (!formData.recipientGender) {
      newErrors.recipientGender = "Gender is required";
    }

    if (!formData.recipientInitials || !/^[A-Z]{2}$/.test(formData.recipientInitials)) {
      newErrors.recipientInitials = "Initials must be exactly 2 uppercase letters (e.g., JD)";
    }

    if (!formData.careNeeds || formData.careNeeds.length < 10) {
      newErrors.careNeeds = "Care needs description is required (min 10 characters)";
    }

    if (!formData.urgency) {
      newErrors.urgency = "Urgency is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await publicReferralRequestService.createRequest(formData);

      if (response.success && response.data) {
        toast.success("Request created successfully!");
        router.push(`/public/requests/${response.data.id}`);
      } else {
        toast.error(response.message || "Failed to create request");
      }
    } catch (err) {
      console.error("Error creating request:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof CreateReferralRequestData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/public/requests">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">
          Request Case Manager Assistance
        </h1>
        <p className="text-muted-foreground mt-1">
          Fill out this form to get help from a case manager in finding the right care
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactName">Your Name *</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder="John Doe"
                className={errors.contactName ? "border-red-500" : ""}
              />
              {errors.contactName && (
                <p className="text-sm text-red-500 mt-1">{errors.contactName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactEmail">Your Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
                placeholder="john@example.com"
                className={errors.contactEmail ? "border-red-500" : ""}
              />
              {errors.contactEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.contactEmail}</p>
              )}
            </div>

            <div>
              <Label htmlFor="contactPhone">Your Phone (Optional)</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Care Recipient Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Care Recipient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientInitials">Initials *</Label>
                <Input
                  id="recipientInitials"
                  value={formData.recipientInitials}
                  onChange={(e) =>
                    updateField("recipientInitials", e.target.value.toUpperCase())
                  }
                  placeholder="JD"
                  maxLength={2}
                  className={errors.recipientInitials ? "border-red-500" : ""}
                />
                {errors.recipientInitials && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.recipientInitials}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="recipientAge">Age *</Label>
                <Input
                  id="recipientAge"
                  type="number"
                  value={formData.recipientAge || ""}
                  onChange={(e) =>
                    updateField("recipientAge", parseInt(e.target.value, 10) || 0)
                  }
                  placeholder="65"
                  min="0"
                  max="120"
                  className={errors.recipientAge ? "border-red-500" : ""}
                />
                {errors.recipientAge && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipientAge}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="recipientGender">Gender *</Label>
              <Select
                value={formData.recipientGender}
                onValueChange={(value) => updateField("recipientGender", value)}
              >
                <SelectTrigger
                  className={errors.recipientGender ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.recipientGender && (
                <p className="text-sm text-red-500 mt-1">{errors.recipientGender}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Care Needs */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Care Needs & Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="careNeeds">Describe Care Needs *</Label>
              <Textarea
                id="careNeeds"
                value={formData.careNeeds}
                onChange={(e) => updateField("careNeeds", e.target.value)}
                placeholder="Please describe the type of care needed, any special requirements, medical needs, mobility assistance, etc..."
                rows={5}
                className={errors.careNeeds ? "border-red-500" : ""}
              />
              {errors.careNeeds && (
                <p className="text-sm text-red-500 mt-1">{errors.careNeeds}</p>
              )}
            </div>

            <div>
              <Label htmlFor="urgency">Urgency *</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => updateField("urgency", value)}
              >
                <SelectTrigger className={errors.urgency ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.urgency && (
                <p className="text-sm text-red-500 mt-1">{errors.urgency}</p>
              )}
            </div>

            <div>
              <Label>Preferred Counties (Optional)</Label>
              <MultiSelect
                options={COUNTY_OPTIONS}
                selected={formData.preferredCounties || []}
                onChange={(values) => updateField("preferredCounties", values)}
                placeholder="Select counties..."
                searchPlaceholder="Search counties..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Payer Information */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Payer Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primaryPayer">Primary Payer</Label>
              <Select
                value={formData.primaryPayer}
                onValueChange={(value) => updateField("primaryPayer", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary payer" />
                </SelectTrigger>
                <SelectContent>
                  {PAYER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="secondaryPayer">Secondary Payer</Label>
              <Select
                value={formData.secondaryPayer}
                onValueChange={(value) => updateField("secondaryPayer", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select secondary payer" />
                </SelectTrigger>
                <SelectContent>
                  {PAYER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/public/requests">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="healthcare"
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
