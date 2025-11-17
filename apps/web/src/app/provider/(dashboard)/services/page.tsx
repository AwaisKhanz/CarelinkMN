"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Save,
  Search,
  Loader2,
  Building2,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { usePageMetadata } from "../use-page-metadata";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import { useProviderData } from "@/hooks/use-provider-data";
import { useProviderServices } from "@/hooks/use-provider-services";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { ProviderLoadingState } from "@/components/provider/provider-loading-state";
import { ProviderErrorState } from "@/components/provider/provider-error-state";
import { BulkActionsToolbar } from "@/components/ui/bulk-actions-toolbar";
import { SubscriptionTier } from "@carelink/types";
import { RequirePermission } from "@/components/auth/require-permission";
import { PROVIDER_CAPABILITIES } from "@/lib/permissions/provider-capabilities";

function ProviderServicesPageContent() {
  const router = useRouter();
  const { setTitle, setDescription } = usePageMetadata();
  const { tier, limits, canAddServices } = useSubscription();

  // Use provider services hook
  const {
    currentServices,
    availableServices,
    selectedServiceIds,
    isLoading,
    isSaving,
    error,
    selectService,
    deselectService,
    deselectAll,
    saveServices,
    isSelected,
  } = useProviderServices();

  const [searchTerm, setSearchTerm] = useState("");
  const [providerLicenses, setProviderLicenses] = useState<string[]>([]);

  // Get provider data from context
  const { provider } = useProviderData();

  useEffect(() => {
    setTitle("Provider Services");
    setDescription("Manage services offered by your organization");
  }, [setTitle, setDescription]);

  // Extract licenses from provider data (ACTIVE and PENDING)
  useEffect(() => {
    if (provider?.licenses) {
      const licenses = provider.licenses
        .filter((l) => l.status === "ACTIVE" || l.status === "PENDING")
        .map((l) => l.licenseType);
      setProviderLicenses(licenses);

      // Check if any licenses are PENDING
      const pendingLicenses = provider.licenses.filter(
        (l) => l.status === "PENDING"
      );
      if (pendingLicenses.length > 0) {
        toast.warning(
          `${pendingLicenses.length} license${pendingLicenses.length > 1 ? "s are" : " is"} pending verification. Services may require verified licenses.`,
          { duration: 5000 }
        );
      }
    }
  }, [provider?.licenses]);

  // Enhanced handlers with subscription checks
  const handleServiceToggle = (serviceId: string) => {
    if (isSelected(serviceId)) {
      // Removing a service is always allowed
      deselectService(serviceId);
    } else {
      // Check if adding a service is allowed based on subscription tier
      if (!canAddServices(selectedServiceIds.length)) {
        toast.error(
          `You've reached your plan's service limit (${limits.maxServices} services). ` +
            (tier === "FREE" ? "Upgrade to Pro for unlimited services." : "")
        );
        return;
      }
      selectService(serviceId);
    }
  };

  const handleSelectAll = () => {
    const filteredServices = getFilteredServices();
    filteredServices.forEach((service) => {
      if (canAddServices(selectedServiceIds.length + 1)) {
        selectService(service.id);
      }
    });
  };

  const handleDeselectAll = () => {
    deselectAll();
  };

  const handleSelectAllInCategory = (category: string) => {
    const categoryServices = availableServices.filter(
      (s) => s.category === category
    );
    categoryServices.forEach((service) => {
      if (
        canAddServices(selectedServiceIds.length + 1) ||
        isSelected(service.id)
      ) {
        selectService(service.id);
      }
    });
  };

  const handleDeselectAllInCategory = (category: string) => {
    const categoryServices = availableServices.filter(
      (s) => s.category === category
    );
    categoryServices.forEach((service) => {
      deselectService(service.id);
    });
  };

  const handleSave = async () => {
    try {
      await saveServices();
      toast.success("Services updated successfully!");
    } catch (err) {
      // Error is already handled in the hook
      console.error("Error updating services:", err);
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
    return filteredServices.filter((service) => isSelected(service.id)).length;
  };

  const getServiceCategories = () => {
    const categories = [...new Set(availableServices.map((s) => s.category))];
    return categories.sort();
  };

  if (isLoading) {
    return <ProviderLoadingState message="Loading services..." />;
  }

  if (error && !currentServices.length && !availableServices.length) {
    return (
      <ProviderErrorState
        title="Error Loading Services"
        message={error}
        action={{
          label: "Retry",
          onClick: () => window.location.reload(),
        }}
        secondaryAction={{
          label: "Go Back",
          onClick: () => router.back(),
        }}
      />
    );
  }

  const filteredServices = getFilteredServices();
  const categories = getServiceCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Provider Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage services offered by your organization across all homes
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card variant="healthcare">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium">About Provider Services</p>
              <p className="text-sm text-muted-foreground">
                Services selected here will be available as defaults for all
                your homes. Individual homes can override or add additional
                services. This helps ensure consistent service offerings across
                your organization.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Note:</strong> Only services that match your provider's
                licenses (active or pending) are shown. Services requiring
                "245D" will match licenses "245D_BASIC" or "245D_INTENSIVE". To
                see more services, add the required licenses to your provider
                profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Services Summary */}
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Current Provider Services
              </CardTitle>
              <CardDescription>
                {currentServices.length} service
                {currentServices.length !== 1 ? "s" : ""} currently assigned to
                your organization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="healthcarePrimary" className="capitalize">
                {tier} Plan
              </Badge>
              <Badge
                variant={
                  canAddServices(selectedServiceIds.length)
                    ? "healthcareSuccess"
                    : "healthcareWarning"
                }
              >
                {selectedServiceIds.length} /{" "}
                {limits.maxServices >= 999 ? "∞" : limits.maxServices} services
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canAddServices(selectedServiceIds.length) && tier === "FREE" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached your plan's service limit ({limits.maxServices}{" "}
                services). Upgrade to Pro or Premium for unlimited services.
              </AlertDescription>
            </Alert>
          )}
          {currentServices.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentServices.map((providerService) => (
                <Badge key={providerService.id} variant="healthcarePrimary">
                  {providerService.service?.name || "Unknown Service"}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No services assigned yet</p>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Banner for FREE tier */}
      {tier === "FREE" &&
        selectedServiceIds.length >= limits.maxServices * 0.8 && (
          <UpgradeBanner
            feature="Unlimited Services"
            currentPlan={tier}
            requiredPlan="PRO"
            description="Upgrade to Pro or Premium for unlimited services and enhanced visibility."
            compact={true}
          />
        )}

      {/* Search and Filters */}
      <Card variant="healthcare">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Services</CardTitle>
              <CardDescription>
                Select services to offer at the organization level
              </CardDescription>
            </div>
            {filteredServices.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    filteredServices.length > 0 &&
                    filteredServices.every((service) => isSelected(service.id))
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectAll();
                    } else {
                      handleDeselectAll();
                    }
                  }}
                  ref={(el) => {
                    if (el) {
                      const input = (el as any).querySelector?.(
                        'input[type="checkbox"]'
                      ) as HTMLInputElement | null;
                      if (input) {
                        const selectedCount = getSelectedServicesCount();
                        input.indeterminate =
                          selectedCount > 0 &&
                          selectedCount < filteredServices.length;
                      }
                    }
                  }}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
            )}
          </div>
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
          </div>

          {/* Bulk Actions Toolbar */}
          {getSelectedServicesCount() > 0 && (
            <BulkActionsToolbar
              selectedCount={getSelectedServicesCount()}
              totalCount={filteredServices.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              actions={[
                {
                  label: "Save Selected",
                  icon: <Save className="h-4 w-4" />,
                  onClick: handleSave,
                  variant: "default",
                  disabled: isSaving,
                },
              ]}
            />
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {getSelectedServicesCount()} of {filteredServices.length} services
              selected
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
            <Card key={category} variant="healthcare">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {categoryServices.filter((s) => isSelected(s.id)).length}{" "}
                      / {categoryServices.length}
                    </Badge>
                    {categoryServices.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={categoryServices.every((service) =>
                            isSelected(service.id)
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleSelectAllInCategory(category);
                            } else {
                              handleDeselectAllInCategory(category);
                            }
                          }}
                          ref={(el) => {
                            if (el) {
                              const input = (el as any).querySelector?.(
                                'input[type="checkbox"]'
                              ) as HTMLInputElement | null;
                              if (input) {
                                const selectedInCategory =
                                  categoryServices.filter((s) =>
                                    isSelected(s.id)
                                  ).length;
                                input.indeterminate =
                                  selectedInCategory > 0 &&
                                  selectedInCategory < categoryServices.length;
                              }
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          Select all
                        </span>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryServices.map((service) => (
                    <div
                      key={service.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                        isSelected(service.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      <Checkbox
                        id={service.id}
                        checked={isSelected(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
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
                        {service.licenseTypes &&
                          service.licenseTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {service.licenseTypes.map((licenseType) => (
                                <Badge
                                  key={licenseType}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {licenseType}
                                </Badge>
                              ))}
                            </div>
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
      {filteredServices.length === 0 &&
        availableServices.length === 0 &&
        !isLoading && (
          <Card variant="healthcare">
            <CardContent className="pt-6">
              <div className="text-center py-8 space-y-4">
                {providerLicenses.length === 0 ? (
                  <>
                    <AlertCircle className="h-12 w-12 text-warning mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        No Services Available
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        You don't have any licenses (active or pending).
                        Services are filtered based on your provider's licenses.
                        Add licenses to your provider profile to see available
                        services.
                      </p>
                      <Button
                        onClick={() => router.push("/provider/licenses")}
                        className="mt-4"
                      >
                        Add Licenses
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      {searchTerm
                        ? `No services found matching "${searchTerm}"`
                        : "No services available for your current licenses"}
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
                    {!searchTerm && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Add more licenses to see additional services.
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
    </div>
  );
}

export default function ProviderServicesPage() {
  return (
    <RequirePermission
      permission={PROVIDER_CAPABILITIES.SERVICES_MANAGE}
      title="Access Restricted"
      description="Only provider owners can manage services. Please contact your organization administrator if you require access."
      action={
        <Button onClick={() => (window.location.href = "/provider/dashboard")}>
          Return to dashboard
        </Button>
      }
    >
      <ProviderServicesPageContent />
    </RequirePermission>
  );
}
