"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Clock, CheckCircle, Trash2 } from "lucide-react";
import { ReferralStatus } from "@carelink/types";
import { Referral } from "@/lib/api";

interface ReferralActionsMenuProps {
  referral: Referral;
  onUpdateStatus: () => void;
  onCloseReferral: () => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function ReferralActionsMenu({
  referral,
  onUpdateStatus,
  onCloseReferral,
  onDelete,
  canUpdate = true,
  canDelete = true,
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
        {canDelete && (
          <>
            {canUpdate && <DropdownMenuSeparator />}
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


