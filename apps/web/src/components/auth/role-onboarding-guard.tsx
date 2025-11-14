"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoleOnboardingGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  onboardingPath: string;
  showLoading?: boolean;
  showError?: boolean;
}

export function RoleOnboardingGuard({ 
  children, 
  requiredRole,
  onboardingPath,
  showLoading = true, 
  showError = true 
}: RoleOnboardingGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Only check for the specific role
      if (!isAuthenticated || !user || user.role !== requiredRole) {
        setIsChecking(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if user has completed onboarding based on role
        let needsOnboarding = false;
        
        switch (requiredRole) {
          case UserRole.CASE_MANAGER:
            const caseManagerResponse = await fetch(`/api/case-managers/by-user/${user.id}`, {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
              },
            });
            if (caseManagerResponse.ok) {
              const caseManagerData = await caseManagerResponse.json();
              needsOnboarding = !caseManagerData.data?.licenseNumber;
            } else {
              needsOnboarding = true;
            }
            break;
            
          case UserRole.HOSPITAL_SW:
            const hospitalResponse = await fetch(`/api/hospital-staff/by-user/${user.id}`, {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
              },
            });
            if (hospitalResponse.ok) {
              const hospitalData = await hospitalResponse.json();
              needsOnboarding = !hospitalData.data?.department;
            } else {
              needsOnboarding = true;
            }
            break;
            
          case UserRole.VRS_SPECIALIST:
            // VRS specialists don't need additional onboarding
            needsOnboarding = false;
            break;
            
          case UserRole.VENDOR:
            const vendorResponse = await fetch(`/api/vendors/by-user/${user.id}`, {
              headers: {
                "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
              },
            });
            if (vendorResponse.ok) {
              const vendorData = await vendorResponse.json();
              needsOnboarding = !vendorData.data?.businessName;
            } else {
              needsOnboarding = true;
            }
            break;
            
          default:
            needsOnboarding = false;
        }

        setNeedsOnboarding(needsOnboarding);
        
        if (needsOnboarding) {
          router.push(onboardingPath);
          return;
        }

        setIsChecking(false);
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setNeedsOnboarding(true); // Assume needs onboarding on error
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, isAuthenticated, requiredRole, onboardingPath, router]);

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
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was an error checking your onboarding status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If needs onboarding, redirect (handled in useEffect)
  if (needsOnboarding) {
    return null;
  }

  // Access granted, render children
  return <>{children}</>;
}

// Convenience components for specific roles
export function CaseManagerOnboardingGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleOnboardingGuard 
      requiredRole={UserRole.CASE_MANAGER}
      onboardingPath="/case-manager/onboarding"
    >
      {children}
    </RoleOnboardingGuard>
  );
}

export function HospitalSWOnboardingGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleOnboardingGuard 
      requiredRole={UserRole.HOSPITAL_SW}
      onboardingPath="/hospital-sw/onboarding"
    >
      {children}
    </RoleOnboardingGuard>
  );
}

export function VendorOnboardingGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleOnboardingGuard 
      requiredRole={UserRole.VENDOR}
      onboardingPath="/vendor/onboarding"
    >
      {children}
    </RoleOnboardingGuard>
  );
}
