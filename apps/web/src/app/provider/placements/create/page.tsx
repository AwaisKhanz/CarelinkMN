"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  placementService,
  openingService,
  providerService,
  CreatePlacementData,
  Opening,
  OpeningStatus,
} from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import {
  PlacementForm,
  PlacementFormData,
} from "@/components/forms/placement-form";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PROVIDER_FEATURE_GATES } from "@/lib/constants";

const placementsGateConfig = PROVIDER_FEATURE_GATES.placements;

export default function CreatePlacementPage() {
  return (
    <FeatureGate
      feature={placementsGateConfig.feature}
      requiredPlan={placementsGateConfig.requiredPlan}
      bannerDescription={placementsGateConfig.description}
    >
      <CreatePlacementContent />
    </FeatureGate>
  );
}

function CreatePlacementContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [isLoadingOpenings, setIsLoadingOpenings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);

  // Set page metadata
  useEffect(() => {
    setTitle("Create Placement");
    setDescription("Create a new placement for a resident");
  }, [setTitle, setDescription]);

  // Get provider ID
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user) return;

      try {
        const provider = await providerService.getProviderByUserId(user.id);
        if (provider?.id) {
          setProviderId(provider.id);
        }
      } catch (error) {
        console.error("Error fetching provider ID:", error);
        toast.error("Failed to load provider information");
      }
    };

    fetchProviderId();
  }, [user]);

  // Fetch openings
  useEffect(() => {
    const fetchOpenings = async () => {
      if (!providerId) return;

      setIsLoadingOpenings(true);
      try {
        const response = await openingService.getOpenings({
          providerId,
          status: OpeningStatus.OPEN,
          page: 1,
          limit: 100,
        });

        if (response.success && response.data) {
          const openingsData = Array.isArray(response.data)
            ? response.data
            : response.data.openings || [];
          setOpenings(openingsData);
        } else {
          toast.error(response.message || "Failed to load openings");
        }
      } catch (error) {
        console.error("Error fetching openings:", error);
        toast.error("Failed to load openings");
      } finally {
        setIsLoadingOpenings(false);
      }
    };

    fetchOpenings();
  }, [providerId]);

  const handleSubmit = async (data: PlacementFormData) => {
    if (!providerId) {
      toast.error("Provider not found");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreatePlacementData = {
        openingId: data.openingId,
        placementDate: data.placementDate,
        moveInDate: data.moveInDate ?? undefined,
        referralId: data.referralId || undefined,
        dischargeCaseId: data.dischargeCaseId || undefined,
      };

      const response = await placementService.createPlacement(payload);

      if (response.success && response.data) {
        toast.success("Placement created successfully");
        router.push(`/provider/placements/${response.data.id}`);
      } else {
        toast.error(response.message || "Failed to create placement");
      }
    } catch (error) {
      console.error("Error creating placement:", error);
      toast.error("Failed to create placement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingOpenings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading openings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Placements
        </Button>
        <h1 className="text-3xl font-bold">Create Placement</h1>
      </div>

      <PlacementForm
        mode="create"
        openings={openings}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

