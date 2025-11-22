"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";
import { PageMetadataProvider, usePageMetadata } from "./use-page-metadata";
import { HospitalSWOnboardingGuard } from "@/components/auth/role-onboarding-guard";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { title, description } = usePageMetadata();

  return (
    <DashboardLayout title={title} description={description}>
      {children}
    </DashboardLayout>
  );
}

export default function DashboardLayoutWrapper({
  children,
}: DashboardLayoutProps) {
  // Guard order: EmailVerificationGuard -> HospitalSWOnboardingGuard -> PageMetadataProvider
  return (
    <EmailVerificationGuard>
      <HospitalSWOnboardingGuard>
        <PageMetadataProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </PageMetadataProvider>
      </HospitalSWOnboardingGuard>
    </EmailVerificationGuard>
  );
}
