"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { AddressForm } from "@/components/ui/address-form";
import { FileUploader, UploadedFile } from "@/components/ui/file-uploader";
import { HomePhoto, HomeAmenity } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const homeSchema = z.object({
  name: z.string().min(1, "Home name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z
    .string()
    .min(2, "State is required")
    .max(2, "State must be 2 characters"),
  zipCode: z.string().min(5, "Invalid zip code").max(10, "Invalid zip code"),
  county: z.string().min(1, "County is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  currentOccupancy: z
    .number()
    .min(0, "Occupancy cannot be negative")
    .optional(),
  wheelchairAccessible: z.boolean().optional(),
  singleLevel: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasRollInShower: z.boolean().optional(),
  virtualTourUrl: z.string().url().optional().or(z.literal("")),
  acceptingNew: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type HomeFormData = z.infer<typeof homeSchema>;

export const STANDARD_AMENITIES = [
  "24/7 Nursing Care",
  "Medication Management",
  "Physical Therapy",
  "Occupational Therapy",
  "Speech Therapy",
  "Memory Care",
  "Dementia Care",
  "Hospice Care",
  "Private Room",
  "Semi-Private Room",
  "Private Bathroom",
  "Kitchenette",
  "Balcony/Patio",
  "Garden Access",
  "Activity Room",
  "Library",
  "Game Room",
  "Fitness Center",
  "Swimming Pool",
  "Walking Paths",
  "Restaurant-Style Dining",
  "Private Dining Room",
  "Snack Bar",
  "Special Diets",
  "Transportation Services",
  "Medical Appointments",
  "Shopping Trips",
  "WiFi",
  "Cable TV",
  "Computer Access",
  "Video Calling",
  "24/7 Security",
  "Emergency Response",
  "Smoke Detectors",
  "Sprinkler System",
  "Pet Friendly",
  "Family Visits",
  "Overnight Stays",
];

interface HomeFormProps {
  mode: "create" | "edit";
  initialData?: Partial<HomeFormData & { photos?: HomePhoto[]; amenities?: HomeAmenity[] }>;
  onSubmit: (data: HomeFormData & { photos: UploadedFile[]; amenities: string[] }) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function HomeForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel,
  onCancel,
}: HomeFormProps) {
  const { tier, limits, canAddPhotos, getRemainingPhotos } = useSubscription();
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const form = useForm<HomeFormData>({
    resolver: zodResolver(homeSchema),
    defaultValues: {
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "MN",
      zipCode: "",
      county: "",
      capacity: 1,
      currentOccupancy: 0,
      wheelchairAccessible: false,
      singleLevel: false,
      hasElevator: false,
      hasRollInShower: false,
      virtualTourUrl: "",
      acceptingNew: true,
      isActive: true,
      ...initialData,
    },
  });

  // Update form and state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "MN",
        zipCode: "",
        county: "",
        capacity: 1,
        currentOccupancy: 0,
        wheelchairAccessible: false,
        singleLevel: false,
        hasElevator: false,
        hasRollInShower: false,
        virtualTourUrl: "",
        acceptingNew: true,
        isActive: true,
        ...initialData,
      });

      // Set photos
      if (initialData.photos && initialData.photos.length > 0) {
        setPhotos(
          initialData.photos.map((photo: HomePhoto) => ({
            url: photo.url,
            fileName: photo.url.split("/").pop() || `photo-${photo.id}`,
            caption: photo.caption || "",
            isPrimary: photo.isPrimary,
            order: photo.order,
            mimeType: "image/jpeg",
          }))
        );
      } else {
        setPhotos([]);
      }

      // Set amenities
      if (initialData.amenities && initialData.amenities.length > 0) {
        setSelectedAmenities(
          initialData.amenities.map((amenity: HomeAmenity) => amenity.amenityType)
        );
      } else {
        setSelectedAmenities([]);
      }
    }
  }, [initialData, form]);

  const handleSubmit = async (data: HomeFormData) => {
    await onSubmit({
      ...data,
      photos,
      amenities: selectedAmenities,
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the basic details for your care home
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Home Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., Maple Grove Care Center"
              className={cn(
                form.formState.errors.name && "border-destructive"
              )}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <AddressForm
        register={form.register}
        control={form.control}
        errors={form.formState.errors}
        showCard={true}
        title="Address Information"
        description="Enter the complete address for your care home"
      />

      {/* Capacity Information */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Capacity Information</CardTitle>
          <CardDescription>
            Set the capacity and current occupancy for your home
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Total Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                {...form.register("capacity", { valueAsNumber: true })}
                placeholder="50"
                className={cn(
                  form.formState.errors.capacity && "border-destructive"
                )}
              />
              {form.formState.errors.capacity && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.capacity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentOccupancy">Current Occupancy *</Label>
              <Input
                id="currentOccupancy"
                type="number"
                min="0"
                {...form.register("currentOccupancy", {
                  valueAsNumber: true,
                })}
                placeholder="25"
                className={cn(
                  form.formState.errors.currentOccupancy &&
                    "border-destructive"
                )}
              />
              {form.formState.errors.currentOccupancy && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.currentOccupancy.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
          <CardDescription>
            Select the amenities available at your care home
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {STANDARD_AMENITIES.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity}
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                <Label htmlFor={amenity} className="text-sm">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Features */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
          <CardDescription>
            Select accessibility features available at your care home
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wheelchairAccessible"
                checked={form.watch("wheelchairAccessible")}
                onCheckedChange={(checked) =>
                  form.setValue("wheelchairAccessible", !!checked)
                }
              />
              <Label htmlFor="wheelchairAccessible">
                Wheelchair Accessible
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="singleLevel"
                checked={form.watch("singleLevel")}
                onCheckedChange={(checked) =>
                  form.setValue("singleLevel", !!checked)
                }
              />
              <Label htmlFor="singleLevel">Single Level</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasElevator"
                checked={form.watch("hasElevator")}
                onCheckedChange={(checked) =>
                  form.setValue("hasElevator", !!checked)
                }
              />
              <Label htmlFor="hasElevator">Has Elevator</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasRollInShower"
                checked={form.watch("hasRollInShower")}
                onCheckedChange={(checked) =>
                  form.setValue("hasRollInShower", !!checked)
                }
              />
              <Label htmlFor="hasRollInShower">Roll-in Shower</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Upload photos of your care home</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="healthcarePrimary" className="capitalize">
                {tier} Plan
              </Badge>
              <Badge variant={canAddPhotos(photos.length) ? "healthcareSuccess" : "healthcareWarning"}>
                {photos.length} / {limits.maxPhotos >= 999 ? '∞' : limits.maxPhotos} photos
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canAddPhotos(photos.length) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached your plan's photo limit ({limits.maxPhotos} photo{limits.maxPhotos !== 1 ? 's' : ''}).
                {tier === 'FREE' && ' Upgrade to Pro for 5 photos or Premium for unlimited photos.'}
                {tier === 'PRO' && ' Upgrade to Premium for unlimited photos.'}
              </AlertDescription>
            </Alert>
          )}
          <FileUploader
            documentType="photo"
            folder="homes/photos"
            accept="image/*"
            maxSize={10 * 1024 * 1024} // 10MB
            maxFiles={limits.maxPhotos}
            multiple={true}
            files={photos}
            onFilesChange={setPhotos}
            label="Upload Photos"
            description={`Upload photos of your care home (JPEG, PNG). ${
              limits.maxPhotos >= 999 
                ? 'Unlimited photos available.' 
                : `${getRemainingPhotos(photos.length)} photo${getRemainingPhotos(photos.length) !== 1 ? 's' : ''} remaining.`
            }`}
            showPreview={true}
            showPrimaryToggle={true}
            previewSize="md"
            variant="healthcare"
          />
        </CardContent>
      </Card>

      {/* Virtual Tour */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Virtual Tour</CardTitle>
          <CardDescription>
            Optional virtual tour URL (YouTube, Matterport, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="virtualTourUrl">Virtual Tour URL</Label>
            <Input
              id="virtualTourUrl"
              type="url"
              {...form.register("virtualTourUrl")}
              placeholder="https://..."
              className={cn(
                form.formState.errors.virtualTourUrl && "border-destructive"
              )}
            />
            {form.formState.errors.virtualTourUrl && (
              <p className="text-sm text-destructive">
                {form.formState.errors.virtualTourUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Set the status settings for this home
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) =>
                form.setValue("isActive", !!checked)
              }
            />
            <Label htmlFor="isActive">This home is active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptingNew"
              checked={form.watch("acceptingNew")}
              onCheckedChange={(checked) =>
                form.setValue("acceptingNew", !!checked)
              }
            />
            <Label htmlFor="acceptingNew">Accepting new residents</Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="healthcare" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {submitLabel || (mode === "create" ? "Creating..." : "Updating...")}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {submitLabel ||
                (mode === "create" ? "Create Home" : "Update Home")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

