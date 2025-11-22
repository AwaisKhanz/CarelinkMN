"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublicGuard } from "@/components/auth/route-guard";
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

export default function PublicDashboardLayout({ children }: LayoutProps) {
  return (
    <PublicGuard>
      <PageMetadataProvider>
        <LayoutContent>{children}</LayoutContent>
      </PageMetadataProvider>
    </PublicGuard>
  );
}

