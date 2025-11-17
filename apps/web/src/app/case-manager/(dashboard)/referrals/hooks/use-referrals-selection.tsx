"use client";

import { useState, useCallback, useMemo } from "react";
import { Referral } from "@/lib/api";
import { ColumnDef } from "@tanstack/react-table";

interface UseReferralsSelectionProps {
  referrals: Referral[];
  baseColumns: ColumnDef<Referral>[];
}

export function useReferralsSelection({
  referrals,
  baseColumns,
}: UseReferralsSelectionProps) {
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);

  const handleSelectAll = useCallback(() => {
    if (selectedReferrals.length === referrals.length) {
      setSelectedReferrals([]);
    } else {
      setSelectedReferrals(referrals.map((r) => r.id));
    }
  }, [selectedReferrals.length, referrals]);

  const handleDeselectAll = useCallback(() => {
    setSelectedReferrals([]);
  }, []);

  const handleToggleSelection = useCallback((referralId: string) => {
    setSelectedReferrals((prev) =>
      prev.includes(referralId)
        ? prev.filter((id) => id !== referralId)
        : [...prev, referralId]
    );
  }, []);

  const handlePageChange = useCallback(() => {
    setSelectedReferrals([]);
  }, []);

  const columnsWithSelection: ColumnDef<Referral>[] = useMemo(
    () => [
      {
        id: "select",
        header: () => (
          <input
            type="checkbox"
            checked={
              selectedReferrals.length > 0 &&
              selectedReferrals.length === referrals.length
            }
            onChange={handleSelectAll}
            className="rounded border-border"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedReferrals.includes(row.original.id)}
            onChange={() => handleToggleSelection(row.original.id)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-border"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...baseColumns,
    ],
    [baseColumns, selectedReferrals, referrals.length, handleSelectAll, handleToggleSelection]
  );

  return {
    selectedReferrals,
    setSelectedReferrals,
    handleSelectAll,
    handleDeselectAll,
    handleToggleSelection,
    handlePageChange,
    columnsWithSelection,
  };
}

