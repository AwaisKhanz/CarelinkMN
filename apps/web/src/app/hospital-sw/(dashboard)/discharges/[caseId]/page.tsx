"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Loader2,
  Calendar,
  MapPin,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Search,
  Package,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { usePageMetadata } from "../../use-page-metadata";
import { dischargeCaseService, DischargeCase, placementService, Placement } from "@/lib/api";
import { toast } from "sonner";
import {
  DischargeStatus,
  DischargeChecklist,
  InviteResponse,
} from "@carelink/types";
import { format as formatDate } from "date-fns";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { LoadingState, ErrorState } from "@/components/shared";
import {
  HospitalSWDetailHeader,
  TransportBookingCard,
  ConsentCard,
} from "@/components/hospital-sw";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { providerService } from "@/lib/api/services/provider.service";
import {
  PAYER_LABELS,
  getDischargeStatusLabel,
  getMobilityStatusLabel,
  getCognitiveStatusLabel,
  getBehavioralConcernLabel,
  getHospitalLocationLabel,
  getTransportTypeLabel,
  getGenderLabel,
  getDMENeedLabel,
} from "@/lib/constants";
import {
  getDischargeStatusBadgeConfig,
  formatCaseNumber,
  getPatientDisplayName,
  calculateHoursUntilInvitationExpiry,
  getInvitationExpiryStatus,
  getInviteResponseBadgeConfig,
} from "@/lib/utils/hospital-sw";
import {
  useDischargeCase,
  useDischargeCaseInvitations,
  useDischargeChecklist,
} from "@/hooks/use-hospital-sw-data";
import { PlacementsTab } from "./components/placements-tab";
import { CreatePlacementDialog } from "@/components/placements/create-placement-dialog";

function DischargeCaseDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const caseId = params.caseId as string;
  const { hasCapability } = useRolePermissions();
  const canViewDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW
  );
  const canUpdateDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_UPDATE
  );
  const canDeleteDischarges = hasCapability(
    HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_DELETE
  );
  const canSendInvitations = hasCapability(
    HOSPITAL_SW_CAPABILITIES.PROVIDER_INVITATIONS_SEND
  );
  const canUseAIMatching = hasCapability(
    HOSPITAL_SW_CAPABILITIES.AI_MATCHING_USE
  );
  const canManageChecklist = hasCapability(
    HOSPITAL_SW_CAPABILITIES.CHECKLISTS_MANAGE
  );
  const canManageNEMT = hasCapability(
    HOSPITAL_SW_CAPABILITIES.NEMT_BOOKING_MANAGE
  );
  const canManageConsent = hasCapability(
    HOSPITAL_SW_CAPABILITIES.CONSENT_MANAGE
  );

  // Use shared hooks for data fetching
  const {
    case: dischargeCase,
    isLoading,
    error: caseError,
    refetch: refetchCase,
  } = useDischargeCase(caseId);
  const {
    invitations,
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations,
  } = useDischargeCaseInvitations(caseId);
  const {
    checklist,
    isLoading: isLoadingChecklist,
    refetch: refetchChecklist,
  } = useDischargeChecklist(caseId);

  // Fetch placements for this discharge case
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isLoadingPlacements, setIsLoadingPlacements] = useState(false);
  const [createPlacementDialogOpen, setCreatePlacementDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchPlacements = async () => {
    setIsLoadingPlacements(true);
    try {
      const response = await placementService.getPlacements({
        dischargeCaseId: caseId,
        page: 1,
        limit: 50,
      });
      if (response.success && response.data) {
        setPlacements(response.data.placements || []);
      }
    } catch (err) {
      console.error("Error fetching placements:", err);
    } finally {
      setIsLoadingPlacements(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchPlacements();
    }
  }, [caseId]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;

    const handleInvitationResponse = (data: any) => {
      if (data.dischargeCaseId === caseId) {
        console.log("Socket event: discharge-invitation:responded", data);
        refetchInvitations();
        toast.info(`Provider responded: ${data.response}`);
      }
    };

    const handleTransportUpdate = (data: any) => {
      if (data.dischargeCaseId === caseId) {
        console.log("Socket event: transport update", data);
        refetchCase();
        toast.info("Transport booking updated");
      }
    };

    const handleConsentCaptured = (data: any) => {
      if (data.dischargeCaseId === caseId) {
        console.log("Socket event: consent captured", data);
        refetchCase();
        toast.info("Consent captured");
      }
    };

    const handlePlacementCreated = (data: any) => {
      if (data.dischargeCaseId === caseId) {
        console.log("Socket event: placement created", data);
        fetchPlacements();
        refetchCase();
        toast.info("Placement created");
      }
    };

    socket.on("discharge-invitation:responded", handleInvitationResponse);
    socket.on("transport:booking-created", handleTransportUpdate);
    socket.on("transport:booking-updated", handleTransportUpdate);
    socket.on("consent:captured", handleConsentCaptured);
    socket.on("placement:created", handlePlacementCreated);

    return () => {
      socket.off("discharge-invitation:responded", handleInvitationResponse);
      socket.off("transport:booking-created", handleTransportUpdate);
      socket.off("transport:booking-updated", handleTransportUpdate);
      socket.off("consent:captured", handleConsentCaptured);
      socket.off("placement:created", handlePlacementCreated);
    };
  }, [socket, caseId, refetchInvitations, refetchCase, fetchPlacements]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTriggeringAI, setIsTriggeringAI] = useState(false);
  const [aiMatchingResult, setAiMatchingResult] = useState<{
    explanation: string;
    providers: Array<{
      id: string;
      matchScore: number;
      matchReasons: string[];
    }>;
  } | null>(null);
  const [isUpdatingChecklist, setIsUpdatingChecklist] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchingProviders, setSearchingProviders] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [availableProviders, setAvailableProviders] = useState<
    Array<{
      id: string;
      organization?: { name: string };
      primaryLicenseType?: {
        id: string;
        name: string;
        code?: string;
      };
    }>
  >([]);
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [isSendingInvitations, setIsSendingInvitations] = useState(false);

  // Get status badge config using shared utility - MUST be before conditional returns
  const statusBadgeConfig = useMemo(() => {
    if (!dischargeCase) return null;
    return getDischargeStatusBadgeConfig(dischargeCase.status);
  }, [dischargeCase]);

  // Prepare header actions - MUST be before conditional returns
  const headerActions = useMemo(() => {
    const actions = [];
    if (canUpdateDischarges) {
      actions.push({
        label: "Edit",
        onClick: () => router.push(`/hospital-sw/discharges/${caseId}/edit`),
        variant: "outline" as const,
        icon: <Edit className="h-4 w-4 mr-2" />,
      });
    }
    if (canDeleteDischarges) {
      actions.push({
        label: "Delete",
        onClick: () => setDeleteDialogOpen(true),
        variant: "destructive" as const,
        icon: <Trash2 className="h-4 w-4 mr-2" />,
      });
    }
    return actions;
  }, [canUpdateDischarges, canDeleteDischarges, caseId, router]);

  useEffect(() => {
    if (dischargeCase) {
      setTitle(`Discharge Case ${formatCaseNumber(dischargeCase.caseNumber)}`);
      setDescription(
        `Patient: ${getPatientDisplayName(dischargeCase.patientInitials)} • Age ${dischargeCase.patientAge}`
      );
    }
  }, [dischargeCase, setTitle, setDescription]);

  const handleDelete = async () => {
    if (!dischargeCase) return;

    setIsDeleting(true);
    try {
      const response = await dischargeCaseService.deleteDischargeCase(caseId);
      if (response.success) {
        toast.success("Discharge case deleted successfully");
        router.push("/hospital-sw/discharges");
      } else {
        toast.error(response.message || "Failed to delete discharge case");
      }
    } catch (err) {
      console.error("Error deleting discharge case:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete discharge case"
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleChecklistToggle = async (
    key: keyof DischargeChecklist,
    value: boolean
  ) => {
    if (!checklist || isUpdatingChecklist) return;

    setIsUpdatingChecklist(true);
    try {
      const updateData: Partial<DischargeChecklist> = {
        [key]: value,
      };
      const response = await dischargeCaseService.updateDischargeChecklist(
        caseId,
        updateData
      );
      if (response.success) {
        toast.success("Checklist updated successfully");
        await refetchChecklist();
      } else {
        toast.error(response.message || "Failed to update checklist");
      }
    } catch (err) {
      console.error("Error updating checklist:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update checklist"
      );
    } finally {
      setIsUpdatingChecklist(false);
    }
  };

  const handleSearchProviders = async (search: string) => {
    if (!search || search.length < 2) {
      setAvailableProviders([]);
      return;
    }

    setSearchingProviders(true);
    try {
      const response = await providerService.getProviders({
        search,
        limit: 20,
        page: 1,
      });
      if (response.success && response.data) {
        // Filter out providers already invited
        const invitedProviderIds = new Set(
          invitations.map((inv) => inv.providerId)
        );
        const filtered = response.data.providers.filter(
          (p) => !invitedProviderIds.has(p.id)
        );
        setAvailableProviders(filtered);
      }
    } catch (err) {
      console.error("Error searching providers:", err);
      toast.error("Failed to search providers");
    } finally {
      setSearchingProviders(false);
    }
  };

  const handleToggleProviderSelection = (providerId: string) => {
    setSelectedProviderIds((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleSendInvitations = async () => {
    if (selectedProviderIds.length === 0) {
      toast.error("Please select at least one provider");
      return;
    }

    setIsSendingInvitations(true);
    try {
      const response = await dischargeCaseService.sendProviderInvitations(
        caseId,
        selectedProviderIds
      );
      if (response.success) {
        toast.success(
          `Successfully sent ${selectedProviderIds.length} invitation(s)`
        );
        setInviteDialogOpen(false);
        setSelectedProviderIds([]);
        setProviderSearch("");
        setAvailableProviders([]);
        await refetchInvitations();
      } else {
        toast.error(response.message || "Failed to send invitations");
      }
    } catch (err) {
      console.error("Error sending invitations:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to send invitations"
      );
    } finally {
      setIsSendingInvitations(false);
    }
  };

  const handleTriggerAIMatching = async () => {
    setIsTriggeringAI(true);
    try {
      const response = await dischargeCaseService.triggerAIMatching(caseId);
      if (response.success && response.data) {
        // Store AI matching result to display explanations
        setAiMatchingResult({
          explanation: response.data.explanation || "",
          providers: response.data.providers.map((p) => ({
            id: p.id,
            matchScore: p.matchScore || 0,
            matchReasons: p.matchReasons || [],
          })),
        });
        toast.success(
          `Found ${response.data.providers.length} matching providers`
        );
        // Refresh invitations to show new matches
        await refetchInvitations();
      } else {
        toast.error(response.message || "Failed to trigger AI matching");
      }
    } catch (err) {
      console.error("Error triggering AI matching:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to trigger AI matching"
      );
    } finally {
      setIsTriggeringAI(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingState message="Loading discharge case..." fullHeight />
    );
  }

  if (caseError || !dischargeCase) {
    return (
      <ErrorState
        title="Error Loading Discharge Case"
        message={caseError?.message || "Discharge case not found"}
        action={{
          label: "Retry",
          onClick: refetchCase,
          variant: "healthcare",
        }}
        secondaryAction={{
          label: "Back to Discharge Cases",
          onClick: () => router.push("/hospital-sw/discharges"),
          variant: "outline",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Use shared component */}
      <HospitalSWDetailHeader
        title={`Case ${formatCaseNumber(dischargeCase.caseNumber)}`}
        subtitle={`Patient: ${getPatientDisplayName(dischargeCase.patientInitials)} • Age ${dischargeCase.patientAge}`}
        backPath="/hospital-sw/discharges"
        badges={
          statusBadgeConfig ? (
            <Badge variant={statusBadgeConfig.variant} className="text-sm">
              {statusBadgeConfig.label}
            </Badge>
          ) : undefined
        }
        actionButtons={headerActions}
      />

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invitations">
            Provider Invitations
            {invitations.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {invitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="placements">
            Placements
            {placements.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {placements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Information */}
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Initials</p>
                  <p className="font-medium">
                    {getPatientDisplayName(dischargeCase.patientInitials)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{dischargeCase.patientAge} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">
                    {getGenderLabel(dischargeCase.patientGender)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Diagnosis Codes</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {dischargeCase.diagnosisCodes.map((code, idx) => (
                      <Badge key={idx} variant="outline">
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobility Status</p>
                  <p className="font-medium">
                    {getMobilityStatusLabel(dischargeCase.mobilityStatus)}
                  </p>
                </div>
                {dischargeCase.cognitiveStatus && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cognitive Status</p>
                    <p className="font-medium">
                      {getCognitiveStatusLabel(dischargeCase.cognitiveStatus)}
                    </p>
                  </div>
                )}
                {dischargeCase.behavioralConcerns.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Behavioral Concerns</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dischargeCase.behavioralConcerns.map((concern, idx) => (
                        <Badge key={idx} variant="outline">
                          {getBehavioralConcernLabel(concern)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discharge Planning */}
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Discharge Planning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Location</p>
                  <p className="font-medium">
                    {getHospitalLocationLabel(dischargeCase.currentLocation)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Discharge Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {formatDate(
                        typeof dischargeCase.targetDischargeDate === "string"
                          ? new Date(dischargeCase.targetDischargeDate)
                          : dischargeCase.targetDischargeDate,
                        "MMM d, yyyy"
                      )}
                    </p>
                  </div>
                </div>
                {dischargeCase.actualDischargeDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Discharge Date</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {formatDate(
                          typeof dischargeCase.actualDischargeDate === "string"
                            ? new Date(dischargeCase.actualDischargeDate)
                            : dischargeCase.actualDischargeDate,
                          "MMM d, yyyy"
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Preferences */}
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Location Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dischargeCase.preferredCounties.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Preferred Counties</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dischargeCase.preferredCounties.map((county, idx) => (
                        <Badge key={idx} variant="outline">
                          {county}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {dischargeCase.preferredCities.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Preferred Cities</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dischargeCase.preferredCities.map((city, idx) => (
                        <Badge key={idx} variant="outline">
                          {city}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {dischargeCase.requiresProximity && (
                  <div>
                    <p className="text-sm text-muted-foreground">Proximity Requirement</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {dischargeCase.proximityZipCode && `Zip: ${dischargeCase.proximityZipCode}`}
                        {dischargeCase.maxDistanceMiles && ` • Max ${dischargeCase.maxDistanceMiles} miles`}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insurance & Equipment */}
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Insurance & Equipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Insurance</p>
                  <Badge variant="outline" className="mt-1">
                    {PAYER_LABELS[dischargeCase.primaryInsurance] || dischargeCase.primaryInsurance}
                  </Badge>
                </div>
                {dischargeCase.secondaryInsurance && (
                  <div>
                    <p className="text-sm text-muted-foreground">Secondary Insurance</p>
                    <Badge variant="outline" className="mt-1">
                      {PAYER_LABELS[dischargeCase.secondaryInsurance] || dischargeCase.secondaryInsurance}
                    </Badge>
                  </div>
                )}
                {dischargeCase.dmeNeeds.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">DME Needs</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dischargeCase.dmeNeeds.map((dme, idx) => (
                        <Badge key={idx} variant="outline">
                          {getDMENeedLabel(dme)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Medication Management</p>
                  <p className="font-medium">
                    {dischargeCase.medicationManagement ? "Required" : "Not Required"}
                  </p>
                </div>
                {dischargeCase.needsTransport && (
                  <div>
                    <p className="text-sm text-muted-foreground">Transport</p>
                    <p className="font-medium">
                      {dischargeCase.transportType
                        ? getTransportTypeLabel(dischargeCase.transportType)
                        : "Transport needed"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {canUseAIMatching && (
              <Card variant="healthcare">
                <CardHeader>
                  <CardTitle>AI Matching</CardTitle>
                  <CardDescription>Find matching providers using AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="healthcare"
                    onClick={handleTriggerAIMatching}
                    disabled={isTriggeringAI}
                    className="w-full"
                  >
                    {isTriggeringAI ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Matching...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Trigger AI Matching
                      </>
                    )}
                  </Button>
                  {aiMatchingResult && aiMatchingResult.explanation && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <h4 className="font-medium mb-2">Why These Matches</h4>
                      <p className="text-sm text-muted-foreground">
                        {aiMatchingResult.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card variant="healthcare">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Provider Invitations</CardTitle>
                  <CardDescription>
                    Providers invited to respond to this discharge case
                  </CardDescription>
                </div>
                {canSendInvitations && (
                  <Button
                    variant="healthcare"
                    size="sm"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Invite Providers
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInvitations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No provider invitations yet</p>
                  {canSendInvitations && (
                    <p className="text-sm mt-2">
                      Use AI matching or manually invite providers
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => {
                    const expiresAt =
                      typeof invitation.expiresAt === "string"
                        ? invitation.expiresAt
                        : invitation.expiresAt.toISOString();
                    const expiryStatus = getInvitationExpiryStatus(expiresAt);
                    const hoursUntilExpiry = calculateHoursUntilInvitationExpiry(expiresAt);
                    const aiMatchInfo = aiMatchingResult?.providers.find(
                      (p) => p.id === invitation.providerId
                    );
                    const responseBadgeConfig = invitation.response
                      ? getInviteResponseBadgeConfig(invitation.response)
                      : null;

                    return (
                      <Card key={invitation.id} variant="healthcare">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">
                                  {invitation.provider?.organization?.name || "Provider"}
                                </h4>
                                {aiMatchInfo && (
                                  <Badge variant="outline" className="text-xs">
                                    Match Score: {aiMatchInfo.matchScore}%
                                  </Badge>
                                )}
                              </div>
                              {invitation.provider?.homes &&
                                invitation.provider.homes.length > 0 && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {invitation.provider.homes.map((h) => h.name).join(", ")}
                                  </p>
                                )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>
                                  Invited:{" "}
                                  {formatDate(
                                    typeof invitation.invitedAt === "string"
                                      ? new Date(invitation.invitedAt)
                                      : invitation.invitedAt,
                                    "MMM d, yyyy 'at' h:mm a"
                                  )}
                                </span>
                                {!invitation.respondedAt && (
                                  <span>
                                    Expires:{" "}
                                    {hoursUntilExpiry > 0
                                      ? `${hoursUntilExpiry}h remaining`
                                      : "Expired"}
                                  </span>
                                )}
                                {invitation.respondedAt && (
                                  <span>
                                    Responded:{" "}
                                    {formatDate(
                                      typeof invitation.respondedAt === "string"
                                        ? new Date(invitation.respondedAt)
                                        : invitation.respondedAt,
                                      "MMM d, yyyy 'at' h:mm a"
                                    )}
                                  </span>
                                )}
                              </div>
                              {aiMatchInfo && aiMatchInfo.matchReasons.length > 0 && (
                                <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/10">
                                  <p className="text-xs font-medium mb-2">Why This Match:</p>
                                  <ul className="text-xs text-muted-foreground space-y-1">
                                    {aiMatchInfo.matchReasons.map((reason, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {invitation.responseNotes && (
                                <div className="mt-3 p-3 bg-muted rounded-md">
                                  <p className="text-xs font-medium mb-1">Response Notes:</p>
                                  <p className="text-sm text-muted-foreground">
                                    {invitation.responseNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {responseBadgeConfig ? (
                                <Badge variant={responseBadgeConfig.variant}>
                                  {responseBadgeConfig.label}
                                </Badge>
                              ) : invitation.respondedAt ? (
                                <Badge variant="healthcareSuccess">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Responded
                                </Badge>
                              ) : (
                                <>
                                  {expiryStatus === "expired" && (
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
                                  {expiryStatus === "active" && (
                                    <Badge variant="healthcareWarning">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pending
                                    </Badge>
                                  )}
                                </>
                              )}
                              
                              {/* Create Placement Button - Moved to Placements tab */}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placements Tab */}
        <TabsContent value="placements" className="space-y-4">
          <PlacementsTab
            dischargeCaseId={caseId}
            placements={placements}
            isLoading={isLoadingPlacements}
            onCreatePlacement={() => setCreatePlacementDialogOpen(true)}
          />
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Discharge Checklist</CardTitle>
              <CardDescription>
                Track progress through the discharge process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingChecklist ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !checklist ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Checklist not yet created</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pre-discharge */}
                  <div>
                    <h4 className="font-medium mb-3">Pre-Discharge</h4>
                    <div className="space-y-2">
                      {[
                        { key: "consentObtained", label: "Consent Obtained" },
                        { key: "insuranceVerified", label: "Insurance Verified" },
                        { key: "medsReconciled", label: "Medications Reconciled" },
                        { key: "equipmentOrdered", label: "Equipment Ordered" },
                        { key: "transportArranged", label: "Transport Arranged" },
                      ].map((item) => {
                        const key = item.key as keyof Pick<DischargeChecklist, "consentObtained" | "insuranceVerified" | "medsReconciled" | "equipmentOrdered" | "transportArranged">;
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 ${
                              canManageChecklist
                                ? "cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                : ""
                            }`}
                            onClick={
                              canManageChecklist
                                ? () => handleChecklistToggle(key, !checklist[key])
                                : undefined
                            }
                          >
                            {checklist[key] ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span>{item.label}</span>
                            {isUpdatingChecklist && (
                              <Loader2 className="h-4 w-4 ml-auto animate-spin text-primary" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* During discharge */}
                  <div>
                    <h4 className="font-medium mb-3">During Discharge</h4>
                    <div className="space-y-2">
                      {[
                        { key: "patientEducated", label: "Patient Educated" },
                        { key: "documentsSent", label: "Documents Sent" },
                        { key: "followUpScheduled", label: "Follow-up Scheduled" },
                      ].map((item) => {
                        const key = item.key as keyof Pick<DischargeChecklist, "patientEducated" | "documentsSent" | "followUpScheduled">;
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 ${
                              canManageChecklist
                                ? "cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                : ""
                            }`}
                            onClick={
                              canManageChecklist
                                ? () => handleChecklistToggle(key, !checklist[key])
                                : undefined
                            }
                          >
                            {checklist[key] ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span>{item.label}</span>
                            {isUpdatingChecklist && (
                              <Loader2 className="h-4 w-4 ml-auto animate-spin text-primary" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Post-discharge */}
                  <div>
                    <h4 className="font-medium mb-3">Post-Discharge</h4>
                    <div className="space-y-2">
                      {[
                        { key: "day1Contact", label: "Day 1 Contact" },
                        { key: "day2Contact", label: "Day 2 Contact" },
                        { key: "day7Contact", label: "Day 7 Contact" },
                        { key: "day30Contact", label: "Day 30 Contact" },
                      ].map((item) => {
                        const key = item.key as keyof Pick<DischargeChecklist, "day1Contact" | "day2Contact" | "day7Contact" | "day30Contact">;
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 ${
                              canManageChecklist
                                ? "cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                : ""
                            }`}
                            onClick={
                              canManageChecklist
                                ? () => handleChecklistToggle(key, !checklist[key])
                                : undefined
                            }
                          >
                            {checklist[key] ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span>{item.label}</span>
                            {isUpdatingChecklist && (
                              <Loader2 className="h-4 w-4 ml-auto animate-spin text-primary" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transport Tab */}
        <TabsContent value="transport" className="space-y-4">
          <TransportBookingCard caseId={caseId} canManage={canManageNEMT} />
        </TabsContent>

        {/* Consent Tab */}
        <TabsContent value="consent" className="space-y-4">
          <ConsentCard caseId={caseId} canManage={canManageConsent} />
        </TabsContent>
      </Tabs>

      {/* Provider Invitation Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Providers</DialogTitle>
            <DialogDescription>
              Search and select providers to invite for this discharge case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search providers by name..."
                  value={providerSearch}
                  onChange={(e) => {
                    setProviderSearch(e.target.value);
                    handleSearchProviders(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            {searchingProviders && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {!searchingProviders && availableProviders.length > 0 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-4">
                {availableProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                    onClick={() => handleToggleProviderSelection(provider.id)}
                  >
                    <Checkbox
                      checked={selectedProviderIds.includes(provider.id)}
                      onCheckedChange={() =>
                        handleToggleProviderSelection(provider.id)
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {provider.organization?.name || "Unknown Provider"}
                      </p>
                      {provider.primaryLicenseType && (
                        <p className="text-sm text-muted-foreground">
                          {provider.primaryLicenseType.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!searchingProviders &&
              providerSearch.length >= 2 &&
              availableProviders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No providers found</p>
              </div>
            )}
            {selectedProviderIds.length > 0 && (
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-sm font-medium">
                  {selectedProviderIds.length} provider(s) selected
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteDialogOpen(false);
                setSelectedProviderIds([]);
                setProviderSearch("");
                setAvailableProviders([]);
              }}
              disabled={isSendingInvitations}
            >
              Cancel
            </Button>
            <Button
              variant="healthcare"
              onClick={handleSendInvitations}
              disabled={isSendingInvitations || selectedProviderIds.length === 0}
            >
              {isSendingInvitations ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitations ({selectedProviderIds.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discharge Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete case {dischargeCase.caseNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Create Placement Dialog */}
      <CreatePlacementDialog
        open={createPlacementDialogOpen}
        onOpenChange={setCreatePlacementDialogOpen}
        dischargeCaseId={caseId}
        candidates={invitations
          .filter(inv => inv.response === InviteResponse.ACCEPTED)
          .map(inv => ({
            providerId: inv.providerId,
            providerName: inv.provider?.organization?.name || "Unknown Provider",
            status: inv.response || "",
            respondedAt: inv.respondedAt,
            responseNotes: inv.responseNotes
          }))}
        onSuccess={() => {
          fetchPlacements();
          refetchInvitations();
        }}
        userRole="HOSPITAL_SW"
      />
    </div>
  );
}

export default function DischargeCaseDetailPage() {
  return (
    <RequirePermission
      permission={HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW}
      title="Access Restricted"
      description="You don't have permission to view discharge case details."
    >
      <DischargeCaseDetailPageContent />
    </RequirePermission>
  );
}

