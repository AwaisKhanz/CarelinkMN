"use client";

import { useMemo } from "react";
import { ReferralStatus, Urgency } from "@carelink/types";
import { Referral } from "@/lib/api";

interface UseReferralsStatsProps {
  referrals: Referral[];
  totalCount: number;
}

export function useReferralsStats({ referrals, totalCount }: UseReferralsStatsProps) {
  const stats = useMemo(() => {
    return {
      total: totalCount || referrals.length,
      active: referrals.filter(
        (r) =>
          r.status === ReferralStatus.NEW ||
          r.status === ReferralStatus.IN_REVIEW ||
          r.status === ReferralStatus.TOURING ||
          r.status === ReferralStatus.OFFER_MADE
      ).length,
      urgent: referrals.filter((r) => r.urgency === Urgency.URGENT).length,
      placed: referrals.filter((r) => r.status === ReferralStatus.PLACED).length,
      closed: referrals.filter((r) => r.status === ReferralStatus.CLOSED).length,
    };
  }, [referrals, totalCount]);

  return stats;
}


