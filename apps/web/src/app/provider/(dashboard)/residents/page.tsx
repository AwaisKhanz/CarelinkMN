"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared";

/**
 * Provider Residents Page
 * 
 * This page redirects to the placements page with active placements filter.
 * Residents are managed through the placements system.
 */
export default function ProviderResidentsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to placements page with active filter
    router.replace("/provider/placements?status=ACTIVE");
  }, [router]);

  return <LoadingState message="Loading residents..." />;
}

