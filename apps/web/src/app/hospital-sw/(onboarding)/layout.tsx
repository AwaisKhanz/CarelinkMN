"use client";

import { HospitalSWGuard } from "@/components/auth/route-guard";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  // Onboarding layout - handles role guard and email verification
  // Guard order: EmailVerificationGuard -> HospitalSWGuard
  return (
    <EmailVerificationGuard>
      <HospitalSWGuard>{children}</HospitalSWGuard>
    </EmailVerificationGuard>
  );
}

