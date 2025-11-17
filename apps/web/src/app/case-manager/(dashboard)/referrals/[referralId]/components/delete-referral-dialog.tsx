"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Referral } from "@/lib/api";

interface DeleteReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referral: Referral | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteReferralDialog({
  open,
  onOpenChange,
  referral,
  onConfirm,
  isDeleting,
}: DeleteReferralDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Referral"
      description="Are you sure you want to delete this referral? This action cannot be undone. All associated data will be permanently removed."
      itemName={referral?.referralNumber}
      itemDetails={
        referral ? (
          <>
            <strong>Client:</strong> {referral.clientInitials}
            <br />
            <strong>Status:</strong> {referral.status}
          </>
        ) : undefined
      }
      onConfirm={onConfirm}
      confirmLabel="Delete"
      isProcessing={isDeleting}
      variant="destructive"
    />
  );
}


