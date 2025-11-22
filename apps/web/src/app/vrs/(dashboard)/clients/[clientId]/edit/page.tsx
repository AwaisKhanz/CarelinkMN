"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { vrsService, type VRSClient } from "@/lib/api";
import type {
  CreateClientData,
  UpdateClientData,
} from "@/lib/api/services/vrs.service";
import { usePageMetadata } from "../../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { LoadingState, ErrorState } from "@/components/shared";
import { getClientDisplayName } from "@/lib/utils/vrs";
import { VRSClientForm } from "@/components/forms/vrs-client-form";

function EditClientPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const clientId = params.clientId as string;
  const [client, setClient] = useState<VRSClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await vrsService.getClientById(clientId);

        if (response.success && response.data) {
          const clientData = response.data;
          setClient(clientData);

          setTitle(
            `Edit Client: ${getClientDisplayName(
              clientData.firstName,
              clientData.lastName
            )}`
          );
          setDescription("Update client information");
        } else {
          setError(response.message || "Failed to load client");
        }
      } catch (err) {
        console.error("Error fetching client:", err);
        setError(err instanceof Error ? err.message : "Failed to load client");
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, setTitle, setDescription]);

  const handleSubmit = async (data: CreateClientData | UpdateClientData) => {
    setIsSubmitting(true);

    try {
      const response = await vrsService.updateClient(
        clientId,
        data as UpdateClientData
      );

      if (response.success) {
        toast.success("Client updated successfully");
        router.push(`/vrs/clients/${clientId}`);
      } else {
        toast.error(response.message || "Failed to update client");
      }
    } catch (err) {
      console.error("Error updating client:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update client"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading client..." />;
  }

  if (error || !client) {
    return (
      <ErrorState
        title="Error Loading Client"
        message={error || "Client not found"}
        action={{
          label: "Back to Clients",
          onClick: () => router.push("/vrs/clients"),
          variant: "healthcare",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Client</h1>
          <p className="text-muted-foreground mt-1">
            Update client information
          </p>
        </div>
      </div>

      <VRSClientForm
        mode="edit"
        initialData={client}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Update Client"
        onCancel={() => router.push(`/vrs/clients/${clientId}`)}
      />
    </div>
  );
}

export default function EditClientPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.CLIENTS_UPDATE}
      title="Access Restricted"
      description="You don't have permission to update clients."
    >
      <EditClientPageContent />
    </RequirePermission>
  );
}
