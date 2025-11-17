"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProviderStatus } from "@/hooks/use-provider-status";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
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
  const { hasProviderProfile, isVerified, needsOnboarding, isLoading, error } = useProviderStatus();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Staff members are already attached to an organization and should never be forced through onboarding
      if (user?.role === UserRole.PROVIDER_STAFF) {
        setIsChecking(false);
        return;
      }

      // Wait for provider status to load
      if (isLoading) return;

      // If user needs onboarding, redirect to onboarding page
      if (needsOnboarding) {
        router.push("/provider/onboarding");
        return;
      }

      // If provider profile exists but is not verified, show verification pending
      if (hasProviderProfile && !isVerified) {
        setIsChecking(false);
        return;
      }

      // If everything is good, allow access
      if (hasProviderProfile && isVerified) {
        setIsChecking(false);
        return;
      }

      // Default case - allow access (shouldn't happen for provider roles)
      setIsChecking(false);
    };

    checkOnboardingStatus();
  }, [hasProviderProfile, isVerified, needsOnboarding, isLoading, router]);

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

  // Show verification pending state
  if (hasProviderProfile && !isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <CardTitle>Verification Pending</CardTitle>
            <CardDescription>
              Your provider profile is being reviewed by our team. You'll receive an email notification once it's approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Profile Status</span>
                <Badge variant="healthcareWarning">Under Review</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Review Time</span>
                <span className="text-sm text-muted-foreground">2-3 business days</span>
              </div>
            </div>
            
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

  // Access granted, render children
  return <>{children}</>;
}
