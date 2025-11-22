"use client";

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmailVerificationGuard } from "@/components/auth/email-verification-guard";
import { ProviderOnboardingCompleteGuard } from "@/components/auth/provider-onboarding-complete-guard";
import { ProviderVerificationGuard } from "@/components/auth/provider-verification-guard";
import { ProviderProvider } from "@/contexts/provider-context";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { PageMetadataProvider, usePageMetadata } from "./use-page-metadata";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@carelink/types";

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

/**
 * Provider Dashboard Layout
 *
 * Guard order (outer to inner):
 * 1. ErrorBoundary - Catches any errors in the component tree
 * 2. EmailVerificationGuard - Ensures user email is verified
 * 3. ProviderOnboardingCompleteGuard - Ensures onboarding is complete, redirects if not
 * 4. ProviderProvider - Provides provider context (single source of truth for provider data)
 * 5. ProviderVerificationGuard - Shows verification pending state but allows access (allowPending=true)
 * 6. SubscriptionProvider - Provides subscription context
 * 7. PageMetadataProvider - Provides page metadata context
 *
 * Note: For pages that require specific subscription tiers, use ProviderSubscriptionGuard at the page level.
 * For pages that require full verification (not just pending), use ProviderVerificationGuard with allowPending=false.
 *
 * Pages requiring PRO subscription (use ProviderSubscriptionGuard):
 * - /provider/analytics
 * - /provider/placements
 * - /provider/residents
 * - /provider/availability
 * - /provider/messages
 *
 * Pages requiring full verification (use ProviderVerificationGuard with allowPending=false):
 * - Pages that require verified status (can be added per page as needed)
 */
export default function DashboardLayoutWrapper({
  children,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const isProviderOwner = user?.role === UserRole.PROVIDER_OWNER;

  const content = (
    <EmailVerificationGuard>
      <ProviderProvider>
        <ProviderVerificationGuard allowPending={true}>
          <SubscriptionProvider>
            <PageMetadataProvider>
              <DashboardLayoutContent>{children}</DashboardLayoutContent>
            </PageMetadataProvider>
          </SubscriptionProvider>
        </ProviderVerificationGuard>
      </ProviderProvider>
    </EmailVerificationGuard>
  );

  if (!isProviderOwner) {
    return <ErrorBoundary>{content}</ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
      <ProviderOnboardingCompleteGuard>
        {content}
      </ProviderOnboardingCompleteGuard>
    </ErrorBoundary>
  );
}
