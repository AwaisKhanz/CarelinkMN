"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2 } from "lucide-react";
import { usePageMetadata } from "../../use-page-metadata";
import { vrsService, type VRSClient } from "@/lib/api";
import { toast } from "sonner";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import {
  VRSLoadingState,
  VRSErrorState,
  VRSDetailHeader,
} from "@/components/vrs";
import {
  ClientDemographicsCard,
  VRSInfoCard,
  PlacementSummaryCard,
  PlacementsTab,
  HistoryTab,
  DeleteClientDialog,
  MatchJobDialog,
} from "./components";
import { getVRSClientStatusBadgeConfig, getClientDisplayName } from "@/lib/utils/vrs";

function VRSClientDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const clientId = params.clientId as string;
  const { hasCapability } = useRolePermissions();
  const canViewClients = hasCapability(VRS_CAPABILITIES.CLIENTS_VIEW);
  const canUpdateClients = hasCapability(VRS_CAPABILITIES.CLIENTS_UPDATE);
  const canDeleteClients = hasCapability(VRS_CAPABILITIES.CLIENTS_DELETE);

  const [client, setClient] = useState<VRSClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [matchJobDialogOpen, setMatchJobDialogOpen] = useState(false);

  // Get status badge config using shared utility - MUST be before conditional returns
  const statusBadgeConfig = useMemo(() => {
    if (!client) return null;
    return getVRSClientStatusBadgeConfig(client.status);
  }, [client]);

  // Prepare header actions - MUST be before conditional returns
  const headerActions = useMemo(() => {
    const actions = [];
    if (canUpdateClients) {
      actions.push({
        label: "Edit",
        onClick: () => router.push(`/vrs/clients/${clientId}/edit`),
        variant: "outline" as const,
        icon: <Edit className="h-4 w-4 mr-2" />,
      });
    }
    if (canDeleteClients) {
      actions.push({
        label: "Delete",
        onClick: () => setDeleteDialogOpen(true),
        variant: "destructive" as const,
        icon: <Trash2 className="h-4 w-4 mr-2" />,
      });
    }
    return actions;
  }, [canUpdateClients, canDeleteClients, clientId, router]);

  const handleMatchSuccess = async () => {
    // Refresh client data to show new placement
    if (clientId) {
      const response = await vrsService.getClientById(clientId);
      if (response.success && response.data) {
        setClient(response.data);
      }
    }
  };

  useEffect(() => {
    const fetchClient = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await vrsService.getClientById(clientId);

        if (response.success && response.data) {
          setClient(response.data);
          setTitle(
            `Client: ${getClientDisplayName(
              response.data.firstName,
              response.data.lastName
            )}`
          );
          setDescription("View client details and placement history");
        } else {
          setError(response.message || "Failed to load client");
          toast.error(response.message || "Failed to load client");
        }
      } catch (err) {
        console.error("Error fetching client:", err);
        setError(err instanceof Error ? err.message : "Failed to load client");
        toast.error("Failed to load client");
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, setTitle, setDescription]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await vrsService.deleteClient(clientId);
      if (response.success) {
        toast.success("Client deleted successfully");
        router.push("/vrs/clients");
      } else {
        toast.error(response.message || "Failed to delete client");
      }
    } catch (err) {
      console.error("Error deleting client:", err);
      toast.error("Failed to delete client");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleViewAllPlacements = () => {
    // Scroll to placements tab
    const placementsTab = document.querySelector('[value="placements"]');
    if (placementsTab) {
      placementsTab.dispatchEvent(new MouseEvent("click"));
    }
  };

  if (isLoading) {
    return <VRSLoadingState message="Loading client details..." />;
  }

  if (error || !client) {
    return (
      <VRSErrorState
        message={error || "Client not found"}
        action={{
          label: "Back to Clients",
          onClick: () => router.push("/vrs/clients"),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <VRSDetailHeader
        title={getClientDisplayName(client.firstName, client.lastName)}
        subtitle={`Client ID: ${client.id.slice(0, 8)}`}
        badge={
          statusBadgeConfig
            ? {
                label: statusBadgeConfig.label,
                variant: statusBadgeConfig.variant || "outline",
              }
            : undefined
        }
        backHref="/vrs/clients"
        actions={headerActions}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ClientDemographicsCard client={client} />
            <VRSInfoCard client={client} />
          </div>

          <PlacementSummaryCard
            client={client}
            onViewAll={handleViewAllPlacements}
            onMatchJob={() => setMatchJobDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <PlacementsTab client={client} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryTab client={client} />
        </TabsContent>
      </Tabs>

      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <MatchJobDialog
        open={matchJobDialogOpen}
        onOpenChange={setMatchJobDialogOpen}
        clientId={clientId}
        clientName={getClientDisplayName(client.firstName, client.lastName)}
        onMatchSuccess={handleMatchSuccess}
      />
    </div>
  );
}

export default function VRSClientDetailPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.CLIENTS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view VRS clients."
    >
      <VRSClientDetailPageContent />
    </RequirePermission>
  );
}
