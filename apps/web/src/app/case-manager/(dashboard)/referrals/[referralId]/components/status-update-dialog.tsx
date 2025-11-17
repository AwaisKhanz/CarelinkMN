"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ReferralStatus } from "@carelink/types";
import { REFERRAL_STATUS_CONFIG } from "@/lib/constants";

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: ReferralStatus;
  newStatus: ReferralStatus | "";
  onStatusChange: (status: ReferralStatus | "") => void;
  onUpdate: () => void;
  isUpdating: boolean;
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  currentStatus,
  newStatus,
  onStatusChange,
  onUpdate,
  isUpdating,
}: StatusUpdateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Referral Status</DialogTitle>
          <DialogDescription>
            Change the status of this referral
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">New Status</Label>
            <Select
              value={newStatus}
              onValueChange={(value) => onStatusChange(value as ReferralStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REFERRAL_STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={onUpdate}
              disabled={isUpdating || !newStatus}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


