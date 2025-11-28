"use client";

import { useState, useEffect } from "react";
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
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Download,
  History,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { placementService, Placement, PlacementStatus } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  PLACEMENT_STATUS_CONFIG,
} from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowUpsTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/follow-ups-tab";
import { DocumentsTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/documents-tab";
import { FamilyTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/family-tab";
import { UpdatesTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/updates-tab";
import { ExpiringDocumentsWidget } from "@/app/provider/(dashboard)/placements/[placementId]/components/expiring-documents-widget";

interface PlacementDetailViewProps {
  placementId: string;
  backUrl: string;
  userRole: "PROVIDER" | "HOSPITAL_SW" | "CASE_MANAGER" | "ADMIN";
  readOnly?: boolean;
}

export function PlacementDetailView({
  placementId,
  backUrl,
  userRole,
  readOnly = false,
}: PlacementDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [packetAccessLogs, setPacketAccessLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [showAccessLogs, setShowAccessLogs] = useState(false);

  // Determine if user can manage placement (Provider only, and only when confirmed)
  const canManagePlacement = userRole === "PROVIDER" && !readOnly && placement?.status === PlacementStatus.CONFIRMED;
  
  // For providers, placement is read-only until confirmed
  const isReadOnly = readOnly || (userRole === "PROVIDER" && placement?.status !== PlacementStatus.CONFIRMED);

  useEffect(() => {
    const fetchPlacement = async () => {
      if (!placementId) return;

      try {
        setIsLoading(true);
        const response = await placementService.getPlacementById(placementId);
        if (response.success && response.data) {
          setPlacement(response.data);
        } else {
          setError(response.message || "Failed to load placement");
        }
      } catch (err) {
        console.error("Error fetching placement:", err);
        setError("Failed to load placement details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlacement();
  }, [placementId]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !placementId) return;

    const handlePlacementUpdate = (data: any) => {
      if (data.placementId === placementId) {
        console.log("Socket event: placement updated", data);
        // Refetch placement data
        placementService.getPlacementById(placementId).then((response) => {
          if (response.success && response.data) {
            setPlacement(response.data);
            toast.info("Placement updated");
          }
        });
      }
    };

    const handleSubFeatureUpdate = (data: any) => {
      if (data.placementId === placementId) {
        console.log("Socket event: placement sub-feature update", data);
        // Refetch placement data to get updated follow-ups/documents
        placementService.getPlacementById(placementId).then((response) => {
          if (response.success && response.data) {
            setPlacement(response.data);
          }
        });
      }
    };

    socket.on("placement:updated", handlePlacementUpdate);
    socket.on("placement:followup:created", handleSubFeatureUpdate);
    socket.on("placement:followup:completed", handleSubFeatureUpdate);
    socket.on("placement:followup:deleted", handleSubFeatureUpdate);
    socket.on("placement:document:uploaded", handleSubFeatureUpdate);
    socket.on("placement:document:deleted", handleSubFeatureUpdate);
    socket.on("family-contact:created", handleSubFeatureUpdate);
    socket.on("family-contact:updated", handleSubFeatureUpdate);
    socket.on("family-contact:deleted", handleSubFeatureUpdate);

    return () => {
      socket.off("placement:updated", handlePlacementUpdate);
      socket.off("placement:followup:created", handleSubFeatureUpdate);
      socket.off("placement:followup:completed", handleSubFeatureUpdate);
      socket.off("placement:followup:deleted", handleSubFeatureUpdate);
      socket.off("placement:document:uploaded", handleSubFeatureUpdate);
      socket.off("placement:document:deleted", handleSubFeatureUpdate);
      socket.off("family-contact:created", handleSubFeatureUpdate);
      socket.off("family-contact:updated", handleSubFeatureUpdate);
      socket.off("family-contact:deleted", handleSubFeatureUpdate);
    };
  }, [socket, placementId]);

  // Fetch packet access logs when placement is loaded (Provider only)
  useEffect(() => {
    if (placement?.id && canManagePlacement) {
      fetchPacketAccessLogs();
    }
  }, [placement?.id, canManagePlacement]);

  const fetchPacketAccessLogs = async () => {
    if (!placementId) return;

    try {
      setIsLoadingLogs(true);
      const response = await placementService.getPacketAccessLogs(placementId);
      if (response.success && response.data) {
        setPacketAccessLogs(response.data);
      }
    } catch (err) {
      console.error("Error fetching packet access logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleGeneratePacket = async () => {
    if (!placementId) return;

    setIsGeneratingPacket(true);
    try {
      const response = await placementService.generatePacket(placementId);
      if (response.success && response.data) {
        toast.success("Placement packet generated successfully");
        
        // Automatically download the packet
        const { packetUrl } = response.data;
        if (packetUrl) {
          const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${packetUrl}`;
          window.open(downloadUrl, "_blank");
        }

        // Refresh placement data
        const placementResponse = await placementService.getPlacementById(
          placementId
        );
        if (placementResponse.success && placementResponse.data) {
          setPlacement(placementResponse.data);
        }
        // Refresh access logs if provider
        if (canManagePlacement) {
          await fetchPacketAccessLogs();
        }
      } else {
        toast.error(response.message || "Failed to generate packet");
      }
    } catch (err) {
      console.error("Error generating packet:", err);
      toast.error("Failed to generate placement packet");
    } finally {
      setIsGeneratingPacket(false);
    }
  };

  const handleDownloadPacket = () => {
    if (placement?.packetUrl && placementId) {
      // packetUrl contains the access token, construct the download URL
      const downloadUrl = `/api/placements/${placementId}/packet/download?token=${placement.packetUrl}`;
      window.open(downloadUrl, "_blank");
    } else {
      toast.error("No packet available. Please generate a packet first.");
    }
  };

  const getResidentDisplay = (placement: Placement | null) => {
    if (!placement) {
      return "Placement";
    }

    if (placement.referral) {
      const initials = placement.referral.clientInitials;
      const age = placement.referral.clientAge;
      return `${initials} (Age ${age})`;
    }

    if (placement.dischargeCase) {
      const initials = placement.dischargeCase.patientInitials;
      const age = placement.dischargeCase.patientAge;
      return `${initials} (Age ${age})`;
    }

    if (placement.opening?.home?.name) {
      return placement.opening.home.name;
    }

    return "Placement";
  };

  const getPlacementIdentifier = (placement: Placement | null) => {
    if (!placement) {
      return "";
    }

    return (
      placement.referral?.referralNumber ||
      placement.dischargeCase?.caseNumber ||
      placement.id
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading placement...</p>
        </div>
      </div>
    );
  }

  if (error || !placement) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(backUrl)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">
                {error || "Placement not found"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = PLACEMENT_STATUS_CONFIG[placement.status];
  const residentDisplay = getResidentDisplay(placement);
  const placementIdentifier = getPlacementIdentifier(placement);

  const locationPreference = placement.referral?.preferredCities?.length
    ? placement.referral.preferredCities.join(", ")
    : placement.referral?.preferredCounties?.length
      ? placement.referral.preferredCounties.join(", ")
      : placement.opening?.home
        ? `${placement.opening.home.city}, ${placement.opening.home.state}`
        : "Not specified";

  const careNeedsList = placement.referral?.servicesNeeded?.length
    ? placement.referral.servicesNeeded
    : placement.referral?.careLevels?.length
      ? placement.referral.careLevels
      : placement.dischargeCase?.diagnosisCodes?.length
        ? placement.dischargeCase.diagnosisCodes
        : placement.opening?.careLevels?.length
          ? placement.opening.careLevels
          : [];

  const careNeedsText =
    Array.isArray(careNeedsList) && careNeedsList.length > 0
      ? careNeedsList.join(", ")
      : "Not specified";

  const timeline = placement.timeline ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backUrl)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{residentDisplay}</h1>
            <p className="text-muted-foreground">
              Placement #{placementIdentifier}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          {placement.status === PlacementStatus.PENDING && (
            <Badge variant="healthcareWarning" className="gap-1">
              <Clock className="h-3 w-3" />
              Pending response
            </Badge>
          )}
          {placement.status === PlacementStatus.CONFIRMED && (
            <Badge variant="healthcarePrimary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Confirmed
            </Badge>
          )}
          {placement.status === PlacementStatus.CANCELLED && (
            <Badge variant="healthcareError" className="gap-1">
              <XCircle className="h-3 w-3" />
              Cancelled
            </Badge>
          )}
        </div>
      </div>

      {/* Placement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="healthcare" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Placement Overview</CardTitle>
            <CardDescription>
              Key details about this placement and resident preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Resident</p>
                  <p className="font-medium text-foreground">
                    {residentDisplay}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Move-In Date
                  </p>
                  <p className="font-medium text-foreground">
                    {placement.moveInDate
                      ? format(new Date(placement.moveInDate), "MMM dd, yyyy")
                      : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Preferred Location
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {locationPreference}
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Care Needs
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {careNeedsText}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Placement Actions</CardTitle>
            <CardDescription>Manage this placement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Packet Generation Section - Available to all who can view */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Placement Packet</h4>
              {!placement.packetGeneratedAt ? (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleGeneratePacket}
                  disabled={isGeneratingPacket}
                >
                  {isGeneratingPacket ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Packet
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground mb-2">
                    Generated:{" "}
                    {format(
                      new Date(placement.packetGeneratedAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </div>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleDownloadPacket}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Packet
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleGeneratePacket}
                    disabled={isGeneratingPacket}
                  >
                    {isGeneratingPacket ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Packet
                      </>
                    )}
                  </Button>
                  {canManagePlacement && (
                    <Button
                      className="w-full justify-start"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAccessLogs(true)}
                    >
                      <History className="h-4 w-4 mr-2" />
                      View Access Logs ({packetAccessLogs.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Documents Widget - Only for Provider */}
        {placementId && canManagePlacement && <ExpiringDocumentsWidget placementId={placementId} />}
      </div>

      <Separator />

      {/* Tabbed Interface for Post-Placement Features */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Placement Information</CardTitle>
              <CardDescription>
                Detailed information about this placement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Placement Date</p>
                    <p className="font-medium">
                      {placement.placementDate
                        ? format(new Date(placement.placementDate), "MMM dd, yyyy")
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Move-In Date</p>
                    <p className="font-medium">
                      {placement.moveInDate
                        ? format(new Date(placement.moveInDate), "MMM dd, yyyy")
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground mb-2">Status</p>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups" className="mt-6">
          <FollowUpsTab placementId={placement.id} readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab placementId={placement.id} readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="family" className="mt-6">
          <FamilyTab placementId={placement.id} readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="updates" className="mt-6">
          <UpdatesTab placementId={placement.id} readOnly={isReadOnly} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Placement Timeline</CardTitle>
              <CardDescription>
                Key events and follow-ups associated with this placement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-2 border-primary/20 pl-6 space-y-6">
                {timeline.length > 0 ? (
                  timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[1.45rem] top-1">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                      </div>
                      <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-foreground">
                            {event.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.date), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {event.description}
                          </p>
                        )}
                        {event.assignedTo && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            Assigned to: {event.assignedTo}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No timeline events recorded yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Packet Access Logs Dialog */}
      <Dialog open={showAccessLogs} onOpenChange={setShowAccessLogs}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Packet Access Logs</DialogTitle>
            <DialogDescription>
              View who has accessed the placement packet and when
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : packetAccessLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No access logs found yet.</p>
                <p className="text-sm mt-1">
                  Access logs will appear here when the packet is downloaded.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {packetAccessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border border-border rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          User ID: {log.accessedBy}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.accessedAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    {log.ipAddress && (
                      <div className="text-xs text-muted-foreground">
                        IP: {log.ipAddress}
                      </div>
                    )}
                    {log.userAgent && (
                      <div className="text-xs text-muted-foreground truncate">
                        {log.userAgent}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
