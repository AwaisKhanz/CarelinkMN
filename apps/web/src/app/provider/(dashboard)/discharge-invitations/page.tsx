"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Building,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { usePageMetadata } from "../use-page-metadata";
import { useProviderId } from "@/hooks/use-provider-data";
import { dischargeCaseService } from "@/lib/api";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  InviteResponse,
  NotificationType,
  DischargeStatus,
  Gender,
  Payer,
  DischargeInvitation,
} from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import {
  getDischargeStatusLabel,
  getMobilityStatusLabel,
  getGenderLabel,
  PAYER_LABELS,
} from "@/lib/constants";

function ProviderDischargeInvitationsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const providerId = useProviderId();

  const [invitations, setInvitations] = useState<DischargeInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] =
    useState<DischargeInvitation | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<InviteResponse | null>(
    null
  );
  const [responseNotes, setResponseNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "responded">(
    "all"
  );

  useEffect(() => {
    setTitle("Discharge Invitations");
    setDescription("View and respond to discharge case invitations");
  }, [setTitle, setDescription]);

  const fetchInvitations = useCallback(async () => {
    if (!providerId) return;

    setIsLoading(true);
    setError(null);
    try {
      // TODO: This API endpoint needs to be created in the backend
      // GET /providers/:providerId/discharge-invitations
      const response = await dischargeCaseService.getProviderDischargeInvitations(
        providerId
      );

      if (response.success && response.data) {
        setInvitations(response.data);
      } else {
        setError(response.message || "Failed to load invitations");
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch invitations"
      );
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (providerId) {
      fetchInvitations();
    }
  }, [providerId, fetchInvitations]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: any) => {
      // Refresh list on new discharge invitation
      if (notification.type === NotificationType.DISCHARGE_INVITATION_RECEIVED) {
        fetchInvitations();
        toast.info("New discharge case invitation received");
      }
    };

    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [socket, fetchInvitations]);

  const handleOpenResponseDialog = (
    invitation: DischargeInvitation,
    response: InviteResponse
  ) => {
    setSelectedInvitation(invitation);
    setSelectedResponse(response);
    setResponseNotes("");
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedInvitation || !selectedResponse) return;

    setIsSubmitting(true);
    try {
      // TODO: This API endpoint needs to be created in the backend
      // PUT /discharge-invitations/:id/respond
      const response = await dischargeCaseService.respondToDischargeInvitation(
        selectedInvitation.id,
        {
          response: selectedResponse,
          responseNotes: responseNotes.trim() || undefined,
        }
      );

      if (response.success) {
        toast.success("Response submitted successfully");
        setResponseDialogOpen(false);
        setSelectedInvitation(null);
        setSelectedResponse(null);
        setResponseNotes("");
        await fetchInvitations();
      } else {
        toast.error(response.message || "Failed to submit response");
      }
    } catch (err) {
      console.error("Error submitting response:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit response"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getResponseBadgeConfig = (response: InviteResponse) => {
    switch (response) {
      case InviteResponse.ACCEPTED:
        return {
          variant: "healthcareSuccess" as const,
          label: "Accepted",
          icon: CheckCircle,
        };
      case InviteResponse.DECLINED:
        return {
          variant: "healthcareError" as const,
          label: "Declined",
          icon: XCircle,
        };
      case InviteResponse.NO_AVAILABILITY:
        return {
          variant: "healthcareWarning" as const,
          label: "No Availability",
          icon: AlertCircle,
        };
      default:
        return {
          variant: "outline" as const,
          label: "Unknown",
          icon: Clock,
        };
    }
  };

  const getExpiryStatus = (expiresAt: Date | string) => {
    const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
    const now = new Date();
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry <= 0) return "expired";
    if (hoursUntilExpiry <= 24) return "expiring_soon";
    return "active";
  };

  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      if (statusFilter === "pending") {
        return !inv.respondedAt;
      }
      if (statusFilter === "responded") {
        return !!inv.respondedAt;
      }
      return true;
    });
  }, [invitations, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: invitations.length,
      pending: invitations.filter((inv) => !inv.respondedAt).length,
      accepted: invitations.filter(
        (inv) => inv.response === InviteResponse.ACCEPTED
      ).length,
      declined: invitations.filter(
        (inv) => inv.response === InviteResponse.DECLINED
      ).length,
    };
  }, [invitations]);

  if (isLoading) {
    return <LoadingState message="Loading discharge invitations..." fullHeight />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Invitations"
        message={error}
        action={{
          label: "Retry",
          onClick: fetchInvitations,
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Discharge Invitations</h1>
        <p className="text-muted-foreground mt-1">
          View and respond to discharge case invitations from hospitals
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Invitations</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending Response</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {stats.declined}
            </div>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === "all" ? "healthcare" : "outline"}
          onClick={() => setStatusFilter("all")}
        >
          All ({invitations.length})
        </Button>
        <Button
          variant={statusFilter === "pending" ? "healthcare" : "outline"}
          onClick={() => setStatusFilter("pending")}
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={statusFilter === "responded" ? "healthcare" : "outline"}
          onClick={() => setStatusFilter("responded")}
        >
          Responded ({stats.total - stats.pending})
        </Button>
      </div>

      {/* Invitations List */}
      {filteredInvitations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invitations found"
          description={
            statusFilter === "pending"
              ? "You don't have any pending discharge case invitations."
              : statusFilter === "responded"
              ? "You haven't responded to any invitations yet."
              : "You don't have any discharge case invitations yet. Invitations will appear here when hospitals send them to your organization."
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredInvitations.map((invitation) => {
            const expiryStatus = getExpiryStatus(invitation.expiresAt);
            const isExpired = expiryStatus === "expired";
            const canRespond = !invitation.respondedAt && !isExpired;
            const responseBadgeConfig = invitation.response
              ? getResponseBadgeConfig(invitation.response)
              : null;

            return (
              <Card key={invitation.id} variant="healthcare">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              Case {invitation.dischargeCase?.caseNumber}
                            </h3>
                            {responseBadgeConfig && (
                              <Badge variant={responseBadgeConfig.variant}>
                                <responseBadgeConfig.icon className="h-3 w-3 mr-1" />
                                {responseBadgeConfig.label}
                              </Badge>
                            )}
                            {!invitation.respondedAt && (
                              <>
                                {isExpired && (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Expired
                                  </Badge>
                                )}
                                {expiryStatus === "expiring_soon" && (
                                  <Badge variant="healthcareWarning">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Expiring Soon
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                          {invitation.dischargeCase?.hospital && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <Building className="h-3 w-3 inline mr-1" />
                              {invitation.dischargeCase.hospital.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Patient Information */}
                      {invitation.dischargeCase && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Patient</p>
                              <p className="font-medium">
                                <User className="h-3 w-3 inline mr-1" />
                                {invitation.dischargeCase.patientInitials},{" "}
                                {invitation.dischargeCase.patientAge} yrs,{" "}
                                {getGenderLabel(invitation.dischargeCase.patientGender)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Mobility Status
                              </p>
                              <p className="text-sm">
                                {getMobilityStatusLabel(
                                  invitation.dischargeCase.mobilityStatus
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Primary Insurance
                              </p>
                              <Badge variant="outline">
                                {PAYER_LABELS[invitation.dischargeCase.primaryInsurance] ||
                                  invitation.dischargeCase.primaryInsurance}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Target Discharge Date
                              </p>
                              <p className="text-sm">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {format(
                                  new Date(invitation.dischargeCase.targetDischargeDate),
                                  "MMM d, yyyy"
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Preferred Location
                              </p>
                              <p className="text-sm">
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {invitation.dischargeCase.preferredCounties.join(", ")}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Diagnosis Codes
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {invitation.dischargeCase.diagnosisCodes
                                  .slice(0, 3)
                                  .map((code, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {code}
                                    </Badge>
                                  ))}
                                {invitation.dischargeCase.diagnosisCodes.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{invitation.dischargeCase.diagnosisCodes.length - 3}{" "}
                                    more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Invitation Details */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Invited:{" "}
                          {formatDistanceToNow(new Date(invitation.invitedAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {!invitation.respondedAt && (
                          <span>
                            Expires:{" "}
                            {formatDistanceToNow(new Date(invitation.expiresAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                        {invitation.respondedAt && (
                          <span>
                            Responded:{" "}
                            {formatDistanceToNow(new Date(invitation.respondedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>

                      {/* Response Notes */}
                      {invitation.responseNotes && (
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs font-medium mb-1">Your Notes:</p>
                          <p className="text-sm text-muted-foreground">
                            {invitation.responseNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {canRespond && (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="healthcare"
                          size="sm"
                          onClick={() =>
                            handleOpenResponseDialog(
                              invitation,
                              InviteResponse.ACCEPTED
                            )
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleOpenResponseDialog(
                              invitation,
                              InviteResponse.NO_AVAILABILITY
                            )
                          }
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          No Availability
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleOpenResponseDialog(
                              invitation,
                              InviteResponse.DECLINED
                            )
                          }
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedResponse === InviteResponse.ACCEPTED && "Accept Invitation"}
              {selectedResponse === InviteResponse.DECLINED && "Decline Invitation"}
              {selectedResponse === InviteResponse.NO_AVAILABILITY &&
                "No Availability"}
            </DialogTitle>
            <DialogDescription>
              {selectedResponse === InviteResponse.ACCEPTED &&
                "You are accepting this discharge case invitation. Please add any notes for the hospital."}
              {selectedResponse === InviteResponse.DECLINED &&
                "You are declining this discharge case invitation. Please provide a reason."}
              {selectedResponse === InviteResponse.NO_AVAILABILITY &&
                "You are indicating no availability for this discharge case. Please add any notes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response-notes">
                Notes {selectedResponse === InviteResponse.DECLINED && "(Required)"}
              </Label>
              <Textarea
                id="response-notes"
                placeholder="Add your notes here..."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResponseDialogOpen(false);
                setSelectedInvitation(null);
                setSelectedResponse(null);
                setResponseNotes("");
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedResponse === InviteResponse.ACCEPTED
                  ? "healthcare"
                  : selectedResponse === InviteResponse.DECLINED
                  ? "destructive"
                  : "default"
              }
              onClick={handleSubmitResponse}
              disabled={
                isSubmitting ||
                (selectedResponse === InviteResponse.DECLINED &&
                  !responseNotes.trim())
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Response"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProviderDischargeInvitationsPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.REFERRALS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view discharge invitations."
    >
      <ProviderDischargeInvitationsPageContent />
    </RequirePermission>
  );
}
