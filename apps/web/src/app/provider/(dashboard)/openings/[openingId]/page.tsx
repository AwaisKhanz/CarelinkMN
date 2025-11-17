"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Edit,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  RefreshCw,
  Trash2,
  AlertCircle,
  Building,
  MoreVertical,
  Save,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  openingService,
  Opening,
  OpeningStatus,
  Gender,
  Payer,
} from "@/lib/api";
import { calculateHoursUntilExpiry } from "@/lib/utils/provider";
import {
  PAYER_LABELS,
  OPENING_STATUS_CONFIG,
  GENDER_LABELS,
} from "@/lib/constants";
import type { BadgeProps } from "@/components/ui/badge";
import { usePageMetadata } from "../../use-page-metadata";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useOpeningTemplates } from "@/hooks/use-opening-templates";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { usePermissions } from "@/hooks/use-permissions";
import { Label } from "@/components/ui/label";

// Use shared constants
const STATUS_CONFIG = OPENING_STATUS_CONFIG;

function OpeningDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const openingId = params.openingId as string;

  const [opening, setOpening] = useState<Opening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { saveTemplate } = useOpeningTemplates();
  const { canManageOpenings } = usePermissions();

  useEffect(() => {
    if (opening) {
      setTitle(`Opening - ${opening.home?.name || "Unknown"}`);
      setDescription(
        `${opening.spotsAvailable} spot${opening.spotsAvailable !== 1 ? "s" : ""} available`
      );
    }
  }, [opening, setTitle, setDescription]);

  useEffect(() => {
    if (openingId) {
      fetchOpeningData();
    }
  }, [openingId]);

  const fetchOpeningData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const openingData = await openingService.getOpeningById(openingId);
      setOpening(openingData);
    } catch (err: unknown) {
      console.error("Error fetching opening:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load opening details";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!opening) return;

    setIsRefreshing(true);
    try {
      await openingService.refreshOpening(opening.id);
      toast.success("Opening refreshed successfully");
      fetchOpeningData();
    } catch (err) {
      console.error("Error refreshing opening:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh opening"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = () => {
    if (!opening) return;
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!opening) return;

    try {
      await openingService.deleteOpening(opening.id);
      toast.success("Opening deleted successfully");
      setDeleteDialogOpen(false);
      router.push("/provider/openings");
    } catch (err) {
      console.error("Error deleting opening:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete opening"
      );
    }
  };

  // Use shared utility function
  const getHoursUntilExpiry = calculateHoursUntilExpiry;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading opening details...</p>
        </div>
      </div>
    );
  }

  if (error || !opening) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center mb-4">
              {error || "Opening not found"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button onClick={fetchOpeningData} className="flex-1">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[opening.status];
  const StatusIcon = statusConfig.icon;
  const hoursUntilExpiry = getHoursUntilExpiry(opening.freshnessTimestamp);
  const isExpiringSoon = hoursUntilExpiry < 24 && hoursUntilExpiry > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {canManageOpenings && (
          <div className="flex items-center gap-2">
            {!opening.isFresh && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManageOpenings && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/provider/openings/${opening.id}/edit`)
                      }
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {!opening.isFresh && (
                      <DropdownMenuItem onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Opening
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setSaveTemplateDialogOpen(true)}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Template
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Status Banner */}
      <Card
        variant="healthcare"
        className={cn(
          "border-l-4",
          opening.status === OpeningStatus.OPEN &&
            "border-l-[hsl(var(--success))]",
          opening.status === OpeningStatus.PENDING &&
            "border-l-[hsl(var(--warning))]",
          opening.status === OpeningStatus.FILLED &&
            "border-l-[hsl(var(--info))]",
          opening.status === OpeningStatus.EXPIRED && "border-l-border"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon
                className={cn(
                  "w-6 h-6",
                  statusConfig.color === "healthcareSuccess" && "text-success",
                  statusConfig.color === "healthcareWarning" && "text-warning",
                  statusConfig.color === "healthcareInfo" && "text-info",
                  statusConfig.color === "secondary" && "text-muted-foreground",
                  statusConfig.color === "destructive" && "text-destructive"
                )}
              />
              <div>
                <h2 className="text-xl font-semibold">{statusConfig.label}</h2>
                <p className="text-sm text-muted-foreground">
                  {opening.spotsAvailable} spot
                  {opening.spotsAvailable !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
            <Badge variant={statusConfig.color}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </Badge>
          </div>
          {isExpiringSoon && opening.isFresh && (
            <div className="mt-4 flex items-center gap-2 text-warning">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                This opening will expire in {hoursUntilExpiry} hour
                {hoursUntilExpiry !== 1 ? "s" : ""}. Refresh to extend.
              </span>
            </div>
          )}
          {!opening.isFresh && (
            <div className="mt-4 flex items-center gap-2 text-destructive">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">
                This opening has expired. Refresh to make it active again.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Home Information */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Home Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{opening.home?.name}</h3>
                <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4" />
                  {opening.home?.city}, {opening.home?.state}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-lg font-semibold">
                    {opening.home?.capacity} beds
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Current Occupancy
                  </p>
                  <p className="text-lg font-semibold">
                    {opening.home?.currentOccupancy || 0}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/provider/homes/${opening.homeId}`)}
                className="w-full"
              >
                View Home Details
              </Button>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Available From
                  </p>
                  <p className="text-base font-semibold mt-1">
                    {format(new Date(opening.availableFrom), "PPP")}
                  </p>
                </div>
                {opening.availableUntil && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Available Until
                    </p>
                    <p className="text-base font-semibold mt-1">
                      {format(new Date(opening.availableUntil), "PPP")}
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Last Updated (Freshness)
                </p>
                <p className="text-base font-semibold mt-1">
                  {format(new Date(opening.freshnessTimestamp), "PPpp")}
                </p>
                {opening.isFresh ? (
                  <Badge variant="healthcareSuccess" className="mt-2">
                    Fresh (within 48 hours)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="mt-2">
                    Expired
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(opening.ageMin || opening.ageMax) && (
                <div>
                  <p className="text-sm text-muted-foreground">Age Range</p>
                  <p className="text-base font-semibold mt-1">
                    {opening.ageMin ? `${opening.ageMin}` : "No minimum"} -{" "}
                    {opening.ageMax ? `${opening.ageMax}` : "No maximum"} years
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  Gender Preference
                </p>
                <p className="text-base font-semibold mt-1">
                  {opening.genderPreference
                    ? GENDER_LABELS[opening.genderPreference]
                    : "No Preference"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Care Levels & Supported Needs */}
          {(opening.careLevels.length > 0 ||
            opening.supportedNeeds.length > 0) && (
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Care Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {opening.careLevels.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Care Levels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opening.careLevels.map((level) => (
                        <Badge key={level} variant="healthcareInfo">
                          {level.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {opening.supportedNeeds.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Supported Needs
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opening.supportedNeeds.map((need) => (
                        <Badge key={need} variant="healthcareSecondary">
                          {need.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payers */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Accepted Payers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {opening.acceptedPayers.map((payer) => (
                  <Badge key={payer} variant="healthcareSuccess">
                    {PAYER_LABELS[payer]}
                  </Badge>
                ))}
              </div>
              {opening.privatePayRate && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Private Pay Rate
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    $
                    {typeof opening.privatePayRate === "number"
                      ? opening.privatePayRate.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : Number(opening.privatePayRate).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    <span className="text-sm font-normal text-muted-foreground">
                      /month
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Spots Available</p>
                <p className="text-3xl font-bold mt-1">
                  {opening.spotsAvailable}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={statusConfig.color} className="mt-2">
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-semibold mt-1">
                  {format(new Date(opening.createdAt), "PP")}
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-semibold mt-1">
                  {format(new Date(opening.updatedAt), "PP")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canManageOpenings && (
                <>
                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(`/provider/openings/${opening.id}/edit`)
                    }
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Opening
                  </Button>
                  {!opening.isFresh && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw
                        className={cn(
                          "w-4 h-4 mr-2",
                          isRefreshing && "animate-spin"
                        )}
                      />
                      Refresh Opening
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save as Template Dialog */}
      <Dialog
        open={saveTemplateDialogOpen}
        onOpenChange={setSaveTemplateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this opening configuration as a template for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Standard Memory Care Opening"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSaveTemplateDialogOpen(false);
                  setTemplateName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!templateName.trim() || !opening) return;

                  try {
                    saveTemplate(templateName.trim(), {
                      spotsAvailable: opening.spotsAvailable,
                      ageMin: opening.ageMin || undefined,
                      ageMax: opening.ageMax || undefined,
                      genderPreference:
                        opening.genderPreference ?? Gender.NO_PREFERENCE,
                      careLevels: opening.careLevels || [],
                      supportedNeeds: opening.supportedNeeds || [],
                      acceptedPayers: opening.acceptedPayers || [],
                      privatePayRate: opening.privatePayRate
                        ? Number(opening.privatePayRate)
                        : undefined,
                    });
                    toast.success("Template saved successfully");
                    setSaveTemplateDialogOpen(false);
                    setTemplateName("");
                  } catch (error) {
                    toast.error("Failed to save template");
                  }
                }}
                disabled={!templateName.trim()}
              >
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Opening"
        description="Are you sure you want to delete this opening? This action cannot be undone. All associated data will be permanently removed."
        itemDetails={
          opening ? (
            <>
              <strong>Home:</strong> {opening.home?.name || "Unknown"}
              <br />
              <strong>Spots Available:</strong> {opening.spotsAvailable}
            </>
          ) : undefined
        }
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}

export default function OpeningDetailPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.OPENINGS_MANAGE}
      title="Access Restricted"
      description="You don't have permission to view opening details. Please contact your organization administrator if you need access."
    >
      <OpeningDetailPageContent />
    </RequirePermission>
  );
}
