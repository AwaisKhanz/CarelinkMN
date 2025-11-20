"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vrsService } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Controller } from "react-hook-form";

const employerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  size: z.string().min(1, "Company size is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  isInclusive: z.boolean().default(false),
  hasAccessibility: z.boolean().default(false),
  isSponsoredListing: z.boolean().default(false),
});

type EmployerFormData = z.infer<typeof employerSchema>;

function CreateEmployerPageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployerFormData>({
    resolver: zodResolver(employerSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      size: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "MN",
      zipCode: "",
      isInclusive: false,
      hasAccessibility: false,
      isSponsoredListing: false,
    },
  });

  useEffect(() => {
    setTitle("Create Employer");
    setDescription("Add a new employer to the system");
  }, [setTitle, setDescription]);

  const handleSubmit = async (data: EmployerFormData) => {
    setIsSubmitting(true);

    try {
      const employerData = {
        companyName: data.companyName,
        industry: data.industry,
        size: data.size,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        isInclusive: data.isInclusive,
        hasAccessibility: data.hasAccessibility,
        isSponsoredListing: data.isSponsoredListing,
      };

      const response = await vrsService.createEmployer(employerData);

      if (response.success) {
        toast.success("Employer created successfully");
        router.push(`/vrs/employers`);
      } else {
        toast.error(response.message || "Failed to create employer");
      }
    } catch (err) {
      console.error("Error creating employer:", err);
      toast.error("Failed to create employer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Create Employer
          </h1>
          <p className="text-muted-foreground mt-1">
            Add a new employer to the system
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic employer details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input id="companyName" {...form.register("companyName")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g., Retail, Manufacturing"
                  {...form.register("industry")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">
                  Company Size <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="size"
                  placeholder="e.g., 1-50, 51-200"
                  {...form.register("size")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">
                Contact Name <span className="text-destructive">*</span>
              </Label>
              <Input id="contactName" {...form.register("contactName")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">
                  Contact Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...form.register("contactEmail")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">
                  Contact Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  {...form.register("contactPhone")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Company location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">
                Address Line 1 <span className="text-destructive">*</span>
              </Label>
              <Input id="addressLine1" {...form.register("addressLine1")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input id="addressLine2" {...form.register("addressLine2")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input id="city" {...form.register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-destructive">*</span>
                </Label>
                <Input id="state" {...form.register("state")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">
                  Zip Code <span className="text-destructive">*</span>
                </Label>
                <Input id="zipCode" {...form.register("zipCode")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Employer features and options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="isInclusive"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="isInclusive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isInclusive" className="cursor-pointer">
                Inclusive Workplace
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="hasAccessibility"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="hasAccessibility"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="hasAccessibility" className="cursor-pointer">
                Has Accessibility Features
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="isSponsoredListing"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="isSponsoredListing"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isSponsoredListing" className="cursor-pointer">
                Sponsored Listing
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="healthcare" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Employer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateEmployerPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.EMPLOYERS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to create employers."
    >
      <CreateEmployerPageContent />
    </RequirePermission>
  );
}
