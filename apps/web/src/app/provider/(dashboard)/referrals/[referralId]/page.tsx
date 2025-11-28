"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { referralService, providerService } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { format, formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Referral,
  ReferralStatus,
  ShortlistStatus,
  Urgency,
} from "@carelink/types";
import { useProviderId } from "@/hooks/use-provider-data";
import { usePermissions } from "@/hooks/use-permissions";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import {
  getUrgencyBadgeConfig,
  getReferralStatusBadgeConfig,
} from "@/lib/utils/provider";
import { SHORTLIST_STATUS_CONFIG } from "@/lib/constants";

function ReferralDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseStatus, setResponseStatus] = useState<ShortlistStatus | "">(
    ""
  );
  const [responseNotes, setResponseNotes] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const providerId = useProviderId();
  const { canRespondToReferrals } = usePermissions();

  const referralId = params?.referralId as string | undefined;

  useEffect(() => {
    setTitle("Referral Details");
    setDescription("View and respond to referral details");
  }, [setTitle, setDescription]);

  useEffect(() => {
    if (referralId) {
      fetchReferral();
    }
  }, [referralId]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !referralId) return;

    const handleReferralUpdate = (data: any) => {
      if (data.referralId === referralId) {
        console.log("Socket event: referral updated", data);
        fetchReferral();
        toast.info("Referral updated");
      }
    };

    socket.on("referral:updated", handleReferralUpdate);

    return () => {
      socket.off("referral:updated", handleReferralUpdate);
    };
  }, [socket, referralId]);

  const fetchReferral = async () => {
    if (!referralId || !providerId) return;

    try {
      setIsLoading(true);
      const response = await providerService.getProviderReferralById(
        providerId,
        referralId
      );
      if (response.success && response.data) {
        setReferral(response.data);
      } else {
        setError(response.message || "Failed to load referral");
      }
    } catch (err) {
      console.error("Error fetching referral:", err);
      setError("Failed to load referral details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!providerId || !referralId || !responseStatus) return;

    setIsResponding(true);
    try {
      const response = await providerService.respondToReferral(
        providerId,
        referralId,
        {
          status: responseStatus,
          notes: responseNotes || undefined,
        }
      );

      if (response.success) {
        toast.success("Referral response updated successfully");
        setResponseDialogOpen(false);
        setResponseStatus("");
        setResponseNotes("");
        await fetchReferral();
      } else {
        toast.error(response.message || "Failed to update response");
      }
    } catch (err) {
      console.error("Error responding to referral:", err);
      toast.error("Failed to respond to referral");
    } finally {
      setIsResponding(false);
    }
  };

  const handleMessage = () => {
    router.push(`/provider/messages?referralId=${referralId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading referral...</p>
        </div>
      </div>
    );
  }

  if (error || !referral) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/provider/referrals")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Referrals
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error || "Referral not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const urgencyConfig = getUrgencyBadgeConfig(referral.urgency);
  const statusConfig = getReferralStatusBadgeConfig(referral.status);
  const shortlistItem = referral.shortlist?.find(
    (s) => s.providerId === providerId
  );
  const shortlistConfig = shortlistItem
    ? SHORTLIST_STATUS_CONFIG[shortlistItem.status]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/provider/referrals")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Referral #{referral.referralNumber}
            </h1>
            <p className="text-muted-foreground">
              Received {formatDistanceToNow(new Date(referral.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={urgencyConfig.variant}>
            {urgencyConfig.icon && (
              <urgencyConfig.icon className="h-3 w-3 mr-1" />
            )}
            {urgencyConfig.label}
          </Badge>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          {shortlistConfig && (
            <Badge variant={shortlistConfig.color}>
              {shortlistConfig.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Referral Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="healthcare" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Referral Information</CardTitle>
            <CardDescription>
              Client details and care requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium text-foreground">
                    {referral.clientInitials} ({referral.clientAge} yrs,{" "}
                    {referral.clientGender})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">
                    {referral.preferredCounties.length > 0
                      ? referral.preferredCounties.join(", ")
                      : "Any"}
                    {referral.preferredCities.length > 0 &&
                      ` (${referral.preferredCities.join(", ")})`}
                  </p>
                </div>
              </div>
            </div>

            {/* Care Needs */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Care Levels</h3>
                <div className="flex flex-wrap gap-2">
                  {referral.careLevels.map((level, idx) => (
                    <Badge key={idx} variant="outline">
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>
              {referral.servicesNeeded.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Services Needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {referral.servicesNeeded.map((service, idx) => (
                      <Badge key={idx} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payer Info */}
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Payer Information</h3>
              <p className="text-sm text-muted-foreground">
                Primary: {referral.primaryPayer}
                {referral.secondaryPayer && (
                  <> | Secondary: {referral.secondaryPayer}</>
                )}
              </p>
            </div>

            {/* Timeline */}
            {referral.targetMoveDate && (
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Target Move Date
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(referral.targetMoveDate), "MMMM d, yyyy")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Respond to this referral</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {canRespondToReferrals && (
              <>
                <Button
                  className="w-full justify-start"
                  variant="healthcare"
                  onClick={() => setResponseDialogOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Update Response
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleMessage}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </>
            )}

            {/* Shortlist Status */}
            {shortlistItem && (
              <>
                <Separator className="my-3" />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Your Status</h4>
                  <Badge variant={shortlistConfig?.color || "outline"}>
                    {shortlistConfig?.label || shortlistItem.status}
                  </Badge>
                  {shortlistItem.contactedAt && (
                    <p className="text-xs text-muted-foreground">
                      Contacted:{" "}
                      {format(
                        new Date(shortlistItem.contactedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  )}
                  {shortlistItem.respondedAt && (
                    <p className="text-xs text-muted-foreground">
                      Responded:{" "}
                      {format(
                        new Date(shortlistItem.respondedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </p>
                  )}
                  {shortlistItem.notes && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className="text-muted-foreground">
                        {shortlistItem.notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Referral Response</DialogTitle>
            <DialogDescription>
              Update your response status for this referral
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response-status">Status</Label>
              <Select
                value={responseStatus}
                onValueChange={(value) =>
                  setResponseStatus(value as ShortlistStatus)
                }
              >
                <SelectTrigger id="response-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ShortlistStatus.CONTACTED}>
                    Contacted
                  </SelectItem>
                  <SelectItem value={ShortlistStatus.RESPONDED}>
                    Interested / Responded
                  </SelectItem>
                  <SelectItem value={ShortlistStatus.TOURING}>
                    Touring Scheduled
                  </SelectItem>
                  <SelectItem value={ShortlistStatus.DECLINED}>
                    Not Interested / Declined
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="response-notes">Notes (Optional)</Label>
              <Textarea
                id="response-notes"
                placeholder="Add any notes about your response..."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResponseDialogOpen(false);
                  setResponseStatus("");
                  setResponseNotes("");
                }}
                disabled={isResponding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRespond}
                disabled={!responseStatus || isResponding}
                variant="healthcare"
              >
                {isResponding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Response
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReferralDetailPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.REFERRALS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view referrals. Please contact your organization administrator if you need access."
    >
      <ReferralDetailContent />
    </RequirePermission>
  );
}

