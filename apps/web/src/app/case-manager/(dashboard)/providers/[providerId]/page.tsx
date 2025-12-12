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
  Loader2,
  MapPin,
  Phone,
  Globe,
  Building,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Plus,
  Mail,
  Calendar,
  Home,
  Bed,
} from "lucide-react";
import { toast } from "sonner";
import { providerService, referralService, Provider } from "@/lib/api";
import { ReferralStatus } from "@carelink/types";
import { usePageMetadata } from "../../use-page-metadata";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProviderPerformanceMetrics {
  totalReferrals: number;
  respondedReferrals: number;
  responseRate: number;
  averageResponseTime: number; // in hours
  totalPlacements: number;
  placementSuccessRate: number;
  lastResponseDate?: string;
}

interface Opening {
  id: string;
  spotsAvailable: number;
  availableFrom: string;
  availableUntil?: string;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: string;
  home: {
    name: string;
    city: string;
    state: string;
  };
}

function ProviderProfilePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const providerId = params?.providerId as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<ProviderPerformanceMetrics | null>(null);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingOpenings, setIsLoadingOpenings] = useState(true);
  const [isAddingToShortlist, setIsAddingToShortlist] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Provider Profile");
    setDescription("View provider details and performance metrics");
  }, [setTitle, setDescription]);

  useEffect(() => {
    // Get referralId from query params if available
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get("referralId");
    if (refId) {
      setReferralId(refId);
    }
  }, []);

  useEffect(() => {
    if (providerId) {
      fetchProvider();
      fetchPerformanceMetrics();
      fetchOpenings();
    }
  }, [providerId]);

  const fetchProvider = async () => {
    setIsLoading(true);
    try {
      const response = await providerService.getProviderProfile(providerId);
      if (response.success && response.data) {
        setProvider(response.data);
      } else {
        toast.error(response.message || "Failed to load provider profile");
        router.push("/case-manager/search");
      }
    } catch (error) {
      console.error("Error fetching provider:", error);
      toast.error("Failed to load provider profile");
      router.push("/case-manager/search");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPerformanceMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const referralsResponse = await providerService.getProviderReferrals(
        providerId,
        { page: 1, limit: 100 }
      );

      if (referralsResponse.success && referralsResponse.data) {
        const referrals = referralsResponse.data.referrals || [];
        const totalReferrals = referrals.length;

        // Calculate real response metrics
        const respondedReferrals = referrals.filter(
          (r) =>
            r.status !== ReferralStatus.NEW &&
            r.status !== ReferralStatus.CANCELLED
        ).length;

        const responseRate =
          totalReferrals > 0 ? (respondedReferrals / totalReferrals) * 100 : 0;

        // Calculate real placements
        const placements = referrals.filter(
          (r) => r.status === ReferralStatus.PLACED
        ).length;
        const placementSuccessRate =
          totalReferrals > 0 ? (placements / totalReferrals) * 100 : 0;

        setPerformanceMetrics({
          totalReferrals,
          respondedReferrals,
          responseRate,
          averageResponseTime: provider?.responseTimeHours || 0,
          totalPlacements: placements,
          placementSuccessRate,
        });
      }
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchOpenings = async () => {
    setIsLoadingOpenings(true);
    try {
      const response = await fetch(
        `/api/openings?providerId=${providerId}&status=OPEN&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setOpenings(data.data.openings || []);
        }
      }
    } catch (error) {
      console.error("Error fetching openings:", error);
    } finally {
      setIsLoadingOpenings(false);
    }
  };

  const handleAddToShortlist = async () => {
    if (!referralId) {
      toast.error("No referral selected. Please select a referral first.");
      return;
    }

    setIsAddingToShortlist(true);
    try {
      const response = await referralService.addToShortlist(referralId, {
        providerIds: [providerId],
      });

      if (response.success) {
        toast.success("Provider added to shortlist successfully");
      } else {
        toast.error(response.message || "Failed to add provider to shortlist");
      }
    } catch (error) {
      console.error("Error adding to shortlist:", error);
      toast.error("Failed to add provider to shortlist");
    } finally {
      setIsAddingToShortlist(false);
    }
  };

  const handleSendMessage = () => {
    if (referralId) {
      router.push(
        `/case-manager/referrals/${referralId}?action=message&providerId=${providerId}`
      );
    } else {
      router.push(`/case-manager/messages?providerId=${providerId}`);
    }
  };

  // Calculate total capacity and occupancy from homes
  const totalCapacity = provider?.homes?.reduce((sum, home) => sum + (home.capacity || 0), 0) || 0;
  const totalOccupancy = provider?.homes?.reduce((sum, home) => sum + (home.currentOccupancy || 0), 0) || 0;
  const availableSpots = totalCapacity - totalOccupancy;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card variant="healthcare" className="max-w-md">
          <CardHeader>
            <CardTitle>Provider Not Found</CardTitle>
            <CardDescription>
              The provider profile you're looking for doesn't exist or is not
              available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/case-manager/search")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {provider.organization?.name || "Provider Profile"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {provider.primaryLicenseType?.name || "Healthcare Provider"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {referralId && (
            <Button
              variant="healthcare"
              onClick={handleAddToShortlist}
              disabled={isAddingToShortlist}
            >
              {isAddingToShortlist ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Shortlist
                </>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={handleSendMessage}>
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Overview - 2 columns */}
        <Card variant="healthcare" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {provider.organization?.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  {provider.primaryLicenseType?.name || "Healthcare Provider"}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                {provider.verified && (
                  <Badge variant="healthcareSuccess">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {provider.acceptsReferrals && (
                  <Badge variant="healthcareInfo">Accepting Referrals</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {provider.description && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <p className="font-medium">
                  {provider.organization?.city || "N/A"},{" "}
                  {provider.organization?.county || "N/A"} County
                </p>
                {provider.organization?.addressLine1 && (
                  <p className="text-sm text-muted-foreground">
                    {provider.organization.addressLine1}
                    {provider.organization.addressLine2 &&
                      `, ${provider.organization.addressLine2}`}
                    {provider.organization.zipCode &&
                      `, ${provider.organization.zipCode}`}
                  </p>
                )}
              </div>

              {provider.organization?.phone && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <p className="font-medium">{provider.organization.phone}</p>
                </div>
              )}

              {provider.organization?.website && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Globe className="h-4 w-4" />
                    Website
                  </div>
                  <a
                    href={provider.organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}

              {provider.responseTimeHours && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    Response Time
                  </div>
                  <p className="font-medium">
                    {provider.responseTimeHours} hours average
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Capacity Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalCapacity}</div>
                <div className="text-xs text-muted-foreground">Total Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-healthcare">{totalOccupancy}</div>
                <div className="text-xs text-muted-foreground">Current Occupancy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{availableSpots}</div>
                <div className="text-xs text-muted-foreground">Available Spots</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics - 1 column */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Provider engagement statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : performanceMetrics ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      Total Referrals
                    </span>
                    <span className="font-semibold text-xl">
                      {performanceMetrics.totalReferrals}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      Response Rate
                    </span>
                    <span className="font-semibold text-xl">
                      {performanceMetrics.responseRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {performanceMetrics.respondedReferrals} of{" "}
                    {performanceMetrics.totalReferrals} responded
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">
                      Placement Success Rate
                    </span>
                    <span className="font-semibold text-xl">
                      {performanceMetrics.placementSuccessRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {performanceMetrics.totalPlacements} successful placements
                  </div>
                </div>

                {performanceMetrics.averageResponseTime > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          Avg. Response Time
                        </span>
                        <span className="font-semibold text-xl">
                          {performanceMetrics.averageResponseTime.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No performance data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Licenses and Homes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Licenses */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Active Licenses</CardTitle>
            <CardDescription>
              Current licenses held by this provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {provider.licenses && provider.licenses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Type</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Expiration Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provider.licenses.map((license, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {license.licenseTypeId || 'N/A'}
                      </TableCell>
                      <TableCell>{license.licenseNumber}</TableCell>
                      <TableCell>
                        {license.expirationDate
                          ? format(
                              new Date(license.expirationDate),
                              "MMM d, yyyy"
                            )
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active licenses found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Homes */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Homes ({provider.homes?.length || 0})</CardTitle>
            <CardDescription>
              Active homes managed by this provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {provider.homes && provider.homes.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {provider.homes.map((home) => (
                  <div
                    key={home.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{home.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {home.city}, {home.state}
                          {home.county && ` • ${home.county} County`}
                        </p>
                      </div>
                      {home.acceptingNew && (
                        <Badge variant="healthcareSuccess" className="text-xs">
                          Accepting New
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                      <div>
                        <span className="text-muted-foreground">Capacity:</span>
                        <p className="font-medium">{home.capacity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Occupancy:</span>
                        <p className="font-medium">
                          {home.currentOccupancy} / {home.capacity}
                        </p>
                      </div>
                      {home.wheelchairAccessible && (
                        <div>
                          <span className="text-muted-foreground">Access:</span>
                          <p className="font-medium text-xs">Wheelchair</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No homes found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services and Openings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
            <CardDescription>
              Services provided by this provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {provider.homes && provider.homes.length > 0 ? (
              <div className="space-y-4">
                {provider.homes.map((home) => {
                  const services = home.services || [];
                  if (services.length === 0) return null;

                  return (
                    <div key={home.id}>
                      <h4 className="font-semibold mb-2 text-sm">{home.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {services.map((homeService, index) => (
                          <Badge key={index} variant="outline">
                            {homeService.service?.name || "Unknown Service"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No services found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Current Openings */}
        <Card variant="healthcare">
          <CardHeader>
            <CardTitle>Current Openings ({openings.length})</CardTitle>
            <CardDescription>
              Available spots at this provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOpenings ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : openings.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {openings.map((opening) => (
                  <div
                    key={opening.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {opening.home.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {opening.home.city}, {opening.home.state}
                        </p>
                      </div>
                      <Badge variant="healthcareSuccess">
                        {opening.spotsAvailable} Spot{opening.spotsAvailable !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>
                        <span className="text-muted-foreground">Available From:</span>
                        <p className="font-medium">
                          {format(new Date(opening.availableFrom), "MMM d, yyyy")}
                        </p>
                      </div>
                      {opening.ageMin !== undefined && opening.ageMax !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Age Range:</span>
                          <p className="font-medium">
                            {opening.ageMin}-{opening.ageMax} years
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No current openings available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProviderProfilePage() {
  return (
    <RequirePermission
      permission={CASE_MANAGER_CAPABILITIES.PROVIDERS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view provider profiles."
    >
      <ProviderProfilePageContent />
    </RequirePermission>
  );
}
