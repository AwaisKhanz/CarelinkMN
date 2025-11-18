"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserPlus } from "lucide-react";
import { caseManagerService, CaseManager } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

interface CaseManagerWithUserId extends CaseManager {
  userId?: string;
}

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referralId: string;
  currentCaseManagerId?: string;
  onAssign: (assignedToUserId: string, notes?: string) => Promise<void>;
  isAssigning: boolean;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  referralId,
  currentCaseManagerId,
  onAssign,
  isAssigning,
}: AssignmentDialogProps) {
  const { user } = useAuth();
  const [caseManagers, setCaseManagers] = useState<CaseManagerWithUserId[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoadingCaseManagers, setIsLoadingCaseManagers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchCaseManagers();
      setSelectedUserId("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  const fetchCaseManagers = async () => {
    setIsLoadingCaseManagers(true);
    setError(null);
    try {
      const response = await caseManagerService.getCaseManagersInOrganization();
      if (response.success && response.data) {
        // Filter out the current user and case managers without user IDs
        const filtered = (response.data as CaseManagerWithUserId[]).filter(
          (cm) => cm.userId && cm.userId !== user?.id && cm.userId !== currentCaseManagerId
        );
        setCaseManagers(filtered);
      } else {
        setError(response.message || "Failed to load case managers");
      }
    } catch (err) {
      console.error("Error fetching case managers:", err);
      setError(err instanceof Error ? err.message : "Failed to load case managers");
    } finally {
      setIsLoadingCaseManagers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      setError("Please select a case manager");
      return;
    }

    setError(null);
    try {
      await onAssign(selectedUserId, notes || undefined);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign referral");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Referral
          </DialogTitle>
          <DialogDescription>
            Assign this referral to another case manager in your organization
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoadingCaseManagers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error && !caseManagers.length ? (
            <div className="text-sm text-destructive py-4">{error}</div>
          ) : (
            <>
              <div>
                <Label htmlFor="caseManager">Assign To</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger id="caseManager">
                    <SelectValue placeholder="Select a case manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseManagers.map((cm) => (
                      <SelectItem key={cm.userId || cm.id} value={cm.userId || ""}>
                        {cm.firstName} {cm.lastName} {cm.email && `(${cm.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {caseManagers.length === 0 && !isLoadingCaseManagers && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No other case managers available in your organization
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="notes">Assignment Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this assignment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning || isLoadingCaseManagers}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning || !selectedUserId || isLoadingCaseManagers || caseManagers.length === 0}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Referral
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

