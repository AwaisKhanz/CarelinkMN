"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { vrsService } from "@/lib/api";
import type { CreateClientData, UpdateClientData } from "@/lib/api/services/vrs.service";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import { VRSClientForm } from "@/components/forms/vrs-client-form";

function CreateClientPageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Create Client");
    setDescription("Add a new VRS client to the system");
  }, [setTitle, setDescription]);

  const handleSubmit = async (data: CreateClientData | UpdateClientData) => {
    setIsSubmitting(true);

    try {
      const response = await vrsService.createClient(data as CreateClientData);

      if (response.success && response.data) {
        toast.success("Client created successfully");
        router.push(`/vrs/clients/${response.data.id}`);
      } else {
        toast.error(response.message || "Failed to create client");
      }
    } catch (err) {
      console.error("Error creating client:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create client"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Client</h1>
          <p className="text-muted-foreground mt-1">
            Add a new VRS client to the system
          </p>
        </div>
      </div>

      <VRSClientForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Create Client"
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default function CreateClientPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.CLIENTS_CREATE}
      title="Access Restricted"
      description="You don't have permission to create clients."
    >
      <CreateClientPageContent />
    </RequirePermission>
  );
}

