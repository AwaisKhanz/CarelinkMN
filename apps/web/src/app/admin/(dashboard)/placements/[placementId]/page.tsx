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
  Loader2,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";
import { placementService, Placement, PlacementStatus } from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYSTEM_CAPABILITIES } from "@/lib/permissions/capabilities";
import { PLACEMENT_STATUS_CONFIG } from "@/lib/constants";
import { RequirePermission } from "@/components/auth/require-permission";
import { LoadingState, ErrorState } from "@/components/shared";

// Reuse components from provider dashboard
import { FollowUpsTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/follow-ups-tab";
import { DocumentsTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/documents-tab";
import { FamilyTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/family-tab";
import { UpdatesTab } from "@/app/provider/(dashboard)/placements/[placementId]/components/updates-tab";

function AdminPlacementDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const placementId = params?.placementId as string | undefined;

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

  const handleDownloadPacket = () => {
    if (placement?.packetUrl && placementId) {
      const downloadUrl = `/api/placements/${placementId}/packet/download?token=${placement.packetUrl}`;
      window.open(downloadUrl, "_blank");
    } else {
      toast.error("No packet available.");
    }
  };

  const handleGeneratePacket = async () => {
    if (!placementId) return;

    try {
      setIsGeneratingPacket(true);
      const response = await placementService.generatePacket(placementId);

      if (response.success && response.data) {
        toast.success("Placement packet generated successfully");
        // Refresh placement data to get the new packet URL
        const refreshResponse = await placementService.getPlacementById(placementId);
        if (refreshResponse.success && refreshResponse.data) {
          setPlacement(refreshResponse.data);
        }
      } else {
        toast.error(response.message || "Failed to generate packet");
      }
    } catch (error) {
      console.error("Error generating packet:", error);
      toast.error("Failed to generate placement packet");
    } finally {
      setIsGeneratingPacket(false);
    }
  };

  const handleStatusUpdate = async (newStatus: PlacementStatus) => {
    if (!placementId || !placement) return;

    try {
      setIsUpdatingStatus(true);
      const response = await placementService.updatePlacement(placementId, {
        status: newStatus,
      });

      if (response.success && response.data) {
        toast.success(`Placement status updated to ${PLACEMENT_STATUS_CONFIG[newStatus].label}`);
        setPlacement(response.data);
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update placement status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading placement details..." fullHeight />;
  }

  if (error || !placement) {
    return (
      <ErrorState
        title="Error Loading Placement"
        message={error || "Placement not found"}
        action={{
          label: "Back to Placements",
          onClick: () => router.push("/admin/placements"),
          variant: "healthcare",
        }}
      />
    );
  }

  const statusConfig = PLACEMENT_STATUS_CONFIG[placement.status] || PLACEMENT_STATUS_CONFIG.PENDING;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Placement Details</h1>
            <p className="text-muted-foreground">
              Administrative view of placement information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {placement.packetUrl ? (
            <Button variant="outline" onClick={handleDownloadPacket}>
              <Download className="h-4 w-4 mr-2" />
              Download Packet
            </Button>
          ) : (
            <Button
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
          )}
          <Select
            value={placement.status}
            onValueChange={(value) => handleStatusUpdate(value as PlacementStatus)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLACEMENT_STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Source Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Source Information</CardTitle>
          <CardDescription>
            Origin of this placement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Source Type</p>
              <p className="font-medium">
                {placement.referralId && "Referral"}
                {placement.dischargeCaseId && "Discharge Case"}
                {!placement.referralId && !placement.dischargeCaseId && "Direct"}
              </p>
            </div>
            {placement.referral && (
              <>
                <div>
                  <p className="text-muted-foreground">Client Initials</p>
                  <p className="font-medium">{placement.referral.clientInitials}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Client Age</p>
                  <p className="font-medium">{placement.referral.clientAge} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Referral Number</p>
                  <p className="font-medium">{placement.referral.referralNumber}</p>
                </div>
              </>
            )}
            {placement.dischargeCase && (
              <>
                <div>
                  <p className="text-muted-foreground">Patient Initials</p>
                  <p className="font-medium">{placement.dischargeCase.patientInitials}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patient Age</p>
                  <p className="font-medium">{placement.dischargeCase.patientAge} years</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Case Number</p>
                  <p className="font-medium">{placement.dischargeCase.caseNumber}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider & Home Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Provider Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Organization</p>
              <p className="font-medium">
                {placement.provider?.organization?.name || "Unknown Provider"}
              </p>
            </div>
            {placement.opening?.home && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Home</p>
                  <p className="font-medium">{placement.opening.home.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {placement.opening.home.addressLine1}
                      <br />
                      {placement.opening.home.city}, {placement.opening.home.state}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Placement Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Placement Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {placement.placementDate
                    ? format(new Date(placement.placementDate), "MMMM dd, yyyy")
                    : "Not set"}
                </p>
              </div>
            </div>
            {placement.moveInDate && (
              <div>
                <p className="text-sm text-muted-foreground">Move-In Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {format(new Date(placement.moveInDate), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}
            {placement.confirmedAt && (
              <div>
                <p className="text-sm text-muted-foreground">Confirmed At</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {format(new Date(placement.confirmedAt), "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {format(new Date(placement.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
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
                <div>
                  <p className="text-muted-foreground mb-2">Status</p>
                  <Badge variant={statusConfig.variant as any}>{statusConfig.label}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">IDs</p>
                  <div className="font-mono text-xs space-y-1">
                    <div>Placement ID: {placement.id}</div>
                    {placement.providerId && <div>Provider ID: {placement.providerId}</div>}
                    {placement.openingId && <div>Opening ID: {placement.openingId}</div>}
                    {placement.referralId && <div>Referral ID: {placement.referralId}</div>}
                    {placement.dischargeCaseId && <div>Discharge Case ID: {placement.dischargeCaseId}</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups" className="mt-6">
          <FollowUpsTab placementId={placement.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab placementId={placement.id} />
        </TabsContent>

        <TabsContent value="family" className="mt-6">
          <FamilyTab placementId={placement.id} />
        </TabsContent>

        <TabsContent value="updates" className="mt-6">
          <UpdatesTab placementId={placement.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPlacementDetailPage() {
  return (
    <RequirePermission
      permission={SYSTEM_CAPABILITIES.SYSTEM_VIEW}
      title="Access Restricted"
      description="You don't have permission to view placement details."
    >
      <AdminPlacementDetailPageContent />
    </RequirePermission>
  );
}
