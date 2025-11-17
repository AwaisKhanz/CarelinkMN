"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Referral } from "@/lib/api";
import { PAYER_LABELS } from "@/lib/constants";
import { getUrgencyBadgeConfig, getReferralStatusBadgeConfig } from "@/lib/utils/case-manager";
import { ReferralActionsCell } from "../components/referral-actions-cell";

interface UseReferralsColumnsProps {
  onView: (referral: Referral) => void;
  onEdit: (referral: Referral) => void;
  onDelete: (referral: Referral) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canManageShortlist?: boolean;
  canManageMessages?: boolean;
}

export function useReferralsColumns({
  onView,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
  canManageShortlist = true,
  canManageMessages = true,
}: UseReferralsColumnsProps) {
  const router = useRouter();

  const columns: ColumnDef<Referral>[] = useMemo(
    () => [
      {
        accessorKey: "referralNumber",
        header: "Referral #",
        cell: ({ row }) => (
          <div className="font-medium whitespace-nowrap">
            {row.original.referralNumber}
          </div>
        ),
      },
      {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="whitespace-nowrap">
              <div className="font-medium">{referral.clientInitials}</div>
              <div className="text-sm text-muted-foreground">
                {referral.clientAge} yrs, {referral.clientGender}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const referral = row.original;
          const config = getReferralStatusBadgeConfig(referral.status);
          return (
            <Badge
              variant={config.variant}
              className="whitespace-nowrap"
            >
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "urgency",
        header: "Urgency",
        cell: ({ row }) => {
          const referral = row.original;
          const config = getUrgencyBadgeConfig(referral.urgency);
          return (
            <Badge variant={config.variant} className="whitespace-nowrap">
              {config.icon && <config.icon className="h-3 w-3 mr-1" />}
              {config.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "payer",
        header: "Payer",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="whitespace-nowrap">
              <Badge variant="outline">
                {PAYER_LABELS[referral.primaryPayer] || referral.primaryPayer}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "targetMoveDate",
        header: "Target Move Date",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="whitespace-nowrap text-sm">
              {referral.targetMoveDate
                ? format(new Date(referral.targetMoveDate), "MMM d, yyyy")
                : "N/A"}
            </div>
          );
        },
      },
      {
        accessorKey: "shortlist",
        header: "Shortlisted",
        cell: ({ row }) => {
          const referral = row.original;
          const shortlistCount = referral.shortlist?.length || 0;
          return (
            <div className="whitespace-nowrap">
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {shortlistCount}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(referral.createdAt), {
                addSuffix: true,
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const referral = row.original;
          return (
            <ReferralActionsCell
              referral={referral}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canManageShortlist={canManageShortlist}
              canManageMessages={canManageMessages}
            />
          );
        },
      },
    ],
    [onView, onEdit, onDelete, canUpdate, canDelete, canManageShortlist, canManageMessages]
  );

  return columns;
}


