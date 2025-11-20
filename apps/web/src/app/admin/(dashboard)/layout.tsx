"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageMetadataProvider, usePageMetadata } from "./use-page-metadata";
import { AdminGuard } from "@/components/auth/route-guard";

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
    <AdminGuard>
      <PageMetadataProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </PageMetadataProvider>
    </AdminGuard>
  );
}
