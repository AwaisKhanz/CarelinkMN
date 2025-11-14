"use client";

import { ProviderGuard } from "@/components/auth/route-guard";
import { ProviderOnboardingGuard } from "@/components/auth/provider-onboarding-guard";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <ProviderGuard>
      <ProviderOnboardingGuard>{children}</ProviderOnboardingGuard>
    </ProviderGuard>
  );
}
