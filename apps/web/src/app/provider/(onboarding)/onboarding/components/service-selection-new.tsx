"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Home, Stethoscope, Brain, Shield, Loader2 } from "lucide-react";
import { homeService, Service } from "@/lib/api";
import { toast } from "sonner";

interface ServiceSelectionProps {
  data: any;
  licenseData?: any;
  onComplete: (data: any) => void | Promise<void>;
  onValidate?: (validateFn: () => Promise<boolean>) => void; // Callback to expose validation function
}

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, typeof Home> = {
  "Daily Living": Home,
  "Medical": Stethoscope,
  "Support Services": Users,
  "Specialized Care": Shield,
  "Physical Support": Users,
  "Personal Care": Users,
  "Health Support": Heart,
  "Mental Health & Behavioral": Brain,
};

// Default icon if category not found
const DefaultIcon = Home;

export function ServiceSelection({ data, licenseData, onComplete, onValidate }: ServiceSelectionProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    data?.selectedServices ? (Array.isArray(data.selectedServices) ? data.selectedServices : []) : []
  );
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const isSyncingFromProps = useRef(false);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        setError(null);
        const response = await homeService.getAvailableServices();
        if (response.success && response.data) {
          const services = Array.isArray(response.data) ? response.data : [];
          setAllServices(services);
          
          // Initial filter if license data exists
          if (licenseData?.licenses) {
            filterServices(services, licenseData.licenses);
          } else {
            setFilteredServices(services);
          }
        } else {
          const errorMsg = response.message || "Failed to load services";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to load services. Please refresh the page.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter services based on licenses
  const filterServices = (servicesToFilter: Service[], licenses: any[]) => {
    if (!licenses || licenses.length === 0) {
      setFilteredServices(servicesToFilter);
      return;
    }

    // Get all license type IDs from the user's uploaded licenses
    // Also include primaryLicenseTypeId if available
    const userLicenseTypeIds = new Set<string>();
    
    licenses.forEach((l: any) => {
      if (l.licenseTypeId) userLicenseTypeIds.add(l.licenseTypeId);
    });
    
    if (licenseData?.primaryLicenseTypeId) {
      userLicenseTypeIds.add(licenseData.primaryLicenseTypeId);
    }
    
    console.log("Filtering services for license types:", Array.from(userLicenseTypeIds));

    // Filter services that match at least one license type
    const filtered = servicesToFilter.filter(service => {
      // If service has no specific license requirements (empty serviceLicenseTypes), 
      // check if it should be shown. 
      // Assumption: If service license types are defined in DB, strict matching applies.
      // If service has NO license types linked, maybe it's general? 
      // SAFEST: Only show services that explicitly match user license types or have NO requirements (if that's desired behavior).
      // Based on previous requirements: "not the one which is linked to the license he has selected" implies strict filtering.
      
      const serviceLicenseTypes = service.serviceLicenseTypes || [];
      
      if (serviceLicenseTypes.length === 0) {
        // If service has no specific license links, maybe allow it? 
        // Or hide it? Usually 'Basic Support' might not need license.
        // For now, let's include them to be safe, or user can clarify.
        // Actually, given the user request "show... the one which is linked", 
        // implies we should only show linked ones.
        // BUT, some services might be available to ALL. 
        // Let's check if there are any serviceLicenseTypes.
        return true; 
      }
      
      // Check if any of the service's required license types match the user's licenses
      return serviceLicenseTypes.some(slt => userLicenseTypeIds.has(slt.licenseTypeId));
    });
    
    setFilteredServices(filtered);
  };

  // Re-run filter when licenseData changes (unlikely to change during this step, but good practice)
  useEffect(() => {
    if (allServices.length > 0 && licenseData?.licenses) {
      filterServices(allServices, licenseData.licenses);
    }
  }, [licenseData, allServices]);

  // Sync selectedServices with data prop when it changes
  useEffect(() => {
    if (data && !isInitialMount.current) {
      isSyncingFromProps.current = true;
      setSelectedServices(data.selectedServices || []);
      // Reset flag after sync
      setTimeout(() => {
        isSyncingFromProps.current = false;
      }, 100);
    }
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [data]);

  // Expose validation function to parent
  useEffect(() => {
    if (onValidate) {
      const validateAndComplete = async () => {
        if (selectedServices.length === 0) {
          toast.error("Please select at least one service");
          return false;
        }
        await onComplete({ selectedServices });
        return true;
      };
      onValidate(validateAndComplete);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices, onComplete]);

  // Group services by category
  const serviceCategories = filteredServices.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleCategoryToggle = (categoryServices: Service[]) => {
    const categoryServiceIds = categoryServices.map(service => service.id);
    const allSelected = categoryServiceIds.every(id => selectedServices.includes(id));

    if (allSelected) {
      // Deselect all services in this category
      setSelectedServices(prev => prev.filter(id => !categoryServiceIds.includes(id)));
    } else {
      // Select all services in this category
      setSelectedServices(prev => {
        const newSelection = [...prev];
        categoryServiceIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const getSelectedServicesCount = (categoryServices: Service[]) => {
    return categoryServices.filter(service => selectedServices.includes(service.id)).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Selection</CardTitle>
          <CardDescription>
            Select the services you provide. These satisfy the requirements for your selected license types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoadingServices && selectedServices.length === 0 && filteredServices.length > 0 && (
            <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning">
                Please select at least one service that your organization provides.
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Services selected: {selectedServices.length}
              </p>
              {selectedServices.length > 0 && (
                <Badge variant="healthcarePrimary">
                  {selectedServices.length} selected
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingServices ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading services...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No services available for your selected license types. 
                Please go back and ensure you have selected the correct license types.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : Object.keys(serviceCategories).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">
                No service categories found. Please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(serviceCategories).map(([categoryName, categoryServices]) => {
            const selectedCount = getSelectedServicesCount(categoryServices);
            const allSelected = selectedCount === categoryServices.length;
            const Icon = CATEGORY_ICONS[categoryName] || DefaultIcon;

            return (
              <Card key={categoryName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{categoryName}</CardTitle>
                        <CardDescription>
                          {categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''} available
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCount > 0 && (
                        <Badge variant={allSelected ? "healthcareSuccess" : "healthcarePrimary"}>
                          {selectedCount}/{categoryServices.length}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCategoryToggle(categoryServices)}
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryServices.map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <div
                          key={service.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleServiceToggle(service.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleServiceToggle(service.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">
                                {service.name}
                              </h4>
                              {service.description && (
                                <p className="text-xs text-muted-foreground">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Card */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Services Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(serviceCategories).map(([categoryName, categoryServices]) => {
                const categorySelected = categoryServices.filter(service =>
                  selectedServices.includes(service.id)
                );

                if (categorySelected.length === 0) return null;

                const Icon = CATEGORY_ICONS[categoryName] || DefaultIcon;

                return (
                  <div key={categoryName} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{categoryName}:</span>
                    <span className="text-sm text-muted-foreground">
                      {categorySelected.length} service{categorySelected.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
