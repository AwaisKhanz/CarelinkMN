"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProviderGuard } from "@/components/auth/route-guard";
import { ProviderOnboardingGuard } from "@/components/auth/provider-onboarding-guard";
import { ProviderProvider } from "@/contexts/provider-context";
import { PageMetadataProvider, usePageMetadata } from "./use-page-metadata";

interface ProviderLayoutProps {
  children: ReactNode;
}

function ProviderLayoutContent({ children }: ProviderLayoutProps) {
  const { title, description } = usePageMetadata();

  return (
    <DashboardLayout title={title} description={description}>
      {children}
    </DashboardLayout>
  );
}

export default function ProviderLayout({ children }: ProviderLayoutProps) {
  return (
    <ProviderGuard>
      <ProviderOnboardingGuard>
        <ProviderProvider>
          <PageMetadataProvider>
            <ProviderLayoutContent>{children}</ProviderLayoutContent>
          </PageMetadataProvider>
        </ProviderProvider>
      </ProviderOnboardingGuard>
    </ProviderGuard>
  );
}
