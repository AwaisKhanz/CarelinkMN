"use client";

import { useMemo } from "react";
import { RetentionStatus } from "@carelink/types";
import type { VRSPlacement } from "@/lib/api";

interface UsePlacementsStatsProps {
  placements: VRSPlacement[];
  totalCount: number;
}

export function usePlacementsStats({
  placements,
  totalCount,
}: UsePlacementsStatsProps) {
  const stats = useMemo(() => {
    return {
      total: totalCount || placements.length,
      retained: placements.filter(
        (p) => p.day90Status === RetentionStatus.RETAINED
      ).length,
      notRetained: placements.filter(
        (p) => p.day90Status === RetentionStatus.NOT_RETAINED
      ).length,
      pending: placements.filter(
        (p) => p.day90Status === RetentionStatus.PENDING || !p.day90Status
      ).length,
    };
  }, [placements, totalCount]);

  return stats;
}

