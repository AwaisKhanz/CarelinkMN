"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { providerService } from "@/lib/api";
import { Service } from "@carelink/types";
import { useProviderId } from "@/hooks/use-provider-data";

export function ServicesTab() {
  const providerId = useProviderId();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (providerId) {
      fetchData();
    }
  }, [providerId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [servicesResponse, providerServicesResponse] = await Promise.all([
        providerService.getAvailableServices(),
        providerService.getProviderServices(providerId!),
      ]);

      if (servicesResponse.success && servicesResponse.data) {
        setAvailableServices(servicesResponse.data);
      }

      if (providerServicesResponse.success && providerServicesResponse.data) {
        const currentIds = new Set(
          providerServicesResponse.data.map((ps) => ps.serviceId)
        );
        setSelectedServiceIds(currentIds);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServiceIds);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServiceIds(newSelected);
  };

  const handleSave = async () => {
    if (!providerId) return;

    setIsSaving(true);
    try {
      await providerService.updateProviderServices(
        providerId,
        Array.from(selectedServiceIds)
      );
      toast.success("Services updated successfully");
    } catch (err) {
      console.error("Error updating services:", err);
      toast.error("Failed to update services");
    } finally {
      setIsSaving(false);
    }
  };

  // Group services by category
  const servicesByCategory = availableServices.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="healthcare">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Services Offered
          </CardTitle>
          <CardDescription>
            Select the services your organization provides. These will be
            displayed on your profile and used for matching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {Object.entries(servicesByCategory).map(([category, services]) => (
              <div key={category} className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={service.id}
                        checked={selectedServiceIds.has(service.id)}
                        onCheckedChange={() => handleToggleService(service.id)}
                      />
                      <div className="space-y-1 leading-none">
                        <Label
                          htmlFor={service.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {service.name}
                        </Label>
                        {service.description && (
                          <p className="text-xs text-muted-foreground">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-8 pt-4 border-t">
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
        </CardContent>
      </Card>
    </div>
  );
}
