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
} from "lucide-react";
import { toast } from "sonner";
import { providerService, referralService, Provider } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { useAuth } from "@/contexts/auth-context";
import { format } from "date-fns";
import { RequirePermission } from "@/components/auth/require-permission";
import { CASE_MANAGER_CAPABILITIES } from "@/lib/permissions/capabilities";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function ProviderProfilePageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const providerId = params?.providerId as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<ProviderPerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
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
      // Get referrals for this provider to calculate metrics
      const referralsResponse = await providerService.getProviderReferrals(
        providerId,
        { page: 1, limit: 1000 }
      );

      if (referralsResponse.success && referralsResponse.data) {
        const referrals = referralsResponse.data.referrals || [];
        const totalReferrals = referrals.length;

        // Calculate response metrics from message threads
        // For now, we'll use a simplified calculation
        // In a real implementation, you'd query message threads
        const respondedReferrals = referrals.filter(
          (r) => r.status !== "NEW" && r.status !== "CANCELLED"
        ).length;

        const responseRate =
          totalReferrals > 0 ? (respondedReferrals / totalReferrals) * 100 : 0;

        // Calculate placements
        const placements = referrals.filter(
          (r) => r.status === "PLACED"
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
      // Don't show error toast - metrics are optional
    } finally {
      setIsLoadingMetrics(false);
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {provider.organization?.name || "Provider Profile"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Provider details and performance metrics
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

      {/* Provider Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card variant="healthcare" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {provider.organization?.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  {provider.primaryLicenseType} Provider
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
          </CardContent>
        </Card>

        {/* Performance Metrics Card */}
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
                    <span className="font-semibold">
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
                    <span className="font-semibold">
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
                    <span className="font-semibold">
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
                        <span className="font-semibold">
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

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="licenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="homes">Homes</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="licenses">
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
                          {license.licenseType}
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
        </TabsContent>

        <TabsContent value="homes">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Homes</CardTitle>
              <CardDescription>
                Active homes managed by this provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              {provider.homes && provider.homes.length > 0 ? (
                <div className="space-y-4">
                  {provider.homes.map((home) => (
                    <Card key={home.id} variant="healthcare">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{home.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {home.city}, {home.state}
                              {home.county && ` • ${home.county} County`}
                            </CardDescription>
                          </div>
                          {home.acceptingNew && (
                            <Badge variant="healthcareSuccess">
                              Accepting New
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Capacity:
                            </span>
                            <p className="font-medium">{home.capacity}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Occupancy:
                            </span>
                            <p className="font-medium">
                              {home.currentOccupancy} / {home.capacity}
                            </p>
                          </div>
                          {home.wheelchairAccessible && (
                            <div>
                              <span className="text-muted-foreground">
                                Accessibility:
                              </span>
                              <p className="font-medium">Wheelchair Accessible</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No homes found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Services offered by this provider
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
                        <h4 className="font-semibold mb-2">{home.name}</h4>
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
        </TabsContent>
      </Tabs>
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

