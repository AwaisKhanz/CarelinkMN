"use client";

import { ReactNode } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface ProviderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  itemName?: string;
  itemDetails?: ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting?: boolean;
  variant?: "delete" | "remove";
}

/**
 * Provider-specific delete dialog wrapper
 * Uses the generic ConfirmationDialog with delete-specific defaults
 * Maintains backward compatibility with existing provider code
 */
export function ProviderDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  itemDetails,
  onConfirm,
  confirmLabel,
  cancelLabel = "Cancel",
  isDeleting = false,
  variant = "delete",
}: ProviderDeleteDialogProps) {
  const actionLabel = confirmLabel || (variant === "delete" ? "Delete" : "Remove");

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      itemName={itemName}
      itemDetails={itemDetails}
      onConfirm={onConfirm}
      confirmLabel={actionLabel}
      cancelLabel={cancelLabel}
      isProcessing={isDeleting}
      variant="destructive"
    />
  );
}
