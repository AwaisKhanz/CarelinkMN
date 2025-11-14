"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CaseManagerGuard } from "@/components/auth/route-guard";
import { CaseManagerOnboardingGuard } from "@/components/auth/role-onboarding-guard";
import { CaseManagerProvider } from "@/contexts/case-manager-context";
import { PageMetadataProvider, usePageMetadata } from "./use-page-metadata";

interface CaseManagerLayoutProps {
  children: ReactNode;
}

function CaseManagerLayoutContent({ children }: CaseManagerLayoutProps) {
  const { title, description } = usePageMetadata();

  return (
    <DashboardLayout title={title} description={description}>
      {children}
    </DashboardLayout>
  );
}

export default function CaseManagerLayout({ children }: CaseManagerLayoutProps) {
  return (
    <CaseManagerGuard>
      <CaseManagerOnboardingGuard>
        <CaseManagerProvider>
          <PageMetadataProvider>
            <CaseManagerLayoutContent>{children}</CaseManagerLayoutContent>
          </PageMetadataProvider>
        </CaseManagerProvider>
      </CaseManagerOnboardingGuard>
    </CaseManagerGuard>
  );
}

