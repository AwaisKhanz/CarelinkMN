"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";
import { VRSGuard } from "@/components/auth/route-guard";
import { PageMetadataProvider, usePageMetadata } from "./use-page-metadata";

interface LayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const { title, description } = usePageMetadata();

  return (
    <DashboardLayout title={title} description={description}>
      {children}
    </DashboardLayout>
  );
}

export default function VRSDashboardLayout({ children }: LayoutProps) {
  // Guard order: EmailVerificationGuard -> VRSGuard -> PageMetadataProvider
  return (
    <EmailVerificationGuard>
      <VRSGuard>
        <PageMetadataProvider>
          <LayoutContent>{children}</LayoutContent>
        </PageMetadataProvider>
      </VRSGuard>
    </EmailVerificationGuard>
  );
}

