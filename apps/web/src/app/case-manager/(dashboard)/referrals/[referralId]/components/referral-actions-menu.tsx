"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Clock, CheckCircle, Trash2, UserPlus } from "lucide-react";
import { ReferralStatus } from "@carelink/types";
import { Referral } from "@/lib/api";

interface ReferralActionsMenuProps {
  referral: Referral;
  onUpdateStatus: () => void;
  onCloseReferral: () => void;
  onDelete: () => void;
  onAssign?: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canAssign?: boolean;
}

export function ReferralActionsMenu({
  referral,
  onUpdateStatus,
  onCloseReferral,
  onDelete,
  onAssign,
  canUpdate = true,
  canDelete = true,
  canAssign = false,
}: ReferralActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canUpdate && (
          <>
            <DropdownMenuItem onClick={onUpdateStatus}>
              <Clock className="h-4 w-4 mr-2" />
              Update Status
            </DropdownMenuItem>
            {referral.status !== ReferralStatus.CLOSED && (
              <DropdownMenuItem onClick={onCloseReferral}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Close Referral
              </DropdownMenuItem>
            )}
          </>
        )}
        {canAssign && onAssign && (
          <>
            {canUpdate && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onAssign}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Case Manager
            </DropdownMenuItem>
          </>
        )}
        {canDelete && (
          <>
            {(canUpdate || canAssign) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


