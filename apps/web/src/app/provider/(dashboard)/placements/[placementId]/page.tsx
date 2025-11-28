"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePageMetadata } from "../../use-page-metadata";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { PlacementDetailView } from "@/components/placements/placement-detail-view";

const placementsGateConfig = PROVIDER_FEATURE_GATES.placements;

function PlacementDetailContent() {
  const params = useParams();
  const { setTitle, setDescription } = usePageMetadata();
  const placementId = params?.placementId as string | undefined;

  useEffect(() => {
    setTitle("Placement Details");
    setDescription("Review resident placement information and timeline");
  }, [setTitle, setDescription]);

  if (!placementId) return null;

  return (
    <PlacementDetailView
      placementId={placementId}
      backUrl="/provider/placements"
      userRole="PROVIDER"
      readOnly={false}
    />
  );
}

function PlacementDetailPageWrapper() {
  return (
    <FeatureGate
      feature={placementsGateConfig.feature}
      requiredPlan={placementsGateConfig.requiredPlan}
      bannerDescription={placementsGateConfig.description}
    >
      <PlacementDetailContent />
    </FeatureGate>
  );
}

export default function PlacementDetailPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.RESIDENTS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view placement details. Please contact your organization administrator if you need access."
    >
      <PlacementDetailPageWrapper />
    </RequirePermission>
  );
}
