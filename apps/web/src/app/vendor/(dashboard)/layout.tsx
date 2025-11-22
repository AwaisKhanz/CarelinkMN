"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";
import { VendorGuard } from "@/components/auth/route-guard";
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

export default function VendorDashboardLayout({ children }: LayoutProps) {
  // Guard order: EmailVerificationGuard -> VendorGuard -> PageMetadataProvider
  return (
    <EmailVerificationGuard>
      <VendorGuard>
        <PageMetadataProvider>
          <LayoutContent>{children}</LayoutContent>
        </PageMetadataProvider>
      </VendorGuard>
    </EmailVerificationGuard>
  );
}

