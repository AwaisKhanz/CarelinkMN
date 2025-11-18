"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Loader2, Calendar, MapPin, FileText, Users, CheckCircle2, XCircle, Clock, Send } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { usePageMetadata } from "../../use-page-metadata";
import { dischargeCaseService, DischargeCase, DischargeInvitation, DischargeChecklist } from "@/lib/api";
import { toast } from "sonner";
import { DischargeStatus, Payer, Gender } from "@carelink/types";
import { format as formatDate } from "date-fns";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";
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
import { PAYER_LABELS } from "@/lib/constants";

function DischargeCaseDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const caseId = params.caseId as string;
  const { hasCapability } = useRolePermissions();
  const canViewDischarges = hasCapability(HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_VIEW);
  const canUpdateDischarges = hasCapability(HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_UPDATE);
  const canDeleteDischarges = hasCapability(HOSPITAL_SW_CAPABILITIES.DISCHARGE_CASES_DELETE);
  const canSendInvitations = hasCapability(HOSPITAL_SW_CAPABILITIES.PROVIDER_INVITATIONS_SEND);
  const canUseAIMatching = hasCapability(HOSPITAL_SW_CAPABILITIES.AI_MATCHING_USE);
  const canManageChecklist = hasCapability(HOSPITAL_SW_CAPABILITIES.CHECKLISTS_MANAGE);

  const [dischargeCase, setDischargeCase] = useState<DischargeCase | null>(null);
  const [invitations, setInvitations] = useState<DischargeInvitation[]>([]);
  const [checklist, setChecklist] = useState<DischargeChecklist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTriggeringAI, setIsTriggeringAI] = useState(false);

  useEffect(() => {
    if (dischargeCase) {
      setTitle(`Discharge Case ${dischargeCase.caseNumber}`);
      setDescription(
        `Patient: ${dischargeCase.patientInitials} • Age ${dischargeCase.patientAge}`
      );
    }
  }, [dischargeCase, setTitle, setDescription]);

  useEffect(() => {
    if (caseId) {
      fetchDischargeCase();
      fetchInvitations();
      fetchChecklist();
    }
  }, [caseId]);

  const fetchDischargeCase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await dischargeCaseService.getDischargeCaseById(caseId);
      if (response.success && response.data) {
        setDischargeCase(response.data);
      } else {
        setError(response.message || "Failed to load discharge case");
      }
    } catch (err) {
      console.error("Error fetching discharge case:", err);
      setError(err instanceof Error ? err.message : "Failed to load discharge case");
      toast.error("Failed to load discharge case details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setIsLoadingInvitations(true);
      const response = await dischargeCaseService.getDischargeCaseInvitations(caseId);
      if (response.success && response.data) {
        setInvitations(response.data);
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
      toast.error("Failed to load invitations");
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const fetchChecklist = async () => {
    try {
      setIsLoadingChecklist(true);
      const response = await dischargeCaseService.getDischargeChecklist(caseId);
      if (response.success && response.data) {
        setChecklist(response.data);
      }
    } catch (err) {
      console.error("Error fetching checklist:", err);
      // Checklist might not exist yet, that's okay
    } finally {
      setIsLoadingChecklist(false);
    }
  };

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

  const handleTriggerAIMatching = async () => {
    setIsTriggeringAI(true);
    try {
      const response = await dischargeCaseService.triggerAIMatching(caseId);
      if (response.success && response.data) {
        toast.success(`Found ${response.data.providers.length} matching providers`);
        // Refresh invitations to show new matches
        await fetchInvitations();
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

  const getStatusBadgeVariant = (status: DischargeStatus) => {
    switch (status) {
      case DischargeStatus.INTAKE:
        return "default";
      case DischargeStatus.MATCHING:
        return "healthcareInfo";
      case DischargeStatus.INVITES_SENT:
        return "healthcareWarning";
      case DischargeStatus.RESPONSES_PENDING:
        return "healthcareWarning";
      case DischargeStatus.PLACEMENT_CONFIRMED:
        return "healthcareSuccess";
      case DischargeStatus.DISCHARGED:
        return "healthcareSuccess";
      case DischargeStatus.FOLLOW_UP:
        return "default";
      case DischargeStatus.COMPLETED:
        return "healthcareSuccess";
      case DischargeStatus.CANCELLED:
        return "destructive";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading discharge case...</p>
      </div>
    );
  }

  if (error || !dischargeCase) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/hospital-sw/discharges")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discharge Cases
        </Button>
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p className="font-medium">Error Loading Discharge Case</p>
              <p className="text-sm mt-1">{error || "Discharge case not found"}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDischargeCase}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/hospital-sw/discharges")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Case {dischargeCase.caseNumber}</h1>
            <p className="text-muted-foreground mt-1">
              Patient: {dischargeCase.patientInitials} • Age {dischargeCase.patientAge}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={getStatusBadgeVariant(dischargeCase.status)}
            className="text-sm"
          >
            {dischargeCase.status.replace(/_/g, " ")}
          </Badge>
          {canUpdateDischarges && (
            <Button
              variant="outline"
              onClick={() => router.push(`/hospital-sw/discharges/${caseId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDeleteDischarges && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

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
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
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
                  <p className="font-medium">{dischargeCase.patientInitials}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{dischargeCase.patientAge} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{dischargeCase.patientGender}</p>
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
                  <p className="font-medium">{dischargeCase.mobilityStatus}</p>
                </div>
                {dischargeCase.cognitiveStatus && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cognitive Status</p>
                    <p className="font-medium">{dischargeCase.cognitiveStatus}</p>
                  </div>
                )}
                {dischargeCase.behavioralConcerns.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Behavioral Concerns</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dischargeCase.behavioralConcerns.map((concern, idx) => (
                        <Badge key={idx} variant="outline">
                          {concern}
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
                  <p className="font-medium">{dischargeCase.currentLocation}</p>
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
                          {dme}
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
                      {dischargeCase.transportType || "Transport needed"}
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
                <CardContent>
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
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Provider Invitations</CardTitle>
              <CardDescription>
                Providers invited to respond to this discharge case
              </CardDescription>
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
                  {invitations.map((invitation) => (
                    <Card key={invitation.id} variant="healthcare">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {invitation.provider?.organization?.name || "Provider"}
                            </h4>
                            {invitation.provider?.homes && invitation.provider.homes.length > 0 && (
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
                                  "MMM d, yyyy"
                                )}
                              </span>
                              {invitation.respondedAt && (
                                <span>
                                  Responded:{" "}
                                  {formatDate(
                                    typeof invitation.respondedAt === "string"
                                      ? new Date(invitation.respondedAt)
                                      : invitation.respondedAt,
                                    "MMM d, yyyy"
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            {invitation.respondedAt ? (
                              <Badge variant="healthcareSuccess">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Responded
                              </Badge>
                            ) : (
                              <Badge variant="healthcareWarning">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                          {checklist[item.key as keyof DischargeChecklist] ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
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
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                          {checklist[item.key as keyof DischargeChecklist] ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
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
                      ].map((item) => (
                        <div key={item.key} className="flex items-center gap-2">
                          {checklist[item.key as keyof DischargeChecklist] ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

