"use client";

import { ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmationVariant = "destructive" | "warning" | "info" | "success" | "default";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  itemName?: string;
  itemDetails?: ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  variant?: ConfirmationVariant;
  icon?: ReactNode;
  showCancel?: boolean;
  size?: "sm" | "md" | "lg";
}

const variantConfig: Record<
  ConfirmationVariant,
  {
    icon: typeof AlertCircle;
    iconColor: string;
    confirmVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  }
> = {
  destructive: {
    icon: AlertCircle,
    iconColor: "text-destructive",
    confirmVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-warning",
    confirmVariant: "default",
  },
  info: {
    icon: Info,
    iconColor: "text-info",
    confirmVariant: "default",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-success",
    confirmVariant: "default",
  },
  default: {
    icon: Info,
    iconColor: "text-muted-foreground",
    confirmVariant: "default",
  },
};

/**
 * Generic confirmation dialog component for the entire application
 * Provides consistent confirmation UI across all parts of the site
 * 
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Item"
 *   description="Are you sure you want to delete this item? This action cannot be undone."
 *   itemName="My Item"
 *   onConfirm={handleDelete}
 *   variant="destructive"
 *   isProcessing={isDeleting}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  itemDetails,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isProcessing = false,
  variant = "default",
  icon,
  showCancel = true,
  size = "md",
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const config = variantConfig[variant];
  const IconComponent = icon ? null : config.icon;
  const iconElement = icon || (IconComponent && <IconComponent className={cn("h-5 w-5", config.iconColor)} />);

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={sizeClasses[size]}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {iconElement && <span className="flex-shrink-0">{iconElement}</span>}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {typeof description === "string" ? (
              <p>{description}</p>
            ) : (
              description
            )}
            {itemName && (
              <p className="font-semibold text-foreground mt-2">{itemName}</p>
            )}
            {itemDetails && (
              <div className="mt-2">{itemDetails}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancel && (
            <AlertDialogCancel disabled={isProcessing}>
              {cancelLabel}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isProcessing}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
