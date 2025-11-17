"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { caseManagerService, organizationService, CaseManager } from "@/lib/api";
import {
  CaseManagerOnboardingOrganizationData,
  CaseManagerOnboardingLicenseData,
} from "@carelink/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileText,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { OrganizationSetup } from "./components/organization-setup";
import { LicenseUpload } from "./components/license-upload";
import { ReviewAndSubmit } from "./components/review-and-submit";

const STEPS = [
  {
    id: "organization",
    title: "Organization Setup",
    description: "Basic organization information",
  },
  {
    id: "license",
    title: "License Upload",
    description: "Upload your professional license",
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review and submit your application",
  },
];

interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  organizationData?: CaseManagerOnboardingOrganizationData;
  licenseData?: CaseManagerOnboardingLicenseData;
}

export default function CaseManagerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: [],
  });
  const [allAcknowledgmentsChecked, setAllAcknowledgmentsChecked] =
    useState(false);
  const [organizationStatus, setOrganizationStatus] = useState<string | null>(
    null
  );
  const [caseManagerData, setCaseManagerData] = useState<CaseManager | null>(null);
  const validateStepRef = useRef<(() => Promise<boolean>) | null>(null);

  // Load existing data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Load case manager first to get organizationId
        const caseManagerResponse =
          await caseManagerService.getCaseManagerByUserId(user.id);
        const caseManagerData = caseManagerResponse?.success
          ? caseManagerResponse.data
          : null;

        // Store case manager data for later use
        setCaseManagerData(caseManagerData ?? null);

        // Get organizationId from case manager if user doesn't have it
        const orgId = user.organizationId || caseManagerData?.organizationId;

        // Load organization data if we have orgId
        const organizationResponse = orgId
          ? await organizationService.getOrganizationById(orgId)
          : null;

        // organizationService.getOrganizationById returns Organization directly, not ApiResponse
        // caseManagerService.getCaseManagerByUserId returns ApiResponse<CaseManager>
        const organizationData = organizationResponse || null;

        // Store organization status to check if submitted but pending review
        if (organizationData) {
          setOrganizationStatus(organizationData.status);
        }

        // Determine current step based on what's completed
        let currentStep = 0;
        const completedSteps: number[] = [];

        if (
          organizationData &&
          organizationData.name !==
            "Case Manager - Case Management (Pending Setup)" &&
          organizationData.city !== "City to be provided"
        ) {
          completedSteps.push(0);
          currentStep = 1;
        }

        if (caseManagerData?.licenseNumber) {
          completedSteps.push(1);
          if (currentStep === 1) currentStep = 2;
        }

        // Helper function to check if a value is a placeholder
        const isPlaceholder = (value: string | null | undefined): boolean => {
          if (!value) return false;
          const placeholders = [
            "to be provided",
            "pending setup",
            "pending",
            "tbd",
          ];
          return placeholders.some((p) =>
            value.toLowerCase().includes(p.toLowerCase())
          );
        };

        setOnboardingState({
          currentStep,
          completedSteps,
          organizationData: organizationData
            ? {
                organizationName:
                  isPlaceholder(organizationData.name) ||
                  organizationData.name ===
                    "Case Manager - Case Management (Pending Setup)"
                    ? ""
                    : organizationData.name || "",
                addressLine1: organizationData.addressLine1 || "",
                addressLine2: organizationData.addressLine2 || "",
                city: isPlaceholder(organizationData.city)
                  ? ""
                  : organizationData.city || "",
                state: organizationData.state || "MN",
                zipCode: organizationData.zipCode || "",
                county: organizationData.county || "",
                phone: isPlaceholder(organizationData.phone)
                  ? ""
                  : organizationData.phone || "",
                email: organizationData.email || "",
                website: organizationData.website || "",
                ein: organizationData.ein || "",
                fax: organizationData.fax || "",
              }
            : undefined,
          licenseData: caseManagerData?.licenseNumber
            ? {
                license: {
                  licenseNumber: caseManagerData.licenseNumber,
                  expirationDate: caseManagerData.licenseExpiry || "",
                  documentUrl: caseManagerData.licenseDocumentUrl,
                  fileName: caseManagerData.licenseFileName,
                },
              }
            : undefined,
        });
      } catch (error) {
        console.error("Failed to load existing data:", error);
        toast.error("Failed to load onboarding data");
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [user]);

  const currentStep = onboardingState.currentStep;
  const completedSteps = onboardingState.completedSteps || [];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // If organization is VERIFIED, redirect to dashboard (onboarding is complete)
  useEffect(() => {
    if (organizationStatus === "VERIFIED" && caseManagerData?.licenseNumber) {
      toast.success("Your onboarding has been approved!");
      router.push("/case-manager/dashboard");
    }
  }, [organizationStatus, caseManagerData?.licenseNumber, router]);

  // Auto-save function with debouncing
  const saveStepData = useCallback(
    async (step: number, data: CaseManagerOnboardingOrganizationData | CaseManagerOnboardingLicenseData, isComplete: boolean = false) => {
      console.log("💾 saveStepData called", {
        step,
        data,
        isComplete,
        userId: user?.id,
        orgId: user?.organizationId,
      });
      try {
        setIsSaving(true);

        // Update local state first
        setOnboardingState((prev) => ({
          ...prev,
          organizationData: step === 0 ? (data as CaseManagerOnboardingOrganizationData) : prev.organizationData,
          licenseData: step === 1 ? (data as CaseManagerOnboardingLicenseData) : prev.licenseData,
          completedSteps:
            isComplete && !prev.completedSteps.includes(step)
              ? [...prev.completedSteps, step]
              : prev.completedSteps,
        }));

        // Get organizationId - try from user, or fetch from case manager
        let orgId = user?.organizationId;
        if (!orgId && step === 0) {
          // Fetch case manager to get organizationId
          try {
            const cmResponse = await caseManagerService.getCaseManagerByUserId(
              user!.id
            );
            if (cmResponse?.success && cmResponse.data?.organizationId) {
              orgId = cmResponse.data.organizationId;
              console.log(
                "📥 Fetched organizationId from case manager:",
                orgId
              );
            }
          } catch (err) {
            console.error("Failed to fetch case manager:", err);
          }
        }

        // Update backend - always try to save if we have the data
        if (step === 0 && data) {
          // Update organization
          const orgData = data as CaseManagerOnboardingOrganizationData;
          if (orgId) {
            console.log("📤 Updating organization via API", { orgId, data: orgData });
            try {
              await organizationService.updateOrganization(orgId, {
                name: orgData.organizationName,
                addressLine1: orgData.addressLine1,
                addressLine2: orgData.addressLine2 || undefined, // Convert empty string to undefined
                city: orgData.city,
                state: orgData.state,
                zipCode: orgData.zipCode,
                county: orgData.county,
                phone: orgData.phone,
                email: orgData.email,
                website: orgData.website?.trim() || undefined, // Convert empty string to undefined
                ein: orgData.ein?.trim() || undefined, // Convert empty string to undefined
                fax: orgData.fax?.trim() || undefined, // Convert empty string to undefined
              });
              console.log("✅ Organization updated successfully");
            } catch (orgError: unknown) {
              console.error("❌ Error updating organization:", orgError);
              throw orgError; // Re-throw to show error to user
            }
          } else {
            console.warn(
              "⚠️ Cannot update organization: organizationId is missing"
            );
            toast.error("Organization ID not found. Please contact support.");
            throw new Error("Organization ID not found");
          }
        } else if (step === 1 && data) {
          const licenseData = data as CaseManagerOnboardingLicenseData;
          // Update case manager license
          if (user?.id && licenseData.license) {
            console.log("📤 Updating case manager license via API", {
              userId: user.id,
              data: licenseData,
            });
            try {
              await caseManagerService.updateCaseManager(user.id, {
                licenseNumber: licenseData.license.licenseNumber,
                licenseExpiry: licenseData.license.expirationDate,
                licenseDocumentUrl: licenseData.license.documentUrl,
                licenseFileName: licenseData.license.fileName,
              });
              console.log("✅ License updated successfully");
            } catch (licenseError: unknown) {
              console.error("❌ Error updating license:", licenseError);
              throw licenseError; // Re-throw to show error to user
            }
          } else {
            console.warn("⚠️ Cannot update license: userId is missing");
            toast.error("User ID not found. Please contact support.");
          }
        }

        if (isComplete) {
          toast.success(`Step ${step + 1} completed successfully!`);
        }
      } catch (error: unknown) {
        console.error("❌ Failed to save step data:", error);

        // Extract detailed error message from API response
        let errorMessage = "Failed to save progress";
        if (error && typeof error === 'object' && 'response' in error) {
          const apiError = error as { response?: { data?: { errors?: Array<{ field: string; message: string }>; message?: string } } };
          if (apiError.response?.data?.errors && Array.isArray(apiError.response.data.errors)) {
            // Show first validation error
            const firstError = apiError.response.data.errors[0];
            errorMessage = `${firstError.field}: ${firstError.message}`;
          } else if (apiError.response?.data?.message) {
            errorMessage = apiError.response.data.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        throw error; // Re-throw so handleNext knows it failed
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  const handleStepComplete = useCallback(
    async (stepData: CaseManagerOnboardingOrganizationData | CaseManagerOnboardingLicenseData) => {
      console.log("🔄 handleStepComplete called", { currentStep, stepData });
      // Save step data when step is completed
      await saveStepData(currentStep, stepData, true);
    },
    [currentStep, saveStepData]
  );

  const handleNext = async () => {
    console.log("➡️ handleNext called", { currentStep });
    if (currentStep < STEPS.length - 1) {
      // Validate and save current step before moving forward
      if (validateStepRef.current) {
        console.log("✅ Validating step...");
        // validateStepRef.current() is now async and calls onComplete, which saves the data
        const isValid = await validateStepRef.current();
        console.log("✅ Validation result:", isValid);
        if (!isValid) {
          toast.error("Please complete all required fields before continuing");
          return;
        }
        // Save is already complete at this point since validateStepRef.current() awaited onComplete
        console.log("✅ Step validated and saved, moving to next step");
      } else {
        console.warn("⚠️ validateStepRef.current is null");
      }

      // Move to next step after validation and save completes
      setOnboardingState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setOnboardingState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update organization if needed
      if (onboardingState.organizationData && user.organizationId) {
        await organizationService.updateOrganization(user.organizationId, {
          name: onboardingState.organizationData.organizationName,
          addressLine1: onboardingState.organizationData.addressLine1,
          addressLine2: onboardingState.organizationData.addressLine2,
          city: onboardingState.organizationData.city,
          state: onboardingState.organizationData.state,
          zipCode: onboardingState.organizationData.zipCode,
          county: onboardingState.organizationData.county,
          phone: onboardingState.organizationData.phone,
          email: onboardingState.organizationData.email,
          website: onboardingState.organizationData.website,
          ein: onboardingState.organizationData.ein,
          fax: onboardingState.organizationData.fax,
        });
      }

      // Update case manager license
      if (onboardingState.licenseData?.license) {
        await caseManagerService.updateCaseManager(user.id, {
          licenseNumber: onboardingState.licenseData.license.licenseNumber,
          licenseExpiry: onboardingState.licenseData.license.expirationDate,
          licenseDocumentUrl: onboardingState.licenseData.license.documentUrl,
          licenseFileName: onboardingState.licenseData.license.fileName,
        });
      }

      toast.success(
        "Application submitted successfully! It's now under review."
      );
      // Reload the page to show the pending review state
      window.location.reload();
    } catch (error) {
      console.error("Failed to submit onboarding:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <OrganizationSetup
            data={onboardingState.organizationData || {}}
            onComplete={handleStepComplete}
            onValidate={(validateFn) => {
              validateStepRef.current = validateFn;
            }}
          />
        );
      case 1:
        return (
          <LicenseUpload
            data={onboardingState.licenseData || {}}
            onComplete={handleStepComplete}
            onValidate={(validateFn) => {
              validateStepRef.current = validateFn;
            }}
          />
        );
      case 2:
        return (
          <ReviewAndSubmit
            organizationData={onboardingState.organizationData || undefined}
            licenseData={onboardingState.licenseData || undefined}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onAcknowledgmentChange={setAllAcknowledgmentsChecked}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-32 w-32 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Loading onboarding data...
          </p>
        </div>
      </div>
    );
  }

  // Show submitted/pending review state
  // If organization is PENDING and both steps are completed, show waiting for review message
  const hasCompletedSteps =
    completedSteps.includes(0) && completedSteps.includes(1);
  if (
    organizationStatus === "PENDING" &&
    hasCompletedSteps &&
    caseManagerData?.licenseNumber
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>
              Your case manager application has been submitted and is currently
              being reviewed by our admin team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="healthcareWarning">Under Review</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Expected Review Time
                </span>
                <span className="text-sm text-muted-foreground">
                  2-3 business days
                </span>
              </div>
            </div>

            <div className="p-3 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-sm text-info text-center">
                You'll receive an email notification once your application has
                been reviewed and approved. You can check back here anytime to
                see your application status.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex-1"
              >
                Go Home
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="healthcare-container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Case Manager Onboarding
              </h1>
              <p className="text-muted-foreground">
                Complete your profile to start managing referrals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="healthcarePrimary" className="text-sm">
                Step {currentStep + 1} of {STEPS.length}
              </Badge>
              {isSaving && (
                <Badge variant="outline" className="text-xs">
                  Saving...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="healthcare-container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Progress
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {completedSteps.includes(index) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-border mx-4 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 0 && <Building2 className="w-5 h-5" />}
                {currentStep === 1 && <FileText className="w-5 h-5" />}
                {currentStep === 2 && <Check className="w-5 h-5" />}
                {STEPS[currentStep].title}
              </CardTitle>
              <CardDescription>
                {STEPS[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !completedSteps.includes(0) ||
                    !completedSteps.includes(1) ||
                    !allAcknowledgmentsChecked ||
                    isSubmitting
                  }
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
