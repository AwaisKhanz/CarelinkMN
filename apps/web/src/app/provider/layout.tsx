"use client";

import { ReactNode } from "react";
import { ProviderGuard } from "@/components/auth/route-guard";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";

interface ProviderLayoutProps {
  children: ReactNode;
}

export default function ProviderLayout({ children }: ProviderLayoutProps) {
  // Root layout - handles role guard and email verification
  // Onboarding and Dashboard route groups have their own layouts
  // Guard order: EmailVerificationGuard -> ProviderGuard
  // Note: EmailVerificationGuard is also in individual layouts, but having it here ensures coverage
  return (
    <EmailVerificationGuard>
      <ProviderGuard>{children}</ProviderGuard>
    </EmailVerificationGuard>
  );
}
