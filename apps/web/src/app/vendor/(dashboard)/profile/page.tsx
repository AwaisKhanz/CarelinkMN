"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vendorService } from "@/lib/api";
import { usePageMetadata } from "../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VENDOR_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState } from "@/components/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { VENDOR_CATEGORIES, SPONSORSHIP_TIERS } from "@/lib/constants/vendor";
import { VendorCategory } from "@carelink/types";

const vendorProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  category: z.nativeEnum(VendorCategory),
  subcategories: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  logo: z.string().optional(),
  services: z.string().optional(),
  serviceAreas: z.string().optional(),
  isSponsoredVendor: z.boolean().default(false),
  sponsorshipTier: z.string().optional(),
  sponsorshipExpiry: z.string().optional(),
});

type VendorProfileFormData = z.infer<typeof vendorProfileSchema>;

export default function VendorProfilePage() {
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const form = useForm<VendorProfileFormData>({
    resolver: zodResolver(vendorProfileSchema),
    defaultValues: {
      businessName: "",
      category: VendorCategory.TRAINING,
      subcategories: "",
      description: "",
      logo: "",
      services: "",
      serviceAreas: "",
      isSponsoredVendor: false,
      sponsorshipTier: "",
      sponsorshipExpiry: "",
    },
  });

  useEffect(() => {
    setTitle("Vendor Profile");
    setDescription("Manage your vendor profile information");
  }, [setTitle, setDescription]);

  const fetchVendor = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await vendorService.getVendorByUserId(user.id);
      if (response.success && response.data) {
        const vendor = response.data;
        setVendorId(vendor.id);
        form.reset({
          businessName: vendor.businessName,
          category: vendor.category,
          subcategories: vendor.subcategories.join("\n"),
          description: vendor.description,
          logo: vendor.logo || "",
          services: vendor.services.join("\n"),
          serviceAreas: vendor.serviceAreas.join("\n"),
          isSponsoredVendor: vendor.isSponsoredVendor,
          sponsorshipTier: vendor.sponsorshipTier || "",
          sponsorshipExpiry: vendor.sponsorshipExpiry
            ? new Date(vendor.sponsorshipExpiry).toISOString().split("T")[0]
            : "",
        });
      } else {
        setError("Vendor profile not found");
      }
    } catch (err) {
      console.error("Error fetching vendor:", err);
      setError(err instanceof Error ? err.message : "Failed to load vendor profile");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, form]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const onSubmit = async (data: VendorProfileFormData) => {
    if (!vendorId) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        businessName: data.businessName,
        category: data.category,
        subcategories: data.subcategories
          ? data.subcategories.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        description: data.description,
        logo: data.logo || undefined,
        services: data.services
          ? data.services.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        serviceAreas: data.serviceAreas
          ? data.serviceAreas.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        isSponsoredVendor: data.isSponsoredVendor,
        sponsorshipTier: data.sponsorshipTier || undefined,
        sponsorshipExpiry: data.sponsorshipExpiry
          ? new Date(data.sponsorshipExpiry).toISOString()
          : undefined,
      };

      const response = await vendorService.updateVendor(vendorId, updateData);
      if (response.success) {
        toast.success("Profile updated successfully!");
        fetchVendor();
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating vendor:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading vendor profile..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Profile"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchVendor,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <RequirePermission
      permission={VENDOR_CAPABILITIES.PROFILE_MANAGE}
      title="Access Restricted"
      description="You don't have permission to manage your vendor profile."
    >
      <div className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Vendor Profile</CardTitle>
            <CardDescription>Update your vendor profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  {...form.register("businessName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as VendorCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDOR_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategories">Subcategories (one per line)</Label>
                <Textarea
                  id="subcategories"
                  rows={3}
                  placeholder="Subcategory 1&#10;Subcategory 2&#10;Subcategory 3"
                  {...form.register("subcategories")}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one subcategory per line
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  {...form.register("logo")}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of your logo image
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="services">Services (one per line)</Label>
                <Textarea
                  id="services"
                  rows={3}
                  placeholder="Service 1&#10;Service 2&#10;Service 3"
                  {...form.register("services")}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one service per line
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceAreas">Service Areas (one per line)</Label>
                <Textarea
                  id="serviceAreas"
                  rows={3}
                  placeholder="County 1&#10;City 1&#10;ZIP 1"
                  {...form.register("serviceAreas")}
                />
                <p className="text-xs text-muted-foreground">
                  Enter one area per line (counties, cities, or ZIP codes)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="isSponsoredVendor"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      id="isSponsoredVendor"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isSponsoredVendor" className="cursor-pointer">
                  Sponsored Vendor Listing
                </Label>
              </div>

              {form.watch("isSponsoredVendor") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="sponsorshipTier">Sponsorship Tier</Label>
                    <Controller
                      name="sponsorshipTier"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {SPONSORSHIP_TIERS.map((tier) => (
                              <SelectItem key={tier.value} value={tier.value}>
                                {tier.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsorshipExpiry">Sponsorship Expiry Date</Label>
                    <Input
                      id="sponsorshipExpiry"
                      type="date"
                      {...form.register("sponsorshipExpiry")}
                    />
                    <p className="text-xs text-muted-foreground">
                      When your sponsorship expires
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button type="submit" variant="healthcare" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequirePermission>
  );
}

