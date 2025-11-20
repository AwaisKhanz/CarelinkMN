"use client";

import { useMemo } from "react";
import { JobStatus } from "@carelink/types";
import type { VRSJob } from "@/lib/api";

interface UseJobsStatsProps {
  jobs: VRSJob[];
  totalCount: number;
}

export function useJobsStats({ jobs, totalCount }: UseJobsStatsProps) {
  const stats = useMemo(() => {
    return {
      total: totalCount || jobs.length,
      open: jobs.filter((j) => j.status === JobStatus.OPEN).length,
      filled: jobs.filter((j) => j.status === JobStatus.FILLED).length,
      draft: jobs.filter((j) => j.status === JobStatus.DRAFT).length,
    };
  }, [jobs, totalCount]);

  return stats;
}

