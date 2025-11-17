"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProviderStatus } from "@/hooks/use-provider-status";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProviderOnboardingCompleteGuardProps {
  children: ReactNode;
  showLoading?: boolean;
  showError?: boolean;
  redirectPath?: string;
}

/**
 * Guard that ensures onboarding is complete before allowing access
 * Redirects to onboarding page if not complete
 * Separate from ProviderOnboardingGuard which also handles verification
 */
export function ProviderOnboardingCompleteGuard({
  children,
  showLoading = true,
  showError = true,
  redirectPath,
}: ProviderOnboardingCompleteGuardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { needsOnboarding, isLoading, error } = useProviderStatus();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Staff members are already attached to their provider org; onboarding isn't required
    if (user?.role === UserRole.PROVIDER_STAFF) {
      setIsChecking(false);
      return;
    }

    if (isLoading) return;

    if (needsOnboarding) {
      const path = redirectPath || "/provider/onboarding";
      router.push(path);
      return;
    }

    setIsChecking(false);
  }, [needsOnboarding, isLoading, redirectPath, router]);

  // Show loading state
  if (isLoading || isChecking) {
    if (!showLoading) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking onboarding status...</p>
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
            <CardTitle>Error Loading Onboarding Status</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => window.location.reload()} className="w-full">
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

  // If onboarding is needed, redirect (should have already redirected)
  if (needsOnboarding) {
    return null;
  }

  // Onboarding complete, allow access
  return <>{children}</>;
}
