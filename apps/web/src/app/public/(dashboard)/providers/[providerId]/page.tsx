"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  Users,
  CheckCircle2,
  Heart,
  ExternalLink,
  Building,
  Calendar,
  HeartHandshake,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState, ErrorState } from "@/components/shared";
import { FavoriteButton } from "@/components/public";
import { usePageMetadata } from "../../use-page-metadata";
import { publicService } from "@/lib/api";
import { ProviderPublicProfile } from "@carelink/types";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  formatDistance,
  formatRating,
  formatAvailability,
  getProviderBadges,
} from "@/lib/utils/public";
import { getLicenseTypeLabel } from "@/lib/constants";
import { PAYER_LABELS } from "@/lib/constants";
import { Payer } from "@carelink/types";

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const providerId = params?.providerId as string;

  const [provider, setProvider] = useState<ProviderPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    if (provider) {
      setTitle(provider.organizationName);
      setDescription(`Provider details for ${provider.organizationName}`);
    } else {
      setTitle("Provider Details");
      setDescription("View provider information");
    }
  }, [provider, setTitle, setDescription]);

  const fetchProvider = useCallback(async () => {
    if (!providerId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await publicService.getProviderProfile(providerId);
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
  }, [providerId]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  // Check if provider is favorited
  useEffect(() => {
    if (user?.id && providerId) {
      publicService
        .getFavorites()
        .then((response) => {
          if (response.success && response.data) {
            const favorite = response.data.favorites.find(
              (f) => f.providerId === providerId
            );
            setIsFavorite(!!favorite);
          }
        })
        .catch((err) => {
          console.error("Error checking favorite:", err);
        });
    }
  }, [user?.id, providerId]);

  const handleFavoriteToggle = async (
    providerId: string,
    newIsFavorite: boolean
  ) => {
    if (!user?.id) {
      toast.error("Please sign in to save favorites");
      return;
    }

    setIsTogglingFavorite(true);
    try {
      if (newIsFavorite) {
        await publicService.addFavorite({ providerId });
        setIsFavorite(true);
        toast.success("Added to favorites");
      } else {
        const response = await publicService.getFavorites();
        if (response.success && response.data) {
          const favorite = response.data.favorites.find(
            (f) => f.providerId === providerId
          );
          if (favorite) {
            await publicService.removeFavorite(favorite.id);
            setIsFavorite(false);
            toast.success("Removed from favorites");
          }
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("Failed to update favorite");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading provider details..." />;
  }

  if (error || !provider) {
    return (
      <ErrorState
        title="Provider Not Found"
        message={error || "Provider not found"}
        action={{
          label: "Retry",
          onClick: fetchProvider,
          variant: "healthcare",
        }}
      />
    );
  }

  const badges = getProviderBadges(provider);
  const primaryHome = provider.homes[0];
  const primaryPhoto =
    primaryHome?.photos.find((p) => p.isPrimary) || primaryHome?.photos[0];
  const totalOpenings = provider.homes.reduce(
    (sum, home) =>
      sum + home.openings.reduce((s, o) => s + o.spotsAvailable, 0),
    0
  );

  // Get all unique accepted payers from all openings
  const acceptedPayers = new Set<Payer>();
  provider.homes.forEach((home) => {
    home.openings.forEach((opening) => {
      opening.acceptedPayers?.forEach((payer) => acceptedPayers.add(payer));
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {user?.id && (
          <FavoriteButton
            providerId={provider.id}
            isFavorite={isFavorite}
            onToggle={handleFavoriteToggle}
            variant="default"
            size="default"
          />
        )}
      </div>

      {/* Provider Header Card */}
      <Card variant="healthcare">
        <div className="relative">
          {primaryPhoto && (
            <div className="h-64 w-full overflow-hidden rounded-t-lg">
              <img
                src={primaryPhoto.url}
                alt={primaryPhoto.caption || provider.organizationName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader className={primaryPhoto ? "pt-6" : ""}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">
                    {provider.organizationName}
                  </CardTitle>
                  {badges.map((badge, idx) => (
                    <Badge key={idx} variant={badge.variant as any}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
                <CardDescription className="flex items-center gap-4 mt-2">
                  {primaryHome && (
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {primaryHome.address.city}, {primaryHome.address.state}
                    </span>
                  )}
                  {provider.distance !== undefined && (
                    <span>{formatDistance(provider.distance)}</span>
                  )}
                  {provider.averageRating !== undefined && (
                    <span className="flex items-center">
                      <Star className="w-4 h-4 mr-1 fill-warning text-warning" />
                      {formatRating(provider.averageRating)}
                      {provider.reviewCount > 0 && (
                        <span className="ml-1">
                          ({provider.reviewCount} review
                          {provider.reviewCount !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {provider.description && (
              <p className="text-muted-foreground mb-4">
                {provider.description}
              </p>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              {totalOpenings > 0 && (
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-1 text-primary" />
                  <span className="font-medium">
                    {formatAvailability(totalOpenings)}
                  </span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Building className="w-4 h-4 mr-1 text-primary" />
                <span>
                  {provider.homes.length} location
                  {provider.homes.length !== 1 ? "s" : ""}
                </span>
              </div>
              {provider.primaryLicenseType && (
                <Badge variant="outline">
                  {getLicenseTypeLabel(provider.primaryLicenseType)}
                </Badge>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="services">Services & Amenities</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Information */}
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {primaryHome?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{primaryHome.address.line1}</p>
                      {primaryHome.address.line2 && (
                        <p>{primaryHome.address.line2}</p>
                      )}
                      <p>
                        {primaryHome.address.city}, {primaryHome.address.state}{" "}
                        {primaryHome.address.zipCode}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accepted Payers */}
            {acceptedPayers.size > 0 && (
              <Card variant="healthcare">
                <CardHeader>
                  <CardTitle>Accepted Payers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(acceptedPayers).map((payer) => (
                      <Badge key={payer} variant="outline">
                        {PAYER_LABELS[payer]}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* License Information */}
            {provider.primaryLicenseType && (
              <Card variant="healthcare">
                <CardHeader>
                  <CardTitle>License Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-base">
                    {getLicenseTypeLabel(provider.primaryLicenseType)}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.homes.map((home) => (
              <Card key={home.id} variant="healthcare">
                <CardHeader>
                  <CardTitle>{home.name || "Location"}</CardTitle>
                  <CardDescription>
                    {home.address.city}, {home.address.state}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {home.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p>{home.address.line1}</p>
                        {home.address.line2 && <p>{home.address.line2}</p>}
                        <p>
                          {home.address.city}, {home.address.state}{" "}
                          {home.address.zipCode}
                        </p>
                      </div>
                    </div>
                  )}
                  {home.photos && home.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {home.photos.slice(0, 4).map((photo, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-lg overflow-hidden"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || `Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services & Amenities Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Services */}
            {provider.homes.some(
              (home) => home.services && home.services.length > 0
            ) && (
              <Card variant="healthcare">
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {provider.homes.map((home) =>
                      home.services?.map((service, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          <span>{service.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          {provider.homes.map((home) => (
            <Card key={home.id} variant="healthcare">
              <CardHeader>
                <CardTitle>{home.name || "Location"}</CardTitle>
                <CardDescription>
                  {home.address.city}, {home.address.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {home.openings && home.openings.length > 0 ? (
                  <div className="space-y-4">
                    {home.openings.map((opening) => (
                      <div
                        key={opening.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Opening</p>
                            {opening.careLevels &&
                              opening.careLevels.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Care Levels: {opening.careLevels.join(", ")}
                                </p>
                              )}
                            {opening.supportedNeeds &&
                              opening.supportedNeeds.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Supported Needs:{" "}
                                  {opening.supportedNeeds.join(", ")}
                                </p>
                              )}
                          </div>
                          <Badge variant="healthcareSuccess">
                            {opening.spotsAvailable} spot
                            {opening.spotsAvailable !== 1 ? "s" : ""} available
                          </Badge>
                        </div>
                        {opening.acceptedPayers &&
                          opening.acceptedPayers.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">
                                Accepted Payers:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {opening.acceptedPayers.map((payer) => (
                                  <Badge
                                    key={payer}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {PAYER_LABELS[payer]}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No current openings</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Need Assistance?</h3>
              <p className="text-sm text-muted-foreground">
                Our case managers can help you find the right care and navigate the placement process.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="healthcare"
                size="lg"
                onClick={() =>
                  router.push(`/public/requests/new?providerId=${provider.id}`)
                }
              >
                <HeartHandshake className="w-4 h-4 mr-2" />
                Request Case Manager Help
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/public/search")}
              >
                Search More Providers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
