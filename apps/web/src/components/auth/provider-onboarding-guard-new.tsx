"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProviderOnboardingStatus } from "@/hooks/use-provider-status-new";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import { Loader2, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProviderOnboardingGuardProps {
  children: React.ReactNode;
  showLoading?: boolean;
  showError?: boolean;
}

export function ProviderOnboardingGuard({
  children,
  showLoading = true,
  showError = true
}: ProviderOnboardingGuardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    hasProviderProfile,
    isVerified,
    needsOnboarding,
    onboardingStatus,
    currentStep,
    adminReviewStatus,
    isLoading,
    error,
    canAccessDashboard,
    shouldShowOnboarding,
    isUnderReview,
    needsChanges,
    isApproved
  } = useProviderOnboardingStatus();

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for provider status to load
      if (isLoading) return;

      // If user should be redirected to onboarding
      if (shouldShowOnboarding && onboardingStatus !== 'under_review') {
        router.push("/provider/onboarding");
        return;
      }

      // If everything is good, allow access
      if (canAccessDashboard) {
        setIsChecking(false);
        return;
      }

      // For other states, show appropriate UI
      setIsChecking(false);
    };

    checkOnboardingStatus();
  }, [
    hasProviderProfile,
    isVerified,
    needsOnboarding,
    onboardingStatus,
    canAccessDashboard,
    shouldShowOnboarding,
    isUnderReview,
    isLoading,
    router
  ]);

  // Show loading state
  if (isLoading || isChecking) {
    if (!showLoading) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking provider status...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    if (!showError) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Error Loading Provider Status</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show under review state
  if (isUnderReview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-warning mx-auto mb-4" />
            <CardTitle>Application Under Review</CardTitle>
            <CardDescription>
              Your provider application is currently being reviewed by our admin team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Application Status</span>
                <Badge variant="healthcareWarning">
                  {adminReviewStatus === 'IN_REVIEW' ? 'In Review' : 'Pending Review'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Step</span>
                <span className="text-sm text-muted-foreground">
                  All steps completed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Review Time</span>
                <span className="text-sm text-muted-foreground">2-3 business days</span>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                You'll receive an email notification once your application has been reviewed.
                In the meantime, you can explore the platform but won't be able to accept referrals.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => router.push("/provider/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show changes needed state
  if (needsChanges) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>
              {onboardingStatus === 'rejected' ? 'Application Rejected' : 'Changes Required'}
            </CardTitle>
            <CardDescription>
              {onboardingStatus === 'rejected'
                ? 'Your application has been rejected. Please review the feedback and reapply.'
                : 'Your application requires changes before it can be approved.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant="destructive">
                  {onboardingStatus === 'rejected' ? 'Rejected' : 'Changes Needed'}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Next Steps:</p>
              <p className="text-sm text-muted-foreground">
                Review the admin feedback and update your application accordingly.
                You can continue from where you left off.
              </p>
            </div>

            <Button
              onClick={() => router.push("/provider/onboarding")}
              className="w-full"
            >
              Continue Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted, render children
  return <>{children}</>;
}