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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Save, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { homeService, Home, Service } from "@/lib/api";
import { usePageMetadata } from "../../../use-page-metadata";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";
import { usePermissions } from "@/hooks/use-permissions";

function HomeServicesPageContent() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const { canManageServices, canManageHomes } = usePermissions();
  const homeId = params.homeId as string;

  const [home, setHome] = useState<
    | (Pick<Home, "id" | "name" | "services" | "providerId"> & {
        provider?: {
          services?: Array<{ serviceId: string; service?: Service }>;
        };
      })
    | null
  >(null);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [providerServiceIds, setProviderServiceIds] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (homeId) {
      fetchHomeData();
    }
  }, [homeId]);

  // Fetch available services after home data is loaded (so we have providerId)
  useEffect(() => {
    if (home?.providerId) {
      fetchAvailableServices();
    }
  }, [home?.providerId]);

  useEffect(() => {
    if (home) {
      setTitle(`Services - ${home.name}`);
      setDescription(`Manage services for ${home.name}`);
    }
  }, [home, setTitle, setDescription]);

  const fetchHomeData = async () => {
    try {
      const homeData = await homeService.getHomeById(homeId);
      const providerServices = (homeData as any).provider?.services || [];
      const providerServiceIdsSet = new Set<string>(
        providerServices.map((ps: any) => ps.serviceId as string)
      );
      setProviderServiceIds(providerServiceIdsSet);

      // Home services override/add to provider services
      // Selected services = provider services (inherited) + home services (overrides/additions)
      const homeServiceIds = new Set(
        (homeData.services || []).map((s) => s.serviceId)
      );

      // Combine: all provider services + home-specific services
      const allSelected = new Set([
        ...Array.from(providerServiceIdsSet),
        ...Array.from(homeServiceIds),
      ]);

      setHome({
        id: homeData.id,
        name: homeData.name,
        services: homeData.services || [],
        providerId: homeData.providerId,
        provider: (homeData as any).provider,
      });
      setSelectedServices(Array.from(allSelected) as string[]);
    } catch (err) {
      console.error("Error fetching home data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch home data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      // Get providerId from home data
      const providerId = home?.providerId;
      if (!providerId) {
        // If home data not loaded yet, wait for it
        return;
      }
      const response = await homeService.getAvailableServices(providerId);
      if (response.success) {
        setAvailableServices(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching available services:", err);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredServices = getFilteredServices();
    const allSelected = filteredServices.every((service) =>
      selectedServices.includes(service.id)
    );

    if (allSelected) {
      // Deselect all filtered services
      const filteredIds = filteredServices.map((s) => s.id);
      setSelectedServices((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );
    } else {
      // Select all filtered services
      const filteredIds = filteredServices.map((s) => s.id);
      setSelectedServices((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleSave = async () => {
    if (!homeId) return;

    setIsSaving(true);

    try {
      // Only save home-level services that differ from provider defaults
      // If a service is in provider services and selected, it's inherited (don't save)
      // If a service is in provider services but NOT selected, it's disabled at home level (save as exclusion)
      // If a service is NOT in provider services but selected, it's a home addition (save)
      // If a service is NOT in provider services and NOT selected, it's not applicable (don't save)

      const homeLevelServices: string[] = [];

      // Services that are selected but not in provider services = home additions
      selectedServices.forEach((serviceId) => {
        if (!providerServiceIds.has(serviceId)) {
          homeLevelServices.push(serviceId);
        }
      });

      // Services that are in provider services but NOT selected = home exclusions (override to disable)
      // Note: We don't currently support "excluding" inherited services, so we'll only save additions
      // If you want to exclude an inherited service, you'd need to add it to home services with isActive=false
      // For now, we'll just save the home-specific additions

      await homeService.updateHomeServices(homeId, homeLevelServices);
      toast.success("Services updated successfully!");
      fetchHomeData(); // Refresh home data
    } catch (err) {
      console.error("Error updating services:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update services"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getFilteredServices = () => {
    return availableServices.filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getSelectedServicesCount = () => {
    const filteredServices = getFilteredServices();
    return filteredServices.filter((service) =>
      selectedServices.includes(service.id)
    ).length;
  };

  const getServiceCategories = () => {
    const categories = [...new Set(availableServices.map((s) => s.category))];
    return categories.sort();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={() => router.back()} className="w-full mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!home) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Home not found</p>
            <Button onClick={() => router.back()} className="w-full mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredServices = getFilteredServices();
  const categories = getServiceCategories();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Home Services
            </h1>
            <p className="text-muted-foreground">
              Manage services for {home.name}
            </p>
          </div>
        </div>

        {/* Current Services Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Services</CardTitle>
            <CardDescription>
              {selectedServices.length} total services (
              {providerServiceIds.size} inherited from provider,{" "}
              {selectedServices.length - providerServiceIds.size} home-specific)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedServices.length > 0 ? (
              <div className="space-y-2">
                {providerServiceIds.size > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Inherited from Provider ({providerServiceIds.size})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(providerServiceIds).map((serviceId) => {
                        const service = availableServices.find(
                          (s) => s.id === serviceId
                        );
                        return service ? (
                          <Badge key={serviceId} variant="outline">
                            {service.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {home.services.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Home-Specific ({home.services.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {home.services.map((homeService) => (
                        <Badge key={homeService.id} variant="default">
                          {homeService.service?.name || "Unknown Service"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No services assigned yet</p>
            )}
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Available Services</CardTitle>
            <CardDescription>
              Select services to assign to this home
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="whitespace-nowrap"
              >
                {getFilteredServices().every((service) =>
                  selectedServices.includes(service.id)
                )
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {getSelectedServicesCount()} of {filteredServices.length}{" "}
                services selected
              </span>
              {searchTerm && <span>(filtered by "{searchTerm}")</span>}
            </div>
          </CardContent>
        </Card>

        {/* Services by Category */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryServices = filteredServices.filter(
              (s) => s.category === category
            );
            if (categoryServices.length === 0) return null;

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category}</span>
                    <Badge variant="outline">
                      {
                        categoryServices.filter((s) =>
                          selectedServices.includes(s.id)
                        ).length
                      }{" "}
                      / {categoryServices.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryServices.map((service) => (
                      <div
                        key={service.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                          selectedServices.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={() =>
                            handleServiceToggle(service.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={service.id}
                              className="font-medium cursor-pointer"
                            >
                              {service.name}
                            </Label>
                            {providerServiceIds.has(service.id) && (
                              <Badge variant="outline" className="text-xs">
                                Inherited
                              </Badge>
                            )}
                            {service.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-sm">
                                      {service.description}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No services found */}
        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm
                    ? `No services found matching "${searchTerm}"`
                    : "No services available"}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {(canManageServices || canManageHomes) && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-32"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeServicesPage() {
  return (
    <RequirePermission
      anyPermission={[
        PROVIDER_CAPABILITIES.SERVICES_MANAGE,
        PROVIDER_CAPABILITIES.HOMES_MANAGE,
      ]}
      title="Access Restricted"
      description="You don't have permission to manage home services. Only provider owners can modify services."
    >
      <HomeServicesPageContent />
    </RequirePermission>
  );
}
