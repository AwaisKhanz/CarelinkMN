"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import { useProviderId } from "@/hooks/use-provider-data";
import { LicenseForm } from "@/components/forms/license-form";
import { UpdateLicenseData, License } from "@carelink/types";
import { usePageMetadata } from "../../../use-page-metadata";
import { Loader2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";

function EditLicensePageContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const licenseId = params.licenseId as string;
  const providerId = useProviderId();
  const [license, setLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Edit License");
    setDescription("Update license information.");
  }, [setTitle, setDescription]);

  useEffect(() => {
    const fetchLicenseData = async () => {
      if (!providerId) return;

      try {
        // Fetch license details
        const licensesResponse =
          await providerService.getProviderLicenses(providerId);
        if (licensesResponse.success && licensesResponse.data) {
          const foundLicense = licensesResponse.data.find(
            (l) => l.id === licenseId
          );
          if (foundLicense) {
            setLicense(foundLicense);
          } else {
            toast.error("License not found.");
            router.push("/provider/licenses");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load license data.");
        router.push("/provider/licenses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLicenseData();
  }, [providerId, licenseId, router]);

  const handleSubmit = async (data: UpdateLicenseData) => {
    if (!providerId) {
      toast.error("Provider information not available.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await providerService.updateProviderLicense(
        providerId,
        licenseId,
        data
      );

      if (response.success) {
        toast.success("License updated successfully!");
        router.push("/provider/licenses");
      } else {
        toast.error(response.message || "Failed to update license.");
      }
    } catch (err) {
      console.error("Error updating license:", err);
      toast.error("Failed to update license.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/provider/licenses");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading license...</p>
        </div>
      </div>
    );
  }

  if (!license) {
    return null;
  }

  return (
    <LicenseForm
      mode="edit"
      initialData={license}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
    />
  );
}

export default function EditLicensePage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.LICENSES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to edit licenses. Only provider owners can manage licenses."
    >
      <EditLicensePageContent />
    </RequirePermission>
  );
}
