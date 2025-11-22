"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { OrganizationStatus, VendorCategory } from "@carelink/types";
import { getOrganizationStatusBadgeConfig } from "@/lib/utils/admin";
import { organizationService, vendorService } from "@/lib/api";
import { toast } from "sonner";

const STEPS = [
  {
    id: "business",
    title: "Business Information",
    description: "Complete your business profile",
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review and submit your application",
  },
];

const vendorCategories = [
  { value: VendorCategory.TRAINING, label: "Training" },
  { value: VendorCategory.DME, label: "Durable Medical Equipment" },
  { value: VendorCategory.HOME_MODS, label: "Home Modifications" },
  { value: VendorCategory.LEGAL, label: "Legal" },
  { value: VendorCategory.STAFFING, label: "Staffing" },
  { value: VendorCategory.TRANSPORT, label: "Transportation" },
];

export default function VendorOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [organizationStatus, setOrganizationStatus] = useState<string | null>(
    null
  );

  const [onboardingData, setOnboardingData] = useState<{
    businessName: string;
    category: VendorCategory | "";
    description: string;
  }>({
    businessName: "",
    category: "",
    description: "",
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Load organization status on mount
  useEffect(() => {
    const loadOrganizationStatus = async () => {
      if (!user?.organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        const orgData = await organizationService.getOrganizationById(
          user.organizationId
        );
        if (orgData) {
          setOrganizationStatus(orgData.status);
        }
      } catch (error) {
        console.error("Failed to load organization status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadOrganizationStatus();
    }
  }, [user]);

  // If organization is VERIFIED, redirect to dashboard
  useEffect(() => {
    if (organizationStatus === OrganizationStatus.VERIFIED) {
      toast.success("Your onboarding has been approved!");
      router.push("/vendor/dashboard");
    }
  }, [organizationStatus, router]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error("User not found");
      }

      // Get vendor by user ID first
      const vendorResponse = await vendorService.getVendorByUserId(user.id);

      if (!vendorResponse.success || !vendorResponse.data) {
        throw new Error("Vendor profile not found");
      }

      const vendorId = vendorResponse.data.id;

      // Update vendor profile with business info
      if (!onboardingData.category) {
        throw new Error("Category is required");
      }

      const updateResponse = await vendorService.updateVendor(vendorId, {
        businessName: onboardingData.businessName,
        category: onboardingData.category as VendorCategory,
        description: onboardingData.description,
      });

      if (!updateResponse.success) {
        throw new Error(
          updateResponse.message || "Failed to update vendor profile"
        );
      }

      toast.success("Vendor profile updated successfully!");

      // Redirect to dashboard
      router.push("/vendor/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update vendor profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Your Business Name"
                value={onboardingData.businessName}
                onChange={(e) =>
                  setOnboardingData((prev) => ({
                    ...prev,
                    businessName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={onboardingData.category}
                onValueChange={(value) =>
                  setOnboardingData((prev) => ({
                    ...prev,
                    category: value as VendorCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {vendorCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Input
                id="description"
                placeholder="Describe your business and services..."
                value={onboardingData.description}
                onChange={(e) =>
                  setOnboardingData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Review Your Information</h3>
              <div className="space-y-2">
                <p>
                  <strong>Business Name:</strong> {onboardingData.businessName}
                </p>
                <p>
                  <strong>Category:</strong>{" "}
                  {vendorCategories.find(
                    (c) => c.value === onboardingData.category
                  )?.label || onboardingData.category}
                </p>
                <p>
                  <strong>Description:</strong> {onboardingData.description}
                </p>
              </div>
            </div>
          </div>
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

  // Show status message for different organization statuses
  // For SUSPENDED/DEACTIVATED: always show (admin action)
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
          "Your vendor application has been suspended. Please contact support for more information.";
        icon = (
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        );
        infoMessage =
          "If you believe this is an error or have questions about the suspension, please contact our support team for assistance.";
        break;
      case OrganizationStatus.DEACTIVATED:
        title = "Application Deactivated";
        description =
          "Your vendor application has been deactivated. Please contact support to reactivate your account.";
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Vendor Onboarding</h1>
            <p className="text-muted-foreground mt-2">
              Complete your business profile to start serving the care community
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep].title}</CardTitle>
              <CardDescription>
                {STEPS[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent>{renderStep()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
