"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vrsService, type VRSPlacement } from "@/lib/api";
import { RetentionStatus } from "@carelink/types";
import { usePageMetadata } from "../../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { VRS_CAPABILITIES } from "@/lib/permissions/capabilities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { LoadingState, ErrorState } from "@/components/shared";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const retentionSchema = z.object({
  day30Status: z.nativeEnum(RetentionStatus).optional().nullable(),
  day60Status: z.nativeEnum(RetentionStatus).optional().nullable(),
  day90Status: z.nativeEnum(RetentionStatus).optional().nullable(),
  endDate: z.string().optional().or(z.literal("")),
  endReason: z.string().optional().or(z.literal("")),
});

type RetentionFormData = z.infer<typeof retentionSchema>;

function UpdateRetentionPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const placementId = params.placementId as string;
  const [placement, setPlacement] = useState<VRSPlacement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RetentionFormData>({
    resolver: zodResolver(retentionSchema),
    defaultValues: {
      day30Status: null,
      day60Status: null,
      day90Status: null,
      endDate: "",
      endReason: "",
    },
  });

  useEffect(() => {
    const fetchPlacement = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get placement from placements list
        const response = await vrsService.getPlacements({ limit: 1000 });

        if (response.success && response.data) {
          const foundPlacement = response.data.placements.find(
            (p) => p.id === placementId
          );

          if (foundPlacement) {
            setPlacement(foundPlacement);

            const endDate = foundPlacement.endDate
              ? new Date(foundPlacement.endDate).toISOString().split("T")[0]
              : "";

            form.reset({
              day30Status: foundPlacement.day30Status || null,
              day60Status: foundPlacement.day60Status || null,
              day90Status: foundPlacement.day90Status || null,
              endDate,
              endReason: foundPlacement.endReason || "",
            });

            setTitle("Update Placement Retention");
            setDescription(
              "Track client retention status and placement outcomes"
            );
          } else {
            setError("Placement not found");
          }
        } else {
          setError(response.message || "Failed to load placement");
        }
      } catch (err) {
        console.error("Error fetching placement:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load placement"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (placementId) {
      fetchPlacement();
    }
  }, [placementId, form, setTitle, setDescription]);

  const handleSubmit = async (data: RetentionFormData) => {
    setIsSubmitting(true);

    try {
      const retentionData = {
        day30Status: data.day30Status || undefined,
        day60Status: data.day60Status || undefined,
        day90Status: data.day90Status || undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        endReason: data.endReason || undefined,
      };

      const response = await vrsService.updatePlacementRetention(
        placementId,
        retentionData
      );

      if (response.success) {
        toast.success("Retention status updated successfully");
        router.push("/vrs/jobs");
      } else {
        toast.error(response.message || "Failed to update retention status");
      }
    } catch (err) {
      console.error("Error updating retention:", err);
      toast.error("Failed to update retention status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading placement..." />;
  }

  if (error || !placement) {
    return (
      <ErrorState
        title="Error Loading Placement"
        message={error || "Placement not found"}
        action={{
          label: "Back to Jobs",
          onClick: () => router.push("/vrs/jobs"),
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
          <h1 className="text-3xl font-bold text-foreground">
            Update Retention Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Track client retention and placement outcomes
          </p>
        </div>
      </div>

      <Card variant="healthcare">
        <CardHeader>
          <CardTitle>Placement Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Client</div>
            <div className="font-medium">
              {placement.client
                ? `${placement.client.firstName} ${placement.client.lastName}`
                : "Unknown Client"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Job</div>
            <div className="font-medium">
              {placement.job?.title || "Unknown Job"}
            </div>
            <div className="text-sm text-muted-foreground">
              {placement.job?.employer?.companyName || "Unknown Employer"}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Placement Date</div>
            <div className="font-medium">
              {format(new Date(placement.placementDate), "MMM d, yyyy")}
            </div>
          </div>
          {placement.startDate && (
            <div>
              <div className="text-sm text-muted-foreground">Start Date</div>
              <div className="font-medium">
                {format(new Date(placement.startDate), "MMM d, yyyy")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Retention Status</CardTitle>
            <CardDescription>
              Track retention at 30, 60, and 90 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="day30Status">30-Day Status</Label>
                <Controller
                  name="day30Status"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "__UNSET__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__UNSET__" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Not set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__UNSET__">Not set</SelectItem>
                        {Object.values(RetentionStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="day60Status">60-Day Status</Label>
                <Controller
                  name="day60Status"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "__UNSET__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__UNSET__" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Not set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__UNSET__">Not set</SelectItem>
                        {Object.values(RetentionStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="day90Status">90-Day Status</Label>
                <Controller
                  name="day90Status"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "__UNSET__"}
                      onValueChange={(value) =>
                        field.onChange(value === "__UNSET__" ? null : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Not set" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__UNSET__">Not set</SelectItem>
                        {Object.values(RetentionStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Placement End Information</CardTitle>
            <CardDescription>
              Record when and why a placement ended (if applicable)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...form.register("endDate")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endReason">End Reason</Label>
              <Textarea
                id="endReason"
                rows={4}
                placeholder="Reason for placement ending..."
                {...form.register("endReason")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="healthcare" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Retention"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function UpdateRetentionPage() {
  return (
    <RequirePermission
      permission={VRS_CAPABILITIES.PLACEMENTS_UPDATE}
      title="Access Restricted"
      description="You don't have permission to update placement retention."
    >
      <UpdateRetentionPageContent />
    </RequirePermission>
  );
}
