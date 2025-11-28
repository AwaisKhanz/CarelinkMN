"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/contexts/socket-context";
import { usePageMetadata } from "../../use-page-metadata";
import {
  referralService,
  messagingService,
  placementService,
  Referral,
  ReferralShortlist,
} from "@/lib/api";
import type { MessageThread, Placement } from "@carelink/types";
import { toast } from "sonner";
import { ReferralStatus, ShortlistStatus } from "@carelink/types";
import { LoadingState, ErrorState } from "@/components/shared";
import {
  ReferralHeader,
  ClientInfoCard,
  CareNeedsCard,
  LocationPreferencesCard,
  PayerInfoCard,
  InternalNotesCard,
  QuickActionsCard,
  TimelineCard,
  ReferralActionsMenu,
  ShortlistTab,
  MessagesTab,
  PlacementsTab,
  StatusUpdateDialog,
  BatchMessageDialog,
  DeleteReferralDialog,
  AssignmentDialog,
} from "./components";
import { CreatePlacementDialog } from "@/components/placements/create-placement-dialog";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";

function ReferralDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const referralId = params.referralId as string;
  const {
    canUpdateReferrals,
    canDeleteReferrals,
    canBatchOutreach,
    canAssignReferrals,
    hasCapability,
  } = useRolePermissions();
  const canManageShortlist = hasCapability(CASE_MANAGER_CAPABILITIES.SHORTLIST_MANAGE);

  const [referral, setReferral] = useState<Referral | null>(null);
  const [shortlist, setShortlist] = useState<ReferralShortlist[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShortlist, setIsLoadingShortlist] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingPlacements, setIsLoadingPlacements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ReferralStatus | "">("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [batchMessageDialogOpen, setBatchMessageDialogOpen] = useState(false);
  const [batchMessageContent, setBatchMessageContent] = useState("");
  const [isSendingBatchMessage, setIsSendingBatchMessage] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [createPlacementDialogOpen, setCreatePlacementDialogOpen] = useState(false);

  useEffect(() => {
    if (referral) {
      setTitle(`Referral ${referral.referralNumber}`);
      setDescription(
        `Client: ${referral.clientInitials} • Age ${referral.clientAge}`
      );
    }
  }, [referral, setTitle, setDescription]);

  useEffect(() => {
    if (referralId) {
      fetchReferralData();
      fetchShortlist();
      fetchThreads();
      fetchPlacements();
    }
  }, [referralId]);

  // Listen for real-time updates
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !referralId) return;

    const handleReferralUpdate = (data: any) => {
      if (data.referralId === referralId) {
        console.log("Socket event: referral updated", data);
        fetchReferralData();
        fetchShortlist();
        toast.info("Referral updated");
      }
    };

    const handlePlacementUpdate = (data: any) => {
      if (data.referralId === referralId) {
        console.log("Socket event: placement update", data);
        fetchPlacements();
        toast.info("Placement updated");
      }
    };

    socket.on("referral:updated", handleReferralUpdate);
    socket.on("placement:created", handlePlacementUpdate);
    socket.on("placement:updated", handlePlacementUpdate);

    return () => {
      socket.off("referral:updated", handleReferralUpdate);
      socket.off("placement:created", handlePlacementUpdate);
      socket.off("placement:updated", handlePlacementUpdate);
    };
  }, [socket, referralId]);

  const fetchReferralData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await referralService.getReferralById(referralId);
      if (response.success && response.data) {
        setReferral(response.data);
      } else {
        setError(response.message || "Failed to load referral");
      }
    } catch (err) {
      console.error("Error fetching referral:", err);
      setError(err instanceof Error ? err.message : "Failed to load referral");
      toast.error("Failed to load referral details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShortlist = async () => {
    try {
      setIsLoadingShortlist(true);
      const response = await referralService.getShortlist(referralId);
      if (response.success && response.data) {
        setShortlist(response.data);
      }
    } catch (err) {
      console.error("Error fetching shortlist:", err);
      toast.error("Failed to load shortlist");
    } finally {
      setIsLoadingShortlist(false);
    }
  };

  const fetchThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const response = await messagingService.getThreads({
        referralId,
        page: 1,
        limit: 50,
      });
      if (response.success && response.data) {
        setThreads(response.data.threads);
      }
    } catch (err) {
      console.error("Error fetching threads:", err);
      toast.error("Failed to load messages");
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const fetchPlacements = async () => {
    try {
      setIsLoadingPlacements(true);
      const response = await placementService.getPlacements({
        referralId,
        page: 1,
        limit: 50,
      });
      if (response.success && response.data) {
        setPlacements(response.data.placements || []);
      }
    } catch (err) {
      console.error("Error fetching placements:", err);
      toast.error("Failed to load placements");
    } finally {
      setIsLoadingPlacements(false);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!referral) return;

    setIsDeleting(true);
    try {
      const response = await referralService.deleteReferral(referral.id);
      if (response.success) {
        toast.success("Referral deleted successfully");
        setDeleteDialogOpen(false);
        router.push("/case-manager/referrals");
      } else {
        toast.error(response.message || "Failed to delete referral");
      }
    } catch (err) {
      console.error("Error deleting referral:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete referral"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!referral || !newStatus) return;

    setIsUpdatingStatus(true);
    try {
      const response = await referralService.updateReferral(referral.id, {
        status: newStatus as ReferralStatus,
      });
      if (response.success) {
        toast.success("Referral status updated successfully");
        setStatusUpdateDialogOpen(false);
        setNewStatus("");
        await fetchReferralData();
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRemoveFromShortlist = async (shortlistId: string) => {
    if (!referral) return;

    try {
      const response = await referralService.removeFromShortlist(
        referral.id,
        shortlistId
      );
      if (response.success) {
        toast.success("Provider removed from shortlist");
        await fetchShortlist();
      } else {
        toast.error(response.message || "Failed to remove from shortlist");
      }
    } catch (err) {
      console.error("Error removing from shortlist:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to remove from shortlist"
      );
    }
  };

  const handleUpdateShortlistStatus = async (
    shortlistId: string,
    status: ShortlistStatus
  ) => {
    if (!referral) return;

    try {
      const response = await referralService.updateShortlistStatus(
        referral.id,
        shortlistId,
        { status }
      );
      if (response.success) {
        toast.success("Shortlist status updated");
        await fetchShortlist();
      } else {
        toast.error(response.message || "Failed to update shortlist status");
      }
    } catch (err) {
      console.error("Error updating shortlist status:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update shortlist status"
      );
    }
  };

  const handleAssign = async (assignedToUserId: string, notes?: string) => {
    if (!referral) return;

    setIsAssigning(true);
    try {
      const response = await referralService.assignReferral(
        referral.id,
        assignedToUserId,
        notes
      );
      if (response.success) {
        toast.success("Referral assigned successfully");
        await fetchReferralData();
      } else {
        throw new Error(response.message || "Failed to assign referral");
      }
    } catch (err) {
      console.error("Error assigning referral:", err);
      throw err;
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBatchMessage = async () => {
    if (!referral || shortlist.length === 0) {
      toast.error("No providers in shortlist to message");
      return;
    }

    if (!batchMessageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSendingBatchMessage(true);
    try {
      const providerIds = shortlist.map((s) => s.providerId);
      const response = await referralService.batchMessageProviders({
        referralIds: [referral.id],
        providerIds,
        message: batchMessageContent,
      });
      if (response.success) {
        toast.success("Batch message sent successfully");
        setBatchMessageDialogOpen(false);
        setBatchMessageContent("");
        await fetchThreads();
      } else {
        toast.error(response.message || "Failed to send batch message");
      }
    } catch (err) {
      console.error("Error sending batch message:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to send batch message"
      );
    } finally {
      setIsSendingBatchMessage(false);
    }
  };

  const handleCloseReferral = async () => {
    if (!referral) return;

    setIsUpdatingStatus(true);
    try {
      const response = await referralService.updateReferral(referral.id, {
        status: ReferralStatus.CLOSED,
      });
      if (response.success) {
        toast.success("Referral closed successfully");
        await fetchReferralData();
      } else {
        toast.error(response.message || "Failed to close referral");
      }
    } catch (err) {
      console.error("Error closing referral:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to close referral"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewThread = (threadId: string) => {
    router.push(
      `/case-manager/messages?threadId=${threadId}&referralId=${referralId}`
    );
  };

  // Loading state
  if (isLoading) {
    return <LoadingState message="Loading referral details..." fullHeight />;
  }

  // Error state
  if (error || !referral) {
    return (
      <ErrorState
        title={error ? "Error Loading Referral" : "Referral Not Found"}
        message={error || "The referral you're looking for doesn't exist."}
        action={{
          label: "Retry",
          onClick: fetchReferralData,
          variant: "healthcare",
        }}
        secondaryAction={{
          label: "Back to Referrals",
          onClick: () => router.push("/case-manager/referrals"),
          variant: "outline",
        }}
      />
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {canUpdateReferrals && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/case-manager/referrals/${referral.id}/edit`)
              }
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <ReferralActionsMenu
            referral={referral}
            onUpdateStatus={() => setStatusUpdateDialogOpen(true)}
            onCloseReferral={handleCloseReferral}
            onDelete={handleDelete}
            onAssign={() => setAssignmentDialogOpen(true)}
            canUpdate={canUpdateReferrals}
            canDelete={canDeleteReferrals}
            canAssign={canAssignReferrals}
          />
        </div>
      </div>

      {/* Referral Header */}
      <ReferralHeader referral={referral} shortlistCount={shortlist.length} />

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="overview" className="whitespace-nowrap">
            Overview
          </TabsTrigger>
          <TabsTrigger value="shortlist" className="whitespace-nowrap">
            Shortlist ({shortlist.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="whitespace-nowrap">
            Messages ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="placements" className="whitespace-nowrap">
            Placements ({placements.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <ClientInfoCard referral={referral} />
              <CareNeedsCard referral={referral} />
              <LocationPreferencesCard referral={referral} />
              <PayerInfoCard referral={referral} />
              <InternalNotesCard referral={referral} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <QuickActionsCard
                referral={referral}
                shortlistCount={shortlist.length}
                onBatchMessage={() => setBatchMessageDialogOpen(true)}
                onCreatePlacement={() => setCreatePlacementDialogOpen(true)}
                canManageShortlist={canManageShortlist}
                canBatchMessage={canBatchOutreach}
              />
              <TimelineCard referral={referral} />
            </div>
          </div>
        </TabsContent>

        {/* Shortlist Tab */}
        <TabsContent value="shortlist" className="space-y-6">
          <ShortlistTab
            referralId={referral.id}
            shortlist={shortlist}
            isLoading={isLoadingShortlist}
            onUpdateStatus={handleUpdateShortlistStatus}
            onRemove={handleRemoveFromShortlist}
          />
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <MessagesTab
            referralId={referral.id}
            threads={threads}
            isLoading={isLoadingThreads}
            shortlistCount={shortlist.length}
            onBatchMessage={() => setBatchMessageDialogOpen(true)}
            onViewThread={handleViewThread}
          />
        </TabsContent>

        {/* Placements Tab */}
        <TabsContent value="placements" className="space-y-6">
          <PlacementsTab
            referralId={referral.id}
            placements={placements}
            isLoading={isLoadingPlacements}
            shortlist={shortlist}
            onRefresh={fetchPlacements}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <StatusUpdateDialog
        open={statusUpdateDialogOpen}
        onOpenChange={setStatusUpdateDialogOpen}
        currentStatus={referral.status}
        newStatus={newStatus}
        onStatusChange={setNewStatus}
        onUpdate={handleUpdateStatus}
        isUpdating={isUpdatingStatus}
      />

      <BatchMessageDialog
        open={batchMessageDialogOpen}
        onOpenChange={setBatchMessageDialogOpen}
        message={batchMessageContent}
        onMessageChange={setBatchMessageContent}
        onSend={handleBatchMessage}
        isSending={isSendingBatchMessage}
        recipientCount={shortlist.length}
        referral={referral}
      />

      <DeleteReferralDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        referral={referral}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        referralId={referral.id}
        currentCaseManagerId={referral.caseManagerId}
        onAssign={handleAssign}
        isAssigning={isAssigning}
      />

      <CreatePlacementDialog
        open={createPlacementDialogOpen}
        onOpenChange={setCreatePlacementDialogOpen}
        referralId={referral.id}
        candidates={shortlist.map(s => ({
          providerId: s.providerId,
          providerName: s.provider?.organization?.name || "Unknown Provider",
          status: s.status,
          respondedAt: s.respondedAt,
          responseNotes: s.notes
        }))}
        onSuccess={() => {
          fetchPlacements();
          fetchShortlist();
        }}
        userRole="CASE_MANAGER"
      />
    </div>
  );
}

export default function ReferralDetailPage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.REFERRALS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view referral details."
    >
      <ReferralDetailPageContent />
    </RequirePermission>
  );
}
