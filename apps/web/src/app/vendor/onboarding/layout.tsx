"use client";

import { VendorGuard } from "@/components/auth/route-guard";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  // Vendor onboarding layout - handles role guard and email verification
  // Guard order: EmailVerificationGuard -> VendorGuard
  return (
    <EmailVerificationGuard>
      <VendorGuard>{children}</VendorGuard>
    </EmailVerificationGuard>
  );
}

