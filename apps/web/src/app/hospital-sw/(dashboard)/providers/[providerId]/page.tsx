"use client";

import { useState, useEffect, useCallback } from "react";
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
  MapPin,
  Phone,
  Globe,
  Building,
  CheckCircle2,
  Clock,
  Mail,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { providerService, Provider } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { HOSPITAL_SW_CAPABILITIES } from "@/lib/permissions/capabilities";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared";
import { HospitalSWDetailHeader } from "@/components/hospital-sw";
import { format } from "date-fns";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { getLicenseTypeLabel } from "@/lib/constants";
import { LicenseStatus } from "@carelink/types";

function ProviderProfilePageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const { hasCapability } = useRolePermissions();
  const canViewProviders = hasCapability(
    HOSPITAL_SW_CAPABILITIES.PROVIDERS_VIEW
  );
  const providerId = params?.providerId as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setTitle(provider.organization?.name || "Provider Profile");
      setDescription("View provider details and information");
    } else {
      setTitle("Provider Profile");
      setDescription("View provider details and information");
    }
  }, [provider, setTitle, setDescription]);

  const fetchProvider = useCallback(async () => {
    if (!providerId || !canViewProviders) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await providerService.getProviderProfile(providerId);
      if (response.success && response.data) {
        setProvider(response.data);
      } else {
        setError(response.message || "Failed to load provider profile");
        toast.error("Failed to load provider profile");
      }
    } catch (err) {
      console.error("Error fetching provider:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load provider profile"
      );
      toast.error("Failed to load provider profile");
    } finally {
      setIsLoading(false);
    }
  }, [providerId, canViewProviders]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  const handleSendMessage = () => {
    router.push(`/hospital-sw/messages?providerId=${providerId}`);
  };

  if (isLoading) {
    return (
      <LoadingState
        message="Loading provider profile..."
        fullHeight
      />
    );
  }

  if (error || !provider) {
    return (
      <ErrorState
        title="Error Loading Provider"
        message={error || "Provider not found"}
        action={{
          label: "Retry",
          onClick: fetchProvider,
          variant: "healthcare",
        }}
        secondaryAction={{
          label: "Back to Providers",
          onClick: () => router.push("/hospital-sw/providers"),
          variant: "outline",
        }}
      />
    );
  }

  // Prepare badges for header
  const headerBadges = (
    <>
      {provider.primaryLicenseType && (
        <Badge variant="outline">
          {getLicenseTypeLabel(provider.primaryLicenseType)}
        </Badge>
      )}
      {provider.verified && (
        <Badge variant="healthcareInfo">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header - Use shared component */}
      <HospitalSWDetailHeader
        title={provider.organization?.name || "Provider Profile"}
        subtitle="Provider details and information"
        backPath="/hospital-sw/providers"
        badges={headerBadges}
        actions={
          <Button variant="outline" onClick={handleSendMessage}>
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        }
      />

      {/* Provider Info */}
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{provider.organization?.name}</CardTitle>
              <CardDescription className="mt-2">
                {provider.primaryLicenseType && (
                  <Badge variant="outline" className="mr-2">
                    {getLicenseTypeLabel(provider.primaryLicenseType)}
                  </Badge>
                )}
                {provider.verified && (
                  <Badge variant="healthcareInfo">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contact Information</h3>
              <div className="space-y-2 text-sm">
                {provider.organization?.addressLine1 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {provider.organization.addressLine1}
                      {provider.organization.addressLine2 && (
                        <>, {provider.organization.addressLine2}</>
                      )}
                      <br />
                      {provider.organization.city},{" "}
                      {provider.organization.state}{" "}
                      {provider.organization.zipCode}
                    </span>
                  </div>
                )}
                {provider.organization?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.organization.phone}</span>
                  </div>
                )}
                {provider.organization?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{provider.organization.email}</span>
                  </div>
                )}
                {provider.organization?.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={provider.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {provider.organization.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Provider Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Provider Details</h3>
              <div className="space-y-2 text-sm">
                {provider.responseTimeHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Average Response Time: {provider.responseTimeHours} hours
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Accepts Referrals:{" "}
                    {provider.acceptsReferrals ? (
                      <Badge variant="healthcareSuccess">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {provider.description && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="homes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="homes">Homes</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
        </TabsList>

        <TabsContent value="homes">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Homes</CardTitle>
              <CardDescription>
                Care facilities managed by this provider
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
                            <CardTitle className="text-lg">
                              {home.name}
                            </CardTitle>
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
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Capacity: {home.capacity} beds
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Current Occupancy: {home.currentOccupancy || 0}
                            </p>
                          </div>
                          <div>
                            {home.wheelchairAccessible && (
                              <Badge variant="outline" className="mr-2">
                                Wheelchair Accessible
                              </Badge>
                            )}
                            {home.singleLevel && (
                              <Badge variant="outline" className="mr-2">
                                Single Level
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Building}
                  title="No Homes"
                  description="This provider has no care facilities registered."
                />
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
                <EmptyState
                  icon={FileText}
                  title="No Services"
                  description="This provider has no services registered."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses">
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Licenses</CardTitle>
              <CardDescription>
                Active licenses for this provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              {provider.licenses && provider.licenses.length > 0 ? (
                <div className="space-y-4">
                  {provider.licenses.map((license) => (
                    <div
                      key={license.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {getLicenseTypeLabel(license.licenseType)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          License #: {license.licenseNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires:{" "}
                          {format(
                            new Date(license.expirationDate),
                            "MMM d, yyyy"
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          license.status === LicenseStatus.ACTIVE
                            ? "healthcareSuccess"
                            : "outline"
                        }
                      >
                        {license.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No Licenses"
                  description="This provider has no licenses registered."
                />
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
      permission={HOSPITAL_SW_CAPABILITIES.PROVIDERS_VIEW}
      title="Access Restricted"
      description="You don't have permission to view provider profiles."
    >
      <ProviderProfilePageContent />
    </RequirePermission>
  );
}
