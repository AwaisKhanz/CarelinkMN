"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  openingService,
  Opening,
  UpdateOpeningData,
  OpeningStatus,
  Gender,
} from "@/lib/api";
import { usePageMetadata } from "../../../use-page-metadata";
import {
  OpeningForm,
  OpeningFormFields,
} from "@/components/forms/opening-form";

export default function EditOpeningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const openingId = params.openingId as string;
  const [opening, setOpening] = useState<Opening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set page metadata
  useEffect(() => {
    setTitle("Edit Opening");
    setDescription("Update opening details");
  }, [setTitle, setDescription]);

  // Fetch opening
  useEffect(() => {
    const fetchOpening = async () => {
      if (!openingId) return;

      setIsLoading(true);
      try {
        const openingData = await openingService.getOpeningById(openingId);
        setOpening(openingData);

        // Form will be populated via initialData prop
      } catch (error) {
        console.error("Error fetching opening:", error);
        toast.error("Failed to load opening");
        router.push("/provider/openings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpening();
  }, [openingId, router]);

  const handleSubmit = async (data: OpeningFormFields) => {
    if (!opening) return;

    setIsSubmitting(true);

    try {
      const updateData: UpdateOpeningData = {
        spotsAvailable: Number(data.spotsAvailable),
        availableFrom: data.availableFrom.toISOString(),
        availableUntil: data.availableUntil?.toISOString(),
        ageMin: data.ageMin || undefined,
        ageMax: data.ageMax || undefined,
        genderPreference: data.genderPreference || undefined,
        careLevels: data.careLevels,
        supportedNeeds: data.supportedNeeds,
        acceptedPayers: data.acceptedPayers,
        privatePayRate: data.privatePayRate || undefined,
        status: data.status,
      };

      await openingService.updateOpening(openingId, updateData);
      toast.success("Opening updated successfully");
      router.push(`/provider/openings/${openingId}`);
    } catch (err) {
      console.error("Error updating opening:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update opening"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading opening...</p>
        </div>
      </div>
    );
  }

  if (!opening) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Opening</h1>
          <p className="text-muted-foreground mt-1">
            Update opening details for {opening.home?.name || "this home"}
          </p>
        </div>
      </div>

      {opening && (
        <OpeningForm
          key={opening.id}
          mode="edit"
          home={
            opening.home
              ? {
                  name: opening.home.name,
                  city: opening.home.city,
                  state: opening.home.state,
                }
              : null
          }
          initialData={{
            spotsAvailable: opening.spotsAvailable,
            availableFrom: new Date(opening.availableFrom),
            availableUntil: opening.availableUntil
              ? new Date(opening.availableUntil)
              : null,
            ageMin: opening.ageMin ?? undefined,
            ageMax: opening.ageMax ?? undefined,
            genderPreference: opening.genderPreference || Gender.NO_PREFERENCE,
            careLevels: opening.careLevels || [],
            supportedNeeds: opening.supportedNeeds || [],
            acceptedPayers: opening.acceptedPayers,
            privatePayRate: opening.privatePayRate ?? undefined,
            status: opening.status,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
