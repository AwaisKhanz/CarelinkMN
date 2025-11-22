"use client";

import { CaseManagerGuard } from "@/components/auth/route-guard";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  // Onboarding layout - only role guard, no onboarding check
  // Route groups ensure this layout is separate from dashboard
  // Note: EmailVerificationGuard is applied at root layout level
  return <CaseManagerGuard>{children}</CaseManagerGuard>;
}

