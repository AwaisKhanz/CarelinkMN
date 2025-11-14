"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";
import {
  onboardingService,
  OnboardingReviewStatus,
} from "@/lib/api/services/onboarding.service";
import { providerService } from "@/lib/api/services/provider.service";

interface ProviderStatus {
  hasProviderProfile: boolean;
  isVerified: boolean;
  needsOnboarding: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useProviderStatus(): ProviderStatus {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<ProviderStatus>({
    hasProviderProfile: false,
    isVerified: false,
    needsOnboarding: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkProviderStatus = async () => {
      // Only check for provider roles
      if (
        !isAuthenticated ||
        !user ||
        ![UserRole.PROVIDER_OWNER, UserRole.PROVIDER_STAFF].includes(
          user.role as UserRole
        )
      ) {
        setStatus({
          hasProviderProfile: false,
          isVerified: false,
          needsOnboarding: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        setStatus((prev) => ({ ...prev, isLoading: true, error: null }));

        // Fetch both provider profile and onboarding state in parallel
        const [providerResponse, onboardingState] = await Promise.allSettled([
          providerService.getProviderByUserId(user.id),
          onboardingService.getOnboardingState(),
        ]);

        // Check provider verification status
        let providerVerified = false;
        let hasProviderProfile = false;

        if (providerResponse.status === "fulfilled" && providerResponse.value) {
          hasProviderProfile = true;
          // Provider is verified if verified field is true
          providerVerified = providerResponse.value.verified === true;
        }

        // Check onboarding state
        let needsOnboarding = true;
        let isComplete = false;
        let adminReviewStatus: OnboardingReviewStatus = "PENDING";

        if (onboardingState.status === "fulfilled" && onboardingState.value) {
          const state = onboardingState.value;
          isComplete = state.isComplete;
          adminReviewStatus = state.adminReviewStatus;

          if (state.isComplete) {
            switch (state.adminReviewStatus) {
              case "APPROVED":
                needsOnboarding = false;
                break;
              case "REJECTED":
              case "NEEDS_CHANGES":
                needsOnboarding = true;
                break;
              case "PENDING":
              case "IN_REVIEW":
                needsOnboarding = false; // Don't allow editing while under review
                break;
              default:
                needsOnboarding = false;
            }
          } else {
            needsOnboarding = true;
          }
        } else if (onboardingState.status === "rejected") {
          // If onboarding state doesn't exist, check if provider exists
          if (hasProviderProfile) {
            // Provider exists but no onboarding state - might be a new provider
            needsOnboarding = true;
          }
        }

        // Provider is verified if Provider.verified is true OR onboarding is approved
        // This allows admins to verify providers independently of onboarding review
        const isVerified =
          providerVerified || (isComplete && adminReviewStatus === "APPROVED");

        // If provider is verified, they don't need onboarding regardless of onboarding state
        // Verified providers can access dashboard even if onboarding review is pending
        if (isVerified) {
          needsOnboarding = false;
        }

        setStatus({
          hasProviderProfile,
          isVerified,
          needsOnboarding,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error checking provider status:", error);

        // If we get a 404, it means the provider profile doesn't exist yet
        // This could happen on first login before onboarding starts
        if (error instanceof Error && error.message.includes("404")) {
          setStatus({
            hasProviderProfile: false,
            isVerified: false,
            needsOnboarding: true,
            isLoading: false,
            error: null,
          });
        } else {
          setStatus({
            hasProviderProfile: false,
            isVerified: false,
            needsOnboarding: true,
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    };

    checkProviderStatus();
  }, [user, isAuthenticated]);

  return status;
}
