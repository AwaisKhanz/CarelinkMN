"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Edit,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { placementService, Placement, PlacementStatus } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PROVIDER_FEATURE_GATES, PLACEMENT_STATUS_CONFIG } from "@/lib/constants";

const placementsGateConfig = PROVIDER_FEATURE_GATES.placements;

// Use shared status config from constants
const STATUS_CONFIG = PLACEMENT_STATUS_CONFIG;

export default function PlacementDetailPage() {
  return (
    <FeatureGate
      feature={placementsGateConfig.feature}
      requiredPlan={placementsGateConfig.requiredPlan}
      bannerDescription={placementsGateConfig.description}
    >
      <PlacementDetailContent />
    </FeatureGate>
  );
}

function PlacementDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const placementId = params?.placementId as string | undefined;

  useEffect(() => {
    setTitle("Placement Details");
    setDescription("Review resident placement information and timeline");
  }, [setTitle, setDescription]);

  useEffect(() => {
    const fetchPlacement = async () => {
      if (!placementId || !user?.organizationId) return;

      try {
        setIsLoading(true);
        const response = await placementService.getPlacementById(placementId);
        if (response.success && response.data) {
          setPlacement(response.data);
        } else {
          setError(response.message || "Failed to load placement");
        }
      } catch (err) {
        console.error("Error fetching placement:", err);
        setError("Failed to load placement details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlacement();
  }, [placementId, user?.organizationId]);

  const getResidentDisplay = (placement: Placement | null) => {
    if (!placement) {
      return "Placement";
    }

    if (placement.referral) {
      const initials = placement.referral.clientInitials;
      const age = placement.referral.clientAge;
      return `${initials} (Age ${age})`;
    }

    if (placement.dischargeCase) {
      const initials = placement.dischargeCase.patientInitials;
      const age = placement.dischargeCase.patientAge;
      return `${initials} (Age ${age})`;
    }

    if (placement.opening?.home?.name) {
      return placement.opening.home.name;
    }

    return "Placement";
  };

  const getPlacementIdentifier = (placement: Placement | null) => {
    if (!placement) {
      return "";
    }

    return (
      placement.referral?.referralNumber ||
      placement.dischargeCase?.caseNumber ||
      placement.id
    );
  };

  let content;

  if (isLoading) {
    content = (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading placement...</p>
        </div>
      </div>
    );
  } else if (error || !placement) {
    content = (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/provider/placements")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Placements
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">
                {error || "Placement not found"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else {
    const statusConfig = STATUS_CONFIG[placement.status];
    const residentDisplay = getResidentDisplay(placement);
    const placementIdentifier = getPlacementIdentifier(placement);

    const locationPreference = placement.referral?.preferredCities?.length
      ? placement.referral.preferredCities.join(", ")
      : placement.referral?.preferredCounties?.length
        ? placement.referral.preferredCounties.join(", ")
        : placement.opening?.home
          ? `${placement.opening.home.city}, ${placement.opening.home.state}`
          : "Not specified";

    const careNeedsList = placement.referral?.servicesNeeded?.length
      ? placement.referral.servicesNeeded
      : placement.referral?.careLevels?.length
        ? placement.referral.careLevels
        : placement.dischargeCase?.diagnosisCodes?.length
          ? placement.dischargeCase.diagnosisCodes
          : placement.opening?.careLevels?.length
            ? placement.opening.careLevels
            : [];

    const careNeedsText =
      Array.isArray(careNeedsList) && careNeedsList.length > 0
        ? careNeedsList.join(", ")
        : "Not specified";

    const timeline = placement.timeline ?? [];

    content = (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/provider/placements")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{residentDisplay}</h1>
              <p className="text-muted-foreground">
                Placement #{placementIdentifier}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            {placement.status === PlacementStatus.PENDING && (
              <Badge variant="healthcareWarning" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending response
              </Badge>
            )}
            {placement.status === PlacementStatus.CONFIRMED && (
              <Badge variant="healthcarePrimary" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Confirmed
              </Badge>
            )}
            {placement.status === PlacementStatus.CANCELLED && (
              <Badge variant="healthcareError" className="gap-1">
                <XCircle className="h-3 w-3" />
                Cancelled
              </Badge>
            )}
          </div>
        </div>

        {/* Placement Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="healthcare" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Placement Overview</CardTitle>
              <CardDescription>
                Key details about this placement and resident preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Resident</p>
                    <p className="font-medium text-foreground">
                      {residentDisplay}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Move-In Date
                    </p>
                    <p className="font-medium text-foreground">
                      {placement.moveInDate
                        ? format(new Date(placement.moveInDate), "MMM dd, yyyy")
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Preferred Location
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {locationPreference}
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Care Needs
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {careNeedsText}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Placement Actions</CardTitle>
              <CardDescription>Manage this placement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="healthcare"
                onClick={() =>
                  router.push(
                    `/provider/placements/${placement.id}/edit?step=details`
                  )
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Placement Details
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Placement Timeline</CardTitle>
            <CardDescription>
              Key events and follow-ups associated with this placement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-2 border-primary/20 pl-6 space-y-6">
              {timeline.length > 0 ? (
                timeline.map((event) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-[1.45rem] top-1">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    </div>
                    <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-foreground">
                          {event.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.date), "MMM dd, yyyy")}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      {event.assignedTo && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          Assigned to: {event.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No timeline events recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return content;
}
