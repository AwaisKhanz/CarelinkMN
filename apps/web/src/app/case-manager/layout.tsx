"use client";

import { ReactNode } from "react";
import { CaseManagerGuard } from "@/components/auth/route-guard";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";

interface CaseManagerLayoutProps {
  children: ReactNode;
}

export default function CaseManagerLayout({ children }: CaseManagerLayoutProps) {
  // Root layout - handles role guard and email verification
  // Onboarding and Dashboard route groups have their own layouts
  // Guard order: EmailVerificationGuard -> CaseManagerGuard
  // EmailVerificationGuard is applied here at the root level to avoid redundant nesting
  return (
    <EmailVerificationGuard>
      <CaseManagerGuard>{children}</CaseManagerGuard>
    </EmailVerificationGuard>
  );
}

