"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { homeService, UpdateHomeData, Home } from "@/lib/api";
import { geocodeAddress } from "@/lib/utils/geocoding";
import { usePageMetadata } from "../../../use-page-metadata";
import { HomeForm, HomeFormData } from "@/components/forms/home-form";
import { UploadedFile } from "@/components/ui/file-uploader";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";

function EditHomePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const homeId = params.homeId as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [home, setHome] = useState<Home | null>(null);

  // Set page metadata
  useEffect(() => {
    setTitle("Edit Home");
    setDescription("Update your care home information");
  }, [setTitle, setDescription]);

  // Load home data
  useEffect(() => {
    if (homeId) {
      fetchHomeData();
    }
  }, [homeId]);

  const fetchHomeData = async () => {
    try {
      setIsLoading(true);
      const homeData = await homeService.getHomeById(homeId);
      setHome(homeData);
    } catch (err: unknown) {
      console.error("Error fetching home data:", err);
      toast.error("Failed to load home data");
      router.push("/provider/homes");
    } finally {
      setIsLoading(false);
    }
  };

  // Simple geocoding function (using a free geocoding service)
  const geocodeAddress = async (
    address: string
  ): Promise<{ latitude: number; longitude: number }> => {
    try {
      // Use geocoding utility which uses apiService
      const coords = await geocodeAddress(address);
      return coords;
    } catch (error) {
      console.error("Geocoding error:", error);
      // Fallback: return existing coordinates or default
      return {
        latitude: home?.latitude || 44.9778,
        longitude: home?.longitude || -93.265,
      };
    }
  };

  const handleSubmit = async (
    data: HomeFormData & { photos: UploadedFile[]; amenities: string[] }
  ) => {
    if (!home) return;

    setIsSubmitting(true);

    try {
      // Geocode address to get latitude/longitude if address changed
      let latitude = home.latitude || 0;
      let longitude = home.longitude || 0;

      const addressChanged =
        data.addressLine1 !== home.addressLine1 ||
        data.city !== home.city ||
        data.state !== home.state ||
        data.zipCode !== home.zipCode;

      if (addressChanged) {
        const address = `${data.addressLine1}, ${data.city}, ${data.state} ${data.zipCode}`;
        const geocodeResult = await geocodeAddress(address);
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      }

      // Map amenities to schema format
      const amenities = data.amenities.map((amenityType, index) => ({
        amenityType,
        order: index,
      }));

      const updateData: UpdateHomeData = {
        id: homeId,
        name: data.name,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        county: data.county,
        latitude,
        longitude,
        capacity: data.capacity,
        currentOccupancy: data.currentOccupancy,
        wheelchairAccessible: data.wheelchairAccessible || false,
        singleLevel: data.singleLevel || false,
        hasElevator: data.hasElevator || false,
        hasRollInShower: data.hasRollInShower || false,
        virtualTourUrl: data.virtualTourUrl || undefined,
        photos:
          data.photos.length > 0
            ? data.photos.map((photo) => ({
                url: photo.url,
                caption: photo.caption || "",
                isPrimary: photo.isPrimary || false,
                order: photo.order || 0,
              }))
            : undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
        acceptingNew:
          data.acceptingNew !== undefined ? data.acceptingNew : true,
        isActive: data.isActive !== undefined ? data.isActive : true,
      };

      await homeService.updateHome(homeId, updateData);
      toast.success("Home updated successfully!");
      router.push(`/provider/homes/${homeId}`);
    } catch (error) {
      console.error("Error updating home:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update home"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading home data...</p>
        </div>
      </div>
    );
  }

  if (!home) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-destructive text-center mb-4">Home not found</p>
          <Button
            variant="healthcare"
            onClick={() => router.push("/provider/homes")}
          >
            Go Back to Homes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <HomeForm
        mode="edit"
        initialData={{
          name: home.name,
          addressLine1: home.addressLine1,
          addressLine2: home.addressLine2 || "",
          city: home.city,
          state: home.state,
          zipCode: home.zipCode,
          county: home.county,
          capacity: home.capacity,
          currentOccupancy: home.currentOccupancy,
          wheelchairAccessible: home.wheelchairAccessible,
          singleLevel: home.singleLevel,
          hasElevator: home.hasElevator,
          hasRollInShower: home.hasRollInShower,
          virtualTourUrl: home.virtualTourUrl || "",
          acceptingNew: home.acceptingNew,
          isActive: home.isActive,
          photos: home.photos || [],
          amenities: home.amenities || [],
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.back()}
      />
    </div>
  );
}

export default function EditHomePage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.HOMES_MANAGE}
      title="Access Restricted"
      description="You don't have permission to edit homes. Please contact your organization administrator if you need access."
    >
      <EditHomePageContent />
    </RequirePermission>
  );
}
