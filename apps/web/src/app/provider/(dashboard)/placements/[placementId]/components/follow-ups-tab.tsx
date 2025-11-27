"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Clock, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { placementService } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSocket } from "@/hooks/use-socket";

import {
  PlacementFollowUp,
  FollowUpType,
  FollowUpOutcome,
} from "@carelink/types";
import {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_OUTCOMES,
  FOLLOW_UP_OUTCOME_COLORS,
} from "@/lib/constants";

interface FollowUpsTabProps {
  placementId: string;
  readOnly?: boolean;
}

export function FollowUpsTab({ placementId, readOnly = false }: FollowUpsTabProps) {
  const [followUps, setFollowUps] = useState<PlacementFollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] = useState<PlacementFollowUp | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [newFollowUpType, setNewFollowUpType] = useState<string>("");
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>("");
  const [newFollowUpNotes, setNewFollowUpNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFollowUps = async () => {
    try {
      setIsLoading(true);
      const response = await placementService.getFollowUps(placementId);
      if (response.success && response.data) {
        setFollowUps(response.data);
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      toast.error("Failed to load follow-ups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [placementId]);

  // Socket integration
  const { socket, joinPlacement, leavePlacement } = useSocket();

  useEffect(() => {
    if (!socket) return;

    joinPlacement(placementId);

    const handleFollowUpCreated = (data: { followUp: PlacementFollowUp }) => {
      setFollowUps((prev) => [data.followUp, ...prev]);
      toast.info("New follow-up added");
    };

    const handleFollowUpCompleted = (data: { followUpId: string; outcome: FollowUpOutcome }) => {
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === data.followUpId
            ? { ...f, completedAt: new Date().toISOString(), outcome: data.outcome }
            : f
        )
      );
      toast.info("Follow-up completed");
    };

    const handleFollowUpDeleted = (data: { followUpId: string }) => {
      setFollowUps((prev) => prev.filter((f) => f.id !== data.followUpId));
      toast.info("Follow-up deleted");
    };

    socket.on("placement:followup:created", handleFollowUpCreated);
    socket.on("placement:followup:completed", handleFollowUpCompleted);
    socket.on("placement:followup:deleted", handleFollowUpDeleted);

    return () => {
      leavePlacement(placementId);
      socket.off("placement:followup:created", handleFollowUpCreated);
      socket.off("placement:followup:completed", handleFollowUpCompleted);
      socket.off("placement:followup:deleted", handleFollowUpDeleted);
    };
  }, [socket, placementId, joinPlacement, leavePlacement]);

  const handleCompleteClick = (followUp: PlacementFollowUp) => {
    setSelectedFollowUp(followUp);
    setNotes(followUp.notes || "");
    setOutcome("");
    setCompleteDialogOpen(true);
  };

  const handleCompleteSubmit = async () => {
    if (!selectedFollowUp || !notes.trim() || !outcome) {
      toast.error("Please provide notes and select an outcome");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await placementService.completeFollowUp(selectedFollowUp.id, {
        notes: notes.trim(),
        outcome: outcome as FollowUpOutcome,
      });

      if (response.success) {
        toast.success("Follow-up completed successfully");
        setCompleteDialogOpen(false);
        setSelectedFollowUp(null);
        setNotes("");
        setOutcome("");
        await fetchFollowUps();
      } else {
        toast.error(response.message || "Failed to complete follow-up");
      }
    } catch (error) {
      console.error("Error completing follow-up:", error);
      toast.error("Failed to complete follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newFollowUpType || !newFollowUpDate) {
      toast.error("Please select a type and date");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await placementService.createFollowUp(placementId, {
        type: newFollowUpType as FollowUpType,
        scheduledDate: new Date(newFollowUpDate).toISOString(),
        notes: newFollowUpNotes.trim() || undefined,
      });

      if (response.success) {
        toast.success("Follow-up scheduled successfully");
        setCreateDialogOpen(false);
        setNewFollowUpType("");
        setNewFollowUpDate("");
        setNewFollowUpNotes("");
        await fetchFollowUps();
      } else {
        toast.error(response.message || "Failed to schedule follow-up");
      }
    } catch (error) {
      console.error("Error scheduling follow-up:", error);
      toast.error("Failed to schedule follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (followUp: PlacementFollowUp) => {
    setSelectedFollowUp(followUp);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFollowUp = async () => {
    if (!selectedFollowUp) return;

    try {
      const response = await placementService.deleteFollowUp(selectedFollowUp.id);
      if (response.success) {
        toast.success("Follow-up deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedFollowUp(null);
        await fetchFollowUps();
      } else {
        toast.error(response.message || "Failed to delete follow-up");
      }
    } catch (error) {
      console.error("Error deleting follow-up:", error);
      toast.error("Failed to delete follow-up");
    }
  };

  const upcomingFollowUps = followUps.filter((f) => !f.completedAt);
  const completedFollowUps = followUps.filter((f) => f.completedAt);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Follow-ups */}
      <Card variant="healthcare">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming Follow-ups</CardTitle>
            <CardDescription>
              Scheduled check-ins for this placement
            </CardDescription>
          </div>
          {!readOnly && (
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {upcomingFollowUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming follow-ups scheduled.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {FOLLOW_UP_TYPES[followUp.type] || followUp.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled: {format(new Date(followUp.scheduledAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="healthcare"
                      size="sm"
                      onClick={() => handleCompleteClick(followUp)}
                      disabled={readOnly}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(followUp)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Follow-ups */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Completed Follow-ups</CardTitle>
          <CardDescription>
            History of completed check-ins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedFollowUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed follow-ups yet.
            </p>
          ) : (
            <div className="space-y-3">
              {completedFollowUps.map((followUp) => {
                const outcomeLabel = followUp.outcome
                  ? FOLLOW_UP_OUTCOMES[followUp.outcome]
                  : null;
                const outcomeColor = followUp.outcome
                  ? FOLLOW_UP_OUTCOME_COLORS[followUp.outcome]
                  : "secondary";

                return (
                  <div
                    key={followUp.id}
                    className="p-4 border border-border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-medium">
                            {FOLLOW_UP_TYPES[followUp.type] || followUp.type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Completed: {format(new Date(followUp.completedAt!), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      {outcomeLabel && (
                        <Badge variant={outcomeColor as any}>
                          {outcomeLabel}
                        </Badge>
                      )}
                    </div>
                    {followUp.notes && (
                      <div className="pl-8">
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {followUp.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Follow-up Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Follow-up</DialogTitle>
            <DialogDescription>
              Record the outcome and notes for this follow-up check-in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome *</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger id="outcome">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FOLLOW_UP_OUTCOMES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes *</Label>
              <Textarea
                id="notes"
                placeholder="Enter notes about this follow-up..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleCompleteSubmit}
              disabled={isSubmitting || !notes.trim() || !outcome}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Follow-up Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>
              Schedule a new follow-up check-in for this placement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={newFollowUpType} onValueChange={setNewFollowUpType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FOLLOW_UP_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-notes">Notes</Label>
              <Textarea
                id="new-notes"
                placeholder="Enter notes about this follow-up..."
                value={newFollowUpNotes}
                onChange={(e) => setNewFollowUpNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting || !newFollowUpType || !newFollowUpDate}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Follow-up Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Follow-up</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {selectedFollowUp?.type && FOLLOW_UP_TYPES[selectedFollowUp.type]} follow-up?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedFollowUp(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteFollowUp}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
