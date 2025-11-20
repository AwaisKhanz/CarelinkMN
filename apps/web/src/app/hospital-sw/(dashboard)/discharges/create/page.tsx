"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../../use-page-metadata";
import {
  dischargeCaseService,
  CreateDischargeCaseData,
  UpdateDischargeCaseData,
  hospitalStaffService,
} from "@/lib/api";
import { toast } from "sonner";
import { DischargeCaseForm } from "@/components/forms/discharge-case-form";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { HospitalSWDetailHeader } from "@/components/hospital-sw";
import { useRolePermissions } from "@/hooks/use-role-permissions";

function CreateDischargeCasePageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canCreateDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_CREATE
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Create Discharge Case");
    setDescription("Create a new discharge case for a patient");
  }, [setTitle, setDescription]);

  const handleSubmit = useCallback(
    async (data: CreateDischargeCaseData | UpdateDischargeCaseData) => {
      if (!user?.id) {
        toast.error("You must be logged in to create a discharge case");
        return;
      }

      // Get organizationId from user or HospitalStaff record
      let hospitalId: string | null = user?.organizationId || null;

      // If user doesn't have organizationId, try to get it from HospitalStaff record
      if (!hospitalId) {
        try {
          const hospitalStaff =
            await hospitalStaffService.getHospitalStaffByUserId(user.id);
          if (hospitalStaff?.organizationId) {
            hospitalId = hospitalStaff.organizationId;
          }
        } catch (err) {
          console.error("Error fetching hospital staff:", err);
        }
      }

      if (!hospitalId) {
        toast.error(
          "Unable to create discharge case: Organization not found. Please contact support."
        );
        return;
      }

      // Add hospitalId from user's organization or HospitalStaff record
      // The form doesn't include hospitalId for create mode, so we add it here
      const submitData: CreateDischargeCaseData = {
        ...data,
        hospitalId: hospitalId, // Backend will validate and use this
      } as CreateDischargeCaseData;

      setIsSubmitting(true);

      try {
        const response =
          await dischargeCaseService.createDischargeCase(submitData);

        if (response.success && response.data) {
          toast.success("Discharge case created successfully");
          router.push(`/hospital-sw/discharges/${response.data.id}`);
        } else {
          // Extract error message from response
          const errorMessage =
            response.message ||
            response.error ||
            "Failed to create discharge case";
          toast.error(errorMessage);
        }
      } catch (err: any) {
        console.error("Error creating discharge case:", err);

        // Extract error message from various error formats
        let errorMessage = "Failed to create discharge case";

        if (err?.response?.data) {
          const errorData = err.response.data;

          // Check for validation errors array
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            // Format validation errors for display
            const errorMessages = errorData.errors.map((error: any) => {
              const field = error.field || error.param || "";
              const msg = error.message || error.msg || "Invalid value";
              return field ? `${field}: ${msg}` : msg;
            });
            errorMessage = errorMessages.join(", ");
          } 
          // Check for validation errors in details array (alternative format)
          else if (
            errorData.details &&
            Array.isArray(errorData.details) &&
            errorData.details.length > 0
          ) {
            const firstError = errorData.details[0];
            errorMessage =
              firstError.msg ||
              firstError.message ||
              errorData.message ||
              errorMessage;
            if (firstError.param || firstError.field) {
              const field = firstError.param || firstError.field;
              errorMessage = `${field}: ${errorMessage}`;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, router]
  );

  const handleCancel = useCallback(() => {
    router.push("/hospital-sw/discharges");
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Header - Use shared component */}
      <HospitalSWDetailHeader
        title="Create Discharge Case"
        subtitle="Create a new discharge case for a patient"
        backPath="/hospital-sw/discharges"
      />

      {/* Form */}
      <DischargeCaseForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        mode="create"
      />
    </div>
  );
}

export default function CreateDischargeCasePage() {
  return (
    <RequirePermission
      permission={HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_CREATE}
      title="Access Restricted"
      description="You don't have permission to create discharge cases."
    >
      <CreateDischargeCasePageContent />
    </RequirePermission>
  );
}
