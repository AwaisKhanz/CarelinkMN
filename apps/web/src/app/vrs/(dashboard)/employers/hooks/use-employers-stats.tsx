"use client";

import { useMemo } from "react";
import type { VRSEmployer } from "@/lib/api";

interface UseEmployersStatsProps {
  employers: VRSEmployer[];
  totalCount: number;
}

export function useEmployersStats({
  employers,
  totalCount,
}: UseEmployersStatsProps) {
  const stats = useMemo(() => {
    return {
      total: totalCount || employers.length,
      inclusive: employers.filter((e) => e.isInclusive).length,
      accessible: employers.filter((e) => e.hasAccessibility).length,
      sponsored: employers.filter((e) => e.isSponsoredListing).length,
    };
  }, [employers, totalCount]);

  return stats;
}

