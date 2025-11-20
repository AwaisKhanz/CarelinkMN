"use client";

import { useMemo } from "react";
import { VRSClientStatus } from "@carelink/types";
import type { VRSClient } from "@/lib/api";

interface UseClientsStatsProps {
  clients: VRSClient[];
  totalCount: number;
}

export function useClientsStats({
  clients,
  totalCount,
}: UseClientsStatsProps) {
  const stats = useMemo(() => {
    return {
      total: totalCount || clients.length,
      jobSearching: clients.filter(
        (c) => c.status === VRSClientStatus.JOB_SEARCHING
      ).length,
      placed: clients.filter((c) => c.status === VRSClientStatus.PLACED)
        .length,
      intake: clients.filter((c) => c.status === VRSClientStatus.INTAKE)
        .length,
    };
  }, [clients, totalCount]);

  return stats;
}

