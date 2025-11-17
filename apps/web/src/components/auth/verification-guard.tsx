"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProvider } from "@/contexts/provider-context";
import { Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerificationGuardProps {
  children: ReactNode;
  showLoading?: boolean;
  showError?: boolean;
  redirectOnFail?: boolean;
  redirectPath?: string;
  allowPending?: boolean; // Allow access if verification is pending
}

/**
 * Guard component that ensures provider is verified before allowing access
 * Can be used at layout or page level to gate features that require verification
 */
export function VerificationGuard({
  children,
  showLoading = true,
  showError = true,
  redirectOnFail = false,
  redirectPath,
  allowPending = false,
}: VerificationGuardProps) {
  const router = useRouter();
  const { provider, isLoading, error } = useProvider();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    const isVerified = provider?.verified === true;
    const isPending = !isVerified && provider !== null;

    // If verification is required and not verified, handle accordingly
    if (!isVerified && !allowPending) {
      if (redirectOnFail) {
        const path = redirectPath || "/provider/settings";
        router.push(path);
        return;
      }
    }

    setIsChecking(false);
  }, [provider, isLoading, allowPending, redirectOnFail, redirectPath, router]);

  // Show loading state
  if (isLoading || isChecking) {
    if (!showLoading) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking verification status...</p>
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
            <CardDescription>{error}</CardDescription>
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

  // Check verification status
  const isVerified = provider?.verified === true;
  const isPending = !isVerified && provider !== null;

  // If verified, allow access
  if (isVerified) {
    return <>{children}</>;
  }

  // If pending and allowed, allow access
  if (isPending && allowPending) {
    return <>{children}</>;
  }

  // Show verification pending/required state
  if (!showError) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isPending ? (
            <Clock className="h-12 w-12 text-warning mx-auto mb-4" />
          ) : (
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          )}
          <CardTitle>
            {isPending ? "Verification Pending" : "Verification Required"}
          </CardTitle>
          <CardDescription>
            {isPending
              ? "Your provider profile is being reviewed by our team. You'll receive an email notification once it's approved."
              : "This feature requires a verified provider profile. Please complete your profile and wait for verification."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Status</span>
              <Badge
                variant={isPending ? "healthcareWarning" : "destructive"}
              >
                {isPending ? "Under Review" : "Not Verified"}
              </Badge>
            </div>
            {isPending && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expected Review Time</span>
                <span className="text-sm text-muted-foreground">
                  2-3 business days
                </span>
              </div>
            )}
          </div>

          {provider?.verificationNotes && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Verification Notes</p>
              <p className="text-sm text-muted-foreground">
                {provider.verificationNotes}
              </p>
            </div>
          )}

          <Button
            onClick={() => router.push("/provider/settings")}
            className="w-full"
          >
            View Profile
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

