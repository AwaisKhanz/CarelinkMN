"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Upload,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  onboardingService,
  OnboardingState,
  OnboardingStepData,
} from "@/lib/api/services/onboarding.service";
import { OrganizationStatus } from "@carelink/types";
import { getOrganizationStatusBadgeConfig } from "@/lib/utils/admin";
import { organizationService } from "@/lib/api";

// Import step components
import { OrganizationSetup } from "./components/organization-setup-new";
import { LicenseUpload } from "./components/license-upload-new";
import { ServiceSelection } from "./components/service-selection-new";
import { SubscriptionPlan } from "./components/subscription-plan-new";
import { ReviewAndSubmit } from "./components/review-and-submit-new";

const STEPS = [
  {
    id: "organization",
    title: "Organization Setup",
    description: "Basic organization information",
  },
  {
    id: "license",
    title: "License Upload",
    description: "Upload your licenses and certifications",
  },
  {
    id: "services",
    title: "Service Selection",
    description: "Choose the services you provide",
  },
  {
    id: "subscription",
    title: "Subscription Plan",
    description: "Select your subscription tier",
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review and submit your application",
  },
];

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingState, setOnboardingState] =
    useState<OnboardingState | null>(null);
  const [allAcknowledgmentsChecked, setAllAcknowledgmentsChecked] =
    useState(false);
  const [organizationStatus, setOrganizationStatus] = useState<string | null>(
    null
  );
  const validateStepRef = useRef<(() => Promise<boolean>) | null>(null);

  // Load onboarding state on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        setIsLoading(true);
        const state = await onboardingService.getOnboardingState();
        setOnboardingState(state);

        // Load organization status if user has organizationId
        if (user?.organizationId) {
          try {
            const orgData = await organizationService.getOrganizationById(
              user.organizationId
            );
            if (orgData) {
              setOrganizationStatus(orgData.status);
            }
          } catch (error) {
            console.error("Failed to load organization status:", error);
          }
        }

        // If onboarding is complete and approved, redirect to dashboard
        if (state.isComplete && state.adminReviewStatus === "APPROVED") {
          toast.success("Your onboarding has been approved!");
          router.push("/provider/dashboard");
          return;
        }
      } catch (error) {
        console.error("Failed to load onboarding state:", error);
        toast.error("Failed to load onboarding progress");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadOnboardingState();
    }
  }, [user, router]);

  // Complete subscription step after returning from Stripe
  useEffect(() => {
    if (!onboardingState) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      const tier = localStorage.getItem("onboarding_selected_plan");
      if (tier) {
        // Mark subscription step (index 3) as complete
        (async () => {
          try {
            const updated = await onboardingService.updateOnboardingStep({
              step: 3,
              data: { subscriptionTier: tier },
              isComplete: true,
            });
            setOnboardingState(updated);
            localStorage.removeItem("onboarding_selected_plan");
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete("checkout");
            window.history.replaceState({}, "", url.toString());
            toast.success("Subscription confirmed");
          } catch (e) {
            console.error("Failed to complete subscription step:", e);
            toast.error("Failed to confirm subscription");
          }
        })();
      }
    }
  }, [onboardingState]);

  const currentStep = onboardingState?.currentStep || 0;
  const completedSteps = onboardingState?.completedSteps || [];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Save step data function
  const saveStepData = useCallback(
    async (step: number, data: any, isComplete: boolean = false) => {
      try {
        setIsSaving(true);
        const stepData: OnboardingStepData = {
          step,
          data,
          isComplete,
        };

        const updatedState =
          await onboardingService.updateOnboardingStep(stepData);
        setOnboardingState(updatedState);

        if (isComplete) {
          toast.success(`Step ${step + 1} completed successfully!`);
        }
      } catch (error) {
        console.error("Failed to save step data:", error);
        toast.error("Failed to save progress");
        throw error; // Re-throw so handleNext knows it failed
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleStepComplete = useCallback(
    async (stepData: any) => {
      // Save step data when step is completed
      await saveStepData(currentStep, stepData, true);
    },
    [currentStep, saveStepData]
  );

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      // Validate and save current step before moving forward
      if (validateStepRef.current) {
        const isValid = await validateStepRef.current();
        if (!isValid) {
          toast.error("Please complete all required fields before continuing");
          return;
        }
        // Save is already complete at this point since validateStepRef.current() awaited onComplete
      } else {
        console.warn("validateStepRef.current is null");
      }

      // Move to next step after validation and save completes
      if (onboardingState) {
        setOnboardingState({
          ...onboardingState,
          currentStep: onboardingState.currentStep + 1,
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      if (onboardingState) {
        setOnboardingState({
          ...onboardingState,
          currentStep: prevStep,
        });
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const completedState = await onboardingService.completeOnboarding();
      setOnboardingState(completedState);

      toast.success(
        "Application submitted successfully! It's now under review."
      );
      router.push("/provider/dashboard");
    } catch (error) {
      console.error("Failed to submit onboarding:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (!onboardingState) return null;

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
          <ServiceSelection
            data={onboardingState.serviceData || {}}
            licenseData={onboardingState.licenseData || {}}
            onComplete={handleStepComplete}
            onValidate={(validateFn) => {
              validateStepRef.current = validateFn;
            }}
          />
        );
      case 3:
        return (
          <SubscriptionPlan
            data={onboardingState.subscriptionData || {}}
            onComplete={handleStepComplete}
            onValidate={(validateFn) => {
              validateStepRef.current = validateFn;
            }}
          />
        );
      case 4:
        return (
          <ReviewAndSubmit
            onboardingState={onboardingState}
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

  // Show organization status message (SUSPENDED, DEACTIVATED) - takes priority over adminReviewStatus
  if (
    organizationStatus &&
    (organizationStatus === OrganizationStatus.SUSPENDED ||
      organizationStatus === OrganizationStatus.DEACTIVATED)
  ) {
    const status = organizationStatus as OrganizationStatus;
    const statusConfig = getOrganizationStatusBadgeConfig(status);

    let title = "";
    let description = "";
    let icon: JSX.Element | null = null;
    let infoMessage = "";

    switch (status) {
      case OrganizationStatus.SUSPENDED:
        title = "Application Suspended";
        description =
          "Your provider application has been suspended. Please contact support for more information.";
        icon = (
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        );
        infoMessage =
          "If you believe this is an error or have questions about the suspension, please contact our support team for assistance.";
        break;
      case OrganizationStatus.DEACTIVATED:
        title = "Application Deactivated";
        description =
          "Your provider application has been deactivated. Please contact support to reactivate your account.";
        icon = (
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        );
        infoMessage =
          "Your account has been deactivated. Please contact our support team if you wish to reactivate your account.";
        break;
      default:
        title = "Application Status";
        description = `Your application status: ${statusConfig.label}`;
        icon = <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />;
        infoMessage =
          "Please check back here anytime to see your application status.";
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {icon}
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={statusConfig.variant}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>

            <div
              className={`p-3 rounded-lg ${
                status === OrganizationStatus.SUSPENDED
                  ? "bg-destructive/10 border border-destructive/20"
                  : "bg-muted/10 border border-muted/20"
              }`}
            >
              <p
                className={`text-sm text-center ${
                  status === OrganizationStatus.SUSPENDED
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {infoMessage}
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

  // Show verification pending state
  if (
    onboardingState?.isComplete &&
    onboardingState.adminReviewStatus === "PENDING"
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>
              Your provider application has been submitted and is currently
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
                <span className="text-sm font-medium">Submitted</span>
                <span className="text-sm text-muted-foreground">
                  {onboardingState.submittedAt
                    ? new Date(onboardingState.submittedAt).toLocaleDateString()
                    : "Recently"}
                </span>
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
                been reviewed. You can check back here anytime to see your
                application status.
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

  // Show changes needed state
  if (
    onboardingState?.adminReviewStatus === "NEEDS_CHANGES" ||
    onboardingState?.adminReviewStatus === "REJECTED"
  ) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Changes Required</CardTitle>
            <CardDescription>
              Your application has been reviewed and changes are required before
              approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardingState.reviewNotes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Admin Notes:</p>
                <p className="text-sm text-muted-foreground">
                  {onboardingState.reviewNotes}
                </p>
              </div>
            )}

            <Button onClick={() => window.location.reload()} className="w-full">
              Continue Onboarding
            </Button>
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
              <h1 className="text-2xl font-bold healthcare-heading">
                Provider Onboarding
              </h1>
              <p className="text-muted-foreground">
                Complete your provider profile to start accepting referrals
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
                {currentStep === 3 && <Upload className="w-5 h-5" />}
                {currentStep === 4 && <CheckCircle className="w-5 h-5" />}
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

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={
                  !allAcknowledgmentsChecked ||
                  !completedSteps.includes(0) ||
                  !completedSteps.includes(1) ||
                  !completedSteps.includes(2) ||
                  !completedSteps.includes(3) ||
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
                    <CheckCircle className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
