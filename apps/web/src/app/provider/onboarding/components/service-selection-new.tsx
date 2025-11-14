"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Heart, Users, Home, Stethoscope, Brain, Shield, Loader2 } from "lucide-react";
import { homeService, Service } from "@/lib/api";
import { toast } from "sonner";

interface ServiceSelectionProps {
  data: any;
  onComplete: (data: any) => void;
  onChange?: (data: any) => void;
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

export function ServiceSelection({ data, onComplete, onChange }: ServiceSelectionProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(data?.selectedServices || []);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoadingServices(true);
        const response = await homeService.getAvailableServices();
        if (response.success && response.data) {
          setServices(response.data);
        } else {
          toast.error("Failed to load services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services. Please refresh the page.");
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (onChange) {
      const timeoutId = setTimeout(() => {
        onChange({ selectedServices });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedServices, onChange]);

  // Group services by category
  const serviceCategories = services.reduce((acc, service) => {
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

  const handleComplete = () => {
    if (selectedServices.length === 0) {
      return; // Validation will show error
    }
    onComplete({ selectedServices });
  };

  const isFormValid = () => {
    return selectedServices.length > 0;
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
            Select all services that your organization provides. This helps us match you with appropriate referrals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedServices.length === 0 && (
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

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!isFormValid()}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Complete Service Selection
        </Button>
      </div>
    </div>
  );
}
