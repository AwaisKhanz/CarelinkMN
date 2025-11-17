"use client";

import { AlertTriangle } from "lucide-react";

interface UrgentCasesHeaderProps {
  totalCount: number;
}

export function UrgentCasesHeader({ totalCount }: UrgentCasesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-warning" />
          Urgent Cases
        </h1>
        <p className="text-muted-foreground mt-1">
          {totalCount} urgent referral{totalCount !== 1 ? "s" : ""} requiring
          immediate attention
        </p>
      </div>
    </div>
  );
}
