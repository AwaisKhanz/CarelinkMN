"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePageMetadata } from "../../use-page-metadata";
import { PlacementDetailView } from "@/components/placements/placement-detail-view";

export default function HospitalSWPlacementDetailPage() {
  const params = useParams();
  const { setTitle, setDescription } = usePageMetadata();
  const placementId = params?.placementId as string | undefined;

  useEffect(() => {
    setTitle("Placement Details");
    setDescription("Read-only view of placement information");
  }, [setTitle, setDescription]);

  if (!placementId) return null;

  return (
    <PlacementDetailView
      placementId={placementId}
      backUrl="/hospital-sw/discharges" // Or wherever they should go back to
      userRole="HOSPITAL_SW"
      readOnly={true}
    />
  );
}
