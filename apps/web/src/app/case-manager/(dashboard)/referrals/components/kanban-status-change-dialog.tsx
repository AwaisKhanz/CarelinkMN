"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ReferralStatus } from "@carelink/types";
import { getReferralStatusBadgeConfig } from "@/lib/utils/case-manager";
import { Loader2 } from "lucide-react";

interface KanbanStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralNumber: string;
  currentStatus: ReferralStatus;
  newStatus: ReferralStatus;
  onConfirm: () => Promise<void>;
  isUpdating: boolean;
}

const STATUS_CHANGE_WARNINGS: Record<ReferralStatus, string[]> = {
  [ReferralStatus.CLOSED]: [
    "This will mark the referral as closed.",
    "The referral will no longer appear in active workflows.",
  ],
  [ReferralStatus.CANCELLED]: [
    "This will cancel the referral.",
    "This action may be difficult to undo.",
  ],
  [ReferralStatus.PLACED]: [
    "This will mark the referral as placed.",
    "The placement date will be recorded.",
  ],
  [ReferralStatus.NEW]: [],
  [ReferralStatus.IN_REVIEW]: [],
  [ReferralStatus.TOURING]: [],
  [ReferralStatus.OFFER_MADE]: [],
};

export function KanbanStatusChangeDialog({
  open,
  onOpenChange,
  referralNumber,
  currentStatus,
  newStatus,
  onConfirm,
  isUpdating,
}: KanbanStatusChangeDialogProps) {
  const currentConfig = getReferralStatusBadgeConfig(currentStatus);
  const newConfig = getReferralStatusBadgeConfig(newStatus);
  const warnings = STATUS_CHANGE_WARNINGS[newStatus] || [];

  const requiresConfirmation =
    newStatus === ReferralStatus.CLOSED ||
    newStatus === ReferralStatus.CANCELLED ||
    newStatus === ReferralStatus.PLACED;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Referral Status</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              Are you sure you want to change the status of referral{" "}
              <span className="font-semibold">{referralNumber}</span>?
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">From:</span>
                <Badge variant={currentConfig.variant}>
                  {currentConfig.label}
                </Badge>
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">To:</span>
                <Badge variant={newConfig.variant}>{newConfig.label}</Badge>
              </div>
            </div>
            {warnings.length > 0 && (
              <div className="pt-2 space-y-1">
                {warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    • {warning}
                  </p>
                ))}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isUpdating}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

