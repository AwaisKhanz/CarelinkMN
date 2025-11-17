"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Users, MessageSquare, Trash2, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Referral } from "@/lib/api";

interface ReferralActionsCellProps {
  referral: Referral;
  onView: (referral: Referral) => void;
  onEdit: (referral: Referral) => void;
  onDelete: (referral: Referral) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canManageShortlist?: boolean;
  canManageMessages?: boolean;
}

export function ReferralActionsCell({
  referral,
  onView,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
  canManageShortlist = true,
  canManageMessages = true,
}: ReferralActionsCellProps) {
  const router = useRouter();

  const hasAnyAction = canUpdate || canDelete || canManageShortlist || canManageMessages;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onView(referral);
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {hasAnyAction && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canUpdate && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(referral);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {canManageShortlist && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/case-manager/referrals/${referral.id}/shortlist`);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Shortlist
              </DropdownMenuItem>
            )}
            {canManageMessages && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/case-manager/messages?referralId=${referral.id}`);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                {(canUpdate || canManageShortlist || canManageMessages) && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(referral);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}


