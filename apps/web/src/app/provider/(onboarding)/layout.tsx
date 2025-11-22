"use client";

import { ProviderGuard } from "@/components/auth/route-guard";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  // Onboarding layout - only role guard, no onboarding check
  // Route groups ensure this layout is separate from dashboard
  // Guard order: EmailVerificationGuard -> ProviderGuard
  return (
    <EmailVerificationGuard>
      <ProviderGuard>{children}</ProviderGuard>
    </EmailVerificationGuard>
  );
}

