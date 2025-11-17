"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { homeService, CreateHomeData } from "@/lib/api";
import { useProviderId } from "@/hooks/use-provider-data";
import { usePageMetadata } from "../../use-page-metadata";
import {
  HomeForm,
  HomeFormData,
  STANDARD_AMENITIES,
} from "@/components/forms/home-form";
import { UploadedFile } from "@/components/ui/file-uploader";

export default function CreateHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const providerId = useProviderId();

  // Set page metadata
  useEffect(() => {
    setTitle("Add New Home");
    setDescription("Create a new care home for your organization");
  }, [setTitle, setDescription]);

  // Simple geocoding function (using a free geocoding service)
  const geocodeAddress = async (
    address: string
  ): Promise<{ latitude: number; longitude: number }> => {
    try {
      // Using OpenStreetMap Nominatim (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            "User-Agent": "CareLinkMN/1.0", // Required by Nominatim
          },
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }

      // Fallback: return default coordinates (Minneapolis, MN)
      console.warn("Geocoding failed, using default coordinates");
      return { latitude: 44.9778, longitude: -93.265 };
    } catch (error) {
      console.error("Geocoding error:", error);
      // Fallback: return default coordinates (Minneapolis, MN)
      return { latitude: 44.9778, longitude: -93.265 };
    }
  };

  const handleSubmit = async (
    data: HomeFormData & { photos: UploadedFile[]; amenities: string[] }
  ) => {
    if (!providerId) {
      toast.error("Provider information not loaded");
      return;
    }

    setIsSubmitting(true);

    try {
      // Geocode address to get latitude/longitude
      const address = `${data.addressLine1}, ${data.city}, ${data.state} ${data.zipCode}`;
      const geocodeResult = await geocodeAddress(address);

      // Map amenities to schema format
      const amenities = data.amenities.map((amenityType, index) => ({
        amenityType,
        order: index,
      }));

      const homeData: CreateHomeData = {
        name: data.name,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        county: data.county,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
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

      await homeService.createHome(providerId, homeData);
      toast.success("Home created successfully!");
      router.push("/provider/homes");
    } catch (error) {
      console.error("Error creating home:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create home"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!providerId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-destructive">
            Unable to load provider information. Please ensure you have
            completed onboarding.
          </p>
          <Button
            variant="healthcare"
            onClick={() => router.push("/provider/dashboard")}
          >
            Go to Dashboard
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
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onCancel={() => router.back()}
      />
    </div>
  );
}
