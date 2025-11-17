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
  Settings,
  Camera,
  BarChart3,
  CheckCircle,
  XCircle,
  Building2,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { homeService, Home, HomePhoto, HomeAmenity } from "@/lib/api";
import { usePageMetadata } from "../../use-page-metadata";
import { getOccupancyColor, getOccupancyPercentage } from "@/lib/utils/provider";
import {
  ProviderLoadingState,
  ProviderErrorState,
} from "@/components/provider";

export default function HomeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle, setDescription } = usePageMetadata();
  const homeId = params.homeId as string;

  const [home, setHome] = useState<Home | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (home) {
      setTitle(home.name);
      setDescription(`${home.city}, ${home.state} - ${home.capacity} beds`);
    }
  }, [home, setTitle, setDescription]);

  useEffect(() => {
    if (homeId) {
      fetchHomeData();
    }
  }, [homeId]);

  const fetchHomeData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const homeData = await homeService.getHomeById(homeId);
      setHome(homeData);
    } catch (err: unknown) {
      console.error("Error fetching home data:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load home details";
      toast.error(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Use shared utility functions

  if (isLoading) {
    return (
      <ProviderLoadingState
        message="Loading home details..."
        fullHeight
      />
    );
  }

  if (error || !home) {
    return (
      <ProviderErrorState
        title="Home Not Found"
        message={error || "Home not found"}
        action={{
          label: "Retry",
          onClick: fetchHomeData,
        }}
        secondaryAction={{
          label: "Go Back",
          onClick: () => router.back(),
        }}
        className="min-h-[400px]"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{home.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4" />
              {home.addressLine1}, {home.city}, {home.state} {home.zipCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={home.isActive ? "healthcareSuccess" : "secondary"}
            className="flex items-center gap-1.5"
          >
            {home.isActive ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Active
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                Inactive
              </>
            )}
          </Badge>
          {home.acceptingNew && (
            <Badge variant="healthcareInfo">Accepting New Residents</Badge>
          )}
          <Button
            variant="healthcare"
            onClick={() => router.push(`/provider/homes/${homeId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Hero Section - Primary Photo */}
      {home.photos && home.photos.length > 0 && (
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden border border-border">
          <img
            src={
              home.photos.find((p) => p.isPrimary)?.url || home.photos[0].url
            }
            alt={`${home.name} - Primary photo`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <Badge variant="healthcareInfo" className="gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                {home.photos.length} Photo{home.photos.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Occupancy</p>
                <p
                  className={`text-2xl font-bold ${getOccupancyColor(home.currentOccupancy, home.capacity)}`}
                >
                  {home.currentOccupancy}/{home.capacity}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {getOccupancyPercentage(home.currentOccupancy, home.capacity)}
                  % occupied
                </p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Available Beds
                </p>
                <p className="text-2xl font-bold text-success">
                  {home.capacity - home.currentOccupancy}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently available
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card variant="healthcare">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Services</p>
                <p className="text-2xl font-bold text-primary">
                  {home.services?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active services
                </p>
              </div>
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos Gallery */}
          {home.photos && home.photos.length > 0 && (
            <Card variant="healthcare">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Photos ({home.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {home.photos.map((photo: HomePhoto) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square overflow-hidden rounded-lg border border-border group cursor-pointer"
                      onClick={() => window.open(photo.url, "_blank")}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || `${home.name} photo`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {photo.isPrimary && (
                        <Badge
                          variant="healthcareSuccess"
                          className="absolute top-2 left-2 text-xs"
                        >
                          Primary
                        </Badge>
                      )}
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs text-foreground">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                {home.amenities?.length || 0} amenities available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {home.amenities && home.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {home.amenities.map((amenity: HomeAmenity) => (
                    <Badge
                      key={amenity.id}
                      variant="healthcareSuccess"
                      className="text-sm"
                    >
                      {amenity.amenityType}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No amenities listed</p>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card variant="healthcare">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Services</CardTitle>
                  <CardDescription>
                    {home.services?.length || 0} services currently offered
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/provider/homes/${homeId}/services`)
                  }
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {home.services && home.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {home.services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <h4 className="font-semibold text-foreground mb-1">
                        {service.service?.name || "Unknown Service"}
                      </h4>
                      {service.service?.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {service.service.description}
                        </p>
                      )}
                      {service.service?.category && (
                        <Badge variant="healthcareInfo" className="text-xs">
                          {service.service.category}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No services assigned yet
                  </p>
                  <Button
                    variant="healthcare"
                    onClick={() =>
                      router.push(`/provider/homes/${homeId}/services`)
                    }
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Services
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                <p className="font-semibold">
                  {home.capacity} bed{home.capacity !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Current Occupancy
                </p>
                <p className="font-semibold">{home.currentOccupancy}</p>
              </div>
              {home.virtualTourUrl && (
                <div>
                  <a
                    href={home.virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Virtual Tour
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{home.addressLine1}</p>
              {home.addressLine2 && (
                <p className="text-muted-foreground">{home.addressLine2}</p>
              )}
              <p className="text-muted-foreground">
                {home.city}, {home.state} {home.zipCode}
              </p>
              <p className="text-sm text-muted-foreground">
                {home.county} County
              </p>
            </CardContent>
          </Card>

          {/* Accessibility Features */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent>
              {home.wheelchairAccessible ||
              home.singleLevel ||
              home.hasElevator ||
              home.hasRollInShower ? (
                <div className="space-y-2">
                  {home.wheelchairAccessible && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Wheelchair Accessible</span>
                    </div>
                  )}
                  {home.singleLevel && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Single Level</span>
                    </div>
                  )}
                  {home.hasElevator && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Has Elevator</span>
                    </div>
                  )}
                  {home.hasRollInShower && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm">Roll-in Shower</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No accessibility features listed
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card variant="healthcare">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/provider/homes/${homeId}/services`)
                }
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Services
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/provider/openings?homeId=${homeId}`)
                }
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Openings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
