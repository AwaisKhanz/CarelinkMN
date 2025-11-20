"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../../../use-page-metadata";
import {
  dischargeCaseService,
  CreateDischargeCaseData,
  UpdateDischargeCaseData,
} from "@/lib/api";
import { toast } from "sonner";
import { DischargeCaseForm } from "@/components/forms/discharge-case-form";
import {
  HospitalSWLoadingState,
  HospitalSWErrorState,
  HospitalSWDetailHeader,
} from "@/components/hospital-sw";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useDischargeCase } from "@/hooks/use-hospital-sw-data";
import { formatCaseNumber, getPatientDisplayName } from "@/lib/utils/hospital-sw";
import { useRolePermissions } from "@/hooks/use-role-permissions";

function EditDischargeCasePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canUpdateDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_UPDATE
  );
  const caseId = params.caseId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use shared hook for fetching discharge case
  const {
    case: dischargeCase,
    isLoading,
    error: fetchError,
    refetch: refetchCase,
  } = useDischargeCase(caseId);

  // Prepare initial data for form - MUST be before conditional returns
  const initialData = useMemo(() => {
    if (!dischargeCase) return null;
    return {
      hospitalId: dischargeCase.hospitalId,
      patientInitials: dischargeCase.patientInitials,
      patientAge: dischargeCase.patientAge,
      patientGender: dischargeCase.patientGender,
      diagnosisCodes: dischargeCase.diagnosisCodes,
      mobilityStatus: dischargeCase.mobilityStatus,
      cognitiveStatus: dischargeCase.cognitiveStatus,
      behavioralConcerns: dischargeCase.behavioralConcerns,
      dmeNeeds: dischargeCase.dmeNeeds,
      medicationManagement: dischargeCase.medicationManagement,
      currentLocation: dischargeCase.currentLocation,
      targetDischargeDate: dischargeCase.targetDischargeDate,
      preferredCounties: dischargeCase.preferredCounties,
      preferredCities: dischargeCase.preferredCities,
      requiresProximity: dischargeCase.requiresProximity,
      proximityZipCode: dischargeCase.proximityZipCode,
      maxDistanceMiles: dischargeCase.maxDistanceMiles,
      primaryInsurance: dischargeCase.primaryInsurance,
      secondaryInsurance: dischargeCase.secondaryInsurance,
      needsTransport: dischargeCase.needsTransport,
      transportType: dischargeCase.transportType,
    };
  }, [dischargeCase]);

  useEffect(() => {
    if (dischargeCase) {
      setTitle(
        `Edit Discharge Case ${formatCaseNumber(dischargeCase.caseNumber)}`
      );
      setDescription(
        `Edit discharge case for patient ${getPatientDisplayName(dischargeCase.patientInitials)}`
      );
    } else {
      setTitle("Edit Discharge Case");
      setDescription("Edit discharge case information");
    }
  }, [dischargeCase, setTitle, setDescription]);

  const handleSubmit = useCallback(
    async (data: CreateDischargeCaseData | UpdateDischargeCaseData) => {
    if (!user?.id || !caseId) {
      toast.error("You must be logged in to update a discharge case");
      return;
    }

    // Convert to UpdateDischargeCaseData (all fields optional)
    const updateData: UpdateDischargeCaseData = {
      patientInitials: data.patientInitials,
      patientAge: data.patientAge,
      patientGender: data.patientGender,
      diagnosisCodes: data.diagnosisCodes,
      mobilityStatus: data.mobilityStatus,
      cognitiveStatus: data.cognitiveStatus,
      behavioralConcerns: data.behavioralConcerns,
      dmeNeeds: data.dmeNeeds,
      medicationManagement: data.medicationManagement,
      currentLocation: data.currentLocation,
      targetDischargeDate: data.targetDischargeDate,
      preferredCounties: data.preferredCounties,
      preferredCities: data.preferredCities,
      requiresProximity: data.requiresProximity,
      proximityZipCode: data.proximityZipCode,
      maxDistanceMiles: data.maxDistanceMiles,
      primaryInsurance: data.primaryInsurance,
      secondaryInsurance: data.secondaryInsurance,
      needsTransport: data.needsTransport,
      transportType: data.transportType,
    };

    setIsSubmitting(true);

    try {
      const response = await dischargeCaseService.updateDischargeCase(caseId, updateData);

      if (response.success && response.data) {
        toast.success("Discharge case updated successfully");
        router.push(`/hospital-sw/discharges/${caseId}`);
      } else {
        // Extract error message from response
        const errorMessage =
          response.message ||
          response.error ||
          "Failed to update discharge case";
        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error("Error updating discharge case:", err);

      // Extract error message from various error formats
      let errorMessage = "Failed to update discharge case";

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
    [user, caseId, router]
  );

  const handleCancel = useCallback(() => {
    router.push(`/hospital-sw/discharges/${caseId}`);
  }, [router, caseId]);

  if (isLoading) {
    return (
      <HospitalSWLoadingState message="Loading discharge case..." fullHeight />
    );
  }

  if (fetchError || !dischargeCase) {
    return (
      <HospitalSWErrorState
        title="Error Loading Discharge Case"
        message={fetchError?.message || "Discharge case not found"}
        action={{
          label: "Retry",
          onClick: refetchCase,
          variant: "healthcare",
        }}
        secondaryAction={{
          label: "Back to Discharge Cases",
          onClick: () => router.push("/hospital-sw/discharges"),
          variant: "outline",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Use shared component */}
      <HospitalSWDetailHeader
        title={`Edit Discharge Case ${formatCaseNumber(dischargeCase.caseNumber)}`}
        subtitle={`Edit discharge case for patient ${getPatientDisplayName(dischargeCase.patientInitials)}`}
        backPath={`/hospital-sw/discharges/${caseId}`}
      />

      {/* Form */}
      {initialData && (
        <DischargeCaseForm
          mode="edit"
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default function EditDischargeCasePage() {
  return (
    <RequirePermission
      permission={HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_UPDATE}
      title="Access Restricted"
      description="You don't have permission to edit discharge cases."
    >
      <EditDischargeCasePageContent />
    </RequirePermission>
  );
}

