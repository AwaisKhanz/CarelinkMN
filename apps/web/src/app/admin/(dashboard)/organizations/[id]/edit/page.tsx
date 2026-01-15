"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { organizationService } from "@/lib/api/services/organization.service";
import { OrganizationType, OrganizationStatus } from "@carelink/types";
import { authToasts } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequirePermission } from "@/components/auth/require-permission";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { LoadingState } from "@/components/shared";

// Schema matching OrganizationUpdateData
const organizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum([
    OrganizationType.PROVIDER,
    OrganizationType.CASE_MANAGEMENT,
    OrganizationType.HOSPITAL,
    OrganizationType.VRS,
    OrganizationType.VENDOR
  ]),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is too short"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  county: z.string().min(1, "County is required"),
  ein: z.string().optional(),
  npi: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  fax: z.string().optional(),
  status: z.enum([
    OrganizationStatus.PENDING,
    OrganizationStatus.VERIFIED,
    OrganizationStatus.SUSPENDED,
    OrganizationStatus.DEACTIVATED
  ]).optional(),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

function EditOrganizationPageContent({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "MN",
      zipCode: "",
      county: "",
      ein: "",
      npi: "",
      website: "",
      fax: "",
    },
  });

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await organizationService.getOrganizationById(params.id);
        
        form.reset({
          name: org.name,
          type: org.type,
          email: org.email,
          phone: org.phone,
          addressLine1: org.addressLine1,
          addressLine2: org.addressLine2 || "",
          city: org.city,
          state: org.state,
          zipCode: org.zipCode,
          county: org.county,
          ein: org.ein || "",
          npi: org.npi || "",
          website: org.website || "",
          fax: org.fax || "",
          status: org.status as OrganizationStatus,
        });
      } catch (error) {
        console.error("Failed to load organization:", error);
        toast.error("Failed to load organization details");
        router.push("/admin/organizations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [params.id, form, router]);

  const onSubmit = async (data: OrganizationFormValues) => {
    setIsSaving(true);
    try {
      // Exclude type from update payload as it's immutable
      const { type, ...updateData } = data;
      await organizationService.updateOrganization(params.id, updateData);
      toast.success("Organization updated successfully");
      router.push("/admin/organizations");
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading organization details..." fullHeight />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Organization</h1>
          <p className="text-muted-foreground">Update organization details and settings</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Primary contact and identification details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Organization Type</Label>
                <Select 
                  disabled
                  value={form.watch("type")} 
                  onValueChange={(val) => form.setValue("type", val as OrganizationType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrganizationType.PROVIDER}>Provider</SelectItem>
                    <SelectItem value={OrganizationType.CASE_MANAGEMENT}>Case Management</SelectItem>
                    <SelectItem value={OrganizationType.HOSPITAL}>Hospital</SelectItem>
                    <SelectItem value={OrganizationType.VRS}>VRS</SelectItem>
                    <SelectItem value={OrganizationType.VENDOR}>Vendor</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...form.register("phone")} />
                {form.formState.errors.phone && <p className="text-sm text-destructive mt-1">{form.formState.errors.phone.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...form.register("website")} />
                {form.formState.errors.website && <p className="text-sm text-destructive mt-1">{form.formState.errors.website.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fax">Fax</Label>
                <Input id="fax" {...form.register("fax")} />
                {form.formState.errors.fax && <p className="text-sm text-destructive mt-1">{form.formState.errors.fax.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ein">EIN (Tax ID)</Label>
                <Input id="ein" {...form.register("ein")} />
                {form.formState.errors.ein && <p className="text-sm text-destructive mt-1">{form.formState.errors.ein.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="npi">NPI Number</Label>
                <Input id="npi" {...form.register("npi")} />
                {form.formState.errors.npi && <p className="text-sm text-destructive mt-1">{form.formState.errors.npi.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Physical location of the organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input id="addressLine1" {...form.register("addressLine1")} />
                {form.formState.errors.addressLine1 && <p className="text-sm text-destructive mt-1">{form.formState.errors.addressLine1.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                <Input id="addressLine2" {...form.register("addressLine2")} />
                {form.formState.errors.addressLine2 && <p className="text-sm text-destructive mt-1">{form.formState.errors.addressLine2.message}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...form.register("city")} />
                  {form.formState.errors.city && <p className="text-sm text-destructive mt-1">{form.formState.errors.city.message}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...form.register("state")} />
                  {form.formState.errors.state && <p className="text-sm text-destructive mt-1">{form.formState.errors.state.message}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" {...form.register("zipCode")} />
                  {form.formState.errors.zipCode && <p className="text-sm text-destructive mt-1">{form.formState.errors.zipCode.message}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="county">County</Label>
                  <Input id="county" {...form.register("county")} />
                  {form.formState.errors.county && <p className="text-sm text-destructive mt-1">{form.formState.errors.county.message}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcareWarning">
          <CardHeader>
            <CardTitle>Organization Status</CardTitle>
            <CardDescription>Manage the active status of this organization</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2 max-w-md">
                <Label htmlFor="status">Current Status</Label>
                <Select 
                  value={form.watch("status")} 
                  onValueChange={(val) => form.setValue("status", val as OrganizationStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrganizationStatus.PENDING}>Pending Verification</SelectItem>
                    <SelectItem value={OrganizationStatus.VERIFIED}>Verified / Active</SelectItem>
                    <SelectItem value={OrganizationStatus.SUSPENDED}>Suspended</SelectItem>
                    <SelectItem value={OrganizationStatus.DEACTIVATED}>Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="healthcare" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditOrganizationPage({ params }: { params: { id: string } }) {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.ORGANIZATIONS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to edit organizations."
    >
      <EditOrganizationPageContent params={params} />
    </RequirePermission>
  );
}
