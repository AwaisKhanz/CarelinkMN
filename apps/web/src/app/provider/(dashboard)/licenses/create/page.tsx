"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import { useProviderId } from "@/hooks/use-provider-data";
import { LicenseForm } from "@/components/forms/license-form";
import { CreateLicenseData, UpdateLicenseData } from "@carelink/types";
import { usePageMetadata } from "../../use-page-metadata";

export default function CreateLicensePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const providerId = useProviderId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Add License");
    setDescription("Add a new license for your provider organization.");
  }, [setTitle, setDescription]);

  const handleSubmit = async (data: CreateLicenseData | UpdateLicenseData) => {
    if (!providerId) {
      toast.error("Provider information not available.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await providerService.createProviderLicense(
        providerId,
        data as CreateLicenseData
      );

      if (response.success) {
        toast.success("License added successfully!");
        router.push("/provider/licenses");
      } else {
        toast.error(response.message || "Failed to add license.");
      }
    } catch (err) {
      console.error("Error creating license:", err);
      toast.error("Failed to add license.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/provider/licenses");
  };

  if (!providerId) {
    return null;
  }

  return (
    <LicenseForm
      mode="create"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      onCancel={handleCancel}
    />
  );
}
