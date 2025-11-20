"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
  return (
    <PageMetadataProvider>
      <HospitalSWOnboardingGuard>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </HospitalSWOnboardingGuard>
    </PageMetadataProvider>
  );
}
