"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CaseManagerOnboardingGuard } from "@/components/auth/role-onboarding-guard";
import { CaseManagerProvider } from "@/contexts/case-manager-context";
import { PageMetadataProvider, usePageMetadata } from "./use-page-metadata";

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

export default function DashboardLayoutWrapper({ children }: DashboardLayoutProps) {
  // Dashboard layout - includes onboarding guard to redirect if needed
  // Route groups ensure onboarding layout doesn't include this guard
  // Note: EmailVerificationGuard is applied at root layout level
  // Guard order: CaseManagerOnboardingGuard -> CaseManagerProvider -> PageMetadataProvider
  return (
    <CaseManagerOnboardingGuard>
      <CaseManagerProvider>
        <PageMetadataProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </PageMetadataProvider>
      </CaseManagerProvider>
    </CaseManagerOnboardingGuard>
  );
}

